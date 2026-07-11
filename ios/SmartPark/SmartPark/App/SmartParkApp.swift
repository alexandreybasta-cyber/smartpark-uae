import SwiftUI
import UserNotifications

@main
struct SmartParkApp: App {
    @State private var appState = AppState()
    @State private var navigationVM = NavigationViewModel()

    var body: some Scene {
        WindowGroup {
            MainContentView()
                .environment(appState)
                .environment(navigationVM)
                .task {
                    await appState.bootstrap()
                }
                .onReceive(NotificationCenter.default.publisher(for: .geofenceTriggered)) { _ in
                    // When geofence triggers, provide current free spots
                    let freeSpots = appState.spots.filter { $0.status == .free }
                    navigationVM.handleGeofenceEntry(freeSpots: freeSpots)
                }
        }
    }
}
