import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const MediaPreview = ({
  uri,
  type,
  name,
  onRemove,
  style,
  imageStyle,
  videoStyle,
}) => {
  if (!uri) return null;

  return (
    <View style={[styles.container, style]}>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Icon name="close" size={20} color="black" />
        </TouchableOpacity>
      )}

      {type?.startsWith('image') ? (
        <Image
          source={{ uri }}
          style={[styles.media, imageStyle]}
          resizeMode="contain"
        />
      ) : type?.startsWith('video') ? (
        <Video
          source={{ uri }}
          style={[styles.media, videoStyle]}
          muted
          controls
          resizeMode="contain"
        />
      ) : (
        <View style={styles.documentContainer}>
          <Icon name="file-document-outline" size={50} color="#555" />
          <Text style={styles.documentName} numberOfLines={1}>
            {name || 'Document'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 5,
  },
  documentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentName: {
    marginTop: 8,
    fontSize: 14,
    color: '#555',
    maxWidth: '80%',
  },
});