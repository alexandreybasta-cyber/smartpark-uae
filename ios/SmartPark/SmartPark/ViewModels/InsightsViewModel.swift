import Foundation
import Observation

@MainActor
@Observable
class InsightsViewModel {
    var predictions: [Prediction] = []
    var selectedZoneId: Int?
    var isLoading = false
    var error: String?

    private let apiClient = APIClient.shared

    func loadPredictions(for zoneId: Int) async {
        isLoading = true
        selectedZoneId = zoneId
        error = nil
        do {
            predictions = try await apiClient.fetchPredictions(zoneId: zoneId)
        } catch {
            self.error = error.localizedDescription
            predictions = []
        }
        isLoading = false
    }

    func selectZone(_ zone: Zone) async {
        await loadPredictions(for: zone.id)
    }
}
