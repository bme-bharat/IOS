BMEVideo iOS Native Port (1:1 architecture)
==========================================

What this package is:
- A native iOS Swift port scaffold that mirrors the Android module structure (class names and responsibilities).
- Provides:
  - BMEVideoPlayerView.swift (native view)
  - BMEVideoPlayerManager.swift (RCTViewManager + exposed commands)
  - BMEVideoPlayer.swift (AVPlayer wrapper with events)
  - PreloadManager.swift (download & cache)
  - CacheProvider.swift (disk cache)
  - PlayerPool.swift (reuse players)
  - BMEEventEmitter.swift (RN event emitter)
  - BMEPreloadModule.swift (bridge for preload APIs)
  - Supporting files: Podfile, bridging header, JS wrapper

Integration steps:
1. Copy the Swift files into an Xcode group inside your iOS target.
2. Add the bridging header to Build Settings -> Objective-C Bridging Header.
3. Run `pod install`.
4. Ensure CommonCrypto is available (bridging header imports it).
5. Import and use the JS wrapper `js/BMEVideo.ios.js` in your RN code.

Notes:
- This is a full *native* port scaffold. It intentionally mirrors the Android architecture so your RN usage and higher-level app logic can remain identical.
- If you want exact method signatures or additional Android-specific helpers ported (e.g., specific preload API names, event payloads), I can update signatures to match exactly once you confirm.

