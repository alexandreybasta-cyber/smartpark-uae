import Foundation

@MainActor
class OfflineSimulator {
    private var timer: Timer?
    var onUpdate: (([SpotUpdate]) -> Void)?

    // MARK: - Seed Zones

    static let seedZones: [Zone] = [
        Zone(id: 1, name: "Dubai Internet City - Block A", geojsonPolygon: nil,
             pricingType: "dynamic", pricePerHour: 5.0, totalSpots: 18,
             freeCount: 8, occupiedCount: 9, reservedCount: 1),
        Zone(id: 2, name: "Dubai Internet City - Block B", geojsonPolygon: nil,
             pricingType: "dynamic", pricePerHour: 4.0, totalSpots: 24,
             freeCount: 10, occupiedCount: 12, reservedCount: 2),
        Zone(id: 3, name: "Dubai Internet City - Block C", geojsonPolygon: nil,
             pricingType: "fixed", pricePerHour: 3.0, totalSpots: 16,
             freeCount: 7, occupiedCount: 8, reservedCount: 1)
    ]

    // MARK: - Seed Spots

    static let seedSpots: [Spot] = generateSeedSpots()

    private static func generateSeedSpots() -> [Spot] {
        var spots: [Spot] = []

        // Zone 1: Block A — 18 spots (lat 25.0920–25.0935, lng 55.1580–55.1600)
        for i in 1...18 {
            let id = String(format: "A-%02d", i)
            let lat = 25.0920 + Double(i - 1) * 0.0000882  // spread across range
            let lng = 55.1580 + Double(i - 1) * 0.0001176
            let status: SpotStatus = i <= 8 ? .free : (i <= 17 ? .occupied : .reserved)
            spots.append(Spot(id: id, zoneId: 1, lat: lat, lng: lng, status: status,
                              lastChangedAt: nil, sensorId: "SEN-A\(i)", occupiedSince: nil))
        }

        // Zone 2: Block B — 24 spots (lat 25.0900–25.0918, lng 55.1610–55.1640)
        for i in 1...24 {
            let id = String(format: "B-%02d", i)
            let lat = 25.0900 + Double(i - 1) * 0.0000783
            let lng = 55.1610 + Double(i - 1) * 0.0001304
            let status: SpotStatus = i <= 10 ? .free : (i <= 22 ? .occupied : .reserved)
            spots.append(Spot(id: id, zoneId: 2, lat: lat, lng: lng, status: status,
                              lastChangedAt: nil, sensorId: "SEN-B\(i)", occupiedSince: nil))
        }

        // Zone 3: Block C — 16 spots (lat 25.0880–25.0898, lng 55.1560–55.1585)
        for i in 1...16 {
            let id = String(format: "C-%02d", i)
            let lat = 25.0880 + Double(i - 1) * 0.000120
            let lng = 55.1560 + Double(i - 1) * 0.0001667
            let status: SpotStatus = i <= 7 ? .free : (i <= 15 ? .occupied : .reserved)
            spots.append(Spot(id: id, zoneId: 3, lat: lat, lng: lng, status: status,
                              lastChangedAt: nil, sensorId: "SEN-C\(i)", occupiedSince: nil))
        }

        return spots
    }

    // MARK: - Lifecycle

    func start() {
        stop()
        timer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.simulateUpdate()
            }
        }
    }

    func stop() {
        timer?.invalidate()
        timer = nil
    }

    // MARK: - Simulation

    private func simulateUpdate() {
        let targetOccupancy = currentTargetOccupancy()
        let allSpots = Self.seedSpots
        let totalCount = allSpots.count

        let desiredOccupied = Int(Double(totalCount) * targetOccupancy)
        let currentOccupied = allSpots.filter { $0.status == .occupied }.count

        // Determine direction: need to fill or free spots
        let needMore = desiredOccupied > currentOccupied
        let changeCandidates: [Spot]
        let newStatus: SpotStatus

        if needMore {
            changeCandidates = allSpots.filter { $0.status == .free }
            newStatus = .occupied
        } else {
            changeCandidates = allSpots.filter { $0.status == .occupied }
            newStatus = .free
        }

        guard !changeCandidates.isEmpty else { return }

        // Randomly flip 1-3 spots
        let flipCount = min(Int.random(in: 1...3), changeCandidates.count)
        let chosen = changeCandidates.shuffled().prefix(flipCount)

        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let now = iso.string(from: Date())

        let updates = chosen.map { spot in
            SpotUpdate(id: spot.id, status: newStatus, lastChangedAt: now)
        }

        onUpdate?(updates)
    }

    private func currentTargetOccupancy() -> Double {
        // Dubai timezone: UTC+4
        let dubaiTZ = TimeZone(secondsFromGMT: 4 * 3600)!
        var calendar = Calendar.current
        calendar.timeZone = dubaiTZ
        let hour = calendar.component(.hour, from: Date())

        switch hour {
        case 0..<7:
            return Double.random(in: 0.08...0.15)
        case 7..<10:
            return Double.random(in: 0.45...0.85)
        case 10..<14:
            return Double.random(in: 0.70...0.80)
        case 14..<17:
            return Double.random(in: 0.72...0.82)
        case 17..<20:
            return Double.random(in: 0.85...0.92)
        default: // 20-24
            return Double.random(in: 0.30...0.50)
        }
    }
}
