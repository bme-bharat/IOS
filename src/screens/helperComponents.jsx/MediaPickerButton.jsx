import React from 'react';
import { TouchableOpacity, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const MediaPickerButton = ({
  onPress,
  isLoading = false,
  iconName = "cloud-upload-outline",
  iconSize = 30,
  text = "Click to upload",
  subText = "Supported formats: JPG, PNG, WEBP, MP4",
  sizeText = "(images 5MB, videos 10MB)",
  style,
  textStyle,
  subTextStyle,
  sizeTextStyle,
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={isLoading}
      style={[styles.container, style]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" />
      ) : (
        <View style={styles.content}>
          <Icon name={iconName} size={iconSize} color="#000" />
          <Text style={[styles.text, textStyle]}>{text}</Text>
          <Text style={[styles.subText, subTextStyle]}>{subText}</Text>
          <Text style={[styles.sizeText, sizeTextStyle]}>{sizeText}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};


export const ProfileMediaPicker = ({
  onPress,
  isLoading = false,
  iconName = "cloud-upload-outline",
  iconSize = 30,
  text = "Click to upload",
  subText = "Supported formats: JPG, PNG, WEBP, MP4",
  sizeText = "(images 5MB, videos 10MB)",
  style,
  textStyle,
  subTextStyle,
  sizeTextStyle,
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={isLoading}
      style={[styles.container, style]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" />
      ) : (
        <View style={styles.content}>
          <Icon name={iconName} size={iconSize} color="#000" />
          <Text style={[styles.text, textStyle]}>{text}</Text>
          <Text style={[styles.subText, subTextStyle]}>{subText}</Text>
          <Text style={[styles.sizeText, sizeTextStyle]}>{sizeText}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: 'gray',
    borderStyle: 'dotted',
    backgroundColor: 'white',
    borderRadius: 15,
  },
  content: {
    alignItems: 'center',
  },
  text: {
    color: 'black',
    fontSize: 14,
    marginTop: 8,
  },
  subText: {
    color: 'black',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  sizeText: {
    color: 'black',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
});