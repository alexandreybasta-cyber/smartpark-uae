import Foundation
import Observation

@Observable
class WebSocketManager: NSObject, URLSessionWebSocketDelegate {
    var isConnected = false
    var lastSpotUpdates: [SpotUpdate] = []

    private var webSocket: URLSessionWebSocketTask?
    private var session: URLSession?
    private var reconnectAttempt = 0
    private let maxReconnectDelay: TimeInterval = 30
    private var isManuallyDisconnected = false

    var onSpotUpdate: (([SpotUpdate]) -> Void)?

    override init() {
        super.init()
    }

    func connect() {
        isManuallyDisconnected = false

        let wsURL = Configuration.wsBaseURL + "/ws/spots"
        guard let url = URL(string: wsURL) else { return }

        let sessionConfig = URLSessionConfiguration.default
        session = URLSession(configuration: sessionConfig, delegate: self, delegateQueue: nil)
        webSocket = session?.webSocketTask(with: url)
        webSocket?.resume()
        receiveMessage()
    }

    func disconnect() {
        isManuallyDisconnected = true
        webSocket?.cancel(with: .goingAway, reason: nil)
        webSocket = nil
        session?.invalidateAndCancel()
        session = nil
        Task { @MainActor in
            self.isConnected = false
        }
    }

    private func receiveMessage() {
        webSocket?.receive { [weak self] result in
            guard let self = self else { return }

            switch result {
            case .success(let message):
                self.reconnectAttempt = 0
                self.handleMessage(message)
                self.receiveMessage()

            case .failure:
                Task { @MainActor in
                    self.isConnected = false
                }
                if !self.isManuallyDisconnected {
                    self.scheduleReconnect()
                }
            }
        }
    }

    private func handleMessage(_ message: URLSessionWebSocketTask.Message) {
        let data: Data
        switch message {
        case .string(let text):
            guard let textData = text.data(using: .utf8) else { return }
            data = textData
        case .data(let rawData):
            data = rawData
        @unknown default:
            return
        }

        let decoder = JSONDecoder()
        guard let spotMessage = try? decoder.decode(SpotUpdateMessage.self, from: data),
              spotMessage.type == "spot_update" else {
            return
        }

        Task { @MainActor in
            self.lastSpotUpdates = spotMessage.spots
            self.onSpotUpdate?(spotMessage.spots)
        }
    }

    private func scheduleReconnect() {
        guard !isManuallyDisconnected else { return }

        let delay = min(pow(2.0, Double(reconnectAttempt)), maxReconnectDelay)
        reconnectAttempt += 1

        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            guard let self = self, !self.isManuallyDisconnected else { return }
            self.connect()
        }
    }

    // MARK: - URLSessionWebSocketDelegate

    func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didOpenWithProtocol protocol: String?
    ) {
        Task { @MainActor in
            self.isConnected = true
            self.reconnectAttempt = 0
        }
    }

    func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
        reason: Data?
    ) {
        Task { @MainActor in
            self.isConnected = false
        }
        if !isManuallyDisconnected {
            scheduleReconnect()
        }
    }
}
