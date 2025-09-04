import Foundation

@objc(BMEPreloadModule)
class BMEPreloadModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @objc func preload(_ url: NSString) {
    PreloadManager.shared.preload(url as String)
  }

  @objc func cancel(_ url: NSString) {
    PreloadManager.shared.cancel(url as String)
  }
}
