import Foundation
import UIKit
import AVFoundation
import React

@objc(BMEVideoPlayerView)
class BMEVideoPlayerView: UIView {
  private var player: BMEVideoPlayer?
  private var playerLayer: AVPlayerLayer?
  private var source: NSDictionary?
  private var shouldRepeat: Bool = false

  private var posterImageView: UIImageView = {
    let iv = UIImageView()
    iv.contentMode = .scaleAspectFit
    iv.clipsToBounds = true
    iv.isHidden = true
    return iv
  }()

  override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = .black
    addSubview(posterImageView)
    setupTapGestures()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    addSubview(posterImageView)
    setupTapGestures()
  }

  private func setupTapGestures() {
    let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
    addGestureRecognizer(tap)
  }

  @objc private func handleTap(_ g: UITapGestureRecognizer) {
    // toggle controls or forward to RN via event emitter if needed
  }

  // MARK: - Props

  @objc func setSource(_ src: NSDictionary) {
    source = src
    guard let uri = src["uri"] as? String, let url = URL(string: uri) else { return }
    let autoplay = (src["autoplay"] as? Bool) ?? false
    let playURL = CacheProvider.shared.playbackURL(for: url)

    let p = PlayerPool.shared.acquire()
    p.listener = self
    p.load(url: playURL, autoplay: autoplay)

    player = p
    let layer = AVPlayerLayer(player: p.player)
    layer.frame = bounds
    layer.videoGravity = .resizeAspect
    self.layer.sublayers?.forEach { $0.removeFromSuperlayer() }
    self.layer.addSublayer(layer)
    self.layer.addSublayer(posterImageView.layer) // keep poster above video
    self.playerLayer = layer
  }

  @objc func setPaused(_ paused: Bool) {
    paused ? player?.pause() : player?.play()
  }

  @objc func setRepeat(_ repeatVal: Bool) {
    shouldRepeat = repeatVal
  }

  @objc func setMuted(_ muted: Bool) {
    player?.setMuted(muted)
  }

  @objc func setVolume(_ volume: NSNumber) {
    player?.setVolume(volume.floatValue)
  }

  @objc func setRate(_ rate: NSNumber) {
    player?.setRate(rate.floatValue)
  }

  @objc func setPoster(_ poster: NSString) {
    guard let url = URL(string: poster as String) else { return }
    DispatchQueue.global().async {
      if let data = try? Data(contentsOf: url),
         let image = UIImage(data: data) {
        DispatchQueue.main.async {
          self.posterImageView.image = image
          self.posterImageView.isHidden = false
        }
      }
    }
  }

  @objc func setPosterResizeMode(_ mode: NSString) {
    switch mode.lowercased {
    case "contain":
      posterImageView.contentMode = .scaleAspectFit
    case "cover":
      posterImageView.contentMode = .scaleAspectFill
    case "stretch":
      posterImageView.contentMode = .scaleToFill
    default:
      posterImageView.contentMode = .scaleAspectFit
    }
  }

  // MARK: - Commands

  @objc func play() { player?.play() }
  @objc func pause() { player?.pause() }
  @objc func seekTo(_ seconds: NSNumber) { player?.seek(to: seconds.doubleValue) }
  @objc func releasePlayer() {
    if let p = player { PlayerPool.shared.release(p) }
    player = nil
    playerLayer?.removeFromSuperlayer()
    playerLayer = nil
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    playerLayer?.frame = bounds
    posterImageView.frame = bounds
  }
}

extension BMEVideoPlayerView: PlayerEventListener {
  func onLoad(duration: Double, width: Int, height: Int) {
    posterImageView.isHidden = false
    if let bridge = self.reactBridge(),
       let emitter = bridge.module(for: BMEEventEmitter.self) as? BMEEventEmitter {
      emitter.send(BMEVideoPlayerEvent.onLoad, body: [
        "duration": duration,
        "width": width,
        "height": height,
        "target": self.reactTag ?? 0
      ])
    }
  }

  func onProgress(currentTime: Double, duration: Double) {
    // hide poster once playback actually starts
    if currentTime > 0 && !posterImageView.isHidden {
      posterImageView.isHidden = true
    }
    if let bridge = self.reactBridge(),
       let emitter = bridge.module(for: BMEEventEmitter.self) as? BMEEventEmitter {
      emitter.send(BMEVideoPlayerEvent.onProgress, body: [
        "currentTime": currentTime,
        "duration": duration,
        "target": self.reactTag ?? 0
      ])
    }
  }

  func onBuffer(_ buffering: Bool) {
    if let bridge = self.reactBridge(),
       let emitter = bridge.module(for: BMEEventEmitter.self) as? BMEEventEmitter {
      emitter.send(BMEVideoPlayerEvent.onBuffer, body: [
        "isBuffering": buffering,
        "target": self.reactTag ?? 0
      ])
    }
  }

  func onError(_ message: String) {
    if let bridge = self.reactBridge(),
       let emitter = bridge.module(for: BMEEventEmitter.self) as? BMEEventEmitter {
      emitter.send(BMEVideoPlayerEvent.onError, body: [
        "error": message,
        "target": self.reactTag ?? 0
      ])
    }
  }

  func onEnd() {
    if shouldRepeat {
      player?.seek(to: 0)
      player?.play()
    } else {
      posterImageView.isHidden = false // show again at end
    }
    if let bridge = self.reactBridge(),
       let emitter = bridge.module(for: BMEEventEmitter.self) as? BMEEventEmitter {
      emitter.send(BMEVideoPlayerEvent.onEnd, body: ["target": self.reactTag ?? 0])
    }
  }

  private func reactBridge() -> RCTBridge? {
    var nextResponder: UIResponder? = self
    while let r = nextResponder {
      if let b = (r as? RCTBridge) { return b }
      nextResponder = r.next
    }
    return nil
  }
}
