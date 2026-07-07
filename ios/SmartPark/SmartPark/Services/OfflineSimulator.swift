import Foundation

@MainActor
class OfflineSimulator {
    private var timer: Timer?
    var onUpdate: (([SpotUpdate]) -> Void)?

    // MARK: - Seed Zones

    static let seedZones: [Zone] = [
        Zone(id: 1, name: "Al Sufouh Road (East)", geojsonPolygon: nil,
             pricingType: "dynamic", pricePerHour: 6.0, totalSpots: 20,
             freeCount: 8, occupiedCount: 10, reservedCount: 2),
        Zone(id: 2, name: "Dubai Internet City - Internal", geojsonPolygon: nil,
             pricingType: "dynamic", pricePerHour: 5.0, totalSpots: 35,
             freeCount: 12, occupiedCount: 18, reservedCount: 5),
        Zone(id: 3, name: "Knowledge Park", geojsonPolygon: nil,
             pricingType: "fixed", pricePerHour: 4.0, totalSpots: 25,
             freeCount: 10, occupiedCount: 12, reservedCount: 3),
        Zone(id: 4, name: "Media City", geojsonPolygon: nil,
             pricingType: "dynamic", pricePerHour: 5.5, totalSpots: 15,
             freeCount: 5, occupiedCount: 8, reservedCount: 2)
    ]

    // MARK: - Seed Spots

    static let seedSpots: [Spot] = generateSeedSpots()

    private static func generateSeedSpots() -> [Spot] {
        var spots: [Spot] = []

        // ─── Zone A: Al Sufouh Road (East) — 20 spots ───
        // Along Al Sufouh Road near DIC, curbside parking (slight lng variation)
        let zoneABase: [(Double, Double)] = [
            (25.0990, 55.1560), (25.0992, 55.1562), (25.0994, 55.1563),
            (25.0996, 55.1564), (25.0997, 55.1566), (25.0999, 55.1567),
            (25.1001, 55.1569), (25.1002, 55.1571), (25.1003, 55.1573),
            (25.1005, 55.1574), (25.1006, 55.1576), (25.1007, 55.1578),
            (25.1008, 55.1580), (25.1009, 55.1582), (25.1010, 55.1583),
            (25.0991, 55.1561), (25.0993, 55.1565), (25.0998, 55.1568),
            (25.1000, 55.1572), (25.1004, 55.1577)
        ]
        for i in 0..<20 {
            let id = String(format: "A-%02d", i + 1)
            let (lat, lng) = zoneABase[i]
            // Curbside offset: slight lng jitter
            let curbLng = lng + Double.random(in: -0.00005...0.00005)
            let status: SpotStatus = i < 8 ? .free : (i < 18 ? .occupied : .reserved)
            spots.append(Spot(id: id, zoneId: 1, lat: lat, lng: curbLng, status: status,
                              lastChangedAt: nil, sensorId: "SEN-A\(i+1)", occupiedSince: nil))
        }

        // ─── Zone B: Dubai Internet City - Internal — 35 spots ───
        // Realistic parking lot clusters (groups of 5-6) along internal roads
        let zoneBClusters: [[(Double, Double)]] = [
            // Cluster near Building 1-3
            [(25.0942, 55.1575), (25.0943, 55.1575), (25.0944, 55.1576),
             (25.0945, 55.1576), (25.0946, 55.1577), (25.0947, 55.1577)],
            // Cluster near Building 4-6
            [(25.0950, 55.1585), (25.0951, 55.1585), (25.0952, 55.1586),
             (25.0953, 55.1586), (25.0954, 55.1587), (25.0955, 55.1587)],
            // Cluster near Building 7-8
            [(25.0957, 55.1595), (25.0958, 55.1595), (25.0959, 55.1596),
             (25.0960, 55.1596), (25.0961, 55.1597)],
            // Cluster near Building 9-10
            [(25.0963, 55.1605), (25.0964, 55.1605), (25.0965, 55.1606),
             (25.0966, 55.1606), (25.0967, 55.1607), (25.0968, 55.1607)],
            // Cluster near Building 11-12
            [(25.0945, 55.1610), (25.0946, 55.1611), (25.0947, 55.1612),
             (25.0948, 55.1612), (25.0949, 55.1613), (25.0950, 55.1614)],
            // Street-side along main internal road
            [(25.0956, 55.1580), (25.0958, 55.1583), (25.0960, 55.1588),
             (25.0962, 55.1592), (25.0964, 55.1598), (25.0966, 55.1602)]
        ]
        var bIndex = 0
        for cluster in zoneBClusters {
            for (lat, lng) in cluster {
                bIndex += 1
                let id = String(format: "B-%02d", bIndex)
                let jitteredLat = lat + Double.random(in: -0.00003...0.00003)
                let jitteredLng = lng + Double.random(in: -0.00004...0.00004)
                let status: SpotStatus
                if bIndex <= 12 { status = .free }
                else if bIndex <= 30 { status = .occupied }
                else { status = .reserved }
                spots.append(Spot(id: id, zoneId: 2, lat: jitteredLat, lng: jitteredLng, status: status,
                                  lastChangedAt: nil, sensorId: "SEN-B\(bIndex)", occupiedSince: nil))
            }
        }

        // ─── Zone C: Knowledge Park — 25 spots ───
        // Along Al Falak Street and internal Knowledge Park roads
        let zoneCBase: [(Double, Double)] = [
            // Al Falak Street (north side)
            (25.0920, 55.1500), (25.0921, 55.1503), (25.0922, 55.1506),
            (25.0923, 55.1509), (25.0924, 55.1512), (25.0925, 55.1515),
            (25.0926, 55.1518), (25.0927, 55.1521), (25.0928, 55.1524),
            (25.0929, 55.1527), (25.0930, 55.1530),
            // Al Falak Street (south side — parallel row)
            (25.0919, 55.1502), (25.0919, 55.1505), (25.0919, 55.1508),
            (25.0919, 55.1511), (25.0919, 55.1514), (25.0919, 55.1517),
            (25.0919, 55.1520),
            // Internal parking cluster
            (25.0935, 55.1535), (25.0936, 55.1536), (25.0937, 55.1537),
            (25.0938, 55.1538), (25.0939, 55.1539), (25.0940, 55.1540),
            (25.0938, 55.1542)
        ]
        for i in 0..<25 {
            let id = String(format: "C-%02d", i + 1)
            let (lat, lng) = zoneCBase[i]
            let jitteredLat = lat + Double.random(in: -0.00002...0.00002)
            let status: SpotStatus
            if i < 10 { status = .free }
            else if i < 22 { status = .occupied }
            else { status = .reserved }
            spots.append(Spot(id: id, zoneId: 3, lat: jitteredLat, lng: lng, status: status,
                              lastChangedAt: nil, sensorId: "SEN-C\(i+1)", occupiedSince: nil))
        }

        // ─── Zone D: Media City — 15 spots ───
        // Near Dubai Media City along road
        let zoneDBase: [(Double, Double)] = [
            (25.0960, 55.1480), (25.0961, 55.1483), (25.0962, 55.1486),
            (25.0963, 55.1489), (25.0964, 55.1492), (25.0965, 55.1495),
            (25.0966, 55.1498), (25.0967, 55.1501), (25.0968, 55.1504),
            (25.0970, 55.1507), (25.0972, 55.1510), (25.0974, 55.1513),
            (25.0976, 55.1515), (25.0978, 55.1517), (25.0980, 55.1519)
        ]
        for i in 0..<15 {
            let id = String(format: "D-%02d", i + 1)
            let (lat, lng) = zoneDBase[i]
            let jitteredLng = lng + Double.random(in: -0.00005...0.00005)
            let status: SpotStatus
            if i < 5 { status = .free }
            else if i < 13 { status = .occupied }
            else { status = .reserved }
            spots.append(Spot(id: id, zoneId: 4, lat: lat, lng: jitteredLng, status: status,
                              lastChangedAt: nil, sensorId: "SEN-D\(i+1)", occupiedSince: nil))
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
