import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, StyleSheet, Easing } from 'react-native';
import { colors } from '../../assets/theme';
import Spin from '../animations/spin';

const AnimatedTextSequence = () => {
  const items = [
    { icon: '🧬', text: 'Integrating engineering \nprinciples with \nadvanced medical science' },
    { icon: '⚙️', text: 'Bridging research \nand real-world \nhealthcare innovation' },
    { icon: '🩺', text: 'Driving innovation \nin medical devices \nand diagnostics' },
  ];

  const [index, setIndex] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateText = () => {
      // Step 1: Zoom in slowly
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start(() => {
        // Step 2: Stay visible briefly
        setTimeout(() => {
          // Step 3: Smoothly disappear (scale down)
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            // Step 4: Move to next item
            setIndex((prev) => (prev + 1) % items.length);
            animateText();
          });
        }, 1500); // visible delay
      });
    };

    animateText();
  }, []);

  return (
    <View style={styles.wrapper}>
      {/* Left: rotating element */}
      <View style={styles.leftContainer}>
        <Spin />
      </View>

      {/* Right: animated text */}
      <View style={styles.rightContainer}>
        <Animated.Text
          style={[
            styles.text,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {items[index].text}
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#f0f0f0',
  },
  leftContainer: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    
  },
  text: {
    fontSize: 20,
    fontWeight: '500',
    color: '#120c73',
    textAlign: 'center',
    fontFamily: 'Montserrat-SemiBold',

  },
});

export default AnimatedTextSequence;
