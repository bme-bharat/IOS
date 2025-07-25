import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Linking,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import apiClient from './ApiClient';

const windowWidth = Dimensions.get('window').width;

const Banner01 = ({ isVisible }) => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));
  const timeoutRef = useRef(null);
  const [error, setError] = useState(null);

  const fetchHomeBannerImages = useCallback(async () => {
    try {
      const response = await apiClient.post('/getBannerImages', {
        command: 'getBannerImages',
        banners_id: '00000',
      });

      if (response.data.status === 'success') {
        const bannerHomeData = response.data.response;
        const bannerItems = [];

        for (const banner of bannerHomeData) {
          if (banner.files?.length > 0) {
            for (const file of banner.files) {
              const { fileKey, redirect } = file;
              try {
                const res = await apiClient.post('/getObjectSignedUrl', {
                  command: 'getObjectSignedUrl',
                  bucket_name: 'bme-app-admin-data',
                  key: fileKey,
                });

                const signedUrl = res.data;

                if (signedUrl) {
                  const type = fileKey.endsWith('.mp4') ? 'video' : 'image';
                  bannerItems.push({
                    url: signedUrl,
                    type,
                    redirect: redirect?.target_url || null,
                  });
                }
              } catch (err) {
                console.warn(`Error fetching URL for ${fileKey}:`, err);
              }
            }
          }
        }

        setBanners(bannerItems);
      }
    } catch (err) {
      console.error('Error fetching banner data:', err);
      setError(err);
    }
  }, []);

  useEffect(() => {
    fetchHomeBannerImages();
  }, [fetchHomeBannerImages]);

  useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: -currentIndex * windowWidth,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [currentIndex, isVisible]);

  useEffect(() => {
    if (!isVisible || banners.length === 0) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const currentBanner = banners[currentIndex];
    const delay = currentBanner.type === 'video' ? 10000 : 3000;

    timeoutRef.current = setTimeout(() => {
      goToNext();
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, banners, isVisible]);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  const handleRedirect = (url) => {
    if (url && typeof url === 'string') {
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      Linking.openURL(url).catch((err) =>
        console.warn('Failed to open URL:', err)
      );
    }
  };

  if (error || banners.length === 0) return null;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => handleRedirect(banners[currentIndex]?.redirect)}
      style={styles.carouselContainer}
    >
      <View style={styles.imageContainer}>
        <Animated.View
          style={[
            styles.imageRow,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {banners.map((item, index) => (
            <View key={index} style={styles.bannerSlide}>
              {item.type === 'image' ? (
                <FastImage
                  source={{ uri: item.url }}
                  style={styles.media}
                  resizeMode="cover"
                />
              ) : (
                <Video
                  key={currentIndex === index ? `video-${index}-${Date.now()}` : `video-${index}`}
                  source={{ uri: item.url }}
                  style={styles.media}
                  resizeMode="cover"
                  repeat
                  
                  paused={!isVisible || currentIndex !== index}
                />
              )}
            </View>
          ))}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 216,
    width: windowWidth,
    alignSelf: 'center',
 
  },
  imageRow: {
    flexDirection: 'row',
    height: 216,
    width: windowWidth * 10,
    backgroundColor: '#DDDDDD',
  },
  bannerSlide: {
    width: windowWidth,
    height: 216,

    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',

  },
});

export default Banner01;
