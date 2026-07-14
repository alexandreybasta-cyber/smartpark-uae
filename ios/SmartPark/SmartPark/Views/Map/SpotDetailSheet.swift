import SwiftUI
import MapKit

struct SpotDetailSheet: View {
    @Environment(AppState.self) private var appState
    let spot: Spot
    
    private var zoneName: String {
        appState.zones.first(where: { $0.id == spot.zoneId })?.name ?? "Unknown Zone"
    }
    
    private var walkingMinutes: Int {
        appState.locationService.effectiveLocation.walkingMinutes(to: spot.coordinate)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spacingLG) {
            // Header: Spot ID + Status
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Bay \(spot.id)")
                        .font(.title2.bold())
                        .foregroundColor(DesignTokens.textPrimary)
                    Text(zoneName)
                        .font(.subheadline)
                        .foregroundColor(DesignTokens.textSecondary)
                }
                Spacer()
                // Status badge
                Text(spot.status.rawValue.capitalized)
                    .font(.caption.bold())
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(DesignTokens.spotColor(for: spot.status).opacity(0.15))
                    .foregroundColor(DesignTokens.spotColor(for: spot.status))
                    .clipShape(Capsule())
            }
            
            // Info row
            HStack(spacing: DesignTokens.spacingXL) {
                Label("\(walkingMinutes) min walk", systemImage: "figure.walk")
                if let since = spot.occupiedSince {
                    Label("Since \(since)", systemImage: "clock")
                }
            }
            .font(.subheadline)
            .foregroundColor(DesignTokens.textSecondary)
            
            Divider()
            
            // Action buttons
            HStack(spacing: DesignTokens.spacingMD) {
                // Navigate button
                Button(action: openInMaps) {
                    Label("Navigate", systemImage: "arrow.triangle.turn.up.right.diamond")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                
                // Ask Agent button
                Button(action: askAgent) {
                    Label("Ask Agent", systemImage: "bubble.left.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(DesignTokens.spacingXL)
    }
    
    private func openInMaps() {
        let placemark = MKPlacemark(coordinate: spot.coordinate)
        let mapItem = MKMapItem(placemark: placemark)
        mapItem.name = "Bay \(spot.id)"
        mapItem.openInMaps(launchOptions: [MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeWalking])
    }
    
    private func askAgent() {
        appState.askAgent(query: "Find free parking near bay \(spot.id) in \(zoneName)")
    }
}

#Preview {
    SpotDetailSheet(spot: Spot(id: "A-05", zoneId: 1, lat: 25.092, lng: 55.16, status: .free, lastChangedAt: nil, sensorId: "S-05", occupiedSince: nil))
        .environment(AppState())
}
