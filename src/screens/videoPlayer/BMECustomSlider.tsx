import React, { useRef, useState, useEffect } from "react";
import { View, PanResponder, StyleSheet } from "react-native";

type Props = {
  value: number;
  minimumValue?: number;
  maximumValue?: number;
  onSlidingComplete?: (value: number) => void;
  onValueChange?: (value: number) => void;
};

export default function CustomSlider({
  value,
  minimumValue = 0,
  maximumValue = 1,
  onSlidingComplete,
  onValueChange,
}: Props) {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [startThumbPos, setStartThumbPos] = useState(0);
  const [thumbPos, setThumbPos] = useState(0);

  // Sync thumb position when value changes
  useEffect(() => {
    if (sliderWidth > 0) {
      const pct = (value - minimumValue) / (maximumValue - minimumValue);
      setThumbPos(pct * sliderWidth);
    }
  }, [value, sliderWidth]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setStartThumbPos(thumbPos);
      },
      onPanResponderMove: (_, gesture) => {
        if (!sliderWidth) return;
        let newX = Math.min(Math.max(0, startThumbPos + gesture.dx), sliderWidth);
        setThumbPos(newX);
        let pct = newX / sliderWidth;
        let newValue = minimumValue + pct * (maximumValue - minimumValue);
        onValueChange?.(newValue);
      },
      onPanResponderRelease: (_, gesture) => {
        if (!sliderWidth) return;
        let newX = Math.min(Math.max(0, startThumbPos + gesture.dx), sliderWidth);
        let pct = newX / sliderWidth;
        let newValue = minimumValue + pct * (maximumValue - minimumValue);
        onSlidingComplete?.(newValue);
      },
    })
  ).current;

  return (
    <View
      style={styles.container}
      onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.track} />
      <View style={[styles.filled, { width: thumbPos, backgroundColor: "#fff" }]} />
      <View
        style={[styles.thumb, { left: thumbPos - 10 }]}
        {...panResponder.panHandlers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 30,
    justifyContent: "center",
  },
  track: {
    position: "absolute",
    height: 4,
    width: "100%",
    backgroundColor: "#888",
    borderRadius: 2,
  },
  filled: {
    position: "absolute",
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#000",
  },
});
