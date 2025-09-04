import Foundation
import AVFoundation

class PlayerPool {
    static let shared = PlayerPool()
    private var pool: [BMEVideoPlayer] = []
    private let lock = NSLock()
    private let maxPool = 3

    private init() {}

    func acquire() -> BMEVideoPlayer {
        lock.lock(); defer { lock.unlock() }
        if let player = pool.popLast() {
            player.pause()
            player.seek(to: .zero)
            return player
        }
        return createPlayer()
    }

    func release(_ player: BMEVideoPlayer) {
        lock.lock(); defer { lock.unlock() }
        player.pause()
        player.seek(to: .zero)

        if pool.count < maxPool {
            pool.append(player)
        } else {
            player.release()
        }
    }

    func createPreloadPlayer() -> BMEVideoPlayer {
        let player = createPlayer()
        player.pause()
        return player
    }

    private func createPlayer() -> BMEVideoPlayer {
        let player = BMEVideoPlayer()
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .moviePlayback, options: [])
        } catch {
            print("⚠️ Failed to set audio session: \(error)")
        }
        return player
    }
}
