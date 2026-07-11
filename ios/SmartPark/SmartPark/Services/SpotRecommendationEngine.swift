import Foundation
import CoreLocation

// MARK: - Recommendation Input

/// Input data for the spot recommendation engine.
struct RecommendationInput {
    let destinationCoordinate: CLLocationCoordinate2D
    let savedPlaceCoordinate: CLLocationCoordinate2D?
    let freeSpots: [Spot]
}

// MARK: - Scored Spot

/// A parking spot with its recommendation score and walking distance.
struct ScoredSpot {
    let spot: Spot
    let score: Double
    let walkingDistanceMeters: Int
}

// MARK: - SpotRecommendationEngine

/// Scores free spots to find optimal parking near a destination.
/// Uses haversine distance calculation.
/// Scoring: 50% destination proximity + 30% saved place proximity + 20% availability stability.
/// Works offline with cached spot data.
struct SpotRecommendationEngine {

    // MARK: - Public API

    /// Returns the best scored parking spot for the given input.
    static func recommend(input: RecommendationInput) -> ScoredSpot? {
        recommendTopN(input: input, count: 1).first
    }

    /// Returns the top N scored parking spots, sorted by score descending.
    static func recommendTopN(input: RecommendationInput, count: Int) -> [ScoredSpot] {
        let scored = input.freeSpots.compactMap { spot -> ScoredSpot? in
            scoreSpot(spot, input: input)
        }
        return Array(scored.sorted { $0.score > $1.score }.prefix(count))
    }

    // MARK: - Private

    private static func scoreSpot(_ spot: Spot, input: RecommendationInput) -> ScoredSpot? {
        let destDistance = haversineDistance(
            from: spot.coordinate,
            to: input.destinationCoordinate
        )

        let destScore = 1.0 / (1.0 + destDistance / 100.0)

        let placeScore: Double
        if let placeCoord = input.savedPlaceCoordinate {
            let placeDistance = haversineDistance(from: spot.coordinate, to: placeCoord)
            placeScore = 1.0 / (1.0 + placeDistance / 100.0)
        } else {
            placeScore = 0.0
        }

        let timeFreeSeconds = timeSinceLastChange(spot)
        let timeScore = min(timeFreeSeconds / 3600.0, 1.0)

        // Scoring weights: adjust if saved place is nil
        let finalScore: Double
        if input.savedPlaceCoordinate != nil {
            finalScore = 0.5 * destScore + 0.3 * placeScore + 0.2 * timeScore
        } else {
            finalScore = 0.7 * destScore + 0.0 * placeScore + 0.3 * timeScore
        }

        let walkingMeters = Int(destDistance)

        return ScoredSpot(spot: spot, score: finalScore, walkingDistanceMeters: walkingMeters)
    }

    // MARK: - Haversine

    /// Calculates the distance in meters between two coordinates using the Haversine formula.
    private static func haversineDistance(
        from: CLLocationCoordinate2D,
        to: CLLocationCoordinate2D
    ) -> Double {
        let earthRadius = 6371000.0 // meters

        let lat1 = from.latitude * .pi / 180.0
        let lat2 = to.latitude * .pi / 180.0
        let dLat = (to.latitude - from.latitude) * .pi / 180.0
        let dLng = (to.longitude - from.longitude) * .pi / 180.0

        let a = sin(dLat / 2) * sin(dLat / 2) +
                cos(lat1) * cos(lat2) *
                sin(dLng / 2) * sin(dLng / 2)
        let c = 2 * atan2(sqrt(a), sqrt(1 - a))

        return earthRadius * c
    }

    // MARK: - Time Calculation

    /// Calculates seconds since the spot last changed status.
    /// Returns 0 if the timestamp is unavailable or unparseable.
    private static func timeSinceLastChange(_ spot: Spot) -> Double {
        guard let lastChanged = spot.lastChangedAt else { return 0 }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        // Try with fractional seconds first, then without
        if let date = formatter.date(from: lastChanged) {
            return max(Date().timeIntervalSince(date), 0)
        }

        formatter.formatOptions = [.withInternetDateTime]
        if let date = formatter.date(from: lastChanged) {
            return max(Date().timeIntervalSince(date), 0)
        }

        return 0
    }
}
