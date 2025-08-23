// EnhancedBMEVideoPlayer.tsx
import React, { useState, useRef, useEffect } from "react";
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Animated,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import BMEVideoPlayer from "./BMEVideoPlayer";
import CustomSlider from "./BMECustomSlider"; // ✅ Use custom slider

type Props = {
    source: string;
    fullscreen?: boolean;
    onClose?: () => void;
};

export default function EnhancedBMEVideoPlayer({
    source,
    fullscreen = false,
    onClose,
}: Props) {
    const playerRef = useRef<any>(null);
    const [status, setStatus] = useState({
        position: 0,
        duration: 0,
        isPlaying: false,
    });
    const [muted, setMuted] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (controlsVisible) {
            const timer = setTimeout(() => fadeControls(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [controlsVisible]);

    const fadeControls = (show: boolean) => {
        setControlsVisible(show);
        Animated.timing(fadeAnim, {
            toValue: show ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const togglePlayPause = () => {
        if (status.isPlaying) {
            playerRef.current?.pause();
        } else {
            playerRef.current?.play();
        }
    };

    const toggleMute = () => setMuted((m) => !m);

    const handleSeek = (newValue: number) => {
        playerRef.current?.seekTo(newValue);
    };

    return (
        <TouchableOpacity
            activeOpacity={1}
            style={styles.container}
            onPress={() => fadeControls(!controlsVisible)}
        >
            <BMEVideoPlayer
                ref={playerRef}
                source={source}
                paused={!status.isPlaying}
                muted={muted}
                resizeMode="contain"
                onPlaybackStatus={(e) =>
                    setStatus((prev) => ({
                        ...prev,
                        position: e.position || prev.position,
                        duration: e.duration || prev.duration,
                        isPlaying:
                            e.event === "playing"
                                ? true
                                : e.event === "paused"
                                ? false
                                : prev.isPlaying,
                    }))
                }
                style={styles.video}
            />

            {controlsVisible && (
                <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                    {/* Top Row */}
                    <View style={styles.topRow}>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={26} color="#fff" style={styles.topButton} />
                        </TouchableOpacity>

                        {fullscreen && (
                            <TouchableOpacity onPress={toggleMute}>
                                <Icon
                                    name={muted ? "volume-mute" : "volume-high"}
                                    size={26}
                                    color="#fff"
                                    style={styles.topButton}
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Center Play/Pause */}
                    {!fullscreen && (
                        <TouchableOpacity
                            onPress={togglePlayPause}
                            style={styles.centerBtn}
                        >
                            <Icon
                                name={status.isPlaying ? "pause" : "play"}
                                size={42}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    )}

                    {/* Bottom Row with Custom Slider */}
                    <View style={styles.bottomRow}>
                        <CustomSlider
                            value={status.position}
                            minimumValue={0}
                            maximumValue={status.duration || 1}
                            onValueChange={handleSeek}
                            onSlidingComplete={handleSeek}
                        />
                        <Text style={styles.timeText}>
                            {formatTime(status.position)} / {formatTime(status.duration)}
                        </Text>
                    </View>
                </Animated.View>
            )}
        </TouchableOpacity>
    );
}

function formatTime(sec: number) {
    if (!sec || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
}

const styles = StyleSheet.create({
    container: { backgroundColor: "#000", position: "relative" },
    video: { width: "100%", height: 220 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "space-between",
        paddingVertical: 10,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 10,
    },
    topButton: { padding: 5 },
    centerBtn: {
        alignSelf: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
        borderRadius: 40,
        padding: 10,
    },
    bottomRow: {
        paddingHorizontal: 10,
        marginTop: 10,
    },
    timeText: { color: "#fff", fontSize: 12, textAlign: "right", marginTop: 4 },
});
