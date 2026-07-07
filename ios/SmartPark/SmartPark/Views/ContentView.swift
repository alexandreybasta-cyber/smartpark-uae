import SwiftUI

struct MainContentView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        @Bindable var state = appState

        TabView(selection: $state.selectedTab) {
            MapTabView()
                .tabItem {
                    Label("Map", systemImage: "map.fill")
                }
                .tag(AppTab.map)

            AgentTabView()
                .tabItem {
                    Label("Agent", systemImage: "bubble.left.and.bubble.right.fill")
                }
                .tag(AppTab.agent)

            PlacesTabView()
                .tabItem {
                    Label("Places", systemImage: "star.fill")
                }
                .tag(AppTab.places)

            InsightsTabView()
                .tabItem {
                    Label("Insights", systemImage: "chart.line.uptrend.xyaxis")
                }
                .tag(AppTab.insights)

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .tag(AppTab.settings)
        }
        .tint(DesignTokens.primaryOrange)
        .onAppear {
            // Request location on first launch
            appState.locationService.requestPermission()
        }
    }
}
