import Foundation
import UIKit

@objc(PreloadManager)
class PreloadManager: NSObject, URLSessionDownloadDelegate {
    @objc static let shared = PreloadManager()

    private let maxConcurrentDownloads: Int = 3
    private var tasks: [URL: URLSessionDownloadTask] = [:]

    // Serial queue for thread-safe access
    private let syncQueue = DispatchQueue(label: "com.bme.preload.sync")

    private lazy var session: URLSession = {
        let config = URLSessionConfiguration.default
        config.httpMaximumConnectionsPerHost = maxConcurrentDownloads
        return URLSession(configuration: config, delegate: self, delegateQueue: OperationQueue())
    }()

    private override init() {
        super.init()
    }

    /// Start preloading a URL into cache
    @objc func preload(_ urlString: String) {
        guard let url = URL(string: urlString) else { return }

        // Skip if already cached
        if CacheProvider.shared.exists(url) { return }

        syncQueue.sync {
            if tasks[url] != nil { return } // already downloading
            let task = session.downloadTask(with: url)
            tasks[url] = task
            task.resume()
        }
    }

    /// Cancel an ongoing preload
    @objc func cancel(_ urlString: String) {
        guard let url = URL(string: urlString) else { return }
        syncQueue.sync {
            if let task = tasks[url] {
                task.cancel()
                tasks[url] = nil
            }
        }
    }

    /// Check if a URL is already cached
    @objc func isPreloaded(_ urlString: String) -> Bool {
        guard let url = URL(string: urlString) else { return false }
        return CacheProvider.shared.exists(url)
    }

    // MARK: - URLSessionDownloadDelegate

    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        guard let original = downloadTask.originalRequest?.url else { return }

        do {
            let data = try Data(contentsOf: location)
            try CacheProvider.shared.save(data: data, for: original)
        } catch {
            NSLog("PreloadManager: failed to save preload for \(original): \(error)")
        }

        syncQueue.sync { tasks[original] = nil }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        guard let url = task.originalRequest?.url else { return }
        if let err = error {
            NSLog("PreloadManager: download failed for \(url): \(err)")
        }
        syncQueue.sync { tasks[url] = nil }
    }
}
