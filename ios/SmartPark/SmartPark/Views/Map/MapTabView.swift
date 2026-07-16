import SwiftUI
import MapKit

struct MapTabView: View {
    @Environment(AppState.self) private var appState
    @Environment(NavigationViewModel.self) private var navigationVM
    @State private var viewModel = MapViewModel()
    
    // Search
    @State private var searchText = ""
    @State private var searchResults: [MKMapItem] = []
    @State private var isSearching = false
    @State private var searchedLocation: CLLocationCoordinate2D?
    @State private var showSearchResults = false
    
    // Parking search
    @State private var showParkingButton = false
    @State private var showParkingResults = false
    @State private var nearbyFreeSpots: [Spot] = []
    @State private var dynamicMockSpots: [Spot] = []
    
    // Visible map center — tracks where the user is currently looking
    @State private var visibleMapCenter: CLLocationCoordinate2D = DemoConstants.dubaiInternetCity
    
    // Dynamic violations based on user location
    private var currentViolations: [Violation] {
        if appState.appMode == .enforcement {
            let coord = appState.locationService.effectiveLocation
            let nearby = MockViolations.violationsNear(coord)
            return nearby + MockViolations.violations  // Include static ones too
        }
        return []
    }
    private var violationSpotIds: Set<String> {
        Set(currentViolations.map(\.spotId))
    }
    
    // Violation mock spots (occupied spots at violation coordinates)
    private var violationMockSpots: [Spot] {
        currentViolations.map { v in
            Spot(
                id: v.spotId,
                zoneId: 1,
                lat: v.lat,
                lng: v.lng,
                status: .occupied,
                lastChangedAt: nil,
                sensorId: nil,
                occupiedSince: v.unpaidDuration
            )
        }
    }
    
    var body: some View {
        @Bindable var navVM = navigationVM
        ZStack(alignment: .top) {
            // Map with annotations and overlays
            Map(position: $viewModel.cameraPosition) {
                // User location
                UserAnnotation()
                
                // Zone polygons
                ForEach(appState.zones) { zone in
                    let coords = parseZonePolygon(zone)
                    if !coords.isEmpty {
                        MapPolygon(coordinates: coords)
                            .foregroundStyle(
                                DesignTokens.zoneColor(freeRatio: viewModel.availabilityRatio(for: zone))
                                    .opacity(0.2)
                            )
                            .stroke(
                                DesignTokens.zoneColor(freeRatio: viewModel.availabilityRatio(for: zone)),
                                lineWidth: 2
                            )
                    }
                }
                
                // Spot markers
                ForEach(appState.spots) { spot in
                    Annotation("", coordinate: spot.coordinate) {
                        Button(action: { viewModel.selectSpot(spot) }) {
                            if appState.appMode == .enforcement && violationSpotIds.contains(spot.id) {
                                ViolationAnnotationView(isSelected: viewModel.selectedSpot?.id == spot.id)
                            } else {
                                SpotAnnotationView(spot: spot, isSelected: viewModel.selectedSpot?.id == spot.id)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                
                // Dynamic mock spots (generated for demo when searching far from seed data)
                ForEach(dynamicMockSpots) { spot in
                    Annotation("", coordinate: spot.coordinate) {
                        Button(action: { viewModel.selectSpot(spot) }) {
                            SpotAnnotationView(spot: spot, isSelected: viewModel.selectedSpot?.id == spot.id)
                        }
                        .buttonStyle(.plain)
                    }
                }
                
                // Violation mock spots (enforcement mode)
                ForEach(violationMockSpots) { spot in
                    Annotation("", coordinate: spot.coordinate) {
                        Button(action: { viewModel.selectSpot(spot) }) {
                            ViolationAnnotationView(isSelected: viewModel.selectedSpot?.id == spot.id)
                        }
                        .buttonStyle(.plain)
                    }
                }
                
                // Search result pin
                if let loc = searchedLocation {
                    Annotation("Searched Location", coordinate: loc) {
                        Image(systemName: "mappin.circle.fill")
                            .font(.title)
                            .foregroundStyle(.tint)
                    }
                }
            }
            .mapStyle(.standard)
            .mapControls {
                MapCompass()
            }
            .onMapCameraChange(frequency: .onEnd) { context in
                // Track the visible map center for parking search
                visibleMapCenter = context.camera.centerCoordinate
                
                // Show parking button when user interacts with map
                if !showParkingButton {
                    withAnimation(.easeOut(duration: 0.3)) {
                        showParkingButton = true
                    }
                }
            }
            
            // Search bar at the top
            VStack(spacing: 0) {
                searchBarView
                
                // Search results dropdown
                if showSearchResults && !searchResults.isEmpty {
                    searchResultsListView
                }
            }
            .padding(.top, 8)
            .padding(.horizontal, DesignTokens.spacingLG)
            
            // Recenter button - positioned below search bar
            Button(action: recenterOnUser) {
                Image(systemName: "location.fill")
                    .font(.body)
                    .foregroundStyle(.tint)
                    .padding(10)
                    .background(DesignTokens.cardBackground)
                    .clipShape(Circle())
                    .shadow(color: .black.opacity(0.15), radius: 4, y: 2)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
            .padding(.top, 60)
            .padding(.trailing, 12)
            
            // Top badges
            VStack(spacing: 6) {
                if appState.appMode == .enforcement {
                    let expiredCount = currentViolations.filter(\.gracePeriodExpired).count
                    HStack(spacing: 4) {
                        Image(systemName: "exclamationmark.shield.fill")
                        Text("\(expiredCount) VIOLATIONS")
                    }
                    .font(.caption.bold())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.red.opacity(0.9))
                    .foregroundColor(.white)
                    .clipShape(Capsule())
                }
                
                if appState.connectionMode == .offline {
                    HStack(spacing: 4) {
                        Image(systemName: "wifi.slash")
                        Text("OFFLINE MODE")
                    }
                    .font(.caption.bold())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(DesignTokens.spotReserved.opacity(0.9))
                    .foregroundColor(.white)
                    .clipShape(Capsule())
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .padding(.top, 70)
            
            // Geofence active banner
            if navigationVM.isNavigating, let dest = navigationVM.activeDestination {
                VStack {
                    Spacer()
                    GeofenceActiveBanner(
                        destinationName: dest.customName ?? dest.label,
                        onCancel: { navigationVM.cancelNavigation() }
                    )
                    .padding(.horizontal, DesignTokens.spacingLG)
                    .padding(.bottom, showParkingResults ? 200 : (showParkingButton ? 80 : 24))
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
            
            // Floating "Search for Parking" button
            if showParkingButton && !showParkingResults {
                VStack {
                    Spacer()
                    Button(action: searchForParking) {
                        HStack(spacing: 8) {
                            Image(systemName: "p.circle.fill")
                                .font(.title3)
                            Text("Search for Parking")
                                .font(.subheadline.bold())
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 14)
                    }
                    .buttonStyle(.borderedProminent)
                    .clipShape(Capsule())
                    .padding(.bottom, 24)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
            
            // Parking results card
            if showParkingResults && !nearbyFreeSpots.isEmpty {
                VStack {
                    Spacer()
                    parkingResultsCard
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .sheet(isPresented: $viewModel.showSpotDetail) {
            if let spot = viewModel.selectedSpot {
                SpotDetailSheet(spot: spot)
                    .presentationDetents([.height(340)])
            }
        }
        .sheet(isPresented: $navVM.showNavigateSheet) {
            NavigateSheet(navigationVM: navigationVM)
                .environment(appState)
        }
        .onChange(of: appState.mapFocusCoordinate) { _, newValue in
            if let coord = newValue {
                viewModel.focusOn(coord)
                if appState.mapShouldAutoSearch {
                    // Update activeDestination to reflect the actual focused coordinate
                    let autoPlace = SavedPlace(
                        id: 0,
                        userId: "auto",
                        label: "Destination",
                        customName: "Destination",
                        lat: coord.latitude,
                        lng: coord.longitude,
                        address: nil
                    )
                    navigationVM.activeDestination = autoPlace
                    
                    // Auto-trigger parking search after a short delay to let the map settle
                    let searchCoord = coord
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        visibleMapCenter = searchCoord
                        searchForParking()
                        appState.mapShouldAutoSearch = false
                    }
                }
                appState.mapFocusCoordinate = nil
            }
        }
    }
    
    // MARK: - Search Bar
    
    private var searchBarView: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(DesignTokens.textTertiary)
            
            TextField("Search location...", text: $searchText)
                .textFieldStyle(.plain)
                .font(.subheadline)
                .autocorrectionDisabled()
                .onSubmit {
                    performSearch()
                }
            
            if !searchText.isEmpty {
                Button(action: clearSearch) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(DesignTokens.textTertiary)
                }
            }
            
            if isSearching {
                ProgressView()
                    .scaleEffect(0.8)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(DesignTokens.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusMedium))
        .shadow(color: .black.opacity(0.1), radius: 6, y: 2)
    }
    
    // MARK: - Search Results List
    
    private var searchResultsListView: some View {
        let items = Array(searchResults.prefix(5))
        return VStack(spacing: 0) {
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                Button(action: { selectSearchResult(item) }) {
                    HStack(spacing: 10) {
                        Image(systemName: "mappin.and.ellipse")
                            .foregroundStyle(.secondary)
                            .frame(width: 24)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.name ?? "Unknown")
                                .font(.subheadline.weight(.medium))
                                .foregroundColor(DesignTokens.textPrimary)
                                .lineLimit(1)
                            
                            if let subtitle = item.placemark.title {
                                Text(subtitle)
                                    .font(.caption)
                                    .foregroundColor(DesignTokens.textSecondary)
                                    .lineLimit(1)
                            }
                        }
                        
                        Spacer()
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                }
                
                if index < items.count - 1 {
                    Divider().padding(.leading, 48)
                }
            }
        }
        .background(DesignTokens.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusMedium))
        .shadow(color: .black.opacity(0.1), radius: 6, y: 2)
        .padding(.top, 4)
    }
    
    // MARK: - Parking Results Card
    
    private var parkingResultsCard: some View {
        let center = visibleMapCenter
        let nearest = nearbyFreeSpots.min(by: {
            $0.coordinate.distance(to: center) < $1.coordinate.distance(to: center)
        })
        let distanceMeters = Int(nearest?.coordinate.distance(to: center) ?? 0)
        let drivingMinutes = max(1, Int(ceil(Double(distanceMeters) / 400.0)))
        
        return VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(DesignTokens.spotFree)
                Text("Parking Found")
                    .font(.headline)
                    .foregroundColor(DesignTokens.textPrimary)
                Spacer()
                Button(action: { withAnimation { showParkingResults = false } }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(DesignTokens.textTertiary)
                }
            }
            
            // Stats row
            HStack(spacing: 20) {
                VStack {
                    Text("\(nearbyFreeSpots.count)")
                        .font(.title2.bold())
                        .foregroundColor(DesignTokens.spotFree)
                    Text("Free Spots")
                        .font(.caption)
                        .foregroundColor(DesignTokens.textSecondary)
                }
                
                VStack {
                    Text("\(distanceMeters)m")
                        .font(.title2.bold())
                        .foregroundColor(DesignTokens.textPrimary)
                    Text("Nearest")
                        .font(.caption)
                        .foregroundColor(DesignTokens.textSecondary)
                }
                
                VStack {
                    Text("\(drivingMinutes) min")
                        .font(.title2.bold())
                        .foregroundColor(DesignTokens.textPrimary)
                    Text("Drive")
                        .font(.caption)
                        .foregroundColor(DesignTokens.textSecondary)
                }
            }
            .frame(maxWidth: .infinity)
            
            // Navigate button
            Button(action: navigateToNearestSpot) {
                HStack {
                    Image(systemName: "arrow.triangle.turn.up.right.diamond.fill")
                    Text("Navigate to Nearest")
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
            .clipShape(Capsule())
            
            // Navigate to destination button
            if navigationVM.activeDestination != nil {
                Button(action: showNavigateSheet) {
                    HStack {
                        Image(systemName: "location.fill")
                        Text("Navigate to Destination")
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(DesignTokens.spacingLG)
        .background(DesignTokens.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusLarge))
        .shadow(color: .black.opacity(0.12), radius: 12, y: -4)
        .padding(.horizontal, DesignTokens.spacingLG)
        .padding(.bottom, 8)
    }
    
    // MARK: - Search Logic
    
    private func performSearch() {
        guard !searchText.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        isSearching = true
        showSearchResults = true
        
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = searchText
        request.region = MKCoordinateRegion(
            center: DemoConstants.dubaiInternetCity,
            span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
        )
        
        let search = MKLocalSearch(request: request)
        search.start { response, error in
            isSearching = false
            if let response = response {
                searchResults = response.mapItems
            } else {
                searchResults = []
            }
        }
    }
    
    private func selectSearchResult(_ item: MKMapItem) {
        let coordinate = item.placemark.coordinate
        searchedLocation = coordinate
        showSearchResults = false
        searchText = item.name ?? ""
        
        // Focus map on selected location
        viewModel.focusOn(coordinate)
        
        // Show the parking button
        withAnimation(.easeOut(duration: 0.3)) {
            showParkingButton = true
        }
        
        // Set up navigation destination from search result
        let place = SavedPlace(
            id: 0,
            userId: "search",
            label: item.name ?? "Destination",
            customName: item.name,
            lat: coordinate.latitude,
            lng: coordinate.longitude,
            address: item.placemark.title
        )
        navigationVM.activeDestination = place
    }
    
    private func clearSearch() {
        searchText = ""
        searchResults = []
        showSearchResults = false
        searchedLocation = nil
        dynamicMockSpots = []
        withAnimation {
            showParkingResults = false
        }
    }
    
    // MARK: - Parking Search Logic
    
    private func searchForParking() {
        // Use where the map is currently looking (visible center)
        let center = visibleMapCenter
        
        // Combine real spots + any dynamic mock spots
        let allSpots = appState.spots + dynamicMockSpots
        let nearby = allSpots.filter { $0.coordinate.distance(to: center) < 500 }
        nearbyFreeSpots = nearby.filter { $0.status == .free }
        
        // If nothing found nearby, generate mock spots for demo
        if nearby.isEmpty {
            dynamicMockSpots = generateMockSpots(near: center)
            nearbyFreeSpots = dynamicMockSpots.filter { $0.status == .free }
        }
        
        withAnimation(.spring) {
            showParkingResults = true
        }
        
        // Focus map on results area if we have spots
        if let firstFree = nearbyFreeSpots.first {
            viewModel.focusOn(firstFree.coordinate)
        }
    }
    
    private func generateMockSpots(near center: CLLocationCoordinate2D) -> [Spot] {
        var spots: [Spot] = []
        // Simulate 2-3 street segments radiating from center
        // Each segment is a direction (bearing) with spots placed along it
        let streetBearings: [Double] = [
            Double.random(in: 0...30),      // roughly north
            Double.random(in: 80...100),    // roughly east
            Double.random(in: 170...190)    // roughly south
        ]
        
        var spotIndex = 0
        for bearing in streetBearings {
            let bearingRad = bearing * .pi / 180
            let spotsOnStreet = Int.random(in: 3...5)
            
            for j in 0..<spotsOnStreet {
                // Place spots at 20-40m intervals along the street
                let distance = Double(j + 1) * Double.random(in: 20...40)
                // Main position along street direction
                let latOffset = distance * cos(bearingRad) / 111_320
                let lngOffset = distance * sin(bearingRad) / (111_320 * cos(center.latitude * .pi / 180))
                // Small perpendicular offset (simulates parking bay beside the road, 5-10m)
                let perpOffset = Double.random(in: 5...10) * (Bool.random() ? 1 : -1)
                let perpBearing = bearingRad + .pi / 2
                let perpLat = perpOffset * cos(perpBearing) / 111_320
                let perpLng = perpOffset * sin(perpBearing) / (111_320 * cos(center.latitude * .pi / 180))
                
                let status: SpotStatus
                let rand = Double.random(in: 0...1)
                if rand < 0.5 { status = .free }
                else if rand < 0.85 { status = .occupied }
                else { status = .reserved }
                
                spots.append(Spot(
                    id: "P-\(String(format: "%02d", spotIndex + 1))",
                    zoneId: 1,
                    lat: center.latitude + latOffset + perpLat,
                    lng: center.longitude + lngOffset + perpLng,
                    status: status,
                    lastChangedAt: nil,
                    sensorId: nil,
                    occupiedSince: nil
                ))
                spotIndex += 1
            }
        }
        return spots
    }
    
    private func navigateToNearestSpot() {
        let center = visibleMapCenter
        if let nearest = nearbyFreeSpots.min(by: {
            $0.coordinate.distance(to: center) < $1.coordinate.distance(to: center)
        }) {
            // Open GPS app with directions to the nearest free spot
            NavigationRedirectService.navigate(
                to: nearest.coordinate,
                label: "Bay \(nearest.id)",
                using: navigationVM.selectedGPSApp
            )
            viewModel.focusOn(nearest.coordinate)
            viewModel.selectSpot(nearest)
        }
    }
    
    /// Shows the NavigateSheet for the current search destination
    private func showNavigateSheet() {
        guard navigationVM.activeDestination != nil else { return }
        navigationVM.showNavigateSheet = true
    }
    
    // MARK: - Helpers
    
    private func parseZonePolygon(_ zone: Zone) -> [CLLocationCoordinate2D] {
        viewModel.parsePolygon(zone.geojsonPolygon)
    }
    
    private func recenterOnUser() {
        let userLocation = appState.locationService.effectiveLocation
        viewModel.focusOn(userLocation)
    }
    
    private func zoneNameFor(_ spot: Spot) -> String {
        appState.zones.first(where: { $0.id == spot.zoneId })?.name ?? "Zone \(spot.zoneId)"
    }
}

// MARK: - Violation Annotation View

struct ViolationAnnotationView: View {
    var isSelected: Bool = false
    
    var body: some View {
        ZStack {
            Circle()
                .fill(Color.red)
                .frame(width: isSelected ? 22 : 16, height: isSelected ? 22 : 16)
            
            Text("!")
                .font(.system(size: isSelected ? 13 : 10, weight: .black))
                .foregroundColor(.white)
        }
        .overlay(
            Circle()
                .stroke(Color.white, lineWidth: isSelected ? 2.5 : 1.5)
        )
        .shadow(color: .red.opacity(0.4), radius: 3, y: 1)
        .animation(.spring(duration: 0.3), value: isSelected)
        // Expand hit area to 44x44 (Apple HIG minimum tap target)
        .frame(width: 44, height: 44)
        .contentShape(Rectangle())
    }
}

#Preview {
    MapTabView()
        .environment(AppState())
}
