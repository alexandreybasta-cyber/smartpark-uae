import SwiftUI
import UserNotifications
import CarPlay

// MARK: - App Delegate (handles CarPlay scene routing)

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        configurationForConnecting connectingSceneSession: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        // Route CarPlay scenes to CarPlaySceneDelegate
        if connectingSceneSession.role == UISceneSession.Role(rawValue: "CPTemplateApplicationSceneSessionRoleApplication") {
            let config = UISceneConfiguration(
                name: "CarPlay Configuration",
                sessionRole: connectingSceneSession.role
            )
            config.delegateClass = CarPlaySceneDelegate.self
            return config
        }

        // Default window scene — handled by SwiftUI's WindowGroup
        let config = UISceneConfiguration(
            name: "Default Configuration",
            sessionRole: connectingSceneSession.role
        )
        return config
    }
}

@main
struct SpotSenseApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
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
