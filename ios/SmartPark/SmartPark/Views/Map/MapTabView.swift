import SwiftUI
import MapKit

struct MapTabView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = MapViewModel()
    
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
                        SpotAnnotationView(spot: spot, isSelected: viewModel.selectedSpot?.id == spot.id)
                            .onTapGesture {
                                viewModel.selectSpot(spot)
                            }
                    }
                }
            }
            .mapStyle(.standard)
            .mapControls {
                MapCompass()
                MapUserLocationButton()
            }
            
            // Connection status badge at top
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
                .padding(.top, 8)
            }
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

#Preview {
    MapTabView()
        .environment(AppState())
}
