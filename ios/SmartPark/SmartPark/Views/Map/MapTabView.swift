import SwiftUI
import MapKit

struct MapTabView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = MapViewModel()
    @State private var proximitySpot: Spot?
    @State private var showProximityBanner = true
    
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
            
            // Proximity notification banner
            if let spot = proximitySpot, showProximityBanner {
                ProximityBanner(spot: spot, zoneName: zoneNameFor(spot), onTap: {
                    viewModel.selectSpot(spot)
                    viewModel.focusOn(spot.coordinate)
                }, onDismiss: {
                    withAnimation(.spring) {
                        showProximityBanner = false
                    }
                })
                .transition(.move(edge: .top).combined(with: .opacity))
                .padding(.horizontal)
                .padding(.top, 60)
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
        .task {
            // Simulate proximity: find nearest free spot to user location after a brief delay
            try? await Task.sleep(for: .seconds(2))
            let userLocation = appState.locationService.effectiveLocation
            let freeSpots = appState.spots.filter { $0.status == .free }
            if let nearest = freeSpots.min(by: {
                $0.coordinate.distance(to: userLocation) < $1.coordinate.distance(to: userLocation)
            }) {
                withAnimation(.spring) {
                    proximitySpot = nearest
                }
            }
        }
    }
    
    private func parseZonePolygon(_ zone: Zone) -> [CLLocationCoordinate2D] {
        viewModel.parsePolygon(zone.geojsonPolygon)
    }
    
    private func zoneNameFor(_ spot: Spot) -> String {
        appState.zones.first(where: { $0.id == spot.zoneId })?.name ?? "Zone \(spot.zoneId)"
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
