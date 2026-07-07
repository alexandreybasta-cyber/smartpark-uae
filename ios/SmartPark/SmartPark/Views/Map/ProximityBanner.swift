import SwiftUI

struct ProximityBanner: View {
    let spot: Spot
    let zoneName: String
    let onTap: () -> Void
    let onDismiss: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            // SmartPark icon
            ZStack {
                Circle()
                    .fill(DesignTokens.primaryOrange)
                    .frame(width: 40, height: 40)
                Text("P")
                    .font(.headline.bold())
                    .foregroundColor(.white)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text("SmartPark")
                        .font(.subheadline.bold())
                        .foregroundColor(DesignTokens.textPrimary)
                    Spacer()
                    Text("now")
                        .font(.caption)
                        .foregroundColor(DesignTokens.textTertiary)
                    Button(action: onDismiss) {
                        Image(systemName: "xmark")
                            .font(.caption)
                            .foregroundColor(DesignTokens.textTertiary)
                    }
                }
                
                Text("\u{1f17f}\u{fe0f} Spot found near your destination!")
                    .font(.subheadline.bold())
                    .foregroundColor(DesignTokens.textPrimary)
                
                Text("Spot \(spot.id) · \(zoneName) · Tap to park")
                    .font(.caption)
                    .foregroundColor(DesignTokens.textSecondary)
            }
        }
        .padding(DesignTokens.spacingMD)
        .background(DesignTokens.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusLarge))
        .shadow(color: .black.opacity(0.15), radius: 10, y: 4)
        .onTapGesture(perform: onTap)
    }
}

#Preview {
    ProximityBanner(
        spot: Spot(id: "A-01", zoneId: 1, lat: 25.096, lng: 55.155, status: .free, lastChangedAt: nil, sensorId: nil, occupiedSince: nil),
        zoneName: "Zone A",
        onTap: {},
        onDismiss: {}
    )
    .padding()
}
