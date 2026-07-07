import SwiftUI

@main
struct SmartParkApp: App {
    @State private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appState)
                .task {
                    await appState.bootstrap()
                }
        }
    }
}

// Placeholder until real ContentView is built in Task 7
struct ContentView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        VStack(spacing: 16) {
            Text("SmartPark")
                .font(.largeTitle)
                .foregroundColor(DesignTokens.primaryOrange)

            Text(appState.connectionMode == .live ? "Connected" :
                 appState.connectionMode == .offline ? "Offline Mode" : "Connecting...")
                .foregroundColor(DesignTokens.textSecondary)

            Text("\(appState.zones.count) zones, \(appState.spots.count) spots")
                .foregroundColor(DesignTokens.textTertiary)
        }
    }
}
