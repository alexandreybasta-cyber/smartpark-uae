import Foundation

// MARK: - Network Error
enum NetworkError: LocalizedError {
    case invalidURL
    case httpError(statusCode: Int, message: String?)
    case decodingFailed(Error)
    case networkUnreachable
    case timeout

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .httpError(let statusCode, let message):
            if let message = message {
                return "HTTP \(statusCode): \(message)"
            }
            return "HTTP Error \(statusCode)"
        case .decodingFailed(let error):
            return "Decoding failed: \(error.localizedDescription)"
        case .networkUnreachable:
            return "Network unreachable. Check your connection."
        case .timeout:
            return "Request timed out. Please try again."
        }
    }
}

// MARK: - API Client
actor APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let decoder: JSONDecoder

    var baseURL: String {
        Configuration.apiBaseURL
    }

    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 10
        config.timeoutIntervalForResource = 30
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config)

        self.decoder = JSONDecoder()
        // Backend uses snake_case — models have custom CodingKeys
    }

    // MARK: - Zone Endpoints

    func fetchZones() async throws -> [Zone] {
        try await get("/api/zones")
    }

    func fetchZoneDetail(_ zoneId: Int) async throws -> ZoneDetail {
        try await get("/api/zones/\(zoneId)")
    }

    func fetchNearbyZones(lat: Double, lng: Double, radiusM: Int = 500) async throws -> [Zone] {
        try await get("/api/zones/nearby?lat=\(lat)&lng=\(lng)&radius_m=\(radiusM)")
    }

    // MARK: - Prediction

    func fetchPredictions(zoneId: Int) async throws -> [Prediction] {
        try await get("/api/predict/\(zoneId)")
    }

    // MARK: - Places CRUD

    func fetchPlaces() async throws -> [SavedPlace] {
        try await get("/api/places")
    }

    func createPlace(_ place: SavedPlaceCreate) async throws -> SavedPlace {
        try await post("/api/places", body: place)
    }

    func deletePlace(_ placeId: Int) async throws {
        try await delete("/api/places/\(placeId)")
    }

    // MARK: - Agent

    func sendAgentQuery(text: String, lat: Double?, lng: Double?) async throws -> AgentResponse {
        let request = AgentTextRequest(text: text, lat: lat, lng: lng)
        return try await post("/api/agent/text", body: request, timeout: 30)
    }

    // MARK: - Private Helpers

    private func get<T: Decodable>(_ path: String, timeout: TimeInterval = 5) async throws -> T {
        guard let url = URL(string: baseURL + path) else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = timeout
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await performRequest(request)
        try validateResponse(response, data: data)

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw NetworkError.decodingFailed(error)
        }
    }

    private func post<T: Decodable, B: Encodable>(_ path: String, body: B, timeout: TimeInterval = 10) async throws -> T {
        guard let url = URL(string: baseURL + path) else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = timeout
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(body)

        let (data, response) = try await performRequest(request)
        try validateResponse(response, data: data)

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw NetworkError.decodingFailed(error)
        }
    }

    private func delete(_ path: String) async throws {
        guard let url = URL(string: baseURL + path) else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.timeoutInterval = 5

        let (data, response) = try await performRequest(request)
        try validateResponse(response, data: data, allowNoContent: true)
    }

    // MARK: - Request Execution

    private func performRequest(_ request: URLRequest) async throws -> (Data, URLResponse) {
        do {
            return try await session.data(for: request)
        } catch let error as URLError {
            switch error.code {
            case .notConnectedToInternet, .networkConnectionLost, .dataNotAllowed:
                throw NetworkError.networkUnreachable
            case .timedOut:
                throw NetworkError.timeout
            default:
                throw NetworkError.networkUnreachable
            }
        }
    }

    private func validateResponse(_ response: URLResponse, data: Data, allowNoContent: Bool = false) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.httpError(statusCode: 0, message: "Invalid response")
        }

        let statusCode = httpResponse.statusCode

        if allowNoContent && statusCode == 204 {
            return
        }

        guard (200...299).contains(statusCode) else {
            let message = String(data: data, encoding: .utf8)
            throw NetworkError.httpError(statusCode: statusCode, message: message)
        }
    }
}
