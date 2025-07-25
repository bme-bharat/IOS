import { useState, useCallback } from 'react';
import apiClient from '../ApiClient';
import { Dimensions } from 'react-native';
import { fetchForumReactionsRaw } from '../helperComponents.jsx/ForumReactions';
import { fetchCommentCount } from '../AppUtils/CommentCount';
import { getSignedUrl } from '../helperComponents.jsx/signedUrls';
import { generateAvatarFromName } from '../helperComponents.jsx/useInitialsAvatar';

const withTimeout = (promise, timeout = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout)),
  ]);
};

export const enrichForumPost = async (post, myId) => {
  const resourceId = post.resource_id;
  const fileKey = post?.fileKey;
  const authorFileKey = post?.author_fileKey;
  const thumbnailFileKey = post?.thumbnail_fileKey;

  console.log(`🔄 Enriching post ${resourceId}`);

  const [ fileKeySignedUrl, authorSignedUrl, thumbnailSignedUrl] = await Promise.all([

    fileKey ? getSignedUrl(resourceId, fileKey) : Promise.resolve({}),
    authorFileKey ? getSignedUrl(resourceId, authorFileKey) : Promise.resolve({}),
    thumbnailFileKey ? getSignedUrl(resourceId, thumbnailFileKey) : Promise.resolve({}),
  ]);

  const authorImageUri = authorFileKey
    ? authorSignedUrl[resourceId] || ''
    : generateAvatarFromName(post.author || 'U');

  const enriched = {
    ...post,
    
    fileKeySignedUrl: fileKeySignedUrl[resourceId] || '',
    thumbnailSignedUrl: thumbnailSignedUrl[resourceId] || '',
    authorSignedUrl: authorSignedUrl[resourceId] || '',
    authorImageUri,
  };

  console.log(`✅ Enriched post ${resourceId}:`, enriched);
  return enriched;
};

export default function useForumFetcher({ command, type, fetchLimit = 10, isConnected = true, preloadUrls, myId }) {
  const [localPosts, setLocalPosts] = useState([]);
  const [paginationState, setPaginationState] = useState({
    lastEvaluatedKey: null,
    hasMorePosts: true,
    isLoading: false,
    isRefreshing: false,
  });

  const fetchPosts = useCallback(async (lastKey = null, isRefreshing = false) => {
    if (!isConnected || paginationState.isLoading) {
      console.log('🚫 Not fetching: either disconnected or already loading');
      return;
    }

    console.log(`📥 Fetching posts: refreshing=${isRefreshing}, lastKey=`, lastKey);

    setPaginationState(prev => ({
      ...prev,
      isLoading: true,
      isRefreshing: isRefreshing || false,
    }));

    try {
      const requestData = {
        command,
        limit: fetchLimit,
        ...(lastKey && !isRefreshing && { lastEvaluatedKey: lastKey }),
      };

      console.log('📤 Sending API request with:', requestData);

      const response = await withTimeout(apiClient.post(`/${command}`, requestData), 10000);

      const newPosts = response?.data?.response || [];
      const lastEvaluatedKeyFromResponse = response?.data?.lastEvaluatedKey || null;

      console.log(`📬 Received ${newPosts.length} posts, nextKey=`, lastEvaluatedKeyFromResponse);

      if (!newPosts.length) {
        setPaginationState(prev => ({
          ...prev,
          hasMorePosts: false,
          isLoading: false,
          isRefreshing: false,
        }));
        console.log('📭 No more posts to fetch.');
        return;
      }

      const enrichedPosts = await Promise.all(
        newPosts.map(post => enrichForumPost(post, myId))
      );

      setLocalPosts(prev => {
        const merged = isRefreshing
          ? enrichedPosts
          : [...prev, ...enrichedPosts].filter(
              (post, index, self) =>
                index === self.findIndex(p => p.resource_id === post.resource_id)
            );

        console.log(`📝 Updated post list. Total: ${merged.length}`);
        return merged;
      });

      setPaginationState(prev => ({
        ...prev,
        lastEvaluatedKey: lastEvaluatedKeyFromResponse,
        hasMorePosts: !!lastEvaluatedKeyFromResponse,
        isLoading: false,
        isRefreshing: false,
      }));
    } catch (error) {
      console.error('[❌ useForumFetcher] Failed to fetch posts:', error.message || error);
      setPaginationState(prev => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
      }));
    }
  }, [command, type, fetchLimit, isConnected, paginationState.isLoading, preloadUrls, myId]);

  return {
    localPosts,
    setLocalPosts,
    fetchPosts,
    hasMorePosts: paginationState.hasMorePosts,
    loading: paginationState.isLoading,
    loadingMore: paginationState.isLoading && !paginationState.isRefreshing,
    lastEvaluatedKey: paginationState.lastEvaluatedKey,
  };
}
