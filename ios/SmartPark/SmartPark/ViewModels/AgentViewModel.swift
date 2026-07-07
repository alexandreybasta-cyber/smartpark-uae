import Foundation
import Observation
import CoreLocation

@MainActor
@Observable
class AgentViewModel {
    var messages: [ChatMessage] = []
    var inputText: String = ""
    var isLoading = false
    var error: String?

    private let apiClient = APIClient.shared
    private let qwenService = QwenAgentService.shared
    let speechService = SpeechService()

    struct ChatMessage: Identifiable {
        let id = UUID()
        let isUser: Bool
        let text: String
        let response: AgentResponse?  // nil for user messages
        let timestamp: Date
    }

    func sendQuery(text: String, location: CLLocationCoordinate2D, appMode: AppMode, zones: [Zone]) async {
        guard !text.isEmpty else { return }

        let userMessage = ChatMessage(isUser: true, text: text, response: nil, timestamp: .now)
        messages.append(userMessage)
        inputText = ""
        isLoading = true
        error = nil

        do {
            var response: AgentResponse

            if appMode == .enforcement {
                // Enforcement mode: always use Qwen with violation context
                response = try await sendEnforcementViaQwen(text: text, location: location, zones: zones)
            } else {
                // Driver mode: try backend first with short timeout, fallback to Qwen
                response = try await sendDriverWithFallback(text: text, location: location, zones: zones)
            }

            // Enrich response with synthetic mapCard if none was provided
            if response.mapCard == nil {
                let syntheticMapCard = createMapCardFromContext(zones: zones)
                response = AgentResponse(
                    text: response.text,
                    reasoningSteps: response.reasoningSteps,
                    mapCard: syntheticMapCard
                )
            }

            let agentMessage = ChatMessage(isUser: false, text: response.text, response: response, timestamp: .now)
            messages.append(agentMessage)
        } catch {
            self.error = error.localizedDescription
            let errorMessage = ChatMessage(isUser: false, text: "Sorry, I couldn't process that request. \(error.localizedDescription)", response: nil, timestamp: .now)
            messages.append(errorMessage)
        }

        isLoading = false
    }

    // MARK: - Driver Mode with Fallback

    private func sendDriverWithFallback(text: String, location: CLLocationCoordinate2D, zones: [Zone]) async throws -> AgentResponse {
        // Try backend first with 3s timeout
        do {
            let response = try await withThrowingTaskGroup(of: AgentResponse.self) { group in
                group.addTask { [apiClient] in
                    try await apiClient.sendAgentQuery(text: text, lat: location.latitude, lng: location.longitude, timeout: 3)
                }
                group.addTask {
                    try await Task.sleep(nanoseconds: 3_500_000_000) // 3.5s hard deadline
                    throw NetworkError.timeout
                }
                let result = try await group.next()!
                group.cancelAll()
                return result
            }
            return response
        } catch {
            // Backend unreachable — fallback to Qwen cloud API
            if !Configuration.qwenAPIKey.isEmpty {
                return try await qwenService.sendDriverQuery(
                    text: text,
                    lat: location.latitude,
                    lng: location.longitude,
                    zones: zones
                )
            } else {
                // No Qwen key either — return a local mock response
                return mockDriverResponse(text: text, zones: zones)
            }
        }
    }

    // MARK: - Enforcement via Qwen

    private func sendEnforcementViaQwen(text: String, location: CLLocationCoordinate2D, zones: [Zone]) async throws -> AgentResponse {
        let context = EnforcementContext(
            lat: location.latitude,
            lng: location.longitude,
            zoneNames: zones.map(\.name),
            totalSpots: zones.reduce(0) { $0 + $1.totalSpots },
            occupiedCount: zones.reduce(0) { $0 + $1.occupiedCount }
        )

        if !Configuration.qwenAPIKey.isEmpty {
            return try await qwenService.sendEnforcementQuery(text: text, context: context)
        } else {
            // No Qwen key — return mock enforcement response
            return mockEnforcementResponse(text: text)
        }
    }

    // MARK: - Mock Responses (no API key fallback)

    private func mockDriverResponse(text: String, zones: [Zone]) -> AgentResponse {
        let bestZone = zones.max(by: { $0.freeCount < $1.freeCount })
        let zoneName = bestZone?.name ?? "Dubai Internet City - Block A"
        let freeCount = bestZone?.freeCount ?? 8

        return AgentResponse(
            text: "Based on current availability, I recommend \(zoneName) with \(freeCount) free spots. This is the closest zone with the most availability right now.",
            reasoningSteps: ["Checked nearby zones", "Compared availability", "Selected best option"],
            mapCard: nil
        )
    }

    private func mockEnforcementResponse(text: String) -> AgentResponse {
        let violations = MockViolations.violations
        let expired = violations.filter(\.gracePeriodExpired)

        return AgentResponse(
            text: "There are \(expired.count) active violations with expired grace periods. Priority: Spot \(expired.first?.spotId ?? "A-09") (plate \(expired.first?.plateNumber ?? "D 12345")) — unpaid \(expired.first?.unpaidDuration ?? "45 min"). Recommended action: \(expired.first?.recommendedAction ?? "Issue fine").",
            reasoningSteps: ["Scanned \(violations.count) violations", "Filtered \(expired.count) expired grace periods", "Prioritized by duration"],
            mapCard: nil
        )
    }

    func speakLastResponse() {
        guard let lastAgent = messages.last(where: { !$0.isUser }) else { return }
        speechService.speak(lastAgent.text)
    }

    func stopSpeaking() {
        speechService.stop()
    }

    // MARK: - Synthetic Map Card

    private func createMapCardFromContext(zones: [Zone]) -> MapCard? {
        guard let bestZone = zones.max(by: { $0.freeCount < $1.freeCount }) else { return nil }
        return MapCard(
            zoneId: bestZone.id,
            zoneName: bestZone.name,
            lat: DemoConstants.dubaiInternetCity.latitude,
            lng: DemoConstants.dubaiInternetCity.longitude,
            freeSpots: bestZone.freeCount,
            totalSpots: bestZone.totalSpots,
            pricePerHour: bestZone.pricePerHour,
            walkingMinutes: 3
        )
    }
}
