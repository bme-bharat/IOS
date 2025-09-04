import Foundation

protocol PlayerEventListener: AnyObject {
  func onLoad(duration: Double, width: Int, height: Int)
  func onProgress(currentTime: Double, duration: Double)
  func onBuffer(_ buffering: Bool)
  func onError(_ message: String)
  func onEnd()
}
