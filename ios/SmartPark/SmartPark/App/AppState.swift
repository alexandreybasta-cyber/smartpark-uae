import Foundation
import Observation
import CoreLocation

@MainActor
@Observable
class AppState {
    // MARK: - State
    var zones: [Zone] = []
    var spots: [Spot] = []
    var connectionMode: ConnectionMode = .connecting
    var selectedTab: AppTab = .map
    var appMode: AppMode = .driver
    var mapFocusCoordinate: CLLocationCoordinate2D?
    var mapShouldAutoSearch = false
    var pendingAgentQuery: String?

    // MARK: - Services
    private let apiClient = APIClient.shared
    private let webSocketManager = WebSocketManager()
    private var offlineSimulator: OfflineSimulator?
    let locationService = LocationService()

    // MARK: - Lifecycle

    func bootstrap() async {
        connectionMode = .connecting

        do {
            // 1. Fetch all zones
            let fetchedZones = try await apiClient.fetchZones()
            zones = fetchedZones

            // 2. Fetch zone details in parallel to get spots
            var allSpots: [Spot] = []
            try await withThrowingTaskGroup(of: [Spot].self) { group in
                for zone in fetchedZones {
                    group.addTask { [apiClient] in
                        let detail = try await apiClient.fetchZoneDetail(zone.id)
                        return detail.spots
                    }
                }
                for try await zoneSpots in group {
                    allSpots.append(contentsOf: zoneSpots)
                }
            }
            spots = allSpots

            // 3. Connected successfully — go live
            connectionMode = .live
            connectWebSocket()

            // 4. Start location updates
            locationService.requestPermission()

        } catch {
            // Network failure — fall back to offline mode
            switchToOffline()
        }
    }

    // MARK: - WebSocket

    func connectWebSocket() {
        webSocketManager.onSpotUpdate = { [weak self] updates in
            Task { @MainActor [weak self] in
                self?.handleSpotUpdate(updates)
            }
        }
        webSocketManager.connect()
    }

    func handleSpotUpdate(_ updates: [SpotUpdate]) {
        for update in updates {
            if let index = spots.firstIndex(where: { $0.id == update.id }) {
                spots[index].status = update.status
                if let changedAt = update.lastChangedAt {
                    spots[index] = Spot(
                        id: spots[index].id,
                        zoneId: spots[index].zoneId,
                        lat: spots[index].lat,
                        lng: spots[index].lng,
                        status: update.status,
                        lastChangedAt: changedAt,
                        sensorId: spots[index].sensorId,
                        occupiedSince: update.status == .occupied ? changedAt : nil
                    )
                }
            }
        }
        recomputeZoneCounts()
    }

    func recomputeZoneCounts() {
        for i in zones.indices {
            let zoneId = zones[i].id
            let zoneSpots = spots.filter { $0.zoneId == zoneId }
            zones[i].freeCount = zoneSpots.filter { $0.status == .free }.count
            zones[i].occupiedCount = zoneSpots.filter { $0.status == .occupied }.count
            zones[i].reservedCount = zoneSpots.filter { $0.status == .reserved }.count
        }
    }

    // MARK: - Offline Mode

    func switchToOffline() {
        connectionMode = .offline

        // Load seed data
        zones = OfflineSimulator.seedZones
        spots = OfflineSimulator.seedSpots

        // Start simulator
        let simulator = OfflineSimulator()
        simulator.onUpdate = { [weak self] updates in
            Task { @MainActor [weak self] in
                self?.handleSpotUpdate(updates)
            }
        }
        simulator.start()
        offlineSimulator = simulator

        // Start location even in offline mode
        locationService.requestPermission()
    }

    // MARK: - Cross-tab Actions

    func showOnMap(coordinate: CLLocationCoordinate2D) {
        mapFocusCoordinate = coordinate
        mapShouldAutoSearch = true
        selectedTab = .map
    }

    func showOnMapAndSearch(coordinate: CLLocationCoordinate2D) {
        mapFocusCoordinate = coordinate
        mapShouldAutoSearch = true
        selectedTab = .map
    }

    func askAgent(query: String) {
        pendingAgentQuery = query
        selectedTab = .agent
    }

    // MARK: - Cleanup

    func disconnect() {
        webSocketManager.disconnect()
        offlineSimulator?.stop()
        offlineSimulator = nil
        locationService.stopUpdating()
    }
}
