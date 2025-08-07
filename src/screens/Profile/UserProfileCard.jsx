import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon1 from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';


const UserProfileCard = ({ profile, onEdit, onNavigate, styles }) => {
  return (
    <TouchableOpacity activeOpacity={1} onPress={onNavigate} style={styles.profileContainer}>
      <TouchableOpacity style={styles.editProfileButton} onPress={onEdit}>
        <Text style={styles.editProfileText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={1} onPress={onNavigate} style={styles.imageContainer}>
        {profile?.imageUrl ? (
          <FastImage
            source={{ uri: profile?.imageUrl, priority: FastImage.priority.normal }}
            cache="immutable"
            style={styles.detailImage}
            resizeMode="contain"
            onError={() => {}}
          />
        ) : (
          <View style={[styles.avatarContainer, { backgroundColor: profile?.companyAvatar?.backgroundColor }]}>
            <Text style={[styles.avatarText, { color: profile?.companyAvatar?.textColor }]}>
              {profile?.companyAvatar?.initials}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.profileDetails}>
        <View style={styles.title1}>
          <Icon1 name="person" size={20} color="#075cab" />
          <Text style={styles.colon}>|</Text>
          <Text style={styles.value}>{profile?.first_name?.trim()} {profile?.last_name}</Text>
        </View>
        <View style={styles.title1}>
          <Icon1 name="phone" size={20} color="#075cab" />
          <Text style={styles.colon}>|</Text>
          <Text style={styles.value}>{profile?.user_phone_number?.trim()}</Text>
        </View>
        <View style={styles.title1}>
          <Icon1 name="email" size={20} color="#075cab" />
          <Text style={styles.colon}>|</Text>
          <Text style={styles.value}>{profile?.user_email_id}</Text>
        </View>
        {profile?.college?.trim() && (
          <View style={styles.title1}>
            <Icon1 name="school" size={20} color="#075cab" />
            <Text style={styles.colon}>|</Text>
            <Text style={styles.value}>{profile.college.trim()}</Text>
          </View>
        )}
      </View>

      <Icon name="gesture-tap" size={18} color="#888" style={{ alignSelf: 'flex-end' }} />
    </TouchableOpacity>
  );
};

export default UserProfileCard;
