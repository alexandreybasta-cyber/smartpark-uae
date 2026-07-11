import Foundation
import CoreLocation
import UIKit

// MARK: - GPS App Enum

/// Supported GPS navigation apps for parking spot navigation.
enum GPSApp: String, CaseIterable, Codable {
    case appleMaps
    case googleMaps
    case waze

    var displayName: String {
        switch self {
        case .appleMaps: return "Apple Maps"
        case .googleMaps: return "Google Maps"
        case .waze: return "Waze"
        }
    }

    var urlScheme: String {
        switch self {
        case .appleMaps: return "maps://"
        case .googleMaps: return "comgooglemaps://"
        case .waze: return "waze://"
        }
    }
}

// MARK: - NavigationRedirectService

/// Opens GPS navigation apps with destination/spot coordinates.
/// Supports Apple Maps, Google Maps, and Waze. Checks app availability before attempting to open.
struct NavigationRedirectService {

    // MARK: - Public API

    /// Checks whether the given GPS app is installed and available.
    static func isAppAvailable(_ app: GPSApp) -> Bool {
        // Apple Maps is always available
        if app == .appleMaps { return true }
        guard let url = URL(string: app.urlScheme) else { return false }
        return UIApplication.shared.canOpenURL(url)
    }

    /// Returns the list of GPS apps currently installed on this device.
    static func availableApps() -> [GPSApp] {
        GPSApp.allCases.filter { isAppAvailable($0) }
    }

    /// Opens the specified GPS app with driving directions to the given coordinate.
    /// Falls back to Apple Maps if the chosen app is not available.
    static func navigate(to coordinate: CLLocationCoordinate2D, label: String, using app: GPSApp) {
        let targetApp = isAppAvailable(app) ? app : .appleMaps
        guard let url = buildURL(for: targetApp, coordinate: coordinate, label: label) else { return }

        Task { @MainActor in
            UIApplication.shared.open(url)
        }
    }

    // MARK: - Private

    private static func buildURL(
        for app: GPSApp,
        coordinate: CLLocationCoordinate2D,
        label: String
    ) -> URL? {
        let lat = coordinate.latitude
        let lng = coordinate.longitude

        switch app {
        case .appleMaps:
            return URL(string: "maps://?daddr=\(lat),\(lng)&dirflg=d")

        case .googleMaps:
            return URL(string: "comgooglemaps://?daddr=\(lat),\(lng)&directionsmode=driving")

        case .waze:
            return URL(string: "waze://?ll=\(lat),\(lng)&navigate=yes")
        }
    }
}
