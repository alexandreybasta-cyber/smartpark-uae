import SwiftUI
import CoreLocation

struct NavigateSheet: View {
    @Environment(AppState.self) private var appState
    @Bindable var navigationVM: NavigationViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: DesignTokens.spacingLG) {
            // Handle bar
            RoundedRectangle(cornerRadius: 3)
                .fill(Color.gray.opacity(0.4))
                .frame(width: 40, height: 5)
                .padding(.top, 10)

            // Destination info
            destinationHeader

            Divider()

            // GPS app picker
            gpsAppPicker

            Divider()

            // Start button
            startButton

            Spacer()
        }
        .padding(.horizontal, DesignTokens.spacingLG)
        .presentationDetents([.height(360)])
        .presentationDragIndicator(.hidden)
    }

    // MARK: - Destination Header

    private var destinationHeader: some View {
        HStack(spacing: 14) {
            Image(systemName: "mappin.circle.fill")
                .font(.title)
                .foregroundColor(DesignTokens.primaryOrange)

            VStack(alignment: .leading, spacing: 4) {
                if let destination = navigationVM.activeDestination {
                    Text(destination.customName ?? destination.label.capitalized)
                        .font(.headline)
                        .foregroundColor(DesignTokens.textPrimary)

                    if let address = destination.address {
                        Text(address)
                            .font(.caption)
                            .foregroundColor(DesignTokens.textSecondary)
                            .lineLimit(2)
                    }
                } else {
                    Text("Select a destination")
                        .font(.headline)
                        .foregroundColor(DesignTokens.textSecondary)
                }
            }

            Spacer()
        }
    }

    // MARK: - GPS App Picker

    private var gpsAppPicker: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Navigate with")
                .font(.subheadline.weight(.medium))
                .foregroundColor(DesignTokens.textSecondary)

            HStack(spacing: 12) {
                ForEach(NavigationRedirectService.availableApps(), id: \.self) { app in
                    gpsAppButton(app)
                }
            }
        }
    }

    private func gpsAppButton(_ app: GPSApp) -> some View {
        let isSelected = navigationVM.selectedGPSApp == app
        return Button(action: { navigationVM.selectedGPSApp = app }) {
            VStack(spacing: 6) {
                Image(systemName: iconForApp(app))
                    .font(.title2)
                Text(app.displayName)
                    .font(.caption2.weight(.medium))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(isSelected ? DesignTokens.primaryOrange.opacity(0.12) : Color.gray.opacity(0.08))
            .foregroundColor(isSelected ? DesignTokens.primaryOrange : DesignTokens.textSecondary)
            .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusMedium))
            .overlay(
                RoundedRectangle(cornerRadius: DesignTokens.radiusMedium)
                    .stroke(isSelected ? DesignTokens.primaryOrange : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Start Button

    private var startButton: some View {
        Button(action: startNavigation) {
            HStack(spacing: 8) {
                Image(systemName: "arrow.triangle.turn.up.right.diamond.fill")
                Text("Start Navigation")
                    .font(.headline)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(DesignTokens.primaryOrange)
            .foregroundColor(.white)
            .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusMedium))
            .shadow(color: DesignTokens.primaryOrange.opacity(0.4), radius: 8, y: 4)
        }
        .disabled(navigationVM.activeDestination == nil)
        .opacity(navigationVM.activeDestination == nil ? 0.5 : 1.0)
    }

    // MARK: - Actions

    private func startNavigation() {
        guard let destination = navigationVM.activeDestination else { return }

        let freeSpots = appState.spots.filter { $0.status == .free }
        navigationVM.startNavigation(
            destination: destination,
            gpsApp: navigationVM.selectedGPSApp,
            freeSpots: freeSpots
        )

        dismiss()
    }

    // MARK: - Helpers

    private func iconForApp(_ app: GPSApp) -> String {
        switch app {
        case .appleMaps: return "map.fill"
        case .googleMaps: return "globe"
        case .waze: return "car.fill"
        }
    }
}

// MARK: - Geofence Active Banner

struct GeofenceActiveBanner: View {
    let destinationName: String
    let onCancel: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "location.circle.fill")
                .foregroundColor(.white)
                .font(.subheadline)

            Text("Monitoring: \(destinationName)")
                .font(.caption.bold())
                .foregroundColor(.white)
                .lineLimit(1)

            Spacer()

            Button(action: onCancel) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.white.opacity(0.8))
                    .font(.subheadline)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(DesignTokens.primaryOrange.opacity(0.9))
        .clipShape(Capsule())
        .shadow(color: DesignTokens.primaryOrange.opacity(0.3), radius: 4, y: 2)
    }
}
