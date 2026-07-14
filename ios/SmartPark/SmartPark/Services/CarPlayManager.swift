import Foundation
import CarPlay
import CoreLocation
import MapKit

// MARK: - CarPlay Manager

/// Bridges between CarPlay templates and existing SpotSense services.
/// Fetches nearby zones via APIClient and converts them to CarPlay POI objects.
actor CarPlayManager {
    static let shared = CarPlayManager()

    // MARK: - State

    private(set) var zones: [Zone] = []
    private var refreshTimer: Timer?
    private let refreshInterval: TimeInterval = 30

    // MARK: - Fetch Zones

    /// Fetches nearby zones using the user's current location or the demo fallback.
    func fetchNearbyZones(location: CLLocationCoordinate2D? = nil) async -> [Zone] {
        let coordinate = location ?? DemoConstants.dubaiInternetCity

        do {
            let fetched = try await APIClient.shared.fetchNearbyZones(
                lat: coordinate.latitude,
                lng: coordinate.longitude,
                radiusM: 2000
            )
            zones = fetched
            return fetched
        } catch {
            // If nearby fails, try fetching all zones as fallback
            do {
                let allZones = try await APIClient.shared.fetchZones()
                zones = allZones
                return allZones
            } catch {
                return zones // Return cached if available
            }
        }
    }

    /// Fetches all zones (used when location is not available).
    func fetchAllZones() async -> [Zone] {
        do {
            let allZones = try await APIClient.shared.fetchZones()
            zones = allZones
            return allZones
        } catch {
            return zones
        }
    }

    // MARK: - Convert to POI

    /// Converts a Zone model into a CPPointOfInterest for CarPlay display.
    func makePointOfInterest(from zone: Zone) -> CPPointOfInterest? {
        // Zone doesn't directly have lat/lng — parse from geojson or use a centroid
        // For zones, we need coordinates. Let's extract from geojson polygon centroid
        guard let coordinate = extractCoordinate(from: zone) else { return nil }

        let mapItem = MKMapItem(placemark: MKPlacemark(coordinate: coordinate))
        mapItem.name = zone.name

        let subtitle = formatSubtitle(for: zone)

        let poi = CPPointOfInterest(
            location: mapItem,
            title: zone.name,
            subtitle: subtitle,
            summary: "Price: AED \(String(format: "%.1f", zone.pricePerHour))/hr • \(zone.totalSpots) total spots",
            detailTitle: zone.name,
            detailSubtitle: subtitle,
            detailSummary: "Free: \(zone.freeCount) | Occupied: \(zone.occupiedCount) | Reserved: \(zone.reservedCount)\nRate: AED \(String(format: "%.1f", zone.pricePerHour)) per hour",
            pinImage: nil
        )

        // Store zone ID in userInfo for later retrieval
        poi.userInfo = ["zoneId": zone.id, "lat": coordinate.latitude, "lng": coordinate.longitude]

        return poi
    }

    /// Creates CPPointOfInterest array from current zones.
    func makeAllPOIs(from zones: [Zone]) -> [CPPointOfInterest] {
        zones.compactMap { makePointOfInterest(from: $0) }
    }

    // MARK: - Navigation

    /// Opens Apple Maps with directions to the given coordinate.
    @MainActor
    func navigateToZone(coordinate: CLLocationCoordinate2D, zoneName: String) {
        let placemark = MKPlacemark(coordinate: coordinate)
        let mapItem = MKMapItem(placemark: placemark)
        mapItem.name = zoneName
        mapItem.openInMaps(launchOptions: [
            MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving
        ])
    }

    // MARK: - Private Helpers

    private func formatSubtitle(for zone: Zone) -> String {
        let freeCount = zone.freeCount
        if freeCount == 0 {
            return "FULL • AED \(String(format: "%.1f", zone.pricePerHour))/hr"
        }
        return "\(freeCount) free spot\(freeCount == 1 ? "" : "s") • AED \(String(format: "%.1f", zone.pricePerHour))/hr"
    }

    /// Extracts a centroid coordinate from zone's geojson polygon.
    /// Falls back to nil if geojson is unavailable or unparseable.
    private func extractCoordinate(from zone: Zone) -> CLLocationCoordinate2D? {
        guard let geojson = zone.geojsonPolygon,
              let data = geojson.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let coordinates = json["coordinates"] as? [[[Double]]],
              let ring = coordinates.first, !ring.isEmpty else {
            // Fallback: return nil if no geojson
            return nil
        }

        // Calculate centroid of the polygon ring
        var latSum = 0.0
        var lngSum = 0.0
        for point in ring {
            guard point.count >= 2 else { continue }
            lngSum += point[0]  // GeoJSON is [lng, lat]
            latSum += point[1]
        }
        let count = Double(ring.count)
        return CLLocationCoordinate2D(latitude: latSum / count, longitude: lngSum / count)
    }
}
