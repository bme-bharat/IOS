import Foundation

class PlayerPool {
  static let shared = PlayerPool()
  private var pool: [BMEVideoPlayer] = []
  private let lock = NSLock()

  func acquire() -> BMEVideoPlayer {
    lock.lock(); defer { lock.unlock() }
    if let p = pool.popLast() { return p }
    return BMEVideoPlayer()
  }

  func release(_ p: BMEVideoPlayer) {
    p.release()
    lock.lock(); defer { lock.unlock() }
    pool.append(p)
  }
}
