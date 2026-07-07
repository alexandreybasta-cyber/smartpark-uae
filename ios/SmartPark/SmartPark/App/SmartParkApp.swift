import SwiftUI

@main
struct SmartParkApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

// Placeholder until ContentView is built in Task 7
struct ContentView: View {
    var body: some View {
        Text("SmartPark")
            .font(.largeTitle)
            .foregroundColor(DesignTokens.primaryOrange)
    }
}
