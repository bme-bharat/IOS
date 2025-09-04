import Foundation
import React

@objc(BMEEventEmitter)
class BMEEventEmitter: RCTEventEmitter {

  private var hasListeners = false

  // MARK: - RCTEventEmitter overrides

  override func supportedEvents() -> [String] {
    return [
      BMEVideoPlayerEvent.onLoad,
      BMEVideoPlayerEvent.onProgress,
      BMEVideoPlayerEvent.onBuffer,
      BMEVideoPlayerEvent.onError,
      BMEVideoPlayerEvent.onEnd,
      BMEVideoPlayerEvent.onReady
    ]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc func send(_ name: String, body: [String: Any]) {
    if hasListeners {
      sendEvent(withName: name, body: body)
    }
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
