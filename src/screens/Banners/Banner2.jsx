import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import FastImage from 'react-native-fast-image';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import apiClient from '../ApiClient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const Banner02 = () => {
  const navigation = useNavigation();
  const [bannerHomeFiles, setBannerHomeFiles] = useState([]);
  const [isVideoReady, setIsVideoReady] = useState({});
  const [isVideoPlaying, setIsVideoPlaying] = useState({});
  const isFocused = useIsFocused();
  const flatListRef = useRef(null);
  const currentIndexRef = useRef(0);
  const fetchBannerData = useCallback(async () => {
    try {
      const response = await apiClient.post('/getBannerImages', {
        command: 'getBannerImages',
        banners_id: 'adban01',
      });

      if (response.data.status === 'success') {

        const bannerData = response.data.response || [];
        const media = [];

        for (const banner of bannerData) {
          for (const file of banner.files || []) {

            try {
              const res = await apiClient.post('/getObjectSignedUrl', {
                command: 'getObjectSignedUrl',
                bucket_name: 'bme-app-admin-data',
                key: file.fileKey, // <-- FIXED
              });

              const url = res.data;
              if (url) {
                const type = file.fileKey.endsWith('.mp4') ? 'video' : 'image';

                let id = null;
                const targetUrl = file.redirect?.target_url;
                const match = targetUrl?.match(/\/company\/([a-f0-9-]+)$/i);
                if (match && match[1]) {
                  id = match[1];
                }
                media.push({
                  url,
                  type,
                  redirect: file.redirect || null, // optionally include redirect
                  id
                });
              }
            } catch (err) {
              console.error('Error fetching signed URL:', err);
            }
          }

        }

        setBannerHomeFiles(media);
      }
    } catch (err) {
      console.error('Banner fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchBannerData();
  }, [fetchBannerData]);

  useEffect(() => {
    if (!isFocused) {
      setIsVideoPlaying({});
    }
  }, [isFocused]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!bannerHomeFiles.length) return;
      currentIndexRef.current = (currentIndexRef.current + 1) % bannerHomeFiles.length;
      flatListRef.current?.scrollToIndex({
        index: currentIndexRef.current,
        animated: true,
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [bannerHomeFiles]);

  const handlePlayPause = (index) => {
    setIsVideoPlaying((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const renderItem = ({ item, index }) => {
    const isPlaying = isVideoPlaying[index] ?? true;
    const videoReady = isVideoReady[index];

    if (item.type === 'image') {
      return (
        <View style={styles.slide}>
          <FastImage source={{ uri: item.url }} style={styles.media} resizeMode="cover" />
        </View>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          if (item.id) {
            navigation.navigate('CompanyDetails', { userId: item.id });
          } else {
            handlePlayPause(index); // fallback behavior
          }
        }}

        style={styles.slide}
      >
        {!videoReady && (
          <ActivityIndicator
            size="large"
            color="#ffffff"
            style={styles.loader}
          />
        )}
        <Video
          source={{ uri: item.url }}
          style={styles.media}
          resizeMode="cover"
          repeat

          paused={!isFocused || !isPlaying}
          onLoad={() =>
            setIsVideoReady((prev) => ({ ...prev, [index]: true }))
          }
        />
        {!isPlaying && (
          <Icon
            name="play-circle-outline"
            size={50}
            color="white"
            style={styles.playIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.carouselContainer}>
      <FlatList
        ref={flatListRef}
        data={bannerHomeFiles}
        horizontal
        pagingEnabled
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: width - 8,
          offset: (width - 8) * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    height: 200,
    width: width - 8,
    alignSelf: 'center',
    borderRadius: 14,
    overflow: 'hidden',
  },
  slide: {
    width: width - 8,
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  loader: {
    position: 'absolute',
    zIndex: 2,
  },
  playIcon: {
    position: 'absolute',
    zIndex: 2,
    alignSelf: 'center',
  },
});

export default Banner02;
