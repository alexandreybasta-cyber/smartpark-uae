import SwiftUI

struct SettingsView: View {
    @Environment(AppState.self) private var appState
    @AppStorage("customAPIURL") private var customAPIURL: String = ""
    @AppStorage("forceOffline") private var forceOffline: Bool = false

    var body: some View {
        NavigationStack {
            Form {
                // MARK: - App Mode
                Section {
                    @Bindable var state = appState
                    Picker("Mode", selection: $state.appMode) {
                        ForEach(AppMode.allCases, id: \.self) { mode in
                            Text(mode.rawValue).tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)
                } header: {
                    Text("App Mode")
                } footer: {
                    Text(appState.appMode == .driver ?
                        "Find free parking spots near your destination." :
                        "Patrol enforcement mode — view flagged spots and talk to AI agent.")
                }

                // MARK: - Connection Status
                Section("Connection") {
                    HStack {
                        Text("Status")
                        Spacer()
                        HStack(spacing: 6) {
                            Circle()
                                .fill(statusColor)
                                .frame(width: 8, height: 8)
                            Text(statusText)
                                .foregroundColor(DesignTokens.textSecondary)
                        }
                    }

                    HStack {
                        Text("Zones")
                        Spacer()
                        Text("\(appState.zones.count)")
                            .foregroundColor(DesignTokens.textSecondary)
                    }

                    HStack {
                        Text("Spots")
                        Spacer()
                        Text("\(appState.spots.count)")
                            .foregroundColor(DesignTokens.textSecondary)
                    }
                }

                // MARK: - Developer
                Section("Developer") {
                    TextField("API URL Override", text: $customAPIURL, prompt: Text("https://api.spotsense.app"))
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)

                    Toggle("Force Offline Mode", isOn: $forceOffline)
                }

                // MARK: - About
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(DesignTokens.textSecondary)
                    }
                    HStack {
                        Text("Platform")
                        Spacer()
                        Text("iOS 17+")
                            .foregroundColor(DesignTokens.textSecondary)
                    }
                    HStack {
                        Text("AI Engine")
                        Spacer()
                        Text(appState.appMode == .enforcement ? "Qwen" : "SpotSense Agent")
                            .foregroundColor(DesignTokens.textSecondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .tint(DesignTokens.primaryOrange)
        }
    }

    private var statusColor: Color {
        switch appState.connectionMode {
        case .live: return DesignTokens.spotFree
        case .offline: return DesignTokens.spotReserved
        case .connecting: return DesignTokens.textTertiary
        }
    }

    private var statusText: String {
        switch appState.connectionMode {
        case .live: return "Live"
        case .offline: return "Offline"
        case .connecting: return "Connecting..."
        }
    }
}
