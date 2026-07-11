# SpotSense — Geofence Proximity Notification & GPS Redirect Feature

## Overview

Build the seamless "approaching destination" flow: user sets destination in SpotSense → navigates with their preferred GPS app → SpotSense detects arrival via geofence → fires notification with optimal free parking spot → tapping notification redirects the GPS app to that spot's coordinates. No app switching required.

---

## User Flow

```
1. User opens SpotSense → searches destination (e.g., "Dubai Internet City")
2. User taps "Navigate" → chooses GPS app (Waze / Google Maps / Apple Maps)
3. SpotSense registers a CLCircularRegion geofence (500m radius) around destination
4. SpotSense opens the chosen GPS app via URL scheme with the destination
5. User drives normally using their GPS app...
6. [BACKGROUND] User enters geofence zone
7. SpotSense fires a local notification: "Free spot 50m from [destination]. Tap to navigate."
8. Notification has action button: "Go to Spot"
9. User taps action → SpotSense fires URL scheme to redirect GPS app to parking spot coordinates
10. GPS app updates route to the free bay. User parks. Done.
```

---

## Architecture

### iOS (Primary Target)

#### 1. GeofenceService.swift (NEW)

**Purpose:** Register/manage geofences around user-selected destinations.

```swift
import CoreLocation

class GeofenceService: NSObject, CLLocationManagerDelegate {
    private let locationManager = CLLocationManager()
    
    // Register geofence when user sets a destination
    func registerDestinationGeofence(
        identifier: String,       // e.g., "destination_<timestamp>"
        center: CLLocationCoordinate2D,
        radius: CLLocationDistance = 500  // 500m trigger zone
    )
    
    // CLLocationManagerDelegate
    func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion)
    // → Triggers notification flow
    
    // Remove geofence after arrival or cancellation
    func removeGeofence(identifier: String)
    func removeAllGeofences()
}
```

**Requirements:**
- Request `authorizedAlways` permission (needed for background geofencing)
- Maximum 20 regions per app (iOS limit) — manage lifecycle
- Must work when app is killed/backgrounded
- Store active geofence metadata in UserDefaults (destination name, saved place ID)

#### 2. NotificationService.swift (NEW)

**Purpose:** Handle local notification delivery and actions.

```swift
import UserNotifications

class NotificationService: NSObject, UNUserNotificationCenterDelegate {
    
    // Request notification permission on first launch
    func requestPermission()
    
    // Fire notification when geofence triggers
    func sendProximityNotification(
        spotId: String,
        spotName: String,        // e.g., "Zone A - Bay 05"
        distance: Int,           // meters from destination
        destinationName: String  // e.g., "Dubai Internet City"
    )
    
    // Define notification category with actions
    // Category: "PARKING_SPOT"
    // Actions: 
    //   - "NAVIGATE_TO_SPOT" (foreground, opens GPS app with spot coordinates)
    //   - "DISMISS" (destructive)
    
    // Handle action tap
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse)
    // → Extract spot coordinates from notification payload
    // → Fire URL scheme to redirect GPS app
}
```

**Notification Payload:**
```json
{
    "spot_id": "101-05",
    "spot_lat": 25.0935,
    "spot_lng": 55.1590,
    "spot_name": "Zone A - Bay 05",
    "destination_name": "Dubai Internet City",
    "distance_meters": 50,
    "preferred_gps_app": "waze"
}
```

#### 3. NavigationRedirectService.swift (NEW)

**Purpose:** Open/redirect GPS apps via URL schemes.

```swift
class NavigationRedirectService {
    
    enum GPSApp: String, CaseIterable {
        case appleMaps = "Apple Maps"
        case googleMaps = "Google Maps"
        case waze = "Waze"
    }
    
    // Open GPS app with destination (initial navigation)
    func navigateTo(
        lat: Double, lng: Double,
        label: String,
        using app: GPSApp
    )
    
    // Redirect GPS app to parking spot (from notification tap)
    func redirectToSpot(
        lat: Double, lng: Double,
        using app: GPSApp
    )
}
```

**URL Schemes:**
```
Apple Maps:  maps://?daddr={lat},{lng}&dirflg=d
Google Maps: comgooglemaps://?daddr={lat},{lng}&directionsmode=driving
Waze:        waze://?ll={lat},{lng}&navigate=yes
```

**Info.plist — add `LSApplicationQueriesSchemes`:**
```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>comgooglemaps</string>
    <string>waze</string>
</array>
```

#### 4. SavedPlacesManager.swift (NEW)

**Purpose:** Store user's saved places for smart spot selection.

```swift
struct SavedPlace: Codable, Identifiable {
    let id: UUID
    var name: String          // "Work", "Home", "Gym"
    var lat: Double
    var lng: Double
    var icon: String          // SF Symbol name
}

class SavedPlacesManager: ObservableObject {
    @Published var places: [SavedPlace] = []
    
    // CRUD operations (persisted in UserDefaults or Core Data)
    func addPlace(_ place: SavedPlace)
    func removePlace(id: UUID)
    func updatePlace(_ place: SavedPlace)
    
    // Find the saved place closest to a given coordinate
    func nearestSavedPlace(to coordinate: CLLocationCoordinate2D) -> SavedPlace?
}
```

**For demo:** Hardcode "Work" = Dubai Internet City office entrance coordinates.

#### 5. SpotRecommendationEngine.swift (NEW)

**Purpose:** Pick the optimal free parking spot when geofence triggers.

```swift
class SpotRecommendationEngine {
    
    struct RecommendationInput {
        let userLocation: CLLocationCoordinate2D
        let destination: CLLocationCoordinate2D
        let savedPlace: SavedPlace?      // nearest saved place (e.g., "Work")
        let freeSpots: [Spot]            // current free spots from backend
    }
    
    struct ScoredSpot {
        let spot: Spot
        let score: Double
        let walkingDistanceToDestination: Int  // meters
    }
    
    // Score and rank spots
    func recommend(input: RecommendationInput) -> ScoredSpot? {
        // Scoring formula:
        // score = (1 / distanceToDestination) * 0.5
        //       + (1 / distanceToSavedPlace) * 0.3
        //       + availabilityConfidence * 0.2
        //
        // Return highest-scoring free spot
    }
}
```

**Scoring Weights:**
- 50% — Walking distance from spot to destination
- 30% — Walking distance from spot to saved place (e.g., office entrance)
- 20% — How long the spot has been free (longer = more confidence it's still free)

If no saved place matches, use 70% destination / 30% availability.

---

### Backend API

#### New Endpoint: `POST /api/recommend/optimal-spot`

```python
# backend/routers/recommend.py

@router.post("/api/recommend/optimal-spot")
async def recommend_spot(request: RecommendRequest, db: AsyncSession = Depends(get_db)):
    """
    Given user's destination and optional saved place,
    return the best free parking spot.
    """
    pass

class RecommendRequest(BaseModel):
    destination_lat: float
    destination_lng: float
    saved_place_lat: Optional[float] = None
    saved_place_lng: Optional[float] = None
    user_lat: float
    user_lng: float

class RecommendResponse(BaseModel):
    spot_id: str
    spot_lat: float
    spot_lng: float
    spot_name: str
    zone_name: str
    walking_distance_meters: int
    score: float
```

**Logic:**
1. Query all spots with `status = 'free'`
2. For each free spot, compute:
   - `dist_to_destination` = haversine(spot, destination)
   - `dist_to_saved_place` = haversine(spot, saved_place) if provided
   - `time_free` = now - last_changed_at (longer = more stable)
3. Score = weighted combination (see weights above)
4. Return top-scoring spot

**Alternative for demo:** Do the scoring entirely on-device (iOS) using cached spot data from WebSocket — no backend call needed. This is faster and works offline.

---

### Permissions Required

**Info.plist additions:**
```xml
<!-- Location - Always (for background geofencing) -->
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>SpotSense needs your location to notify you of free parking spots when you arrive at your destination.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>SpotSense needs your location to find parking spots near you.</string>

<!-- Background Modes -->
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
</array>

<!-- URL Schemes for GPS apps -->
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>comgooglemaps</string>
    <string>waze</string>
</array>
```

**Permission Flow:**
1. First launch → request "When In Use" location
2. When user first taps "Navigate" → upgrade to "Always" with explanation
3. Request notification permission at same time

---

### UI Changes (iOS)

#### NavigateButton in Search/Places View

When user selects a destination, show:
```
┌─────────────────────────────────┐
│  Navigate to Dubai Internet City │
│                                  │
│  [🗺 Apple Maps] [Waze] [Google] │
│                                  │
│  ✓ Notify me of free spots      │
│    when I arrive                 │
└─────────────────────────────────┘
```

Tapping a GPS app button:
1. Registers geofence
2. Opens GPS app with destination
3. SpotSense goes to background

#### Notification Appearance (Lock Screen / Banner over Waze)

```
┌─────────────────────────────────────┐
│ 🅿️ SpotSense                   now │
│                                     │
│ Free spot near Dubai Internet City  │
│ Zone A - Bay 05 · 50m walk          │
│                                     │
│ [Navigate to Spot]      [Dismiss]   │
└─────────────────────────────────────┘
```

---

### Data Flow Diagram

```
User taps "Navigate with Waze"
        │
        ├──→ GeofenceService.registerDestinationGeofence(center, 500m)
        ├──→ Store metadata: { destination, savedPlace, preferredApp: "waze" }
        └──→ UIApplication.open(waze://?ll=dest_lat,dest_lng&navigate=yes)

... user drives using Waze ...

CLLocationManager: didEnterRegion (background)
        │
        ├──→ Fetch latest spot data (from cached WebSocket state or quick API call)
        ├──→ SpotRecommendationEngine.recommend(destination, savedPlace, freeSpots)
        │         → Returns: Zone A - Bay 05 (score: 0.87)
        │
        └──→ NotificationService.sendProximityNotification(
                spotId: "101-05",
                spotLat: 25.0935, spotLng: 55.1590,
                spotName: "Zone A - Bay 05",
                distance: 50
             )

User taps "Navigate to Spot" on notification
        │
        └──→ NavigationRedirectService.redirectToSpot(
                lat: 25.0935, lng: 55.1590,
                using: .waze
             )
             → Opens: waze://?ll=25.0935,55.1590&navigate=yes
             → Waze updates destination to parking bay
```

---

## Demo Scenario

**Setup:**
- Hardcode saved place "Work" = specific lat/lng near Zone A
- 3 zones already seeded with 58 spots
- Simulator running (spots changing status)

**Demo Steps:**
1. Open SpotSense → search "Dubai Internet City"
2. Tap "Navigate with Waze" (or Apple Maps if Waze not installed)
3. Waze opens, starts navigation
4. Walk/drive into the 500m geofence zone
5. **NOTIFICATION FIRES** over Waze: "Free spot near your destination"
6. Tap "Navigate to Spot"
7. Waze updates to parking bay coordinates
8. Arrive at bay → spot shows occupied on the map (once hardware sensor deployed)

**For testing without driving:**
- Set geofence radius to 50m
- Walk toward the zone on foot
- Or use Xcode location simulation (set custom GPX waypoints)

---

## File Structure (New Files)

```
ios/SmartPark/SmartPark/
├── Services/
│   ├── GeofenceService.swift          (NEW)
│   ├── NotificationService.swift      (NEW)
│   ├── NavigationRedirectService.swift (NEW)
│   └── SpotRecommendationEngine.swift (NEW)
├── Models/
│   └── SavedPlace.swift               (NEW)
├── ViewModels/
│   └── NavigationViewModel.swift      (NEW)
└── Views/
    └── Navigation/
        ├── NavigateSheet.swift         (NEW - GPS app picker)
        └── SavedPlacesView.swift       (NEW - manage saved places)

backend/
├── routers/
│   └── recommend.py                   (NEW)
└── schemas.py                         (ADD RecommendRequest/Response)
```

---

## Constraints & Notes

- **iOS geofence limit:** 20 regions max. Only 1 active destination at a time (remove old before adding new)
- **Background execution:** Geofence triggers give ~10 seconds of background runtime — enough to query spots and fire notification
- **No booking:** This feature finds and directs to free spots — does NOT reserve them
- **Offline fallback:** If backend unreachable when geofence triggers, use last-cached spot data from WebSocket
- **Battery:** Geofencing is hardware-accelerated on iOS — minimal battery impact (unlike continuous GPS polling)
- **macOS constraint:** User runs macOS Sequoia 15.5, cannot use Xcode 26. Ensure all APIs used are available in iOS 17+ (geofencing, UNNotification — all supported since iOS 8+)
- **Saved places for demo:** Hardcode 1-2 places. Full CRUD UI is nice-to-have but not MVP.
