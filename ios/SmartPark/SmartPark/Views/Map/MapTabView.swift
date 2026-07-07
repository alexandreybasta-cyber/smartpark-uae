import SwiftUI
import MapKit

struct MapTabView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = MapViewModel()
    
    private var violationSpotIds: Set<String> {
        Set(MockViolations.violations.map(\.spotId))
    }
    
    var body: some View {
        ZStack(alignment: .top) {
            // Map with annotations and overlays
            Map(position: $viewModel.cameraPosition) {
                // User location
                UserAnnotation()
                
                // Zone polygons
                ForEach(appState.zones) { zone in
                    let coords = parseZonePolygon(zone)
                    if !coords.isEmpty {
                        MapPolygon(coordinates: coords)
                            .foregroundStyle(
                                DesignTokens.zoneColor(freeRatio: viewModel.availabilityRatio(for: zone))
                                    .opacity(0.2)
                            )
                            .stroke(
                                DesignTokens.zoneColor(freeRatio: viewModel.availabilityRatio(for: zone)),
                                lineWidth: 2
                            )
                    }
                }
                
                // Spot markers
                ForEach(appState.spots) { spot in
                    Annotation("", coordinate: spot.coordinate) {
                        if appState.appMode == .enforcement && violationSpotIds.contains(spot.id) {
                            // Violation marker: red circle with "!" overlay
                            ViolationAnnotationView(isSelected: viewModel.selectedSpot?.id == spot.id)
                                .onTapGesture {
                                    viewModel.selectSpot(spot)
                                }
                        } else {
                            SpotAnnotationView(spot: spot, isSelected: viewModel.selectedSpot?.id == spot.id)
                                .onTapGesture {
                                    viewModel.selectSpot(spot)
                                }
                        }
                    }
                }
            }
            .mapStyle(.standard)
            .mapControls {
                MapCompass()
                MapUserLocationButton()
            }
            
            // Top badges
            VStack(spacing: 6) {
                // Enforcement violation count badge
                if appState.appMode == .enforcement {
                    let expiredCount = MockViolations.violations.filter(\.gracePeriodExpired).count
                    HStack(spacing: 4) {
                        Image(systemName: "exclamationmark.shield.fill")
                        Text("\(expiredCount) VIOLATIONS")
                    }
                    .font(.caption.bold())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.red.opacity(0.9))
                    .foregroundColor(.white)
                    .clipShape(Capsule())
                }
                
                // Connection status badge
                if appState.connectionMode == .offline {
                    HStack(spacing: 4) {
                        Image(systemName: "wifi.slash")
                        Text("OFFLINE MODE")
                    }
                    .font(.caption.bold())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(DesignTokens.spotReserved.opacity(0.9))
                    .foregroundColor(.white)
                    .clipShape(Capsule())
                }
            }
            .padding(.top, 8)
        }
        .sheet(isPresented: $viewModel.showSpotDetail) {
            if let spot = viewModel.selectedSpot {
                SpotDetailSheet(spot: spot)
                    .presentationDetents([.height(280)])
            }
        }
        .onChange(of: appState.mapFocusCoordinate) { _, newValue in
            if let coord = newValue {
                viewModel.focusOn(coord)
                appState.mapFocusCoordinate = nil
            }
        }
    }
    
    private func parseZonePolygon(_ zone: Zone) -> [CLLocationCoordinate2D] {
        viewModel.parsePolygon(zone.geojsonPolygon)
    }
}

// MARK: - Violation Annotation View

struct ViolationAnnotationView: View {
    var isSelected: Bool = false
    
    var body: some View {
        ZStack {
            Circle()
                .fill(Color.red)
                .frame(width: isSelected ? 22 : 16, height: isSelected ? 22 : 16)
            
            Text("!")
                .font(.system(size: isSelected ? 13 : 10, weight: .black))
                .foregroundColor(.white)
        }
        .overlay(
            Circle()
                .stroke(Color.white, lineWidth: isSelected ? 2.5 : 1.5)
        )
        .shadow(color: .red.opacity(0.4), radius: 3, y: 1)
        .animation(.spring(duration: 0.3), value: isSelected)
    }
}

#Preview {
    MapTabView()
        .environment(AppState())
}
