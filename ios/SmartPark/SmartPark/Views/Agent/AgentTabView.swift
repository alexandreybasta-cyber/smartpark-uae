import SwiftUI
import CoreLocation

struct AgentTabView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = AgentViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Chat messages
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: DesignTokens.spacingMD) {
                            ForEach(viewModel.messages) { message in
                                ChatBubble(message: message, onShowOnMap: { coord in
                                    appState.showOnMap(coordinate: coord)
                                })
                            }

                            if viewModel.isLoading {
                                HStack {
                                    ProgressView()
                                    Text("Thinking...")
                                        .font(.subheadline)
                                        .foregroundColor(DesignTokens.textSecondary)
                                }
                                .padding()
                            }
                        }
                        .padding(DesignTokens.spacingLG)
                    }
                    .onChange(of: viewModel.messages.count) { _, _ in
                        if let last = viewModel.messages.last {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }

                Divider()

                // Input bar
                inputBar
            }
            .navigationTitle(appState.appMode == .enforcement ? "Enforce Agent" : "Parking Agent")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: {
                        if viewModel.speechService.isSpeaking {
                            viewModel.stopSpeaking()
                        } else {
                            viewModel.speakLastResponse()
                        }
                    }) {
                        Image(systemName: viewModel.speechService.isSpeaking ? "speaker.slash.fill" : "speaker.wave.2.fill")
                            .foregroundColor(DesignTokens.primaryOrange)
                    }
                }
            }
            .onChange(of: appState.pendingAgentQuery) { _, query in
                if let query = query {
                    Task {
                        await viewModel.sendQuery(
                            text: query,
                            location: appState.locationService.effectiveLocation,
                            appMode: appState.appMode,
                            zones: appState.zones
                        )
                    }
                    appState.pendingAgentQuery = nil
                }
            }
        }
    }

    private var inputBar: some View {
        HStack(spacing: DesignTokens.spacingSM) {
            TextField(
                appState.appMode == .enforcement ? "Ask about violations..." : "Find parking near...",
                text: $viewModel.inputText
            )
            .textFieldStyle(.roundedBorder)
            .onSubmit { sendMessage() }

            Button(action: sendMessage) {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.title2)
                    .foregroundColor(viewModel.inputText.isEmpty ? DesignTokens.textTertiary : DesignTokens.primaryOrange)
            }
            .disabled(viewModel.inputText.isEmpty || viewModel.isLoading)
        }
        .padding(DesignTokens.spacingMD)
        .background(DesignTokens.surfaceBackground)
    }

    private func sendMessage() {
        let text = viewModel.inputText
        Task {
            await viewModel.sendQuery(
                text: text,
                location: appState.locationService.effectiveLocation,
                appMode: appState.appMode,
                zones: appState.zones
            )
        }
    }
}

// MARK: - Chat Bubble

struct ChatBubble: View {
    let message: AgentViewModel.ChatMessage
    let onShowOnMap: (CLLocationCoordinate2D) -> Void

    var body: some View {
        HStack {
            if message.isUser { Spacer() }

            VStack(alignment: message.isUser ? .trailing : .leading, spacing: DesignTokens.spacingSM) {
                Text(message.text)
                    .font(.body)
                    .foregroundColor(message.isUser ? .white : DesignTokens.textPrimary)
                    .padding(DesignTokens.spacingMD)
                    .background(message.isUser ? DesignTokens.primaryOrange : DesignTokens.surfaceBackground)
                    .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusLarge))

                // Agent-only: reasoning steps
                if let response = message.response, !response.reasoningSteps.isEmpty {
                    ReasoningStepsView(steps: response.reasoningSteps)
                }

                // Agent-only: map card
                if let mapCard = message.response?.mapCard {
                    MapCardView(mapCard: mapCard, onShowOnMap: onShowOnMap)
                }

                // Agent-only: always show "Show on Map" button (fallback when no mapCard)
                if !message.isUser {
                    Button(action: {
                        if let lat = message.response?.mapCard?.lat,
                           let lng = message.response?.mapCard?.lng {
                            onShowOnMap(CLLocationCoordinate2D(latitude: lat, longitude: lng))
                        } else {
                            onShowOnMap(DemoConstants.dubaiInternetCity)
                        }
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: "map.fill")
                            Text("Show on Map")
                        }
                        .font(.caption.bold())
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(DesignTokens.primaryOrange)
                        .foregroundColor(.white)
                        .clipShape(Capsule())
                    }
                    .padding(.top, 4)
                }
            }
            .frame(maxWidth: 300, alignment: message.isUser ? .trailing : .leading)

            if !message.isUser { Spacer() }
        }
    }
}
