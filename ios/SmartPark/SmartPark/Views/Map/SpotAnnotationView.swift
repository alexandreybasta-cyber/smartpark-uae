import SwiftUI

struct SpotAnnotationView: View {
    let spot: Spot
    var isSelected: Bool = false
    
    var body: some View {
        Circle()
            .fill(DesignTokens.spotColor(for: spot.status))
            .frame(width: isSelected ? 18 : 12, height: isSelected ? 18 : 12)
            .overlay(
                Circle()
                    .stroke(Color.white, lineWidth: isSelected ? 2 : 1)
            )
            .shadow(color: .black.opacity(0.2), radius: 2, y: 1)
            .animation(.spring(duration: 0.3), value: isSelected)
            .animation(.easeInOut(duration: 0.5), value: spot.status)
            // Expand hit area to 44x44 (Apple HIG minimum tap target)
            .frame(width: 44, height: 44)
            .contentShape(Circle())
    }
}

#Preview {
    HStack(spacing: 20) {
        SpotAnnotationView(spot: Spot(id: "A1", zoneId: 1, lat: 25.09, lng: 55.16, status: .free, lastChangedAt: nil, sensorId: nil, occupiedSince: nil))
        SpotAnnotationView(spot: Spot(id: "A2", zoneId: 1, lat: 25.09, lng: 55.16, status: .occupied, lastChangedAt: nil, sensorId: nil, occupiedSince: nil), isSelected: true)
        SpotAnnotationView(spot: Spot(id: "A3", zoneId: 1, lat: 25.09, lng: 55.16, status: .reserved, lastChangedAt: nil, sensorId: nil, occupiedSince: nil))
    }
    .padding()
}
