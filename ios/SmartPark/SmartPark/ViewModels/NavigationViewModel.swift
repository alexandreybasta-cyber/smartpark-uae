import Foundation
import CoreLocation
import Observation

@MainActor
@Observable
class NavigationViewModel {
    // MARK: - State
    var isNavigating = false
    var activeDestination: SavedPlace?
    var selectedGPSApp: GPSApp = .appleMaps
    var showNavigateSheet = false
    var recommendedSpot: ScoredSpot?
    var isLoadingRecommendation = false
    var geofenceTriggered = false

    // MARK: - Services
    let geofenceService = GeofenceService()
    let notificationService = NotificationService()

    // MARK: - Init

    init() {
        setupCallbacks()
        restoreActiveNavigation()
    }

    // MARK: - Public API

    /// Starts navigation to a saved place: registers geofence, opens GPS app, sets up trigger callback.
    func startNavigation(destination: SavedPlace, gpsApp: GPSApp, freeSpots: [Spot]) {
        activeDestination = destination
        selectedGPSApp = gpsApp
        isNavigating = true
        geofenceTriggered = false
        recommendedSpot = nil

        // Register geofence around destination
        let center = CLLocationCoordinate2D(latitude: destination.lat, longitude: destination.lng)
        let identifier = "nav_\(destination.id)"

        geofenceService.registerGeofence(identifier: identifier, center: center)
        geofenceService.setDestinationName(destination.customName ?? destination.label)
        geofenceService.setPreferredGPSApp(gpsApp.rawValue)

        // Request notification permission if not yet granted
        if !notificationService.isPermissionGranted {
            notificationService.requestPermission()
        }

        // Open GPS app with destination
        NavigationRedirectService.navigate(to: center, label: destination.customName ?? destination.label, using: gpsApp)
    }

    /// Cancels the active navigation and removes the geofence.
    func cancelNavigation() {
        geofenceService.removeAllGeofences()
        isNavigating = false
        activeDestination = nil
        geofenceTriggered = false
        recommendedSpot = nil
    }

    /// Called when the geofence is triggered (user enters region).
    /// Runs SpotRecommendationEngine and sends a notification.
    func handleGeofenceEntry(freeSpots: [Spot]) {
        guard let destination = activeDestination else { return }

        geofenceTriggered = true
        isLoadingRecommendation = true

        let destCoord = CLLocationCoordinate2D(latitude: destination.lat, longitude: destination.lng)

        let input = RecommendationInput(
            destinationCoordinate: destCoord,
            savedPlaceCoordinate: nil,  // No separate saved place — use destination-only scoring
            freeSpots: freeSpots
        )

        let result = SpotRecommendationEngine.recommend(input: input)
        recommendedSpot = result
        isLoadingRecommendation = false

        // Send notification with the best spot
        if let scored = result {
            notificationService.sendProximityNotification(
                spotId: scored.spot.id,
                spotName: scored.spot.id,
                distanceMeters: scored.walkingDistanceMeters,
                destinationName: destination.customName ?? destination.label,
                spotLat: scored.spot.lat,
                spotLng: scored.spot.lng,
                preferredApp: selectedGPSApp.rawValue
            )
        }

        // Remove geofence after trigger — single use
        geofenceService.removeAllGeofences()
    }

    /// Called when user taps "Navigate to Spot" on the notification.
    func handleNotificationAction(spotLat: Double, spotLng: Double, appName: String) {
        let coordinate = CLLocationCoordinate2D(latitude: spotLat, longitude: spotLng)
        let app = GPSApp(rawValue: appName) ?? .appleMaps
        NavigationRedirectService.navigate(to: coordinate, label: "Parking Spot", using: app)
    }

    // MARK: - Private

    private func setupCallbacks() {
        geofenceService.onGeofenceTriggered = { [weak self] _ in
            Task { @MainActor [weak self] in
                // We don't have live spots here, so we'll post a notification
                // The view layer will call handleGeofenceEntry with current spots
                self?.geofenceTriggered = true
            }
        }

        notificationService.onNavigateToSpot = { [weak self] lat, lng, app in
            Task { @MainActor [weak self] in
                self?.handleNotificationAction(spotLat: lat, spotLng: lng, appName: app)
            }
        }
    }

    private func restoreActiveNavigation() {
        // Check if there's a persisted geofence from a previous session
        if geofenceService.isMonitoring {
            isNavigating = true
            let metadata = geofenceService.persistedMetadata()
            if let name = metadata.name, let lat = metadata.lat, let lng = metadata.lng {
                // Reconstruct a minimal destination for display
                activeDestination = SavedPlace(
                    id: 0,
                    userId: "restored",
                    label: name,
                    customName: name,
                    lat: lat,
                    lng: lng,
                    address: nil
                )
            }
            if let appName = metadata.gpsApp, let app = GPSApp(rawValue: appName) {
                selectedGPSApp = app
            }
        }
    }
}
