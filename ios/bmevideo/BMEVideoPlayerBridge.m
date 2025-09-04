#import <React/RCTViewManager.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(BMEVideoPlayer, RCTViewManager)

// Props
RCT_EXPORT_VIEW_PROPERTY(source, NSString)
RCT_EXPORT_VIEW_PROPERTY(paused, BOOL)
RCT_EXPORT_VIEW_PROPERTY(muted, BOOL)
RCT_EXPORT_VIEW_PROPERTY(volume, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString)
RCT_EXPORT_VIEW_PROPERTY(poster, NSString)
RCT_EXPORT_VIEW_PROPERTY(posterResizeMode, NSString)
RCT_EXPORT_VIEW_PROPERTY(repeat, BOOL)

// Events
RCT_EXPORT_VIEW_PROPERTY(onPlaybackStatus, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onSeek, RCTBubblingEventBlock)

// Commands / Methods bridged to manager
RCT_EXTERN_METHOD(play:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(pause:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(seekTo:(nonnull NSNumber *)reactTag seconds:(nonnull NSNumber *)seconds)
RCT_EXTERN_METHOD(releasePlayer:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(stop:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(preload:(NSString *)url)
RCT_EXTERN_METHOD(cancelPreload:(NSString *)url)

@end