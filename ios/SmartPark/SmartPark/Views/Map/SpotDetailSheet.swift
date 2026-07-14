import SwiftUI
import MapKit

struct SpotDetailSheet: View {
    @Environment(AppState.self) private var appState
    let spot: Spot
    
    private var zoneName: String {
        appState.zones.first(where: { $0.id == spot.zoneId })?.name ?? "Unknown Zone"
    }
    
    private var drivingMinutes: Int {
        let dist = appState.locationService.effectiveLocation.distance(to: spot.coordinate)
        return max(1, Int(ceil(Double(dist) / 400.0)))
    }
    
    private var currentViolations: [Violation] {
        if appState.appMode == .enforcement {
            let coord = appState.locationService.effectiveLocation
            return MockViolations.violationsNear(coord) + MockViolations.violations
        }
        return []
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
                Label("\(drivingMinutes) min drive", systemImage: "car.fill")
                if let since = spot.occupiedSince {
                    Label("Since \(since)", systemImage: "clock")
                }
            }
            .font(.subheadline)
            .foregroundColor(DesignTokens.textSecondary)
            
            // Show violation info if this is a violation spot
            if let violation = currentViolations.first(where: { $0.spotId == spot.id }) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.orange)
                        Text("Parked for: \(violation.unpaidDuration)")
                            .font(.subheadline.bold())
                            .foregroundColor(DesignTokens.textPrimary)
                    }
                    HStack {
                        Text("Plate: \(violation.plateNumber)")
                            .font(.caption)
                            .foregroundColor(DesignTokens.textSecondary)
                        Spacer()
                        Text(violation.gracePeriodExpired ? "Grace expired" : "In grace period")
                            .font(.caption.bold())
                            .foregroundColor(violation.gracePeriodExpired ? .red : .green)
                    }
                    Text(violation.recommendedAction)
                        .font(.caption)
                        .foregroundColor(.orange)
                }
                .padding(12)
                .background(Color.orange.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            
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
        mapItem.openInMaps(launchOptions: [MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving])
    }
    
    private func askAgent() {
        appState.askAgent(query: "Find free parking near bay \(spot.id) in \(zoneName)")
    }
}

#Preview {
    SpotDetailSheet(spot: Spot(id: "A-05", zoneId: 1, lat: 25.092, lng: 55.16, status: .free, lastChangedAt: nil, sensorId: "S-05", occupiedSince: nil))
        .environment(AppState())
}
