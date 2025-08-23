

// BMEVideoPlayerManager.m
#import "BMEVideoPlayerManager.h"
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import "BMEVideoPlayerView.h"

@implementation BMEVideoPlayerManager

RCT_EXPORT_MODULE(BMEVideoPlayer)

- (UIView *)view
{
  return [[BMEVideoPlayerView alloc] init];
}

// Props
RCT_EXPORT_VIEW_PROPERTY(source, NSString)
RCT_EXPORT_VIEW_PROPERTY(paused, BOOL)
RCT_EXPORT_VIEW_PROPERTY(muted, BOOL)
RCT_EXPORT_VIEW_PROPERTY(volume, float)
RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString)

// Events
RCT_EXPORT_VIEW_PROPERTY(onPlaybackStatus, RCTBubblingEventBlock)

// Commands (UIManager dispatch)
RCT_EXPORT_METHOD(play:(nonnull NSNumber *)reactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    BMEVideoPlayerView *view = (BMEVideoPlayerView *)viewRegistry[reactTag];
    if (![view isKindOfClass:[BMEVideoPlayerView class]]) {
      RCTLogError(@"Cannot find BMEVideoPlayerView with tag #%@", reactTag);
      return;
    }
    [view play];
  }];
}

RCT_EXPORT_METHOD(pause:(nonnull NSNumber *)reactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    BMEVideoPlayerView *view = (BMEVideoPlayerView *)viewRegistry[reactTag];
    [view pause];
  }];
}

RCT_EXPORT_METHOD(seekTo:(nonnull NSNumber *)reactTag seconds:(double)seconds)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    BMEVideoPlayerView *view = (BMEVideoPlayerView *)viewRegistry[reactTag];
    [view seekTo:CMTimeMakeWithSeconds(seconds, NSEC_PER_SEC) completion:nil];
  }];
}

RCT_EXPORT_METHOD(presentFullscreen:(nonnull NSNumber *)reactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    BMEVideoPlayerView *view = (BMEVideoPlayerView *)viewRegistry[reactTag];
    [view presentFullscreen];
  }];
}

@end
