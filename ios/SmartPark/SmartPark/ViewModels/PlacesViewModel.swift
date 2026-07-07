import Foundation
import Observation

@MainActor
@Observable
class PlacesViewModel {
    var places: [SavedPlace] = []
    var isLoading = false
    var error: String?
    var showAddForm = false

    // Form fields
    var newLabel: String = "home"
    var newName: String = ""
    var newLat: String = ""
    var newLng: String = ""
    var newAddress: String = ""

    private let apiClient = APIClient.shared

    func loadPlaces() async {
        isLoading = true
        error = nil
        do {
            places = try await apiClient.fetchPlaces()
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func addPlace() async {
        guard let lat = Double(newLat), let lng = Double(newLng) else {
            error = "Invalid coordinates"
            return
        }

        let place = SavedPlaceCreate(
            label: newLabel,
            customName: newName.isEmpty ? nil : newName,
            lat: lat,
            lng: lng,
            address: newAddress.isEmpty ? nil : newAddress
        )

        do {
            let created = try await apiClient.createPlace(place)
            places.append(created)
            resetForm()
            showAddForm = false
        } catch {
            self.error = error.localizedDescription
        }
    }

    func deletePlace(_ place: SavedPlace) async {
        do {
            try await apiClient.deletePlace(place.id)
            places.removeAll { $0.id == place.id }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func resetForm() {
        newLabel = "home"
        newName = ""
        newLat = ""
        newLng = ""
        newAddress = ""
    }

    // Label options
    static let labelOptions = ["home", "work", "gym", "school", "custom"]

    // Icon for label
    static func icon(for label: String) -> String {
        switch label {
        case "home": return "house.fill"
        case "work": return "briefcase.fill"
        case "gym": return "dumbbell.fill"
        case "school": return "graduationcap.fill"
        default: return "mappin.circle.fill"
        }
    }
}
