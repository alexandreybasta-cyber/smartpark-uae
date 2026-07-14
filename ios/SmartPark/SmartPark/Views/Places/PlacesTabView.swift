import SwiftUI
import MapKit

struct PlacesTabView: View {
    @Environment(AppState.self) private var appState
    @Environment(NavigationViewModel.self) private var navigationVM
    @State private var viewModel = PlacesViewModel()

    var body: some View {
        @Bindable var navVM = navigationVM
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
                            }, onNavigate: {
                                navigationVM.activeDestination = place
                                navigationVM.showNavigateSheet = true
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
            .sheet(isPresented: $navVM.showNavigateSheet) {
                NavigateSheet(navigationVM: navigationVM)
                    .environment(appState)
            }
        }
    }
}

// MARK: - Place Row
struct PlaceRow: View {
    let place: SavedPlace
    let onFindParking: () -> Void
    let onNavigate: () -> Void

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

            Button(action: onNavigate) {
                Image(systemName: "arrow.triangle.turn.up.right.diamond.fill")
                    .font(.body)
                    .foregroundColor(.white)
                    .padding(8)
                    .background(DesignTokens.primaryOrange)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)

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
    @State private var searchCompleter = LocationSearchCompleter()
    @State private var locationQuery = ""
    @State private var selectedLocation: MKMapItem?

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

                Section("Location") {
                    if selectedLocation == nil {
                        TextField("Search for a place...", text: $locationQuery)
                            .autocorrectionDisabled()
                            .onChange(of: locationQuery) { _, newValue in
                                searchCompleter.search(query: newValue)
                            }

                        if !searchCompleter.results.isEmpty {
                            ForEach(searchCompleter.results, id: \.self) { result in
                                Button(action: { selectCompletion(result) }) {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(result.title)
                                            .font(.subheadline)
                                            .foregroundColor(DesignTokens.textPrimary)
                                        if !result.subtitle.isEmpty {
                                            Text(result.subtitle)
                                                .font(.caption)
                                                .foregroundColor(DesignTokens.textSecondary)
                                        }
                                    }
                                }
                            }
                        }

                        if selectedLocation == nil && viewModel.newLat.isEmpty && !locationQuery.isEmpty {
                            Text("Tap a result above to select a location")
                                .font(.caption)
                                .foregroundColor(DesignTokens.textSecondary)
                        }
                    } else {
                        HStack {
                            Image(systemName: "mappin.circle.fill")
                                .foregroundColor(DesignTokens.primaryOrange)
                            Text(selectedLocation?.name ?? "Selected Location")
                                .font(.subheadline)
                                .foregroundColor(DesignTokens.textPrimary)
                            Spacer()
                            Button("Change") {
                                selectedLocation = nil
                                locationQuery = ""
                                viewModel.newLat = ""
                                viewModel.newLng = ""
                                viewModel.newAddress = ""
                            }
                            .font(.caption)
                            .foregroundColor(DesignTokens.primaryOrange)
                        }
                    }

                    Button(action: useCurrentLocation) {
                        Label("Use Current Location", systemImage: "location.fill")
                    }
                    .foregroundColor(DesignTokens.primaryOrange)
                }

                Section("Details") {
                    TextField("Name (optional)", text: $viewModel.newName)
                }

                if let error = viewModel.error {
                    Section {
                        Label(error, systemImage: "exclamationmark.triangle.fill")
                            .font(.subheadline)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Add Place")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        viewModel.error = nil
                        dismiss()
                    }
                    .disabled(viewModel.isSaving)
                }
                ToolbarItem(placement: .confirmationAction) {
                    if viewModel.isSaving {
                        ProgressView()
                    } else {
                        Button("Save") {
                            Task {
                                let success = await viewModel.addPlace()
                                if success {
                                    dismiss()
                                }
                            }
                        }
                        .disabled(selectedLocation == nil && viewModel.newLat.isEmpty)
                        .tint(DesignTokens.primaryOrange)
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .interactiveDismissDisabled(viewModel.isSaving)
    }

    private func selectCompletion(_ result: MKLocalSearchCompletion) {
        let request = MKLocalSearch.Request(completion: result)
        let search = MKLocalSearch(request: request)
        Task {
            guard let response = try? await search.start(),
                  let mapItem = response.mapItems.first else { return }
            selectedLocation = mapItem
            locationQuery = result.title
            viewModel.newLat = String(mapItem.placemark.coordinate.latitude)
            viewModel.newLng = String(mapItem.placemark.coordinate.longitude)
            viewModel.newAddress = [
                mapItem.placemark.name,
                mapItem.placemark.locality,
                mapItem.placemark.administrativeArea
            ].compactMap { $0 }.joined(separator: ", ")
        }
    }

    private func useCurrentLocation() {
        let locationService = LocationService()
        locationService.requestPermission()
        locationService.startUpdating()
        let coordinate = locationService.effectiveLocation
        viewModel.newLat = String(coordinate.latitude)
        viewModel.newLng = String(coordinate.longitude)

        // Reverse geocode for address
        let location = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
        let geocoder = CLGeocoder()
        Task {
            if let placemark = try? await geocoder.reverseGeocodeLocation(location).first {
                viewModel.newAddress = [
                    placemark.name,
                    placemark.locality,
                    placemark.administrativeArea
                ].compactMap { $0 }.joined(separator: ", ")
                locationQuery = placemark.name ?? "Current Location"
            } else {
                locationQuery = "Current Location"
            }
            selectedLocation = MKMapItem(placemark: MKPlacemark(coordinate: coordinate))
        }
    }
}

// MARK: - Location Search Completer
@Observable
class LocationSearchCompleter: NSObject, MKLocalSearchCompleterDelegate {
    var results: [MKLocalSearchCompletion] = []
    private let completer = MKLocalSearchCompleter()

    override init() {
        super.init()
        completer.delegate = self
        completer.resultTypes = [.address, .pointOfInterest]
        // Bias toward Dubai area
        completer.region = MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 25.09, longitude: 55.16),
            span: MKCoordinateSpan(latitudeDelta: 0.5, longitudeDelta: 0.5)
        )
    }

    func search(query: String) {
        guard !query.isEmpty else {
            results = []
            return
        }
        completer.queryFragment = query
    }

    func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
        results = completer.results
    }

    func completer(_ completer: MKLocalSearchCompleter, didFailWithError error: Error) {
        results = []
    }
}
