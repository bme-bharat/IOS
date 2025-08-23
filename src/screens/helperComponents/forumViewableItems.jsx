import { Image, Text } from 'react-native';
import { useRef, useState, useCallback, useEffect } from 'react';
import apiClient from '../ApiClient';

export const useForumMedia = (posts, isFocused, setActiveVideo) => {

  const viewedForumIdsRef = useRef(new Set());
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm'];

  const incrementViewCount = async (forumId) => {
    try {
      await apiClient.post('/forumViewCounts', {
        command: 'forumViewCounts',
        forum_id: forumId,
      });
    } catch { }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (!viewableItems?.length) {
      setActiveVideo?.(null);
      return;
    }

    if (isFocused ) {
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

  }).current;


  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100, // ms
  };
  

  return {
    onViewableItemsChanged,
    viewabilityConfig,
  };
};




