import SwiftUI
import CoreLocation

struct MapCardView: View {
    let mapCard: MapCard
    let onShowOnMap: (CLLocationCoordinate2D) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spacingSM) {
            // Zone name
            if let name = mapCard.zoneName {
                Text(name)
                    .font(.subheadline.bold())
                    .foregroundColor(DesignTokens.textPrimary)
            }

            // Stats row
            HStack(spacing: DesignTokens.spacingLG) {
                if let free = mapCard.freeSpots, let total = mapCard.totalSpots {
                    Label("\(free)/\(total) free", systemImage: "car.fill")
                }
                if let price = mapCard.pricePerHour {
                    Label("AED \(String(format: "%.0f", price))/hr", systemImage: "creditcard")
                }
                if let walk = mapCard.walkingMinutes {
                    Label("\(walk) min", systemImage: "figure.walk")
                }
            }
            .font(.caption)
            .foregroundColor(DesignTokens.textSecondary)

            // Action buttons
            HStack(spacing: DesignTokens.spacingSM) {
                if let lat = mapCard.lat, let lng = mapCard.lng {
                    Button(action: {
                        onShowOnMap(CLLocationCoordinate2D(latitude: lat, longitude: lng))
                    }) {
                        Label("Show on Map", systemImage: "map")
                            .font(.caption.bold())
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                }
            }
        }
        .padding(DesignTokens.spacingMD)
        .background(DesignTokens.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusMedium))
        .overlay(
            RoundedRectangle(cornerRadius: DesignTokens.radiusMedium)
                .stroke(DesignTokens.borderLight, lineWidth: 1)
        )
    }
}
