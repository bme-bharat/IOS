
// BMEVideoPlayerView.m
#import "BMEVideoPlayerView.h"
#import <AVKit/AVKit.h>
#import <React/RCTLog.h>

@interface BMEVideoPlayerView ()

@property (nonatomic, strong) AVPlayer *player;
@property (nonatomic, strong) AVPlayerLayer *playerLayer;
@property (nonatomic, strong) id timeObserver;
@property (nonatomic, strong) AVPlayerItem *playerItem;
@property (nonatomic, assign) BOOL isObserving;

@end

@implementation BMEVideoPlayerView

- (instancetype)init
{
  if (self = [super init]) {
    self.backgroundColor = [UIColor blackColor];
    _player = [AVPlayer new];
    _playerLayer = [AVPlayerLayer playerLayerWithPlayer:_player];
    _playerLayer.videoGravity = AVLayerVideoGravityResizeAspect;
    [self.layer addSublayer:_playerLayer];
    _paused = YES;
    _muted = NO;
    _volume = 1.0;
    // Ensure audio plays with silent switch
    NSError *sessionError = nil;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback error:&sessionError];
    if (sessionError) {
      RCTLogWarn(@"Failed to set audio session category: %@", sessionError);
    }
  }
  return self;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  self.playerLayer.frame = self.bounds;
}

#pragma mark - Setters

- (void)setSource:(NSString *)source
{
  if (!source) return;
  if ([_source isEqualToString:source]) return;
  _source = [source copy];

  // Remove old observers
  [self removePlayerObservers];

  NSURL *url = [self urlFromSource:source];
  if (!url) {
    RCTLogError(@"Invalid video URL: %@", source);
    return;
  }

  AVURLAsset *asset = [AVURLAsset URLAssetWithURL:url options:nil];
  AVPlayerItem *item = [AVPlayerItem playerItemWithAsset:asset];
  self.playerItem = item;
  [self.player replaceCurrentItemWithPlayerItem:item];
  [self addPlayerObservers];

  if (!self.paused) {
    [self.player play];
  }
}

- (void)setPaused:(BOOL)paused
{
  _paused = paused;
  if (paused) {
    [self.player pause];
  } else {
    [self.player play];
  }
}

- (void)setMuted:(BOOL)muted
{
  _muted = muted;
  self.player.muted = muted;
}

- (void)setVolume:(float)volume
{
  _volume = volume;
  self.player.volume = volume;
}

- (NSURL *)urlFromSource:(NSString *)src
{
  // Accept remote http/https or local file path
  if ([src hasPrefix:@"http://"] || [src hasPrefix:@"https://"]) {
    return [NSURL URLWithString:src];
  }
  // allow file:// or bare path
  if ([src hasPrefix:@"file://"]) return [NSURL URLWithString:src];
  return [NSURL fileURLWithPath:src];
}

#pragma mark - Player control

- (void)play
{
  if (self.player.currentItem) {
    [self.player play];
    [self sendPlaybackEvent:@{ @"state": @"playing" }];
  }
}

- (void)pause
{
  [self.player pause];
  [self sendPlaybackEvent:@{ @"state": @"paused" }];
}

- (void)seekTo:(CMTime)time completion:(void (^)(BOOL finished))completion
{
  if (!self.player.currentItem) {
    if (completion) completion(NO);
    return;
  }
  __weak typeof(self) weakSelf = self;
  [self.player seekToTime:time toleranceBefore:kCMTimeZero toleranceAfter:kCMTimeZero completionHandler:^(BOOL finished) {
    if (weakSelf.onPlaybackStatus) {
      weakSelf.onPlaybackStatus(@{ @"event": @"seekCompleted", @"position": @(CMTimeGetSeconds(time)) });
    }
    if (completion) completion(finished);
  }];
}

- (void)presentFullscreen
{
  if (!self.player) return;
  AVPlayerViewController *vc = [AVPlayerViewController new];
  vc.player = self.player;
  vc.modalPresentationStyle = UIModalPresentationFullScreen;

  // find topmost view controller
  UIViewController *root = UIApplication.sharedApplication.delegate.window.rootViewController;
  UIViewController *top = root;
  while (top.presentedViewController) {
    top = top.presentedViewController;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    [top presentViewController:vc animated:YES completion:^{
      [vc.player play];
    }];
  });
}

#pragma mark - Observers

- (void)addPlayerObservers
{
  if (!self.playerItem || self.isObserving) return;
  self.isObserving = YES;

  [self.playerItem addObserver:self forKeyPath:@"status" options:0 context:NULL];
  [self.playerItem addObserver:self forKeyPath:@"playbackLikelyToKeepUp" options:0 context:NULL];

  __weak typeof(self) weakSelf = self;
  self.timeObserver = [self.player addPeriodicTimeObserverForInterval:CMTimeMakeWithSeconds(0.5, NSEC_PER_SEC) queue:dispatch_get_main_queue() usingBlock:^(CMTime time) {
    if (!weakSelf) return;
    float position = CMTimeGetSeconds(time);
    if (weakSelf.onPlaybackStatus) {
      weakSelf.onPlaybackStatus(@{ @"event": @"progress", @"position": @(position) });
    }
  }];
}

- (void)removePlayerObservers
{
  if (!self.isObserving) return;
  self.isObserving = NO;
  @try {
    [self.playerItem removeObserver:self forKeyPath:@"status"];
    [self.playerItem removeObserver:self forKeyPath:@"playbackLikelyToKeepUp"];
  } @catch (NSException *exception) {
    // noop
  }
  if (self.timeObserver) {
    [self.player removeTimeObserver:self.timeObserver];
    self.timeObserver = nil;
  }
}

- (void)dealloc
{
  [self removePlayerObservers];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context
{
  if (object == self.playerItem) {
    if ([keyPath isEqualToString:@"status"]) {
      if (self.playerItem.status == AVPlayerItemStatusReadyToPlay) {
        if (self.onPlaybackStatus) {
          self.onPlaybackStatus(@{ @"event": @"ready", @"duration": @(CMTimeGetSeconds(self.playerItem.duration)) });
        }
      } else if (self.playerItem.status == AVPlayerItemStatusFailed) {
        if (self.onPlaybackStatus) {
          self.onPlaybackStatus(@{ @"event": @"error", @"message": self.playerItem.error.localizedDescription ?: @"unknown" });
        }
      }
    } else if ([keyPath isEqualToString:@"playbackLikelyToKeepUp"]) {
      if (self.playerItem.playbackLikelyToKeepUp) {
        if (self.onPlaybackStatus) self.onPlaybackStatus(@{ @"event": @"bufferingFinished" });
      }
    }
  }
}

#pragma mark - Utilities

- (void)sendPlaybackEvent:(NSDictionary *)payload
{
  if (self.onPlaybackStatus) {
    self.onPlaybackStatus(payload);
  }
}

@end
