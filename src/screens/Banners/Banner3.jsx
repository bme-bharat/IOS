import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import apiClient from '../ApiClient';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const MARGIN = 4;
const ITEM_WIDTH = width - 2 * MARGIN; // = width - 8

const Banner03 = () => {
    const navigation = useNavigation();
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
     
        setBannerHomeImages(media);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
    }
    setIsFetching(false);
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);


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
    <TouchableOpacity
      onPress={() => {
        if (item.id) {
          navigation.navigate('CompanyDetails', { userId: item.id });
        }}} activeOpacity={1}>
      <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />

    </TouchableOpacity>
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
