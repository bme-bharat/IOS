import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, StyleSheet, Easing, Image } from 'react-native';
import { colors } from '../../assets/theme';
import Spin from './spin'
const AnimatedTextSequence = () => {
    const items = [
        { icon: '🧬', text: 'Integrating engineering \nprinciples \nwith medical science' },
        { icon: '⚙️', text: 'Bridging research \nand real-world healthcare innovation' },
        { icon: '🩺', text: 'Driving innovation in \nmedical devices and diagnostics' },
    ];

    const [index, setIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(10)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const rotationValue = useRef(0);

    // 🔁 Text animation
    useEffect(() => {
        const animateText = () => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setTimeout(() => {
                    Animated.parallel([
                        Animated.timing(fadeAnim, {
                            toValue: 0,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                        Animated.timing(translateY, {
                            toValue: -10,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        setIndex((prev) => (prev + 1) % items.length);
                        translateY.setValue(10);
                        animateText();
                    });
                }, 1500);
            });
        };
        animateText();
    }, []);

    // 🔄 Rotate the triangle 120° every 2 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            rotationValue.current += 120;
            Animated.timing(rotateAnim, {
                toValue: rotationValue.current,
                duration: 800,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }).start();
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });

    const inverseSpin = rotateAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '-360deg'],
    });

    return (
        <View style={styles.wrapper}>
            {/* Left: rotating triangle */}
            <View style={styles.leftContainer}>
                {/* <Animated.View
          style={[
            styles.triangleContainer,
            { transform: [{ rotate: spin }] },
          ]}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                right: 0,
                top: '50%',
                transform: [
                  { translateY: -20 },
                  { rotate: inverseSpin },
                ],
              },
            ]}
          >
            <Text style={styles.icon}>{items[0].icon}</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.iconWrapper,
              {
                left: 0,
                top: 0,
                transform: [{ rotate: inverseSpin }],
              },
            ]}
          >
            <Text style={styles.icon}>{items[1].icon}</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.iconWrapper,
              {
                left: 0,
                bottom: 0,
                transform: [{ rotate: inverseSpin }],
              },
            ]}
          >
            <Text style={styles.icon}>{items[2].icon}</Text>
          </Animated.View>
        </Animated.View> */}
                <Spin/>
                {/* <View style={{ width: 100, height: 120 }}>
                    <Image
                        source={require('../../images/homepage/caduceus.png')}
                        style={[styles.image]}
                    />
                </View> */}
            </View>

            {/* Right: animated text */}
            <View style={styles.rightContainer}>
                <Animated.Text
                    style={[
                        styles.text,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY }],
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
        backgroundColor:'#f0f0f0',


    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode:'contain'
    },
    leftContainer: {
        flex: 0.8, // balanced portion for triangle
        alignItems: 'center',
        justifyContent: 'center',
    },
    triangleContainer: {
        width: 90,
        height: 100,
        position: 'relative',
    },
    iconWrapper: {
        position: 'absolute',
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1.8,
        borderColor: '#ddd',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    icon: {
        fontSize: 20,
    },
    rightContainer: {
        flex: 2, // slightly larger to give text room
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        height: 100,
    },
    text: {
        fontSize: 24,
        fontWeight: '500',
        color: colors.primary,
        textAlign: 'center',
        fontFamily: 'Times New Roman', // example Arabic-style font
        lineHeight:28
      },
      
});


export default AnimatedTextSequence;
