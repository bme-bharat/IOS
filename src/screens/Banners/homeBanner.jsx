import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Linking,
  AppState,
} from "react-native";
import Video from "react-native-video";
import FastImage from "react-native-fast-image";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import apiClient from "../ApiClient";
import GlowPlaceholder from "../ShimmerPlaceholder";

const { width } = Dimensions.get("window");

// ---------- CONFIG ----------
const BANNER_HEIGHT = 216;
const MARGIN = 4;
const ITEM_WIDTH = width - 2 * MARGIN;

const VIDEO_MAX_DURATION = 15000;
const IMAGE_DISPLAY_DURATION = 3000;

const VIRTUAL_MULTIPLIER = 500;
const EDGE_THRESHOLD_MULTIPLIER = 2;

const MAX_SIGNEDURL_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 500;

// ---------- COMPONENT ----------
const HomeBanner = ({ bannerId }) => {
  const navigation = useNavigation();
  const flatListRef = useRef(null);

  const activeIndexRef = useRef(0);
  const timerRef = useRef(null);
  const appStateRef = useRef("active");
  const isManualScrollRef = useRef(false);
  const retryCountRef = useRef({});

  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [appState, setAppState] = useState("active");
  const isFocused = useIsFocused();

  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);
  useEffect(() => { appStateRef.current = appState; }, [appState]);

  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      setAppState(next);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (appState !== "active" && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [appState]);

  // ---------- Fetch banners and signed urls ----------
  const fetchBanners = useCallback(async () => {
    try {
      const { data } = await apiClient.post("/getBannerImages", {
        command: "getBannerImages",
        banners_id: bannerId,
      });

      if (data?.status !== "success") return;
      const bannerData = data.response || [];

      const files = bannerData.flatMap((banner) =>
        (banner.files || []).map((file) => ({
          ...file,
          redirect: banner.redirect || file.redirect,
        }))
      );

      const results = await Promise.all(
        files.map(async (file) => {
          try {
            const { data: signedUrl } = await apiClient.post("/getObjectSignedUrl", {
              command: "getObjectSignedUrl",
              bucket_name: "bme-app-admin-data",
              key: file.fileKey,
            });

            if (!signedUrl) return null;
            const type = file.fileKey?.toLowerCase().endsWith(".mp4") ? "video" : "image";

            let id = null;
            const match = (file.redirect?.target_url || "").match(/\/company\/([a-f0-9-]+)$/i);
            if (match?.[1]) id = match[1];

            return { url: signedUrl, type, redirect: file.redirect || null, id, fileKey: file.fileKey };
          } catch (e) {
            console.warn("getObjectSignedUrl failed for", file.fileKey, e?.message || e);
            return null;
          }
        })
      );

      const filtered = results.filter(Boolean);
      setBanners(filtered);
    } catch (err) {
      console.error("Failed to fetch banners:", err);
    }
  }, [bannerId]);

  useEffect(() => {
    if (!banners.length) fetchBanners();
  }, [banners.length, fetchBanners]);

  useEffect(() => {
    if (!banners.length) return;
    const realIndex = activeIndex % banners.length;
  
    // preload next & previous images
    [realIndex - 1, realIndex + 1].forEach((idx) => {
      const banner = banners[(idx + banners.length) % banners.length];
      if (banner?.type === "image") {
        FastImage.preload([{ uri: banner.url }]);
      }
    });
  }, [activeIndex, banners]);

  
  // ---------- Virtual data helpers ----------
  const totalVirtualCount = useMemo(() => {
    return banners.length ? banners.length * VIRTUAL_MULTIPLIER : 0;
  }, [banners.length]);

  const initialIndex = useMemo(() => {
    return banners.length ? banners.length * Math.floor(VIRTUAL_MULTIPLIER / 2) : 0;
  }, [banners.length]);

  // ---------- Safe scroll helpers ----------
  const getSafeIndex = useCallback(
    (index) => {
      if (!totalVirtualCount) return 0;
      return Math.max(0, Math.min(index, totalVirtualCount - 1));
    },
    [totalVirtualCount]
  );

  const scrollToIndexAnimated = useCallback(
    (index) => {
      const safeIdx = getSafeIndex(index);
      try {
        flatListRef.current?.scrollToIndex({ index: safeIdx, animated: true });
      } catch (e) {
        try {
          flatListRef.current?.scrollToOffset({
            offset: safeIdx * (ITEM_WIDTH + 2 * MARGIN),
            animated: true,
          });
        } catch (e2) {
          console.warn("scroll fallback failed:", e2?.message || e2);
        }
      }
    },
    [getSafeIndex]
  );

  const scrollToIndexNoAnim = useCallback(
    (index) => {
      const safeIdx = getSafeIndex(index);
      try {
        flatListRef.current?.scrollToIndex({ index: safeIdx, animated: false });
      } catch (e) {
        try {
          flatListRef.current?.scrollToOffset({
            offset: safeIdx * (ITEM_WIDTH + 2 * MARGIN),
            animated: false,
          });
        } catch (e2) {
          console.warn("no-anim scroll fallback failed:", e2?.message || e2);
        }
      }
    },
    [getSafeIndex]
  );

  // ---------- Auto-play timer ----------
  const scheduleAutoPlay = useCallback(() => {
    if (banners.length <= 1) return;
    if (!banners.length) return;
    if (appStateRef.current !== "active") return;
    if (isManualScrollRef.current) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const virtualIdx = activeIndexRef.current;
    const real = banners[virtualIdx % banners.length];
    if (!real) return;

    const duration = real.type === "image" ? IMAGE_DISPLAY_DURATION : VIDEO_MAX_DURATION;
    timerRef.current = setTimeout(() => {
      const nextVirtual = getSafeIndex((virtualIdx + 1) % totalVirtualCount);
      scrollToIndexAnimated(nextVirtual);
      setActiveIndex(nextVirtual);
    }, duration);
  }, [banners, totalVirtualCount, scrollToIndexAnimated]);

  useEffect(() => {
    scheduleAutoPlay();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeIndex, banners.length, appState, scheduleAutoPlay]);

  useEffect(() => {
    if (!isFocused && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    } else if (isFocused) {
      scheduleAutoPlay(); // restart autoplay only when visible
    }
  }, [isFocused, scheduleAutoPlay]);
  
  // ---------- Signed URL retry ----------
  const refreshSignedUrl = useCallback(
    async (realIndex) => {
      const fileKey = banners[realIndex]?.fileKey;
      if (!fileKey) return;

      const attempts = retryCountRef.current[fileKey] || 0;
      if (attempts >= MAX_SIGNEDURL_RETRIES) return;

      retryCountRef.current[fileKey] = attempts + 1;
      const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempts);
      await new Promise((res) => setTimeout(res, delay));

      try {
        const { data: signedUrl } = await apiClient.post("/getObjectSignedUrl", {
          command: "getObjectSignedUrl",
          bucket_name: "bme-app-admin-data",
          key: fileKey,
        });
        if (signedUrl) {
          setBanners((prev) => {
            const copy = [...prev];
            copy[realIndex] = { ...copy[realIndex], url: signedUrl };
            return copy;
          });
          retryCountRef.current[fileKey] = 0;
        }
      } catch (err) {
        console.error("Signed URL retry failed:", err);
      }
    },
    [banners]
  );

  const handleMediaError = useCallback(
    (virtualIndex) => {
      if (!banners.length) return;
      const realIndex = virtualIndex % banners.length;
      refreshSignedUrl(realIndex);
    },
    [banners.length, refreshSignedUrl]
  );

  // ---------- Reset to middle ----------
  const maybeResetToMiddle = useCallback(
    (virtualIndex) => {
      if (!banners.length) return;
      const total = totalVirtualCount;
      if (!total) return;

      const leftEdge = banners.length * EDGE_THRESHOLD_MULTIPLIER;
      const rightEdge = total - leftEdge;

      if (virtualIndex <= leftEdge || virtualIndex >= rightEdge) {
        const real = virtualIndex % banners.length;
        const middleBlock = Math.floor(VIRTUAL_MULTIPLIER / 2);
        const middleVirtual = banners.length * middleBlock + real;
        scrollToIndexNoAnim(middleVirtual);
        setActiveIndex(middleVirtual);
      }
    },
    [banners.length, totalVirtualCount, scrollToIndexNoAnim]
  );

  // ---------- Viewability ----------
  const viewabilityConfig = useMemo(
    () => ({ viewAreaCoveragePercentThreshold: 50, minimumViewTime: 50 }),
    []
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (!viewableItems || viewableItems.length === 0) return;
    const first = viewableItems[0];
    const newVirtualIndex = first.index ?? 0;
    setActiveIndex(newVirtualIndex);
    maybeResetToMiddle(newVirtualIndex);
  }).current;

  // ---------- Redirect ----------
  const handleRedirect = useCallback((url) => {
    if (!url) return;
    const safeUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(safeUrl).catch(() => {});
  }, []);

  // ---------- Render item ----------
  const renderItem = useCallback(
    ({ index }) => {
      if (!banners.length) return <GlowPlaceholder />;
      const realIndex = index % banners.length;
      const banner = banners[realIndex];
      const isActive = index === activeIndex;

      if (!banner) return <GlowPlaceholder />;

      return (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.slide}
          onPress={() => {
            if (banner.id) navigation.navigate("CompanyDetails", { userId: banner.id });
            else if (banner.redirect?.target_url) handleRedirect(banner.redirect.target_url);
          }}
        >
          {banner.type === "video" ? (
            isActive ? (
              <Video
                source={{ uri: banner.url }}
                style={styles.media}
                resizeMode="cover"
                paused={!isActive || appState !== "active"}
                repeat={false}
                muted
                onEnd={() => {
                  if (index === activeIndexRef.current) {
                    const nextVirtual = getSafeIndex(index + 1);
                    scrollToIndexAnimated(nextVirtual);
                    setActiveIndex(nextVirtual);
                  }
                }}
                onError={() => handleMediaError(index)}
              />
            ) : (
              <FastImage
                source={{ uri: banner.url + "?thumbnail" }}
                style={styles.media}
                resizeMode={FastImage.resizeMode.cover}
              />
            )
          ) : (
            <FastImage
              source={{ uri: banner.url }}
              style={styles.media}
              resizeMode={FastImage.resizeMode.cover}
              onError={() => handleMediaError(index)}
            />
          )}
        </TouchableOpacity>
      );
    },
    [banners, activeIndex, navigation, handleRedirect, appState, handleMediaError, getSafeIndex, scrollToIndexAnimated]
  );

  // ---------- Initialize ----------
  useEffect(() => {
    if (!banners.length) return;
    const start = initialIndex;
    setTimeout(() => {
      scrollToIndexNoAnim(start);
      setActiveIndex(start);
    }, 50);
  }, [banners.length, initialIndex, scrollToIndexNoAnim]);

  // ---------- UI ----------
  return (
    <View style={styles.carouselContainer}>
      {banners.length === 0 ? (
        <View style={{ flexDirection: "row" }}>
          {[...Array(3)].map((_, i) => (
            <GlowPlaceholder key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={Array.from({ length: totalVirtualCount })}
          renderItem={renderItem}
          keyExtractor={(_, idx) => idx.toString()}
          horizontal
          pagingEnabled
          snapToInterval={ITEM_WIDTH + 2 * MARGIN}
          decelerationRate="fast"
          disableIntervalMomentum={true}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: ITEM_WIDTH + 2 * MARGIN,
            offset: (ITEM_WIDTH + 2 * MARGIN) * index,
            index,
          })}
          onScrollBeginDrag={() => {
            isManualScrollRef.current = true;
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }}
          onMomentumScrollEnd={() => {
            setTimeout(() => {
              isManualScrollRef.current = false;
              scheduleAutoPlay();
            }, 50);
          }}
          windowSize={7}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    height: BANNER_HEIGHT,
    alignSelf: "center",
    borderRadius: 14,
    overflow: "hidden",
  },
  slide: {
    width: ITEM_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 14,
    overflow: "hidden",
    marginHorizontal: MARGIN,
  },
  media: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
});

export default React.memo(HomeBanner);
