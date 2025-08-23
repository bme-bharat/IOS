// BMEVideoPlayer.tsx
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
} from "react";
import {
  requireNativeComponent,
  UIManager,
  findNodeHandle,
  NativeSyntheticEvent,
  ViewProps,
  Platform,
} from "react-native";

type PlaybackStatusEvent = {
  event: string;
  position?: number;
  duration?: number;
  message?: string;
};

type BMEVideoPlayerProps = ViewProps & {
  source: string;
  paused?: boolean;
  muted?: boolean;
  volume?: number;
  resizeMode?: "contain" | "cover" | "stretch";
  onPlaybackStatus?: (event: PlaybackStatusEvent) => void;
};

type BMEVideoPlayerHandle = {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  presentFullscreen: () => void;
};

const NativeBMEVideoPlayer =
  requireNativeComponent<BMEVideoPlayerProps>("BMEVideoPlayer");

const BMEVideoPlayer = forwardRef<BMEVideoPlayerHandle, BMEVideoPlayerProps>(
  ({ onPlaybackStatus, ...props }, ref) => {
    const nativeRef = useRef(null);

    useImperativeHandle(ref, () => ({
      play() {
        dispatchCommand("play");
      },
      pause() {
        dispatchCommand("pause");
      },
      seekTo(seconds: number) {
        if (!nativeRef.current) return;
        const reactTag = findNodeHandle(nativeRef.current);
        if (reactTag == null) return;
        UIManager.dispatchViewManagerCommand(
          reactTag,
          UIManager.getViewManagerConfig("BMEVideoPlayer").Commands.seekTo,
          [seconds]
        );
      },
      presentFullscreen() {
        dispatchCommand("presentFullscreen");
      },
    }));

    const dispatchCommand = useCallback(
      (commandName: string) => {
        if (!nativeRef.current) return;
        const reactTag = findNodeHandle(nativeRef.current);
        if (reactTag == null) return;
        const commandId = UIManager.getViewManagerConfig("BMEVideoPlayer")
          .Commands[commandName];
        UIManager.dispatchViewManagerCommand(reactTag, commandId, []);
      },
      []
    );

    const handlePlaybackStatus = useCallback(
      (event: NativeSyntheticEvent<PlaybackStatusEvent>) => {
        if (onPlaybackStatus) {
          onPlaybackStatus(event.nativeEvent);
        }
      },
      [onPlaybackStatus]
    );

    return (
      <NativeBMEVideoPlayer
        {...props}
        ref={nativeRef}
        onPlaybackStatus={handlePlaybackStatus}
      />
    );
  }
);

export default BMEVideoPlayer;
