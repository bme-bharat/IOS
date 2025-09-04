//
//  BMEVideoPlayerView.swift
//  bmevideo
//

import UIKit
import AVFoundation
import React

@objc(BMEVideoPlayerView)
class BMEVideoPlayerView: UIView {

    // MARK: - Player
    private var engine: BMEVideoPlayer?
    private var playerLayer: AVPlayerLayer?

    // MARK: - Poster
    private var posterImageView: UIImageView = {
        let iv = UIImageView()
        iv.contentMode = .scaleAspectFit
        iv.clipsToBounds = true
        iv.isHidden = false
        iv.alpha = 1.0
        iv.backgroundColor = .white
        return iv
    }()
    private var lastPosterURL: String?

    // MARK: - State
    private var shouldRepeat = false
    private var pausedProp = false
    private var isPosterFading = false

    // MARK: - Progress
    private var progressTimer: Timer?
    private let progressInterval: TimeInterval = 0.25

    // MARK: - Active player
    private static weak var activePlayer: BMEVideoPlayerView?
    private static let activePlayerLock = NSLock()

    // MARK: - Init
    override init(frame: CGRect) {
        super.init(frame: frame)
        commonInit()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        commonInit()
    }

    private func commonInit() {
        backgroundColor = .white
        addSubview(posterImageView)
        setupTapGesture()
    }

    deinit {
        cleanup()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        playerLayer?.frame = bounds
        posterImageView.frame = bounds
    }

    // MARK: - Gesture
    private func setupTapGesture() {
        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        addGestureRecognizer(tap)
    }

    @objc private func handleTap(_ g: UITapGestureRecognizer) {}

    // MARK: - Public Props
    @objc func setSource(_ src: Any?) {
        guard let src = src else { return }
        var url: URL?
        var autoplay = false
        if let s = src as? String { url = URL(string: s) }
        else if let dict = src as? NSDictionary, let uri = dict["uri"] as? String {
            url = URL(string: uri)
            autoplay = (dict["autoplay"] as? Bool) ?? false
        }
        guard let playUrl = url else { return }

        // Progressive playback: try cached URL if exists
        let resolved = CacheProvider.shared.playbackURL(for: playUrl)

        // Start preloading in background if not cached
        if !CacheProvider.shared.exists(playUrl) {
            PreloadManager.shared.preload(playUrl.absoluteString)
        }

        let p = PlayerPool.shared.acquire()
        p.listener = self
        p.load(url: resolved, autoplay: autoplay)

        if engine != nil {
            playerLayer?.removeFromSuperlayer()
            playerLayer = nil
            stopProgressUpdates()
        }

        engine = p

        // Pre-render first frame to prevent black flash
        engine?.player?.pause()
        engine?.player?.currentItem?.preferredForwardBufferDuration = 1.0
        engine?.player?.playImmediately(atRate: 0)

        let layer = AVPlayerLayer(player: p.player)
        layer.frame = bounds
        layer.videoGravity = .resizeAspect
        layer.backgroundColor = UIColor.clear.cgColor
        self.layer.addSublayer(layer)
        playerLayer = layer
        bringSubviewToFront(posterImageView)

        if pausedProp { p.pause() } else { p.play() }
    }

    @objc func setPaused(_ paused: Bool) {
        pausedProp = paused
        if paused { engine?.pause(); stopProgressUpdates(); emitPlaybackStatus(status: "paused") }
        else { engine?.play(); startProgressUpdates(); setActivePlayerIfNeeded(); emitPlaybackStatus(status: "playing") }
    }

    @objc func setRepeat(_ repeatVal: Bool) { shouldRepeat = repeatVal }
    @objc func setMuted(_ muted: Bool) { engine?.setMuted(muted) }
    @objc func setVolume(_ volume: NSNumber) { engine?.setVolume(volume.floatValue) }
    @objc func setRate(_ rate: NSNumber) { engine?.setRate(rate.floatValue) }

    @objc func setPoster(_ poster: NSString?) {
        guard let poster = poster as String? else {
            lastPosterURL = nil
            posterImageView.image = nil
            posterImageView.isHidden = true
            return
        }
        lastPosterURL = poster
        loadPosterAsync(urlString: poster)
    }

    @objc func setPosterResizeMode(_ mode: NSString?) {
        guard let mode = mode as String? else { return }
        switch mode.lowercased() {
        case "contain": posterImageView.contentMode = .scaleAspectFit
        case "cover": posterImageView.contentMode = .scaleAspectFill
        case "stretch": posterImageView.contentMode = .scaleToFill
        default: posterImageView.contentMode = .scaleAspectFit
        }
    }

    @objc func setResizeMode(_ mode: NSString?) {
        guard let mode = mode as String? else { return }
        switch mode.lowercased() {
        case "contain": playerLayer?.videoGravity = .resizeAspect
        case "cover": playerLayer?.videoGravity = .resizeAspectFill
        case "stretch": playerLayer?.videoGravity = .resize
        default: playerLayer?.videoGravity = .resizeAspect
        }
    }

    // MARK: - Commands
    @objc func play() { engine?.play(); startProgressUpdates(); setActivePlayerIfNeeded(); emitPlaybackStatus(status: "playing") }
    @objc func pause() { engine?.pause(); stopProgressUpdates(); emitPlaybackStatus(status: "paused") }
    @objc func seekTo(_ seconds: NSNumber) { engine?.seek(to: seconds.doubleValue, completion: { [weak self] _ in self?.emitSeek(position: seconds.doubleValue) }) }
    @objc func releasePlayer() { cleanup() }

    // MARK: - Poster
    private func loadPosterAsync(urlString: String) {
        guard let url = URL(string: urlString) else { return }
        posterImageView.isHidden = false
        posterImageView.alpha = 1.0
        DispatchQueue.global(qos: .background).async { [weak self] in
            guard let self = self else { return }
            if let data = try? Data(contentsOf: url), let img = UIImage(data: data) {
                DispatchQueue.main.async {
                    if self.lastPosterURL == urlString {
                        self.posterImageView.image = img
                        self.posterImageView.isHidden = false
                        self.posterImageView.alpha = 1.0
                    }
                }
            }
        }
    }

    private func fadeOutPoster() {
        guard !posterImageView.isHidden && !isPosterFading else { return }
        guard let player = engine?.player, player.currentItem?.status == .readyToPlay || player.rate > 0 else { return }
        isPosterFading = true
        UIView.animate(withDuration: 0.1, animations: { self.posterImageView.alpha = 0.0 }, completion: { _ in
            self.posterImageView.isHidden = true
            self.isPosterFading = false
        })
    }

    private func showPosterImmediately() {
        if let last = lastPosterURL, !last.isEmpty {
            posterImageView.alpha = 1.0
            posterImageView.isHidden = false
            isPosterFading = false
        } else { posterImageView.isHidden = true }
    }

    // MARK: - Progress
    private func startProgressUpdates() {
        if progressTimer != nil { return }
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.progressTimer = Timer.scheduledTimer(withTimeInterval: self.progressInterval, repeats: true, block: { [weak self] _ in
                guard let self = self, let player = self.engine?.player else { return }
                let cur = player.currentTime().seconds
                let dur = player.currentItem.map { CMTimeGetSeconds($0.duration) } ?? 0
                self.emitPlaybackStatus(status: "progress", position: cur, duration: dur)
                if cur > 0 { self.fadeOutPoster(); self.setActivePlayerIfNeeded() }
            })
            RunLoop.current.add(self.progressTimer!, forMode: .common)
        }
    }

    private func stopProgressUpdates() {
        DispatchQueue.main.async { self.progressTimer?.invalidate(); self.progressTimer = nil }
    }

    // MARK: - Active player
    private func setActivePlayerIfNeeded() {
        BMEVideoPlayerView.activePlayerLock.lock(); defer { BMEVideoPlayerView.activePlayerLock.unlock() }
        if BMEVideoPlayerView.activePlayer !== self {
            BMEVideoPlayerView.activePlayer?.setPaused(true)
            BMEVideoPlayerView.activePlayer = self
        }
    }

    // MARK: - Events
    private func emitPlaybackStatus(status: String, position: Double? = nil, duration: Double? = nil, error: String? = nil) {
        var body: [String: Any] = ["status": status, "target": reactTag ?? 0]
        if let p = position { body["position"] = p }
        if let d = duration { body["duration"] = d }
        if let e = error { body["error"] = e }
        if let bridge = self.reactBridge(), let emitter = bridge.module(for: BMEEventEmitter.self) as?
            BMEEventEmitter {
                emitter.send("onPlaybackStatus", body: body)
            }
        }

        private func emitSeek(position: Double) {
            let body: [String: Any] = ["position": position, "target": reactTag ?? 0]
            if let bridge = self.reactBridge(), let emitter = bridge.module(for: BMEEventEmitter.self) as? BMEEventEmitter {
                emitter.send("onSeek", body: body)
            }
        }

        private func cleanup() {
            stopProgressUpdates()
            if let e = engine {
                PlayerPool.shared.release(e)
                engine = nil
            }
            playerLayer?.removeFromSuperlayer()
            playerLayer = nil
            posterImageView.removeFromSuperview()
        }

        private func reactBridge() -> RCTBridge? {
            var nextResponder: UIResponder? = self
            while let r = nextResponder {
                if let b = r as? RCTBridge { return b }
                nextResponder = r.next
            }
            return nil
        }
    }

    // MARK: - PlayerEventListener
    extension BMEVideoPlayerView: PlayerEventListener {
        func onLoad(duration: Double, width: Int, height: Int) {
            showPosterImmediately()
            emitPlaybackStatus(status: "loaded", position: 0, duration: duration)
        }

        func onProgress(currentTime: Double, duration: Double) {
            if currentTime > 0 {
                fadeOutPoster()
                setActivePlayerIfNeeded()
            }
            emitPlaybackStatus(status: "progress", position: currentTime, duration: duration)
        }

        func onBuffer(_ buffering: Bool) {
            emitPlaybackStatus(status: buffering ? "buffering" : "playing")
        }

        func onError(_ message: String) {
            showPosterImmediately()
            stopProgressUpdates()
            emitPlaybackStatus(status: "error", error: message)
        }

        func onEnd() {
            if shouldRepeat {
                engine?.seek(to: 0)
                engine?.play()
                startProgressUpdates()
                emitPlaybackStatus(status: "playing")
            } else {
                showPosterImmediately()
                stopProgressUpdates()
                emitPlaybackStatus(status: "ended")
            }
        }
    }
