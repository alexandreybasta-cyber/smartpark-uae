import Foundation
import CoreLocation
import Observation

// MARK: - Geofence Persistence Keys
private enum GeofenceKeys {
    static let destinationName = "geofence_destination_name"
    static let destinationLat = "geofence_destination_lat"
    static let destinationLng = "geofence_destination_lng"
    static let preferredGPSApp = "geofence_preferred_gps_app"
    static let identifier = "geofence_identifier"
}

// MARK: - GeofenceService

/// Manages CLCircularRegion geofences for destination proximity detection.
/// Registers a 500m geofence around a destination and fires delegate callback
/// when user enters the region (background capable). Single geofence at a time.
@Observable
class GeofenceService: NSObject, CLLocationManagerDelegate {
    var isMonitoring = false
    var activeGeofenceId: String?

    /// Called when user enters the geofenced region. Parameter is the region identifier.
    var onGeofenceTriggered: ((String) -> Void)?

    private let manager = CLLocationManager()
    private let defaults = UserDefaults.standard

    override init() {
        super.init()
        manager.delegate = self
        if manager.authorizationStatus == .authorizedAlways {
            manager.allowsBackgroundLocationUpdates = true
        }
        restoreActiveGeofence()
    }

    // MARK: - Public API

    /// Registers a circular geofence around the given coordinate.
    /// Removes any existing geofence before registering a new one.
    func registerGeofence(
        identifier: String,
        center: CLLocationCoordinate2D,
        radius: CLLocationDistance = 500
    ) {
        removeAllGeofences()
        ensureAlwaysAuthorization()

        let clampedRadius = min(radius, manager.maximumRegionMonitoringDistance)
        let region = CLCircularRegion(center: center, radius: clampedRadius, identifier: identifier)
        region.notifyOnEntry = true
        region.notifyOnExit = false

        if manager.authorizationStatus == .authorizedAlways {
            manager.allowsBackgroundLocationUpdates = true
        }
        manager.startMonitoring(for: region)
        activeGeofenceId = identifier
        isMonitoring = true

        persistGeofenceMetadata(identifier: identifier, center: center)
    }

    /// Removes all monitored geofences.
    func removeAllGeofences() {
        for region in manager.monitoredRegions {
            manager.stopMonitoring(for: region)
        }
        activeGeofenceId = nil
        isMonitoring = false
        clearPersistedMetadata()
    }

    /// Persists the preferred GPS app for the active geofence.
    func setPreferredGPSApp(_ app: String) {
        defaults.set(app, forKey: GeofenceKeys.preferredGPSApp)
    }

    /// Persists the destination name for the active geofence.
    func setDestinationName(_ name: String) {
        defaults.set(name, forKey: GeofenceKeys.destinationName)
    }

    /// Returns persisted geofence metadata (survives app termination).
    func persistedMetadata() -> (name: String?, lat: Double?, lng: Double?, gpsApp: String?) {
        let name = defaults.string(forKey: GeofenceKeys.destinationName)
        let lat = defaults.object(forKey: GeofenceKeys.destinationLat) as? Double
        let lng = defaults.object(forKey: GeofenceKeys.destinationLng) as? Double
        let app = defaults.string(forKey: GeofenceKeys.preferredGPSApp)
        return (name, lat, lng, app)
    }

    // MARK: - CLLocationManagerDelegate

    func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        guard let circular = region as? CLCircularRegion else { return }
        onGeofenceTriggered?(circular.identifier)
        NotificationCenter.default.post(
            name: .geofenceTriggered,
            object: nil,
            userInfo: ["identifier": circular.identifier]
        )
    }

    func locationManager(_ manager: CLLocationManager, monitoringDidFailFor region: CLRegion?, withError error: Error) {
        // Monitoring failed — reset state
        isMonitoring = false
        activeGeofenceId = nil
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .authorizedAlways:
            manager.allowsBackgroundLocationUpdates = true
        case .authorizedWhenInUse:
            manager.requestAlwaysAuthorization()
        default:
            manager.allowsBackgroundLocationUpdates = false
        }
    }

    // MARK: - Private

    private func ensureAlwaysAuthorization() {
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestAlwaysAuthorization()
        case .authorizedWhenInUse:
            manager.requestAlwaysAuthorization()
        default:
            break
        }
    }

    private func persistGeofenceMetadata(identifier: String, center: CLLocationCoordinate2D) {
        defaults.set(identifier, forKey: GeofenceKeys.identifier)
        defaults.set(center.latitude, forKey: GeofenceKeys.destinationLat)
        defaults.set(center.longitude, forKey: GeofenceKeys.destinationLng)
    }

    private func clearPersistedMetadata() {
        defaults.removeObject(forKey: GeofenceKeys.identifier)
        defaults.removeObject(forKey: GeofenceKeys.destinationName)
        defaults.removeObject(forKey: GeofenceKeys.destinationLat)
        defaults.removeObject(forKey: GeofenceKeys.destinationLng)
        defaults.removeObject(forKey: GeofenceKeys.preferredGPSApp)
    }

    private func restoreActiveGeofence() {
        if let identifier = defaults.string(forKey: GeofenceKeys.identifier) {
            activeGeofenceId = identifier
            isMonitoring = !manager.monitoredRegions.isEmpty
        }
    }
}

// MARK: - Notification Name

extension Notification.Name {
    static let geofenceTriggered = Notification.Name("GeofenceTriggered")
}
