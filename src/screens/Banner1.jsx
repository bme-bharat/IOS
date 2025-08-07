import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Linking
} from 'react-native';
import Video from 'react-native-video';
import FastImage from 'react-native-fast-image';
import apiClient from './ApiClient';

const { width } = Dimensions.get('window');
const MARGIN = 4;
const ITEM_WIDTH = width - 2 * MARGIN;

const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const flatListRef = useRef(null);
  const currentIndexRef = useRef(0);

  const fetchBanners = useCallback(async () => {
    try {
      const response = await apiClient.post('/getBannerImages', {
        command: 'getBannerImages',
        banners_id: 'ban01',
      });

      if (response.data.status === 'success') {
        
        const data = [];
        for (const banner of response.data.response || []) {
          for (const file of banner.files || []) {
            
            const { fileKey, redirect } = file;
            const res = await apiClient.post('/getObjectSignedUrl', {
              command: 'getObjectSignedUrl',
              bucket_name: 'bme-app-admin-data',
              key: fileKey,
            });

            const url = res.data;
            if (url) {
              const type = fileKey.endsWith('.mp4') ? 'video' : 'image';
              data.push({ url, type, redirect: redirect?.target_url || null });
            }
          }
        }

        setBanners(data);
      }
    } catch (err) {
      console.error('Failed to fetch banners:', err);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (banners.length === 0) return;
      currentIndexRef.current = (currentIndexRef.current + 1) % banners.length;
      flatListRef.current?.scrollToIndex({
        index: currentIndexRef.current,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [banners]);

  const handleRedirect = (url) => {
    if (url) {
      if (!url.startsWith('http')) url = 'https://' + url;
      Linking.openURL(url).catch((err) =>
        console.warn('Failed to open URL:', err)
      );
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => handleRedirect(item.redirect)}
      style={styles.slide}
    >
      {item.type === 'video' ? (
        <Video
          source={{ uri: item.url }}
          style={styles.media}
          resizeMode="cover"
          repeat
          muted
        />
      ) : (
        <FastImage
          source={{ uri: item.url }}
          style={styles.media}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.carouselContainer}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        snapToInterval={ITEM_WIDTH + 2 * MARGIN}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH + 2 * MARGIN,
          offset: (ITEM_WIDTH + 2 * MARGIN) * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          const index = Math.round(offsetX / (ITEM_WIDTH + 2 * MARGIN));
          currentIndexRef.current = index;
        }}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    height: 216,
    alignSelf: 'center',
    borderRadius: 14,
    overflow: 'hidden',
  },
  
  slide: {
    width: ITEM_WIDTH,
    height: 216,
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: MARGIN,
  },
  media: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    
  },
});


export default BannerCarousel;
