import Foundation
import CarPlay
import CoreLocation
import MapKit

// MARK: - CarPlay Scene Delegate

/// Handles the CarPlay scene lifecycle and displays parking zone POIs.
/// Uses CPPointOfInterestTemplate as the primary interface for the parking app.
class CarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {

    // MARK: - Properties

    private var interfaceController: CPInterfaceController?
    private var poiTemplate: CPPointOfInterestTemplate?

    // MARK: - CPTemplateApplicationSceneDelegate

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didConnect interfaceController: CPInterfaceController
    ) {
        self.interfaceController = interfaceController

        // Build and set the initial template
        Task {
            await loadAndDisplayZones()
        }
    }

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didDisconnectInterfaceController interfaceController: CPInterfaceController
    ) {
        self.interfaceController = nil
        self.poiTemplate = nil
    }

    // MARK: - Data Loading

    private func loadAndDisplayZones() async {
        let zones = await CarPlayManager.shared.fetchNearbyZones()

        if zones.isEmpty {
            // Fallback to all zones
            let allZones = await CarPlayManager.shared.fetchAllZones()
            await buildTemplate(from: allZones)
        } else {
            await buildTemplate(from: zones)
        }
    }

    @MainActor
    private func buildTemplate(from zones: [Zone]) async {
        let pois = await CarPlayManager.shared.makeAllPOIs(from: zones)

        if pois.isEmpty {
            // Show an empty state
            let emptyTemplate = CPPointOfInterestTemplate(
                title: "SpotSense Parking",
                pointsOfInterest: [],
                selectedIndex: NSNotFound
            )
            emptyTemplate.emptyViewTitleVariants = ["No Parking Zones Found"]
            emptyTemplate.emptyViewSubtitleVariants = ["Pull to refresh or check your connection"]
            poiTemplate = emptyTemplate
            interfaceController?.setRootTemplate(emptyTemplate, animated: true, completion: nil)
            return
        }

        let template = CPPointOfInterestTemplate(
            title: "SpotSense Parking",
            pointsOfInterest: pois,
            selectedIndex: NSNotFound
        )
        template.pointOfInterestDelegate = self

        poiTemplate = template
        interfaceController?.setRootTemplate(template, animated: true, completion: nil)
    }

    // MARK: - Refresh

    private func refreshData() {
        Task {
            await loadAndDisplayZones()
        }
    }
}

// MARK: - CPPointOfInterestTemplateDelegate

extension CarPlaySceneDelegate: CPPointOfInterestTemplateDelegate {

    func pointOfInterestTemplate(
        _ pointOfInterestTemplate: CPPointOfInterestTemplate,
        didChangeMapRegion region: MKCoordinateRegion
    ) {
        // Could reload zones for the new region, but keep simple for now
    }

    func pointOfInterestTemplate(
        _ pointOfInterestTemplate: CPPointOfInterestTemplate,
        didSelectPointOfInterest pointOfInterest: CPPointOfInterest
    ) {
        // When user selects a POI, show a detail panel with Navigate button
        guard let userInfo = pointOfInterest.userInfo as? [String: Any],
              let lat = userInfo["lat"] as? Double,
              let lng = userInfo["lng"] as? Double else {
            return
        }

        let coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
        let zoneName = pointOfInterest.title

        // Create Navigate button
        let navigateAction = CPPointOfInterestTemplate.Button(
            title: "Navigate",
            type: .navigate
        ) { [weak self] _ in
            self?.launchNavigation(to: coordinate, name: zoneName)
        }

        // Create Refresh button
        let refreshAction = CPPointOfInterestTemplate.Button(
            title: "Refresh",
            type: .custom
        ) { [weak self] _ in
            self?.refreshData()
        }

        pointOfInterest.primaryButton = navigateAction
        pointOfInterest.secondaryButton = refreshAction

        // Update the selected POI
        poiTemplate?.selectedIndex = poiTemplate?.pointsOfInterest.firstIndex(where: {
            ($0.userInfo as? [String: Any])?["zoneId"] as? Int == userInfo["zoneId"] as? Int
        }) ?? NSNotFound
    }

    // MARK: - Navigation Launch

    private func launchNavigation(to coordinate: CLLocationCoordinate2D, name: String) {
        let placemark = MKPlacemark(coordinate: coordinate)
        let mapItem = MKMapItem(placemark: placemark)
        mapItem.name = name
        mapItem.openInMaps(launchOptions: [
            MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving
        ])
    }
}
