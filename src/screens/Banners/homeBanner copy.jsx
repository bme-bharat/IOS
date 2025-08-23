import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Linking,
  AppState,
} from 'react-native';
import Video from 'react-native-video';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../ApiClient';
import GlowPlaceholder from '../ShimmerPlaceholder';

const { width } = Dimensions.get('window');
const MARGIN = 4;
const ITEM_WIDTH = width - 2 * MARGIN;
const VIRTUAL_MULTIPLIER = 1000; // 🔄 Infinite loop illusion
// Consider making configurable constants
const VIDEO_MAX_DURATION = 15000;
const IMAGE_DISPLAY_DURATION = 3000;

const HomeBanner = ({ bannerId, isVisible }) => {
  const navigation = useNavigation();

  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [appState, setAppState] = useState('active'); // track app lifecycle

  const flatListRef = useRef(null);
  const timerRef = useRef(null);

  /** ✅ Cleanup on unmount */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /** ✅ Listen for app state changes */
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
    });
    return () => sub.remove();
  }, []);

  /** ✅ Stop autoplay when not visible or app is background */
  useEffect(() => {
    if ((!isVisible || appState !== 'active') && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [isVisible, appState]);

  /** ✅ Fetch banners */
  const fetchBanners = useCallback(async () => {
    try {
      const { data } = await apiClient.post('/getBannerImages', {
        command: 'getBannerImages',
        banners_id: bannerId,
      });
  
      if (data.status !== 'success') return;
  
      const bannerData = data.response || [];
  
      // Flatten all files with parent redirect info
      const files = bannerData.flatMap((banner) =>
        (banner.files || []).map((file) => ({
          ...file,
          redirect: file.redirect,
        })),
      );
  
      // Fetch all signed URLs in parallel
      const results = await Promise.all(
        files.map(async (file) => {
          try {
            const { data: signedUrl } = await apiClient.post(
              '/getObjectSignedUrl',
              {
                command: 'getObjectSignedUrl',
                bucket_name: 'bme-app-admin-data',
                key: file.fileKey,
              },
            );
  
            if (!signedUrl) return null;
  
            const type = file.fileKey.endsWith('.mp4') ? 'video' : 'image';
  
            let id = null;
            const match = file.redirect?.target_url?.match(
              /\/company\/([a-f0-9-]+)$/i,
            );
            if (match?.[1]) id = match[1];
  
            return {
              url: signedUrl,
              type,
              redirect: file.redirect || null,
              id,
              fileKey: file.fileKey, // keep for retry
            };
          } catch (err) {
            console.error('Error fetching signed URL:', err);
            return null;
          }
        }),
      );
  
      // Filter out failed ones
      setBanners(results.filter(Boolean));
    } catch (err) {
      console.error('Failed to fetch banners:', err);
    }
  }, [bannerId]);
  

  /** ✅ Fetch only when visible */
  useEffect(() => {
    if (isVisible && banners.length === 0) {
      fetchBanners();
    }
  }, [isVisible, banners.length, fetchBanners]);

  /** ✅ Auto-play logic */
  useEffect(() => {
    if (!banners.length || appState !== 'active') return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const currentItem = banners[activeIndex % banners.length];
    if (!currentItem) return;

    if (currentItem.type === 'image') {
      timerRef.current = setTimeout(() => {
        goToNext();
      }, IMAGE_DISPLAY_DURATION);
    } else if (currentItem.type === 'video') {
      // ✅ Safety cutoff (e.g., 15s max play)
      timerRef.current = setTimeout(() => {
        if (activeIndex % banners.length === banners.indexOf(currentItem)) {
          goToNext();
        }
      }, VIDEO_MAX_DURATION);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIndex, banners, appState]);

  /** ✅ Next banner */
  const goToNext = useCallback(() => {
    if (!banners.length) return;
    const nextIndex = activeIndex + 1;
    flatListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
    setActiveIndex(nextIndex);
  }, [activeIndex, banners.length]);

  /** ✅ Retry signed URL if expired */
  const handleMediaError = useCallback(
    async (bannerIndex) => {
      try {
        const fileKey = banners[bannerIndex]?.fileKey;
        if (!fileKey) return;

        const { data: signedUrl } = await apiClient.post(
          '/getObjectSignedUrl',
          {
            command: 'getObjectSignedUrl',
            bucket_name: 'bme-app-admin-data',
            key: fileKey,
          },
        );

        if (signedUrl) {
          setBanners((prev) => {
            const copy = [...prev];
            copy[bannerIndex] = { ...copy[bannerIndex], url: signedUrl };
            return copy;
          });
        }
      } catch (err) {
        console.error('Failed to refresh signed URL:', err);
      }
    },
    [banners],
  );

  /** ✅ Redirect logic */
  const handleRedirect = useCallback((url) => {
    if (!url) return;
    const safeUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(safeUrl).catch((err) =>
      console.warn('Failed to open URL:', err),
    );
  }, []);

  /** ✅ Memoized FlatList data */
  const flatListData = useMemo(
    () => Array.from({ length: banners.length * VIRTUAL_MULTIPLIER }, (_, i) => i),
    [banners.length],
  );

  /** ✅ Render item */
  const renderItem = useCallback(
    ({ index }) => {
      const realIndex = index % banners.length;
      const banner = banners[realIndex];
      const isActive = index === activeIndex;

      if (!banner) return <GlowPlaceholder />;

      return (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.slide}
          onPress={() => {
            if (banner.id) {
              navigation.navigate('CompanyDetails', { userId: banner.id });
            } else if (banner.redirect?.target_url) {
              handleRedirect(banner.redirect.target_url);
            }
          }}
        >
          {banner.type === 'video' ? (
            <Video
              source={{ uri: banner.url }}
              style={styles.media}
              resizeMode="cover"
              paused={!isActive || !isVisible || appState !== 'active'}
              repeat={false}
              muted
              onEnd={() => isActive && goToNext()}
              onError={() => handleMediaError(realIndex)} // ✅ retry URL
            />
          ) : (
            <FastImage
              source={{ uri: banner.url }}
              style={styles.media}
              resizeMode={FastImage.resizeMode.cover}
              onError={() => handleMediaError(realIndex)} // ✅ retry URL
            />
          )}
        </TouchableOpacity>
      );
    },
    [banners, activeIndex, isVisible, appState, navigation, handleRedirect, goToNext, handleMediaError],
  );

  /** ✅ Initial index */
  const initialIndex = banners.length * Math.floor(VIRTUAL_MULTIPLIER / 2);

  return (
    <View style={styles.carouselContainer}>
      {banners.length === 0 ? (
        <View style={{ flexDirection: 'row' }}>
          {[...Array(3)].map((_, i) => (
            <GlowPlaceholder key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={flatListData}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          pagingEnabled
          snapToInterval={ITEM_WIDTH + 2 * MARGIN}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: ITEM_WIDTH + 2 * MARGIN,
            offset: (ITEM_WIDTH + 2 * MARGIN) * index,
            index,
          })}
          onLayout={() => setActiveIndex(initialIndex)}
          onMomentumScrollEnd={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / (ITEM_WIDTH + 2 * MARGIN));
            setActiveIndex(index);
          }}
          windowSize={5}
          removeClippedSubviews
        />
      )}
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

export default React.memo(HomeBanner);
