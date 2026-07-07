import SwiftUI

enum DesignTokens {
    // MARK: - Primary Colors
    static let primaryOrange = Color(hex: "F97316")
    static let primaryOrangeGradientStart = Color(hex: "F97316")
    static let primaryOrangeGradientEnd = Color(hex: "EA580C")
    
    // MARK: - Background
    static let background = Color.white
    static let cardBackground = Color.white
    static let surfaceBackground = Color(hex: "F8FAFC")
    
    // MARK: - Spot Status Colors
    static let spotFree = Color(hex: "22C55E")       // green
    static let spotOccupied = Color(hex: "EF4444")   // red
    static let spotReserved = Color(hex: "F59E0B")   // amber
    static let spotOffline = Color(hex: "9CA3AF")    // gray
    
    // MARK: - Zone Availability Colors
    static let zoneAvailable = Color(hex: "22C55E")  // >30% free
    static let zoneMedium = Color(hex: "F59E0B")     // 10-30% free
    static let zoneFull = Color(hex: "EF4444")       // <10% free
    
    // MARK: - Text
    static let textPrimary = Color(hex: "1E293B")
    static let textSecondary = Color(hex: "64748B")
    static let textTertiary = Color(hex: "94A3B8")
    
    // MARK: - Shadows & Borders
    static let cardShadowColor = Color.black.opacity(0.08)
    static let cardShadowRadius: CGFloat = 8
    static let borderLight = Color(hex: "E2E8F0")
    
    // MARK: - Spacing
    static let spacingXS: CGFloat = 4
    static let spacingSM: CGFloat = 8
    static let spacingMD: CGFloat = 12
    static let spacingLG: CGFloat = 16
    static let spacingXL: CGFloat = 24
    static let spacingXXL: CGFloat = 32
    
    // MARK: - Corner Radius
    static let radiusSmall: CGFloat = 6
    static let radiusMedium: CGFloat = 10
    static let radiusLarge: CGFloat = 16
    static let radiusBadge: CGFloat = 20
    
    // MARK: - Gradients
    static var orangeGradient: LinearGradient {
        LinearGradient(
            colors: [primaryOrangeGradientStart, primaryOrangeGradientEnd],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
    
    // MARK: - Helpers
    static func spotColor(for status: SpotStatus) -> Color {
        switch status {
        case .free: return spotFree
        case .occupied: return spotOccupied
        case .reserved: return spotReserved
        case .sensor_offline: return spotOffline
        }
    }
    
    static func zoneColor(freeRatio: Double) -> Color {
        if freeRatio > 0.3 { return zoneAvailable }
        if freeRatio > 0.1 { return zoneMedium }
        return zoneFull
    }
}
