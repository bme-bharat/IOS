import React from 'react';
import { Text, TouchableOpacity, View, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';

const CollapsedProfileBar = ({ profile, navigation, collapsedTranslateY, collapsedOpacity, styles }) => (
  <Animated.View
    style={[
      styles.collapsedProfile,
      {
        transform: [{ translateY: collapsedTranslateY }],
        opacity: collapsedOpacity,
      },
    ]}
  >
    <TouchableOpacity
      onPress={() => navigation.navigate('UserProfile')}
      style={styles.miniProfileContent}
      activeOpacity={0.8}
    >
      <View style={styles.miniLeft}>
        {profile?.imageUrl ? (
          <FastImage
            source={{ uri: profile.imageUrl, priority: FastImage.priority.normal }}
            cache="immutable"
            style={styles.miniImage}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.avatarContainerMini, { backgroundColor: profile?.companyAvatar?.backgroundColor }]}>
            <Text style={[styles.avatarTextMini, { color: profile?.companyAvatar?.textColor }]}>
              {profile?.companyAvatar?.initials}
            </Text>
          </View>
        )}
        <Text style={styles.miniName}>
          {profile?.first_name?.trim()} {profile?.last_name}
        </Text>
      </View>
      <Icon name="chevron-down" size={26} color="#1e2a38" />
    </TouchableOpacity>
  </Animated.View>
);

export default CollapsedProfileBar;
