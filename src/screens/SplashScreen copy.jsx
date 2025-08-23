import React from "react";
import { View, StyleSheet, Text, SafeAreaView } from "react-native";
import LottieView from "lottie-react-native";
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

export default function SplashScreen(onAnimationFinish) {

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.animationContainer}>
        <LottieView
          source={require("../assets/lottie/splash.json")}
          autoPlay
          loop
          style={styles.animation}
          onAnimationFinish={onAnimationFinish}

        />
      </View>
      <MaskedView
        style={{ height: 30 }} // matches text height
        maskElement={
          <View style={{ backgroundColor: 'transparent', alignItems: 'center' }}>
            <Text style={[styles.title, { backgroundColor: 'transparent' }]}>
              Bme Bharat
            </Text>
          </View>
        }
      >
        <LinearGradient
          colors={[
            '#003680', // deep navy
            '#013781', // slightly brighter navy
            '#0086bf', // medium blue
            '#018ac1', // bright cyan-blue
            '#028bc2'  // lighter cyan end
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </MaskedView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  animationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  animation: {
    width: 300,
    height: 300,
  },

  title: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 8,
    color: 'black', // fallback color
    backgroundColor: 'transparent',
  },


});