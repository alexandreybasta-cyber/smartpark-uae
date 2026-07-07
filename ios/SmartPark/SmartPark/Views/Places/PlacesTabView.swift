import SwiftUI

struct PlacesTabView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = PlacesViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.places.isEmpty {
                    ProgressView("Loading places...")
                } else if viewModel.places.isEmpty {
                    ContentUnavailableView(
                        "No Saved Places",
                        systemImage: "mappin.slash",
                        description: Text("Add your frequent locations to quickly find parking nearby.")
                    )
                } else {
                    List {
                        ForEach(viewModel.places) { place in
                            PlaceRow(place: place, onFindParking: {
                                appState.askAgent(query: "Find parking near my \(place.label) at \(place.customName ?? place.label)")
                            })
                        }
                        .onDelete { indexSet in
                            Task {
                                for index in indexSet {
                                    await viewModel.deletePlace(viewModel.places[index])
                                }
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Places")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { viewModel.showAddForm = true }) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(DesignTokens.primaryOrange)
                    }
                }
            }
            .sheet(isPresented: $viewModel.showAddForm) {
                AddPlaceSheet(viewModel: viewModel)
            }
            .task {
                await viewModel.loadPlaces()
            }
            .refreshable {
                await viewModel.loadPlaces()
            }
        }
    }
}

// MARK: - Place Row
struct PlaceRow: View {
    let place: SavedPlace
    let onFindParking: () -> Void

    var body: some View {
        HStack(spacing: DesignTokens.spacingMD) {
            Image(systemName: PlacesViewModel.icon(for: place.label))
                .font(.title2)
                .foregroundColor(DesignTokens.primaryOrange)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(place.customName ?? place.label.capitalized)
                    .font(.headline)
                    .foregroundColor(DesignTokens.textPrimary)
                if let address = place.address {
                    Text(address)
                        .font(.caption)
                        .foregroundColor(DesignTokens.textSecondary)
                }
            }

            Spacer()

            Button("Find Parking", action: onFindParking)
                .font(.caption.bold())
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(DesignTokens.primaryOrange.opacity(0.1))
                .foregroundColor(DesignTokens.primaryOrange)
                .clipShape(Capsule())
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Add Place Sheet
struct AddPlaceSheet: View {
    @Bindable var viewModel: PlacesViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Type") {
                    Picker("Label", selection: $viewModel.newLabel) {
                        ForEach(PlacesViewModel.labelOptions, id: \.self) { label in
                            Label(label.capitalized, systemImage: PlacesViewModel.icon(for: label))
                                .tag(label)
                        }
                    }
                }

                Section("Details") {
                    TextField("Name (optional)", text: $viewModel.newName)
                    TextField("Address (optional)", text: $viewModel.newAddress)
                }

                Section("Coordinates") {
                    TextField("Latitude", text: $viewModel.newLat)
                        .keyboardType(.decimalPad)
                    TextField("Longitude", text: $viewModel.newLng)
                        .keyboardType(.decimalPad)
                }
            }
            .navigationTitle("Add Place")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            await viewModel.addPlace()
                            dismiss()
                        }
                    }
                    .disabled(viewModel.newLat.isEmpty || viewModel.newLng.isEmpty)
                    .tint(DesignTokens.primaryOrange)
                }
            }
        }
        .presentationDetents([.medium])
    }
}
