import Foundation
import CoreLocation

// MARK: - Spot Status
enum SpotStatus: String, Codable, CaseIterable {
    case free
    case occupied
    case reserved
    case sensor_offline
}

// MARK: - Zone
struct Zone: Codable, Identifiable {
    let id: Int
    let name: String
    let geojsonPolygon: String?
    let pricingType: String
    let pricePerHour: Double
    let totalSpots: Int
    var freeCount: Int
    var occupiedCount: Int
    var reservedCount: Int
    
    enum CodingKeys: String, CodingKey {
        case id, name
        case geojsonPolygon = "geojson_polygon"
        case pricingType = "pricing_type"
        case pricePerHour = "price_per_hour"
        case totalSpots = "total_spots"
        case freeCount = "free_count"
        case occupiedCount = "occupied_count"
        case reservedCount = "reserved_count"
    }
}

// MARK: - Zone Detail (includes spots)
struct ZoneDetail: Codable, Identifiable {
    let id: Int
    let name: String
    let geojsonPolygon: String?
    let pricingType: String
    let pricePerHour: Double
    let totalSpots: Int
    var freeCount: Int
    var occupiedCount: Int
    var reservedCount: Int
    let spots: [Spot]
    
    enum CodingKeys: String, CodingKey {
        case id, name, spots
        case geojsonPolygon = "geojson_polygon"
        case pricingType = "pricing_type"
        case pricePerHour = "price_per_hour"
        case totalSpots = "total_spots"
        case freeCount = "free_count"
        case occupiedCount = "occupied_count"
        case reservedCount = "reserved_count"
    }
}

// MARK: - Spot
struct Spot: Codable, Identifiable {
    let id: String
    let zoneId: Int
    let lat: Double
    let lng: Double
    var status: SpotStatus
    let lastChangedAt: String?
    let sensorId: String?
    let occupiedSince: String?
    
    enum CodingKeys: String, CodingKey {
        case id, lat, lng, status
        case zoneId = "zone_id"
        case lastChangedAt = "last_changed_at"
        case sensorId = "sensor_id"
        case occupiedSince = "occupied_since"
    }
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}

// MARK: - Prediction
struct Prediction: Codable, Identifiable {
    var id: String { timestamp }
    let timestamp: String
    let predictedOccupancy: Double
    let confidence: Double
    
    enum CodingKeys: String, CodingKey {
        case timestamp
        case predictedOccupancy = "predicted_occupancy"
        case confidence
    }
}

// MARK: - Saved Place
struct SavedPlace: Codable, Identifiable {
    let id: Int
    let userId: String
    let label: String
    let customName: String?
    let lat: Double
    let lng: Double
    let address: String?
    
    enum CodingKeys: String, CodingKey {
        case id, label, lat, lng, address
        case userId = "user_id"
        case customName = "custom_name"
    }
}

// MARK: - Create Place Request
struct SavedPlaceCreate: Codable {
    let label: String
    let customName: String?
    let lat: Double
    let lng: Double
    let address: String?
    
    enum CodingKeys: String, CodingKey {
        case label, lat, lng, address
        case customName = "custom_name"
    }
}

// MARK: - Agent
struct AgentTextRequest: Codable {
    let text: String
    let lat: Double?
    let lng: Double?
}

struct AgentResponse: Codable {
    let text: String
    let reasoningSteps: [String]
    let mapCard: MapCard?
    
    enum CodingKeys: String, CodingKey {
        case text
        case reasoningSteps = "reasoning_steps"
        case mapCard = "map_card"
    }
}

struct MapCard: Codable {
    let zoneId: Int?
    let zoneName: String?
    let lat: Double?
    let lng: Double?
    let freeSpots: Int?
    let totalSpots: Int?
    let pricePerHour: Double?
    let walkingMinutes: Int?
    
    enum CodingKeys: String, CodingKey {
        case lat, lng
        case zoneId = "zone_id"
        case zoneName = "zone_name"
        case freeSpots = "free_spots"
        case totalSpots = "total_spots"
        case pricePerHour = "price_per_hour"
        case walkingMinutes = "walking_minutes"
    }
}

// MARK: - WebSocket Message
struct SpotUpdateMessage: Codable {
    let type: String
    let spots: [SpotUpdate]
}

struct SpotUpdate: Codable {
    let id: String
    let status: SpotStatus
    let lastChangedAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id, status
        case lastChangedAt = "last_changed_at"
    }
}

// MARK: - App Enums
enum ConnectionMode {
    case connecting
    case live
    case offline
}

enum AppMode: String, CaseIterable {
    case driver = "Driver"
    case enforcement = "Enforcement"
}

enum AppTab: String, CaseIterable {
    case map = "Map"
    case agent = "Agent"
    case places = "Places"
    case insights = "Insights"
    case settings = "Settings"
}
