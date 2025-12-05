// CoinSpinReanimated.js
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const Coin = () => {
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, {
        duration: 5000,
        easing: Easing.linear,
      }),
      -1, // infinite loop
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const rotateY = `${rotate.value}deg`;
    return {
      transform: [
        { perspective: 2000 },
        { rotateY },

      ],
    };
  });

  return (
    <View style={styles.container}>

      <View style={{ width: 80, height: 60, }}>
        <Animated.Image
          source={require('../../images/homepage/caduceus.png')}
          style={[styles.image, animatedStyle]}
        />
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center'

  },
  image: {
    width: "100%",
    height: '100%',
    // backfaceVisibility: 'hidden',
    backgroundColor: 'transparent',
    resizeMode: 'contain'
  },
});

export default Coin;
