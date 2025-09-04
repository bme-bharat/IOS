import Foundation

@objc(PreloadManager)
class PreloadManager: NSObject, URLSessionDownloadDelegate {
  @objc static let shared = PreloadManager()
  private var tasks: [URL: URLSessionDownloadTask] = [:]
  private lazy var session: URLSession = {
    let cfg = URLSessionConfiguration.default
    return URLSession(configuration: cfg, delegate: self, delegateQueue: nil)
  }()

  @objc func preload(_ urlString: String) {
    guard let url = URL(string: urlString) else { return }
    if CacheProvider.shared.exists(url) { return }
    if tasks[url] != nil { return }
    let task = session.downloadTask(with: url)
    tasks[url] = task
    task.resume()
  }

  func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
    guard let original = downloadTask.originalRequest?.url else { return }
    do {
      let data = try Data(contentsOf: location)
      try CacheProvider.shared.save(data: data, for: original)
    } catch {
      // ignore for now
    }
    tasks[original] = nil
  }

  @objc func cancel(_ urlString: String) {
    guard let url = URL(string: urlString), let task = tasks[url] else { return }
    task.cancel()
    tasks[url] = nil
  }
}
