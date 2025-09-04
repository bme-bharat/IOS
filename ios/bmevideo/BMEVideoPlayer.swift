import Foundation
import AVFoundation
import UIKit

class BMEVideoPlayer: NSObject {
  private(set) var player: AVPlayer?
  private var item: AVPlayerItem?
  private var timeToken: Any?
  private var statusObs: NSKeyValueObservation?
  private var timeControlObs: NSKeyValueObservation?
  weak var listener: PlayerEventListener?

  deinit { release() }

  func load(url: URL, autoplay: Bool = false) {
    releaseItem()
    let asset = AVURLAsset(url: url)
    let it = AVPlayerItem(asset: asset)
    item = it
    player = AVPlayer(playerItem: it)
    observe(item: it)
    addTimeObserver()
    if autoplay { player?.play() }
  }

  private func observe(item: AVPlayerItem) {
    statusObs = item.observe(\AVPlayerItem.status, options: [.new, .initial]) { [weak self] it, _ in
      guard let self = self else { return }
      switch it.status {
      case .readyToPlay:
        let dur = CMTimeGetSeconds(it.duration)
        var w = 0, h = 0
        if let track = it.asset.tracks(withMediaType: .video).first {
          let size = track.naturalSize.applying(track.preferredTransform)
          w = Int(abs(size.width)); h = Int(abs(size.height))
        }
        self.listener?.onLoad(duration: dur.isFinite ? dur : 0, width: w, height: h)
      case .failed:
        if let err = it.error {
          self.listener?.onError(err.localizedDescription)
        }
      default: break
      }
    }

    timeControlObs = player?.observe(\AVPlayer.timeControlStatus, options: [.new, .initial]) { [weak self] p, _ in
      guard let self = self else { return }
      switch p.timeControlStatus {
      case .waitingToPlayAtSpecifiedRate:
        self.listener?.onBuffer(true)
      case .playing:
        self.listener?.onBuffer(false)
      case .paused:
        self.listener?.onBuffer(false)
      @unknown default:
        break
      }
    }

    NotificationCenter.default.addObserver(self, selector: #selector(didEnd(_:)), name: .AVPlayerItemDidPlayToEndTime, object: item)
  }

  @objc private func didEnd(_ n: Notification) {
    listener?.onEnd()
  }

  func play() { player?.play() }
  func pause() { player?.pause() }
  func seek(to seconds: Double, completion: ((Bool)->Void)? = nil) {
    let t = CMTimeMakeWithSeconds(seconds, preferredTimescale: 600)
    player?.seek(to: t, toleranceBefore: .zero, toleranceAfter: .zero, completionHandler: completion ?? { _ in })
  }
  func setMuted(_ m: Bool) { player?.isMuted = m }
  func setVolume(_ v: Float) { player?.volume = v }
  func setRate(_ r: Float) { player?.rate = r }

  private func addTimeObserver() {
    guard timeToken == nil, let player = player else { return }
    let interval = CMTimeMake(value: 1, timescale: 4)
    timeToken = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
      guard let self = self else { return }
      let cur = CMTimeGetSeconds(time)
      let dur = CMTimeGetSeconds(self.item?.duration ?? .zero)
      self.listener?.onProgress(currentTime: cur.isFinite ? cur : 0, duration: dur.isFinite ? dur : 0)
    }
  }

  func releaseItem() {
    if let t = timeToken { player?.removeTimeObserver(t); timeToken = nil }
    NotificationCenter.default.removeObserver(self)
    statusObs?.invalidate(); timeControlObs?.invalidate()
    statusObs = nil; timeControlObs = nil
    item = nil; player = nil
  }

  func release() { releaseItem() }
}
