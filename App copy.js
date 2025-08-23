import React, { useRef, useState } from "react";
import { View, Button, StyleSheet, Text } from "react-native";
import BMEVideoPlayer from "./src/screens/videoPlayer/BMEVideoPlayer";


export default function VideoScreen() {
  const playerRef = useRef(null);
  const [status, setStatus] = useState({});
  const [action, setAction] = useState("paused");

  const videoUrl =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  const handlePlay = () => {
    playerRef.current?.play();
    setAction("playing");
  };

  const handlePause = () => {
    playerRef.current?.pause();
    setAction("paused");
  };

  return (
    <View style={styles.container}>
      <BMEVideoPlayer
        ref={playerRef}
        source={videoUrl}
        paused={false}
        muted={false}
        volume={1}
        resizeMode="contain"
        onPlaybackStatus={(e) => {
          setStatus(e);
          // Optional: if native sends paused/playing info
          if (e?.isPlaying !== undefined) {
            setAction(e.isPlaying ? "playing" : "paused");
          }
        }}
        style={styles.player}
      />

      <View style={styles.controls}>
        <Button title="Play" onPress={handlePlay} />
        <Button title="Pause" onPress={handlePause} />
        <Button
          title="Seek to 10s"
          onPress={() => playerRef.current?.seekTo(10)}
        />
        <Button
          title="Fullscreen"
          onPress={() => playerRef.current?.presentFullscreen()}
        />
      </View>

      <Text style={styles.status}>
        Action: {action} | Status: {JSON.stringify(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: "#000" },
  player: { width: "100%", aspectRatio: 16/9, backgroundColor: "#000" },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  status: {
    marginTop: 10,
    color: "#fff",
  },
});




