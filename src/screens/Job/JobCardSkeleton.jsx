import React, { useRef, useEffect } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const JobCardSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2200, // slower shimmer
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.card}>
      {/* Avatar / Company Logo in center */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar} />
      </View>

      {/* Text container */}
      <View style={styles.textContainer}>
        {/* Job Title */}
        <View style={styles.lineTitle} />

        {/* Company */}
        <View style={styles.row}>
          <View style={styles.smallBox} />
          <View style={styles.lineShort} />
        </View>

        {/* Package */}
        <View style={styles.row}>
          <View style={styles.smallBox} />
          <View style={styles.lineMedium} />
        </View>

        {/* Location */}
        <View style={styles.row}>
          <View style={styles.smallBox} />
          <View style={styles.lineLong} />
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <View style={styles.button} />
          <View style={styles.buttonSmall} />
        </View>
      </View>

      {/* Shimmer Overlay */}
      <Animated.View
        style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 10,
    paddingBottom: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#e0e0e0",
  },
  textContainer: {
    paddingHorizontal: 16,
  },
  lineTitle: {
    width: "70%",
    height: 16,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  smallBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginRight: 8,
  },
  lineShort: {
    width: "30%",
    height: 12,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  lineMedium: {
    width: "50%",
    height: 12,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  lineLong: {
    width: "70%",
    height: 12,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    alignItems: "center",
  },
  button: {
    width: 100,
    height: 30,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
  },
  buttonSmall: {
    width: 40,
    height: 30,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
});

export default JobCardSkeleton;
