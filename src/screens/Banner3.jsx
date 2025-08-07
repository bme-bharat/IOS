import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import apiClient from './ApiClient';

const { width } = Dimensions.get('window');
const MARGIN = 4;
const ITEM_WIDTH = width - 2 * MARGIN; // = width - 8

const Banner03 = () => {
  const [bannerHomeImages, setBannerHomeImages] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const flatListRef = useRef(null);
  const currentIndexRef = useRef(0);

  const fetchImages = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await apiClient.post('/getBannerImages', {
        command: 'getBannerImages',
        banners_id: 'adban02',
      });

      if (response.data.status === 'success') {
        const banners = response.data.response;
        const urls = [];

        for (const banner of banners) {
          for (const fileKey of banner.files || []) {
            
            try {
              const res = await apiClient.post('/getObjectSignedUrl', {
                command: 'getObjectSignedUrl',
                bucket_name: 'bme-app-admin-data',
                key: fileKey,
              });

              if (res.data) {
                urls.push(res.data);
              }
            } catch {}
          }
        }

        setBannerHomeImages(urls);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
    }
    setIsFetching(false);
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Auto-slide logic
  useEffect(() => {
    if (!bannerHomeImages.length) return;

    const interval = setInterval(() => {
      currentIndexRef.current =
        (currentIndexRef.current + 1) % bannerHomeImages.length;

      flatListRef.current?.scrollToIndex({
        index: currentIndexRef.current,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [bannerHomeImages]);

  const renderItem = ({ item }) => (
    <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
  );

  // if (isFetching) {
  //   return <ActivityIndicator style={{ marginTop: 30 }} size="large" color="#000" />;
  // }

  return (
    <View style={styles.container}>
<FlatList
  ref={flatListRef}
  data={bannerHomeImages}
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
  container: {
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: MARGIN,
  },
image: {
  width: ITEM_WIDTH,
  height: 200,
  borderRadius: 14,
  marginHorizontal: MARGIN,
},

});

export default Banner03;
