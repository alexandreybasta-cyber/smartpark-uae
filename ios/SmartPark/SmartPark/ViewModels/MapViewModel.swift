import Foundation
import MapKit
import Observation

@MainActor
@Observable
class MapViewModel {
    var selectedSpot: Spot?
    var showSpotDetail = false
    var cameraPosition: MapCameraPosition = .region(MKCoordinateRegion(
        center: DemoConstants.dubaiInternetCity,
        span: MKCoordinateSpan(latitudeDelta: 0.008, longitudeDelta: 0.008)
    ))
    
    // MARK: - GeoJSON Parsing
    
    /// Parse GeoJSON polygon string into coordinates array
    /// Format: {"type":"Polygon","coordinates":[[[lng,lat],[lng,lat],...,[lng,lat]]]}
    func parsePolygon(_ geojson: String?) -> [CLLocationCoordinate2D] {
        guard let geojson = geojson,
              let data = geojson.data(using: .utf8) else { return [] }
        
        do {
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let coordinates = json["coordinates"] as? [[[Double]]],
                  let ring = coordinates.first else { return [] }
            
            // GeoJSON is [longitude, latitude] — flip to CLLocationCoordinate2D(latitude, longitude)
            return ring.compactMap { pair in
                guard pair.count >= 2 else { return nil }
                return CLLocationCoordinate2D(latitude: pair[1], longitude: pair[0])
            }
        } catch {
            return []
        }
    }
    
    // MARK: - Zone Availability
    
    /// Compute zone availability ratio
    func availabilityRatio(for zone: Zone) -> Double {
        guard zone.totalSpots > 0 else { return 0 }
        return Double(zone.freeCount) / Double(zone.totalSpots)
    }
    
    // MARK: - Spot Selection
    
    func selectSpot(_ spot: Spot) {
        selectedSpot = spot
        showSpotDetail = true
    }
    
    // MARK: - Camera Control
    
    /// Focus map on coordinate (called when AppState.mapFocusCoordinate changes)
    func focusOn(_ coordinate: CLLocationCoordinate2D) {
        withAnimation(.easeInOut(duration: 0.5)) {
            cameraPosition = .region(MKCoordinateRegion(
                center: coordinate,
                span: MKCoordinateSpan(latitudeDelta: 0.004, longitudeDelta: 0.004)
            ))
        }
    }
}
