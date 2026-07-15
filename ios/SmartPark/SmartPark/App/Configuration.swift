import Foundation

enum Configuration {
    static var apiBaseURL: String {
        guard let url = Bundle.main.infoDictionary?["SMARTPARK_API_BASE_URL"] as? String, !url.isEmpty else {
            return "https://test.smartparkai.com"
        }
        return url
    }
    
    static var qwenAPIKey: String {
        guard let key = Bundle.main.infoDictionary?["QWEN_API_KEY"] as? String, !key.isEmpty, key != "your-qwen-api-key-here" else {
            return ""
        }
        return key
    }
    
    static var qoderAgentAPIKey: String {
        guard let key = Bundle.main.infoDictionary?["QODER_AGENT_API_KEY"] as? String, !key.isEmpty, key != "your-qoder-agent-key-here" else {
            return ""
        }
        return key
    }
    
    static var wsBaseURL: String {
        let http = apiBaseURL
        return http.replacingOccurrences(of: "http://", with: "ws://")
                   .replacingOccurrences(of: "https://", with: "wss://")
    }
}
