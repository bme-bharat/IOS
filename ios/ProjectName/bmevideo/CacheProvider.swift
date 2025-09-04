import Foundation
import CommonCrypto

class CacheProvider {
  static let shared = CacheProvider()
  private let cacheDir: URL

  private init() {
    let fm = FileManager.default
    let caches = fm.urls(for: .cachesDirectory, in: .userDomainMask).first!
    cacheDir = caches.appendingPathComponent("BMEVideoCache", isDirectory: true)
    if !fm.fileExists(atPath: cacheDir.path) {
      try? fm.createDirectory(at: cacheDir, withIntermediateDirectories: true, attributes: nil)
    }
  }

  func cachedFileURL(for url: URL) -> URL {
    let filename = url.absoluteString.sha256()
    return cacheDir.appendingPathComponent(filename)
  }

  func exists(_ url: URL) -> Bool {
    let p = cachedFileURL(for: url).path
    return FileManager.default.fileExists(atPath: p)
  }

  func save(data: Data, for url: URL) throws {
    let dest = cachedFileURL(for: url)
    try data.write(to: dest, options: .atomic)
  }

  func playbackURL(for url: URL) -> URL {
    let cached = cachedFileURL(for: url)
    if FileManager.default.fileExists(atPath: cached.path) {
      return cached
    } else {
      return url
    }
  }
}

fileprivate extension String {
  func sha256() -> String {
    guard let data = self.data(using: .utf8) else { return UUID().uuidString }
    var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
    data.withUnsafeBytes { _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &digest) }
    return digest.map { String(format: "%02x", $0) }.joined()
  }
}
