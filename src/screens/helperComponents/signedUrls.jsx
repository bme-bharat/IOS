
import { Image, Text } from 'react-native';
import { useRef, useState, useCallback, useEffect } from 'react';
import apiClient from '../ApiClient';
import FastImage from 'react-native-fast-image';


export const getSignedUrl = async (id, key) => {
  if (!key) {
    return { [id]: '' };
  }
  try {
    const res = await apiClient.post('/getObjectSignedUrl', {
      command: 'getObjectSignedUrl',
      key,
    });

    return { [id]: res.data };
  } catch (error) {
    return { [id]: '' };
  }
};

export const useLazySignedUrls = (
  allItems = [],
  getSignedUrl,
  prefetchCount = 5,
  {
    idField = 'post_id',
    fileKeyField = 'fileKey',
  } = {}
) => {
  const signedUrlCache = useRef({});
  const [version, setVersion] = useState(0);
  const triggerRerender = () => setVersion(v => v + 1);

  const getUrlFor = useCallback(
    (id) => signedUrlCache.current[id] || '',
    []
  );

  const getNestedProperty = (obj, path) => {
    if (!path) return undefined;

    if (typeof path === 'string' && !path.includes('[')) {
      return obj[path];
    }

    const parts = typeof path === 'string'
      ? path.split(/[\[\].]/).filter(Boolean)
      : [path];

    return parts.reduce((acc, part) => acc && acc[part], obj);
  };

  const fetchSignedUrlIfNeeded = async (item) => {
    if (!item) return;

    const id = getNestedProperty(item, idField);
    const key = getNestedProperty(item, fileKeyField);

    if (!id || signedUrlCache.current[id] || !key) return;

    try {
      const res = await getSignedUrl(id, key);
      const url = res[id];
      if (url) {
        signedUrlCache.current[id] = url;
        FastImage.preload([{ uri: url }]);
      }
    } catch {
      // Do nothing if there's an error
    }

    triggerRerender();
  };

  // Viewability-based prefetch
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (!viewableItems?.length) return;

    const visibleIndices = viewableItems.map(({ index }) => index).filter(i => i != null);
    const maxVisibleIndex = Math.max(...visibleIndices);

    const prefetchStart = Math.max(0, maxVisibleIndex + 1);
    const prefetchEnd = Math.min(prefetchStart + prefetchCount, allItems.length - 1);

    const itemsToFetch = new Set();

    // Add currently visible
    viewableItems.forEach(({ item }) => item && itemsToFetch.add(item));

    // Add items ahead for prefetch
    for (let i = prefetchStart; i <= prefetchEnd; i++) {
      if (allItems[i]) itemsToFetch.add(allItems[i]);
    }

    itemsToFetch.forEach((item) => {
      const id = getNestedProperty(item, idField);
      if (id && !signedUrlCache.current[id]) {
        fetchSignedUrlIfNeeded(item);
      }
    });
  }).current;

  // Manual scroll-based preloading
  const preloadUrls = (startIndex, endIndex) => {
    for (let i = startIndex; i <= endIndex; i++) {
      const item = allItems[i];
      if (!item) continue;

      const id = getNestedProperty(item, idField);
      if (id && !signedUrlCache.current[id]) {
        fetchSignedUrlIfNeeded(item);
      }
    }
  };

  // Initial prefetch on mount or list change
  useEffect(() => {
    preloadUrls(0, prefetchCount - 1);
  }, [allItems]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 10,
    waitForInteraction: false,
  };

  return {
    getUrlFor,
    onViewableItemsChanged,
    viewabilityConfig,
    version,
    preloadUrls,
  };
};




export const getTimeDisplay = (timestampInSeconds) => {
  const secondsAgo = Math.floor(Date.now() / 1000 - timestampInSeconds);

  if (secondsAgo < 60) return `few sec ago`;
  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `${minutesAgo} mins ago`;
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo} hours ago`;

  return new Date(timestampInSeconds * 1000).toLocaleDateString('en-GB').replace(/\//g, '-');

};

export const getTimeDisplayHome = (timestampInSeconds) => {
  const secondsAgo = Math.floor(Date.now() / 1000 - timestampInSeconds);

  if (secondsAgo < 60) return `few sec ago`;

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `${minutesAgo} mins ago`;

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo} hours ago`;

  const daysAgo = Math.floor(hoursAgo / 24);
  return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
};

export const getTimeDisplayForum = (timestampInSeconds) => {

  const secondsAgo = Math.floor(Date.now() / 1000 - timestampInSeconds);

  if (secondsAgo < 60) return `few sec ago`;
  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) return `${minutesAgo} mins ago`;
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo} hours ago`;

  const date = new Date(timestampInSeconds * 1000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};


const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
};


export const highlightMatch = (
  text = '',
  query = '',
  highlightStyle = {
    backgroundColor: '#fff9c4',
    color: 'black',
    borderRadius: 4,
    paddingHorizontal: 2,
  }
) => {

  if (!query?.trim()) return <Text>{text}</Text>;

  const safeQuery = escapeRegExp(query);
  const regex = new RegExp(`(${safeQuery})`, 'ig');
  const parts = text.split(regex);

  return (
    <Text>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Text key={index} style={highlightStyle}>
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
        )
      )}
    </Text>
  );
};

