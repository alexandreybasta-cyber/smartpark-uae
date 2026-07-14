import SwiftUI
import Charts

struct InsightsTabView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = InsightsViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DesignTokens.spacingXL) {
                    // Zone picker
                    zonePicker

                    // Prediction chart
                    if !viewModel.predictions.isEmpty {
                        predictionChart
                    } else if viewModel.isLoading {
                        ProgressView()
                            .frame(height: 200)
                    } else if viewModel.selectedZoneId != nil {
                        ContentUnavailableView(
                            "No Predictions",
                            systemImage: "chart.line.downtrend.xyaxis",
                            description: Text("No prediction data available for this zone.")
                        )
                    }

                    // Zone comparison cards
                    zoneComparisonSection
                }
                .padding(DesignTokens.spacingLG)
            }
            .navigationTitle("Insights")
            .task {
                if let firstZone = appState.zones.first {
                    await viewModel.loadPredictions(for: firstZone.id)
                }
            }
        }
    }

    // MARK: - Zone Picker
    private var zonePicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: DesignTokens.spacingSM) {
                ForEach(appState.zones) { zone in
                    Button {
                        Task { await viewModel.selectZone(zone) }
                    } label: {
                        Text(zone.name)
                            .font(.subheadline.weight(.medium))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(
                                viewModel.selectedZoneId == zone.id
                                    ? Color(.secondarySystemFill)
                                    : DesignTokens.surfaceBackground
                            )
                            .foregroundColor(
                                viewModel.selectedZoneId == zone.id
                                    ? DesignTokens.textPrimary
                                    : DesignTokens.textSecondary
                            )
                            .clipShape(Capsule())
                            .overlay(
                                Capsule()
                                    .stroke(
                                        viewModel.selectedZoneId == zone.id
                                            ? Color.clear
                                            : DesignTokens.borderLight,
                                        lineWidth: 1
                                    )
                            )
                    }
                }
            }
        }
    }

    // MARK: - Prediction Chart
    private var predictionChart: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spacingSM) {
            Text("Predicted Occupancy")
                .font(.headline)
                .foregroundColor(DesignTokens.textPrimary)

            Chart(viewModel.predictions) { prediction in
                LineMark(
                    x: .value("Time", prediction.timestamp),
                    y: .value("Occupancy", prediction.predictedOccupancy)
                )
                .foregroundStyle(DesignTokens.textSecondary)
                .interpolationMethod(.catmullRom)

                AreaMark(
                    x: .value("Time", prediction.timestamp),
                    y: .value("Occupancy", prediction.predictedOccupancy)
                )
                .foregroundStyle(
                    LinearGradient(
                        colors: [DesignTokens.textTertiary.opacity(0.3), .clear],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
            }
            .chartYScale(domain: 0...100)
            .chartYAxis {
                AxisMarks(values: [0, 25, 50, 75, 100]) { value in
                    AxisValueLabel {
                        Text("\(value.as(Int.self) ?? 0)%")
                    }
                    AxisGridLine()
                }
            }
            .frame(height: 200)
        }
        .padding()
        .background(DesignTokens.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusLarge))
        .shadow(color: DesignTokens.cardShadowColor, radius: DesignTokens.cardShadowRadius)
    }

    // MARK: - Zone Comparison
    private var zoneComparisonSection: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spacingMD) {
            Text("Zone Overview")
                .font(.headline)
                .foregroundColor(DesignTokens.textPrimary)

            ForEach(appState.zones) { zone in
                zoneCard(zone)
            }
        }
    }

    private func zoneCard(_ zone: Zone) -> some View {
        let occupancyRatio = zone.totalSpots > 0
            ? Double(zone.occupiedCount) / Double(zone.totalSpots)
            : 0
        let freeRatio = zone.totalSpots > 0
            ? Double(zone.freeCount) / Double(zone.totalSpots)
            : 0

        return VStack(alignment: .leading, spacing: DesignTokens.spacingSM) {
            HStack {
                Text(zone.name)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(DesignTokens.textPrimary)
                Spacer()
                Text("AED \(String(format: "%.1f", zone.pricePerHour))/hr")
                    .font(.caption.weight(.medium))
                    .foregroundColor(DesignTokens.textSecondary)
            }

            HStack(spacing: DesignTokens.spacingSM) {
                Label("\(zone.freeCount) free", systemImage: "car.fill")
                    .font(.caption)
                    .foregroundColor(DesignTokens.spotFree)
                Text("/")
                    .font(.caption)
                    .foregroundColor(DesignTokens.textTertiary)
                Text("\(zone.totalSpots) total")
                    .font(.caption)
                    .foregroundColor(DesignTokens.textSecondary)
            }

            // Occupancy bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(DesignTokens.surfaceBackground)
                        .frame(height: 8)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(DesignTokens.zoneColor(freeRatio: freeRatio))
                        .frame(width: geometry.size.width * occupancyRatio, height: 8)
                }
            }
            .frame(height: 8)

            Text("\(Int(occupancyRatio * 100))% occupied")
                .font(.caption2)
                .foregroundColor(DesignTokens.textTertiary)
        }
        .padding()
        .background(DesignTokens.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusMedium))
        .shadow(color: DesignTokens.cardShadowColor, radius: DesignTokens.cardShadowRadius / 2)
    }
}
