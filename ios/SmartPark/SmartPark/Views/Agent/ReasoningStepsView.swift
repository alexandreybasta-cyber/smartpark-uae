import SwiftUI

struct ReasoningStepsView: View {
    let steps: [String]
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spacingSM) {
            Button(action: { withAnimation { isExpanded.toggle() } }) {
                HStack {
                    Image(systemName: "brain")
                        .foregroundStyle(.secondary)
                    Text("Reasoning (\(steps.count) steps)")
                        .font(.caption.bold())
                        .foregroundColor(DesignTokens.textSecondary)
                    Spacer()
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(DesignTokens.textTertiary)
                }
            }

            if isExpanded {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                        HStack(alignment: .top, spacing: 8) {
                            Text("\(index + 1)")
                                .font(.caption2.bold())
                                .foregroundColor(.primary)
                                .frame(width: 18, height: 18)
                                .background(Color(.secondarySystemFill))
                                .clipShape(Circle())
                            Text(step)
                                .font(.caption)
                                .foregroundColor(DesignTokens.textSecondary)
                        }
                        .transition(.opacity.combined(with: .move(edge: .top)))
                    }
                }
            }
        }
        .padding(DesignTokens.spacingMD)
        .background(DesignTokens.surfaceBackground)
        .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusMedium))
    }
}
