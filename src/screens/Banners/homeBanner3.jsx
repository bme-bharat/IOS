import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../ApiClient';
import BMEVideoPlayer from '../BMEVideoPlayer';
import { colors } from '../../assets/theme';

const { width } = Dimensions.get('window');

const HomeBanner = ({bannerId}) => {
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);
  const navigation = useNavigation();
  const videoRefs = useRef([]);

  // Handle banner press (navigate or redirect)
  const onPressBanner = useCallback(
    (item) => {
      if (item.id) {
        navigation.navigate('CompanyDetails', { userId: item.id });
        return;
      }
  
      if (item.redirect?.target_url) {
        const url = item.redirect.target_url;
  
        try {
          // Extract last segment manually (no URL API)
          const segments = url.split('/').filter(Boolean);
          const companyId = segments[segments.length - 1];
  
          if (companyId) {
            navigation.navigate('CompanyDetails', { userId: companyId });
          }
        } catch (err) {
          console.warn('Invalid URL:', err);
        }
      }
    },
    [navigation]
  );
  

  // Fetch only video banners
  const fetchBanners = useCallback(async () => {
    try {
      const response = await apiClient.post('/getBannerImages', {
        command: 'getBannerImages',
        banners_id: bannerId,
      });

      if (response.data.status === 'success') {
        const bannerData = response.data.response;
        const mediaUrls = [];

        for (const banner of bannerData) {
          if (banner.files?.length > 0) {
            for (const file of banner.files) {
              if (file.fileKey.endsWith('.mp4')) continue;
              try {
                const res = await apiClient.post('/getObjectSignedUrl', {
                  command: 'getObjectSignedUrl',
                  bucket_name: 'bme-app-admin-data',
                  key: file.fileKey,
                });
                if (res.data) {
                  mediaUrls.push({
                    url: res.data,
                    id: banner.company_id,
                    redirect: file.redirect,
                  });
                }
              } catch (err) {
                console.log('Signed URL fetch error:', err);
              }

            }
          }
        }

        setBanners(mediaUrls);
      }
    } catch (err) {
      console.error('Banner fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);



  // Start the first video when banners are ready
  useEffect(() => {
    if (banners.length > 0) {
      // Give React a short delay to mount the native views
      const timer = setTimeout(() => setCurrentIndex(0), 400);
      return () => clearTimeout(timer);
    }
  }, [banners]);


  return (
    <View style={{ alignItems: 'center' }}>
      <Carousel
        ref={carouselRef}
        width={width}
        height={width * 0.4}
        data={banners}
        loop
        windowSize={3}
        autoPlay={true} // handled manually by video end
        scrollAnimationDuration={1000}
        autoPlayInterval={3000}
        onProgressChange={(_, absoluteProgress) => {
          const index = Math.round(absoluteProgress);
          setCurrentIndex(index);
        }}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.98,
          parallaxScrollingOffset: 0,
        }}
        renderItem={({ item, index }) => (

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPressBanner(item)}
            style={{
              flex: 1,
              borderRadius: 8,
              overflow: 'hidden',
              elevation: 3,
              backgroundColor: '#fff',
            }}
          >
            <Image
              source={{ uri: item.url }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
            />
            {loading && (
              <ActivityIndicator
                size="small"
                color={colors.primary || '#fff'}
                style={{ position: 'absolute', top: '45%', left: '45%' }}
              />
            )}
          </TouchableOpacity>

        )}
      />
      <View
                style={{
                  position: 'absolute',
                  bottom:10, // move higher or lower as needed
                  left: 0,
                  right: 0,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {banners.map((_, index) => (
                  <View
                    key={index}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 20,
                      marginHorizontal: 4,
                      backgroundColor:
                        currentIndex === index
                          ? colors.primary || '#075cab'
                          : '#ccc', // soft white overlay
                    }}
                  />
                ))}
              </View>
    </View>
  );
};

export default HomeBanner;
