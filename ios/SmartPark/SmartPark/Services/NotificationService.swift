import Foundation
import UserNotifications
import Observation

// MARK: - Notification Categories & Actions
private enum NotificationConstants {
    static let categoryId = "PARKING_SPOT"
    static let navigateAction = "NAVIGATE_TO_SPOT"
    static let dismissAction = "DISMISS"
}

// MARK: - NotificationService

/// Manages local notifications for parking spot proximity alerts.
/// Requests notification permission, sends rich local notifications with action buttons,
/// and handles notification response (user taps action).
@Observable
class NotificationService: NSObject, UNUserNotificationCenterDelegate {
    var isPermissionGranted = false

    /// Called when user taps "Navigate to Spot" action. Parameters: (lat, lng, preferredApp)
    var onNavigateToSpot: ((Double, Double, String) -> Void)?

    private let center = UNUserNotificationCenter.current()

    override init() {
        super.init()
        center.delegate = self
        registerCategories()
    }

    // MARK: - Public API

    /// Requests notification permission from the user.
    func requestPermission(completion: ((Bool) -> Void)? = nil) {
        center.requestAuthorization(options: [.alert, .sound, .badge]) { [weak self] granted, _ in
            Task { @MainActor in
                self?.isPermissionGranted = granted
                completion?(granted)
            }
        }
    }

    /// Sends a proximity notification for a free parking spot.
    func sendProximityNotification(
        spotId: String,
        spotName: String,
        distanceMeters: Int,
        destinationName: String,
        spotLat: Double,
        spotLng: Double,
        preferredApp: String
    ) {
        let content = UNMutableNotificationContent()
        content.title = "Free Parking Found"
        content.body = "Free spot \(distanceMeters)m from \(destinationName). Tap to navigate."
        content.sound = .default
        content.categoryIdentifier = NotificationConstants.categoryId
        content.userInfo = [
            "spotId": spotId,
            "spotName": spotName,
            "spotLat": spotLat,
            "spotLng": spotLng,
            "preferredApp": preferredApp,
            "destinationName": destinationName
        ]

        let request = UNNotificationRequest(
            identifier: "parking_spot_\(spotId)",
            content: content,
            trigger: nil // Deliver immediately
        )

        center.add(request)
    }

    // MARK: - UNUserNotificationCenterDelegate

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo

        switch response.actionIdentifier {
        case NotificationConstants.navigateAction:
            guard let lat = userInfo["spotLat"] as? Double,
                  let lng = userInfo["spotLng"] as? Double,
                  let app = userInfo["preferredApp"] as? String else {
                completionHandler()
                return
            }
            onNavigateToSpot?(lat, lng, app)

        case UNNotificationDefaultActionIdentifier:
            // User tapped the notification body — treat same as navigate
            guard let lat = userInfo["spotLat"] as? Double,
                  let lng = userInfo["spotLng"] as? Double,
                  let app = userInfo["preferredApp"] as? String else {
                completionHandler()
                return
            }
            onNavigateToSpot?(lat, lng, app)

        case NotificationConstants.dismissAction:
            break

        default:
            break
        }

        completionHandler()
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound])
    }

    // MARK: - Private

    private func registerCategories() {
        let navigateAction = UNNotificationAction(
            identifier: NotificationConstants.navigateAction,
            title: "Navigate to Spot",
            options: [.foreground]
        )

        let dismissAction = UNNotificationAction(
            identifier: NotificationConstants.dismissAction,
            title: "Dismiss",
            options: [.destructive]
        )

        let category = UNNotificationCategory(
            identifier: NotificationConstants.categoryId,
            actions: [navigateAction, dismissAction],
            intentIdentifiers: [],
            options: []
        )

        center.setNotificationCategories([category])
    }
}
