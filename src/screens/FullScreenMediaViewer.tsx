import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";
import BMEVideoPlayer, { BMEVideoPlayerHandle } from "./BMEVideoPlayer";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");
const AUTO_HIDE_DELAY = 3000;
const SEEK_IGNORE_MS = 300;

const InlineVideo = ({ route }) => {
  const { source, poster, videoHeight } = route.params;
  const videoRef = useRef<BMEVideoPlayerHandle>(null);
  const sliderValueRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isSliding, setIsSliding] = useState(false);
  const [ignoreUpdatesUntil, setIgnoreUpdatesUntil] = useState(0);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const topInset =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : insets.top;
  const bottomInset = Platform.OS === "android" ? 16 : insets.bottom;
  const usableHeight = height - topInset - bottomInset;

  // -------- Playback status from native player --------
  const handlePlaybackStatus = useCallback(
    (event) => {
      const now = Date.now();
      if (now < ignoreUpdatesUntil || isSliding) return;

      if (event.position !== undefined) setPosition(event.position);
      if (event.duration !== undefined) setDuration(event.duration);

      if (event.status === "buffering") {
        setLoading(true);
      } else if (event.status === "progress") {
        setLoading(false);
      } else if (event.status === "ended") {
        setPaused(true);
      }
    },
    [isSliding, ignoreUpdatesUntil]
  );

  // -------- Toggle play/pause --------
  const togglePlayPause = () => {
    setPaused(prev => {
      const next = !prev;
      showControls(next);
      return next;
    });
  };
  

  // -------- Toggle mute --------
  const toggleMute = () => {
    setMuted((prev) => !prev);
    showControls();
  };

  // -------- Seek video --------
  const handleSeekComplete = (value: number) => {
    sliderValueRef.current = value;
    setPosition(value); // optimistic
    videoRef.current?.seekTo(value);

    setIgnoreUpdatesUntil(Date.now() + SEEK_IGNORE_MS);
    setIsSliding(false);

    // resume playback after seek
    setPaused(false);
    showControls();
  };

  // -------- Show controls (auto-hide only when playing) --------
  const showControls = (isPaused = paused) => {
    setControlsVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
  
    if (!isPaused && !isSliding) {
      hideTimeout.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setControlsVisible(false));
      }, AUTO_HIDE_DELAY);
    }
  };
  

  // -------- Keep controls visible when paused --------
  useEffect(() => {
    if (paused) {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      setControlsVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      showControls(); // schedules auto-hide
    }
  }, [paused]);
  

  // -------- Format seconds to mm:ss --------
  const formatTime = (sec: number) => {
    if (!sec || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // -------- Focus/unfocus handling --------
  useFocusEffect(
    useCallback(() => {
      setPaused(false);
      return () => {
        setPaused(true);
        videoRef.current?.release();
      };
    }, [])
  );

  useEffect(() => {
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      videoRef.current?.release();
    };
  }, []);

  const handleClose = () => {
    setPaused(true);
    videoRef.current?.stop();
    navigation.goBack();
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        togglePlayPause();
      }}
    >
      <View style={[styles.videoContainer, { height: usableHeight }]}>
        <BMEVideoPlayer
          ref={videoRef}
          source={source}
          paused={paused}
          muted={muted}
          onPlaybackStatus={handlePlaybackStatus}
          style={{ width: "100%", aspectRatio: videoHeight }}
          resizeMode="contain"
          repeat
          poster={poster}
          posterResizeMode="cover"
        />

        {/* Loader (top-right) */}
        {loading && (
          <View
            style={{
              position: "absolute",
              top: topInset + 10,
              right: 12,
              zIndex: 20,
            }}
          >
            <ActivityIndicator size="small" color="#FFF" />
          </View>
        )}

      {/* Central + bottom controls (auto-hide) */}
{controlsVisible && (
  <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
    {/* Top row (close + mute) */}
    <View style={[styles.topControls, { top: 10 }]}>
      <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
        <Icon name="close" size={24} color="#FFF" />
      </TouchableOpacity>
      <TouchableOpacity onPress={toggleMute} style={styles.iconButton}>
        <Icon
          name={muted ? "volume-mute" : "volume-high"}
          size={24}
          color="#FFF"
        />
      </TouchableOpacity>
    </View>

    {/* Central big play/pause */}
    <View style={styles.centralIcon}>
      <TouchableOpacity activeOpacity={0.8} onPress={togglePlayPause}>
        <Icon
          name={paused ? "play-circle-sharp" : "pause-circle-sharp"}
          size={80}
          color="rgba(255,255,255,0.85)"
        />
      </TouchableOpacity>
    </View>

    {/* Bottom row (small play/pause + slider + timer) */}
    <View style={[styles.bottomControls, { paddingBottom: bottomInset }]}>
      <TouchableOpacity
        onPress={togglePlayPause}
        style={styles.smallPlayPause}
      >
        <Icon name={paused ? "play" : "pause"} size={24} color="#FFF" />
      </TouchableOpacity>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration > 0 ? duration : 0}
        value={position}
        onSlidingStart={() => {
          setIsSliding(true);
          showControls(); // keep visible while sliding
        }}
        onValueChange={(value) => {
          if (isSliding) {
            sliderValueRef.current = value;
            setPosition(value);
          }
        }}
        onSlidingComplete={handleSeekComplete}
        minimumTrackTintColor="#075cab"
        maximumTrackTintColor="rgba(255,255,255,0.5)"
        thumbTintColor="#fff"
      />

      <Text style={styles.timeText}>
        -{formatTime(duration - position)}
      </Text>
    </View>
  </Animated.View>
)}

      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    width: "100%",
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "space-between",
  },
  centralIcon: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topControls: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    zIndex: 30,
  },
  bottomControls: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  iconButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 20,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
    height: 8,
    borderRadius: 8,
  },
  timeText: {
    color: "#FFF",
    fontSize: 12,
  },
  smallPlayPause: {
    marginRight: 8,
  },
});

export default InlineVideo;
