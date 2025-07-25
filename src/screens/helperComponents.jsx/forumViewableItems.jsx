import { Image, Text } from 'react-native';
import { useRef, useState, useCallback, useEffect } from 'react';
import apiClient from '../ApiClient';
import maleImage from '../../images/homepage/dummy.png';
import femaleImage from '../../images/homepage/female.jpg';
import companyImage from '../../images/homepage/buliding.jpg';
import FastImage from 'react-native-fast-image';
import { getSignedUrl, useLazySignedUrls } from './signedUrls';
import { generateAvatarFromName } from './useInitialsAvatar';

const defaultImageUriCompany = Image.resolveAssetSource(companyImage).uri;
const defaultImageUriFemale = Image.resolveAssetSource(femaleImage).uri;
const defaultImageUriMale = Image.resolveAssetSource(maleImage).uri;

const cacheLimit = 50;
const cacheTTL = 10 * 60 * 1000; // 5 minutes


export const fetchMediaForPost = async (input) => {
  const posts = Array.isArray(input) ? input : [input];
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm'];

  const getAuthorImage = async (post) => {
    if (post.author_fileKey) {
      const res = await getSignedUrl('author', post.author_fileKey);
      return res?.author || res?.url || null;
    }
    return null;
  };

  const results = await Promise.all(
    posts.map(async (post) => {
      const mediaData = { forum_id: post.forum_id };
      const fileKey = post.fileKey?.toLowerCase();

      if (fileKey) {
        const res = await getSignedUrl('file', post.fileKey);
        const url = res?.file || res?.url || null;

        if (url) {
          const isVideo = videoExtensions.some(ext => fileKey.endsWith(ext));

          if (isVideo) {
            mediaData.videoUrl = url;

            if (post.thumbnail_fileKey) {
              const thumbRes = await getSignedUrl('thumb', post.thumbnail_fileKey);
              mediaData.thumbnailUrl = thumbRes?.thumb || null;
            } else {
              mediaData.thumbnailUrl = null;
            }
          } else {
            mediaData.imageUrl = url;
          }
        }
      }

      mediaData.authorImageUrl = await getAuthorImage(post);

      const enrichedPost = { ...post, ...mediaData };

      return enrichedPost;
    })
  );

  return Array.isArray(input) ? results : results[0];
};


export const useForumMedia = (posts, isFocused,isTabActive, setActiveVideo) => {
  const signedUrlCache = useRef(new Map());
  const viewedForumIdsRef = useRef(new Set());
  const [version, setVersion] = useState(0);
  const triggerRerender = () => setVersion(v => v + 1);

  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm'];

  const insertIntoCache = (id, url) => {
    const now = Date.now();
    const cache = signedUrlCache.current;

    if (cache.has(id)) cache.delete(id); // Move to end
    cache.set(id, { url, timestamp: now });

    if (cache.size > cacheLimit) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    triggerRerender();
  };

  const getUrlFor = useCallback((id) => {
    const cache = signedUrlCache.current;
    const entry = cache.get(id);
    if (!entry) return '';

    const now = Date.now();
    if (now - entry.timestamp > cacheTTL) {
      cache.delete(id);
      return '';
    }

    // Refresh LRU
    cache.delete(id);
    cache.set(id, entry);

    return entry.url;
  }, []);

  const getNestedProperty = (obj, path) => {
    if (!path) return undefined;
    if (typeof path === 'string' && !path.includes('[')) return obj[path];
    const parts = typeof path === 'string'
      ? path.split(/[\[\].]/).filter(Boolean)
      : [path];
    return parts.reduce((acc, part) => acc && acc[part], obj);
  };

  const incrementViewCount = async (forumId) => {
    try {
      await apiClient.post('/forumViewCounts', {
        command: 'forumViewCounts',
        forum_id: forumId,
      });
    } catch {}
  };

  const fetchSignedUrlIfNeeded = async (item, idField, fileKeyField, thumbKeyField) => {
    if (!item) return;

    const id = getNestedProperty(item, idField);
    const key = getNestedProperty(item, fileKeyField);
    const thumbKey = getNestedProperty(item, thumbKeyField);

    if (!id) return;

    const fileCacheHit = getUrlFor(id);
    const thumbCacheHit = getUrlFor(`${id}-thumb`);

    const authorKey = getNestedProperty(item, 'author_fileKey');
    if (authorKey && !getUrlFor(authorKey)) {
      const res = await getSignedUrl('author', authorKey);
      const url = res?.author || res?.url;
      if (url) {
        insertIntoCache(authorKey, url);
        FastImage.preload([{ uri: url }]);
      }
    }

    if (fileCacheHit && (!thumbKey || thumbCacheHit)) return;

    if (key && !fileCacheHit) {
      const res = await getSignedUrl(id, key);
      const url = res?.[id];
      if (url) {
        insertIntoCache(id, url);
        FastImage.preload([{ uri: url }]);
      }
    }

    if (thumbKey && !thumbCacheHit) {
      const thumbRes = await getSignedUrl('thumb', thumbKey);
      const thumbUrl = thumbRes?.thumb;
      if (thumbUrl) {
        insertIntoCache(`${id}-thumb`, thumbUrl);
        FastImage.preload([{ uri: thumbUrl }]);
      }
    }
  };

  const preloadUrls = (startIndex, endIndex) => {
    for (let i = startIndex; i <= endIndex; i++) {
      const item = posts[i];
      if (!item) continue;
      const id = item.forum_id;
      if (id && !getUrlFor(id)) {
        fetchSignedUrlIfNeeded(item, 'forum_id', 'fileKey', 'thumbnail_fileKey');
      }
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (!viewableItems?.length) {
      setActiveVideo?.(null);
      return;
    }

    if (isFocused && isTabActive) {
      const visibleItem = viewableItems.find(item => item.isViewable);
      if (visibleItem) {
        const { forum_id, fileKey } = visibleItem.item || {};
        const isVideo = fileKey && videoExtensions.some(ext => fileKey.toLowerCase().endsWith(ext));

        if (forum_id && isVideo) {
          setActiveVideo?.(forum_id);
        } else {
          setActiveVideo?.(null);
        }

        if (forum_id && !viewedForumIdsRef.current.has(forum_id)) {
          viewedForumIdsRef.current.add(forum_id);
          incrementViewCount(forum_id);
        }
      } else {
        setActiveVideo?.(null);
      }
    }

    const visibleIndices = viewableItems.map(({ index }) => index).filter(i => i != null);
    const maxVisibleIndex = Math.max(...visibleIndices);
    const prefetchStart = Math.max(0, maxVisibleIndex + 1);
    const prefetchEnd = Math.min(prefetchStart + 5, posts.length - 1);

    const itemsToFetch = new Set();
    viewableItems.forEach(({ item }) => item && itemsToFetch.add(item));
    for (let i = prefetchStart; i <= prefetchEnd; i++) {
      if (posts[i]) itemsToFetch.add(posts[i]);
    }

    itemsToFetch.forEach((item) => {
      const id = item.forum_id;
      if (id && !getUrlFor(id)) {
        fetchSignedUrlIfNeeded(item, 'forum_id', 'fileKey', 'thumbnail_fileKey');
      }
    });

  }).current;

  const getMediaForItem = useCallback((item) => {
    const fileKey = item.fileKey;
    if (!fileKey) return {};

    const url = getUrlFor(item.forum_id);
    const thumb = item.thumbnail_fileKey
      ? getUrlFor(`${item.forum_id}-thumb`)
      : null;

    if (!url) return {};

    const isVideo = videoExtensions.some(ext => fileKey.toLowerCase().endsWith(ext));
    return {
      [isVideo ? 'videoUrl' : 'imageUrl']: url,
      thumbnailUrl: isVideo ? thumb : null,
    };
  }, [getUrlFor]);

  const getAuthorImage = useCallback((item) => {
    if (item.author_fileKey) {
      const url = getUrlFor(item.author_fileKey);
      if (url) return { uri: url };
    }

    return generateAvatarFromName(item.author || '');
  }, [getUrlFor]);
  

  useEffect(() => {
    preloadUrls(0, 4);
  }, [posts]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
    waitForInteraction: false,
  };

  return {
    getMediaForItem,
    getAuthorImage,
    preloadUrls,
    onViewableItemsChanged,
    viewabilityConfig,
    version,
  };
};




