import Foundation
import CoreLocation

// MARK: - Violation Model
struct Violation: Identifiable {
    let id: String
    let spotId: String
    let zoneName: String
    let lat: Double
    let lng: Double
    let unpaidSince: Date
    let gracePeriodExpired: Bool
    let plateNumber: String
    let recommendedAction: String

    var unpaidDuration: String {
        let interval = Date().timeIntervalSince(unpaidSince)
        let minutes = Int(interval / 60)
        if minutes < 60 {
            return "\(minutes) min"
        } else {
            let hours = minutes / 60
            let remainingMin = minutes % 60
            return remainingMin > 0 ? "\(hours)h \(remainingMin)m" : "\(hours)h"
        }
    }
}

// MARK: - Mock Violations Data
enum MockViolations {
    static let violations: [Violation] = [
        Violation(
            id: "VIO-001",
            spotId: "A-09",
            zoneName: "Dubai Internet City - Block A",
            lat: 25.0927,
            lng: 55.1589,
            unpaidSince: Date().addingTimeInterval(-45 * 60),
            gracePeriodExpired: true,
            plateNumber: "D 12345",
            recommendedAction: "Issue fine (AED 200)"
        ),
        Violation(
            id: "VIO-002",
            spotId: "A-12",
            zoneName: "Dubai Internet City - Block A",
            lat: 25.0929,
            lng: 55.1592,
            unpaidSince: Date().addingTimeInterval(-120 * 60),
            gracePeriodExpired: true,
            plateNumber: "Abu Dhabi 67890",
            recommendedAction: "Request tow"
        ),
        Violation(
            id: "VIO-003",
            spotId: "B-14",
            zoneName: "Dubai Internet City - Block B",
            lat: 25.0910,
            lng: 55.1627,
            unpaidSince: Date().addingTimeInterval(-30 * 60),
            gracePeriodExpired: true,
            plateNumber: "D 54321",
            recommendedAction: "Issue fine (AED 200)"
        ),
        Violation(
            id: "VIO-004",
            spotId: "B-18",
            zoneName: "Dubai Internet City - Block B",
            lat: 25.0913,
            lng: 55.1632,
            unpaidSince: Date().addingTimeInterval(-15 * 60),
            gracePeriodExpired: false,
            plateNumber: "Sharjah 11223",
            recommendedAction: "Issue warning"
        ),
        Violation(
            id: "VIO-005",
            spotId: "B-21",
            zoneName: "Dubai Internet City - Block B",
            lat: 25.0916,
            lng: 55.1636,
            unpaidSince: Date().addingTimeInterval(-90 * 60),
            gracePeriodExpired: true,
            plateNumber: "D 99887",
            recommendedAction: "Issue fine (AED 200)"
        ),
        Violation(
            id: "VIO-006",
            spotId: "C-10",
            zoneName: "Dubai Internet City - Block C",
            lat: 25.0891,
            lng: 55.1575,
            unpaidSince: Date().addingTimeInterval(-60 * 60),
            gracePeriodExpired: true,
            plateNumber: "Abu Dhabi 44556",
            recommendedAction: "Issue fine (AED 200)"
        ),
        Violation(
            id: "VIO-007",
            spotId: "C-13",
            zoneName: "Dubai Internet City - Block C",
            lat: 25.0894,
            lng: 55.1580,
            unpaidSince: Date().addingTimeInterval(-105 * 60),
            gracePeriodExpired: true,
            plateNumber: "D 77665",
            recommendedAction: "Request tow"
        )
    ]

    /// Summary string for AI context
    static var contextSummary: String {
        let lines = violations.map { v in
            "- Spot \(v.spotId) (\(v.zoneName)): Plate \(v.plateNumber), unpaid \(v.unpaidDuration), grace expired: \(v.gracePeriodExpired ? "YES" : "NO"), action: \(v.recommendedAction)"
        }
        return """
        ACTIVE VIOLATIONS (\(violations.count) total):
        \(lines.joined(separator: "\n"))
        """
    }

    /// Generate dynamic violations near a coordinate for enforcement mode
    static func violationsNear(_ coord: CLLocationCoordinate2D, count: Int = 12) -> [Violation] {
        let platePrefixes = ["D ", "Abu Dhabi ", "Sharjah ", "AJ ", "RAK ", "D ", "D ", "Abu Dhabi "]
        let actions = ["Issue fine (AED 200)", "Issue fine (AED 200)", "Issue fine (AED 200)", "Request tow", "Issue warning"]
        let zoneNames = ["Zone A", "Zone B", "Zone C", "Zone A", "Zone B"]
        
        var violations: [Violation] = []
        for i in 0..<count {
            let angle = Double(i) * (.pi * 2 / Double(count))
            let distance = Double.random(in: 30...250)
            let latOffset = distance * cos(angle) / 111_320
            let lngOffset = distance * sin(angle) / (111_320 * cos(coord.latitude * .pi / 180))
            
            let minutesAgo = [5, 10, 15, 20, 30, 45, 60, 75, 90, 120, 150, 180]
            let unpaidMinutes = minutesAgo[i % minutesAgo.count]
            let graceExpired = unpaidMinutes > 15
            
            violations.append(Violation(
                id: "VIO-DYN-\(String(format: "%02d", i + 1))",
                spotId: "V-\(String(format: "%02d", i + 1))",
                zoneName: zoneNames[i % zoneNames.count],
                lat: coord.latitude + latOffset,
                lng: coord.longitude + lngOffset,
                unpaidSince: Date().addingTimeInterval(-Double(unpaidMinutes) * 60),
                gracePeriodExpired: graceExpired,
                plateNumber: "\(platePrefixes[i % platePrefixes.count])\(Int.random(in: 10000...99999))",
                recommendedAction: actions[i % actions.count]
            ))
        }
        return violations
    }
}
