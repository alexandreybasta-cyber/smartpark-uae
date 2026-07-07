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
            let response: AgentResponse

            if appMode == .enforcement && !Configuration.qwenAPIKey.isEmpty {
                // Enforcement mode: use Qwen for richer reasoning
                let context = EnforcementContext(
                    lat: location.latitude,
                    lng: location.longitude,
                    zoneNames: zones.map(\.name),
                    totalSpots: zones.reduce(0) { $0 + $1.totalSpots },
                    occupiedCount: zones.reduce(0) { $0 + $1.occupiedCount }
                )
                response = try await qwenService.sendEnforcementQuery(text: text, context: context)
            } else {
                // Driver mode: use backend agent
                response = try await apiClient.sendAgentQuery(
                    text: text,
                    lat: location.latitude,
                    lng: location.longitude
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

    func speakLastResponse() {
        guard let lastAgent = messages.last(where: { !$0.isUser }) else { return }
        speechService.speak(lastAgent.text)
    }

    func stopSpeaking() {
        speechService.stop()
    }
}
