import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Animated, Dimensions, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';


const SplashScreen = ({ navigation }) => {


  return (
    <View style={styles.container}>
      <FastImage
        source={require('../images/homepage/2.jpg')} 
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor:'white'
  },
  image: {
    width: '100%', // Adjust image size
    height: '100%', // Adjust image size
    resizeMode: 'cover',
  },

});

export default SplashScreen;