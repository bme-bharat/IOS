import Foundation
import CommonCrypto

/// Singleton cache provider for video files
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

    /// Returns local cached file URL for a given remote URL
    func cachedFileURL(for url: URL) -> URL {
        let filename = url.absoluteString.sha256()
        return cacheDir.appendingPathComponent(filename)
    }

    /// Returns true if file exists locally
    func exists(_ url: URL) -> Bool {
        FileManager.default.fileExists(atPath: cachedFileURL(for: url).path)
    }

    /// Save data to cache
    func save(data: Data, for url: URL) throws {
        let dest = cachedFileURL(for: url)
        try data.write(to: dest, options: .atomic)
    }

    /// Return playback URL (cached file if exists, else original URL)
    func playbackURL(for url: URL) -> URL {
        let cached = cachedFileURL(for: url)
        return FileManager.default.fileExists(atPath: cached.path) ? cached : url
    }

    /// Clear all cached files
    func clearCache() {
        try? FileManager.default.removeItem(at: cacheDir)
        try? FileManager.default.createDirectory(at: cacheDir, withIntermediateDirectories: true, attributes: nil)
    }
}

fileprivate extension String {
    /// SHA256 hash of string for file naming
    func sha256() -> String {
        guard let data = self.data(using: .utf8) else { return UUID().uuidString }
        var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes { _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &digest) }
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}
