import Foundation
import UIKit

class BMEApplication {
  static func registerLifecycleObservers() {
    NotificationCenter.default.addObserver(self, selector: #selector(willResign), name: UIApplication.willResignActiveNotification, object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(didBecome), name: UIApplication.didBecomeActiveNotification, object: nil)
  }

  @objc static func willResign() {
    // handle background pause logic if needed
  }

  @objc static func didBecome() {
    // handle resume logic
  }
}
