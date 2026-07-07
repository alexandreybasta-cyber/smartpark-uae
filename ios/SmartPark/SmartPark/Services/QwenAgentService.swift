import Foundation

actor QwenAgentService {
    static let shared = QwenAgentService()

    private let session: URLSession
    private let decoder = JSONDecoder()

    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)
    }

    // MARK: - Driver Mode Query

    /// Send a driver-mode query to Qwen API (finding parking, navigation help)
    func sendDriverQuery(text: String, lat: Double, lng: Double, zones: [Zone]) async throws -> AgentResponse {
        let apiKey = Configuration.qwenAPIKey
        guard !apiKey.isEmpty else {
            throw QwenError.noAPIKey
        }

        let zoneInfo = zones.prefix(5).map { z in
            "\(z.name): \(z.freeCount)/\(z.totalSpots) free, AED \(z.pricePerHour)/hr"
        }.joined(separator: "\n")

        let systemPrompt = """
        You are SmartPark Driver AI, an intelligent parking assistant for drivers in Dubai Internet City.
        You help drivers with:
        - Finding available parking spots nearby
        - Comparing zones by price, availability, and walking distance
        - Navigation suggestions to the best parking zone
        - Parking rules and pricing information
        - General parking-related questions

        Current context:
        - Driver location: \(lat), \(lng)
        - Nearby zones:
        \(zoneInfo)

        Respond concisely. Suggest the best option first. Include zone names and free spot counts.
        """

        return try await callQwenAPI(systemPrompt: systemPrompt, userMessage: text)
    }

    // MARK: - Enforcement Mode Query

    /// Send enforcement query to Qwen API via Dashscope-compatible endpoint
    func sendEnforcementQuery(text: String, context: EnforcementContext) async throws -> AgentResponse {
        let apiKey = Configuration.qwenAPIKey
        guard !apiKey.isEmpty else {
            throw QwenError.noAPIKey
        }

        let violationsContext = MockViolations.contextSummary

        let systemPrompt = """
        You are SmartPark Enforce AI, an intelligent assistant for parking enforcement officers in Dubai Internet City.
        You help patrol officers with:
        - Finding nearby parking violations (unpaid vehicles past grace period)
        - Recommending patrol routes based on violation density
        - Providing violation status updates
        - Suggesting enforcement actions (warn, fine, tow)

        Current context:
        - Officer location: \(context.lat), \(context.lng)
        - Active zones: \(context.zoneNames.joined(separator: ", "))
        - Total monitored spots: \(context.totalSpots)
        - Currently occupied: \(context.occupiedCount)

        \(violationsContext)

        Respond concisely and actionably. Reference specific violations by spot ID and plate number when relevant.
        """

        return try await callQwenAPI(systemPrompt: systemPrompt, userMessage: text)
    }

    // MARK: - Shared API Call

    private func callQwenAPI(systemPrompt: String, userMessage: String) async throws -> AgentResponse {
        let apiKey = Configuration.qwenAPIKey

        let messages: [[String: String]] = [
            ["role": "system", "content": systemPrompt],
            ["role": "user", "content": userMessage]
        ]

        let requestBody: [String: Any] = [
            "model": "qwen-plus",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 500
        ]

        // Call Qwen API (Dashscope compatible endpoint)
        let url = URL(string: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw QwenError.apiError
        }

        // Parse Qwen response into our AgentResponse format
        let qwenResponse = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let choices = qwenResponse?["choices"] as? [[String: Any]]
        let message = choices?.first?["message"] as? [String: Any]
        let content = message?["content"] as? String ?? "No response from AI"

        return parseQwenResponse(content)
    }

    private func parseQwenResponse(_ content: String) -> AgentResponse {
        // Split response into reasoning steps and final answer
        let lines = content.components(separatedBy: "\n").filter { !$0.isEmpty }
        var reasoningSteps: [String] = []
        var answerLines: [String] = []
        var inReasoning = false

        for line in lines {
            if line.hasPrefix("- ") || line.hasPrefix("• ") || line.hasPrefix("1.") || line.hasPrefix("2.") || line.hasPrefix("3.") {
                reasoningSteps.append(line.trimmingCharacters(in: .whitespaces))
                inReasoning = true
            } else {
                if inReasoning {
                    answerLines.append(line)
                } else {
                    answerLines.append(line)
                }
            }
        }

        let answer = answerLines.isEmpty ? content : answerLines.joined(separator: "\n")
        if reasoningSteps.isEmpty {
            reasoningSteps = ["Analyzing query...", "Processing: \(content.prefix(50))..."]
        }

        return AgentResponse(text: answer, reasoningSteps: reasoningSteps, mapCard: nil)
    }
}

struct EnforcementContext {
    let lat: Double
    let lng: Double
    let zoneNames: [String]
    let totalSpots: Int
    let occupiedCount: Int
}

enum QwenError: LocalizedError {
    case noAPIKey
    case apiError
    case decodingFailed

    var errorDescription: String? {
        switch self {
        case .noAPIKey: return "Qwen API key not configured. Add it to Secrets.xcconfig."
        case .apiError: return "Qwen API request failed."
        case .decodingFailed: return "Failed to parse Qwen response."
        }
    }
}
