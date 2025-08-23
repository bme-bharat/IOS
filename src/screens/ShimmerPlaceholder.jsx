import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const MARGIN = 4;
const ITEM_WIDTH = width - 2 * MARGIN;

const GlowPlaceholder = ({ style }) => {
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1, // fully bright
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5, // dim
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const bgColor = glowAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: ['#dcdcdc', '#f2f2f2']

  });

  return <Animated.View style={[styles.placeholder, style, { backgroundColor: bgColor }]} />;
};

const styles = StyleSheet.create({
  placeholder: {
    width: ITEM_WIDTH,
    height: 216,
    marginHorizontal: MARGIN,
    borderRadius: 14,
  },
});

export default GlowPlaceholder;
