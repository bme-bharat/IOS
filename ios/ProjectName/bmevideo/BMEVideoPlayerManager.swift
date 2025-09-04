import Foundation
import React

@objc(BMEVideoPlayerManager)
class BMEVideoPlayerManager: RCTViewManager {
  override func view() -> UIView! {
    return BMEVideoPlayerView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc override func constantsToExport() -> [AnyHashable : Any]! {
    return ["Events": [
      BMEVideoPlayerEvent.onLoad,
      BMEVideoPlayerEvent.onProgress,
      BMEVideoPlayerEvent.onBuffer,
      BMEVideoPlayerEvent.onError,
      BMEVideoPlayerEvent.onEnd
    ]]
  }

  // MARK: - Props
  @objc func setSource(_ reactTag: NSNumber, src: NSDictionary) {
    bridge.uiManager.addUIBlock { (_, viewRegistry) in
      (viewRegistry?[reactTag] as? BMEVideoPlayerView)?.setSource(src)
    }
  }

  @objc func setPaused(_ reactTag: NSNumber, paused: Bool) {
    bridge.uiManager.addUIBlock { (_, viewRegistry) in
      (viewRegistry?[reactTag] as? BMEVideoPlayerView)?.setPaused(paused)
    }
  }

  @objc func setRepeat(_ reactTag: NSNumber, repeatVal: Bool) {
    bridge.uiManager.addUIBlock { (_, viewRegistry) in
      (viewRegistry?[reactTag] as? BMEVideoPlayerView)?.setRepeat(repeatVal)
    }
  }

  @objc func setMuted(_ reactTag: NSNumber, muted: Bool) {
    bridge.uiManager.addUIBlock { (_, viewRegistry) in
      (viewRegistry?[reactTag] as? BMEVideoPlayerView)?.setMuted(muted)
    }
  }

  @objc func setVolume(_ reactTag: NSNumber, volume: NSNumber) {
    bridge.uiManager.addUIBlock { (_, viewRegistry) in
      (viewRegistry?[reactTag] as? BMEVideoPlayerView)?.setVolume(volume)
    }
  }

  @objc func setRate(_ reactTag: NSNumber, rate: NSNumber) {
    bridge.uiManager.addUIBlock { (_, viewRegistry) in
      (viewRegistry?[reactTag] as? BMEVideoPlayerView)?.setRate(rate)
    }
  }

  // MARK: - Commands
  @objc func play(_ reactTag: NSNumber) {
    bridge.uiManager.addUIBlock { (_, viewRegistry) in
      (viewRegistry?[reactTag] as? BMEVideoPlayerView)?.play()
    }
  }

  @objc func pause(_ reactTag: NSNumber) {
    bridge.uiManager.addUIBlock { (_, viewRegistry) in
      (viewRegistry?[reactTag] as? BMEVideoPlayerView)?.pause()
    }
  }

  @objc func seekTo(_ reactTag: NSNumber, seconds: NSNumber) {
    bridge.uiManager.addUIBlock { (_, viewRegistry) in
      (viewRegistry?[reactTag] as? BMEVideoPlayerView)?.seekTo(seconds)
    }
  }

  @objc func releasePlayer(_ reactTag: NSNumber) {
    bridge.uiManager.addUIBlock { (_, viewRegistry) in
      (viewRegistry?[reactTag] as? BMEVideoPlayerView)?.releasePlayer()
    }
  }

  // MARK: - Preload
  @objc func preload(_ url: NSString) {
    PreloadManager.shared.preload(url as String)
  }

  @objc func cancelPreload(_ url: NSString) {
    PreloadManager.shared.cancel(url as String)
  }
}
