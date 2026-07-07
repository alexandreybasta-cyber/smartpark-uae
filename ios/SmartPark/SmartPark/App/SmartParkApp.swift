import SwiftUI

@main
struct SmartParkApp: App {
    @State private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            MainContentView()
                .environment(appState)
                .task {
                    await appState.bootstrap()
                }
        }
    }
}
