import React, { useRef, useEffect } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

const ShimmerSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar} />
        <View style={styles.userInfo}>
          <View style={styles.username} />
          <View style={styles.subText} />
        </View>
      </View>

      {/* Post Image */}
      <View style={styles.postImage} />

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionIcon} />
        <View style={styles.actionIcon} />
        <View style={styles.actionIcon} />
      </View>

      {/* Caption */}
      <View style={styles.caption}>
        <View style={styles.lineFull} />
        <View style={styles.lineHalf} />
      </View>

      {/* Shimmer overlay */}
      <Animated.View
        style={[
          styles.shimmerOverlay,
          { transform: [{ translateX }] },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#f0f0f0', overflow: 'hidden', marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0e0e0' },
  userInfo: { marginLeft: 10, flex: 1 },
  username: { width: 120, height: 12, borderRadius: 4, backgroundColor: '#e0e0e0' },
  subText: { marginTop: 6, width: 80, height: 12, borderRadius: 4, backgroundColor: '#e0e0e0' },
  postImage: { width: width, height: width, backgroundColor: '#e0e0e0' },
  actions: { flexDirection: 'row', padding: 10 },
  actionIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#e0e0e0', marginRight: 10 },
  caption: { paddingHorizontal: 10, paddingBottom: 10 },
  lineFull: { width: width - 40, height: 12, borderRadius: 4, backgroundColor: '#e0e0e0', marginBottom: 6 },
  lineHalf: { width: width / 2, height: 12, borderRadius: 4, backgroundColor: '#e0e0e0' },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});

export default ShimmerSkeleton;
