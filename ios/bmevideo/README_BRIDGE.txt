BMEVideoPlayer iOS bridge files (auto-generated)
-----------------------------------------------

What I added:
1. BMEVideoPlayerBridge.m - Objective-C bridge using RCT_EXTERN_MODULE to expose the Swift
   BMEVideoPlayer manager (annotated @objc(BMEVideoPlayer)) to React Native.
   - Exposes view props, events, and manager methods/commands.

Why:
- If your Swift manager class is correctly annotated with @objc(BMEVideoPlayer) and included
  in the Xcode target, React Native can load it. However, adding this explicit Objective-C
  bridge helps ensure the properties/events/methods are visible to the RN bridge and avoids
  issues where JS sees `null` for the view manager's event config.

How to use (production-ready checklist):
1. Open your Xcode workspace/project and ensure all Swift files in the `bmevideo` folder
   are added to the iOS target (Build Phases -> Compile Sources).
2. Ensure you have a bridging header (BMEVideo-Bridging-Header.h) and it's referenced in
   Build Settings -> Swift Compiler - General -> Objective-C Bridging Header.
3. Add `BMEVideoPlayerBridge.m` to your Xcode project (File -> Add Files...).
4. Clean build folder (Product -> Clean Build Folder), then build.
5. In JS keep: requireNativeComponent('BMEVideoPlayer') and that should match @objc name.

Notes:
- I did not change your Swift code. I only added a small Objective-C bridge file and a README.
- If you want, I can also add an Obj-C `.m/.h` that manually registers the module instead of using RCT_EXTERN_MODULE,
  but RCT_EXTERN_MODULE is the recommended pattern when exposing Swift managers.