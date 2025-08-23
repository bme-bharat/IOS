
// BMEVideoPlayerView.h
#import <UIKit/UIKit.h>
#import <React/RCTComponent.h>
#import <AVFoundation/AVFoundation.h>

@interface BMEVideoPlayerView : UIView

@property (nonatomic, copy) RCTBubblingEventBlock onPlaybackStatus;
@property (nonatomic, copy) NSString *source;
@property (nonatomic, assign) BOOL paused;
@property (nonatomic, assign) BOOL muted;
@property (nonatomic, assign) float volume;
@property (nonatomic, copy) NSString *resizeMode;

- (void)play;
- (void)pause;
- (void)seekTo:(CMTime)time completion:(void (^)(BOOL finished))completion;
- (void)presentFullscreen;

@end
