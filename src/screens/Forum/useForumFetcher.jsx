import { useState, useCallback } from 'react';
import apiClient from '../ApiClient';
import { Dimensions } from 'react-native';

import { fetchCommentCount } from '../AppUtils/CommentCount';
import { getSignedUrl } from '../helperComponents/signedUrls';
import { generateAvatarFromName } from '../helperComponents/useInitialsAvatar';
import { fetchForumReactionsRaw } from './useForumReactions';

const withTimeout = (promise, timeout = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout)),
  ]);
};
export const enrichForum = async (post, myId) => {
  const forumId = post.forum_id;
  const fileKey = post?.fileKey;
  const authorFileKey = post?.author_fileKey;
  const thumbnailFileKey = post?.thumbnail_fileKey;

  const [reactionData, commentCount, fileKeySignedUrl, authorSignedUrl, thumbnailSignedUrl] = await Promise.all([
    fetchForumReactionsRaw(forumId, myId),
    fetchCommentCount(forumId),
    fileKey ? getSignedUrl(forumId, fileKey) : Promise.resolve({}),
    authorFileKey ? getSignedUrl(forumId, authorFileKey) : Promise.resolve({}),
    thumbnailFileKey ? getSignedUrl(forumId, thumbnailFileKey) : Promise.resolve({}),
  ]);

  const authorImageUri = authorFileKey
    ? authorSignedUrl[forumId] || ''
    : generateAvatarFromName(post.author || 'U');

  return {
    ...post,
    commentCount: commentCount || 0,
    reactionsCount: reactionData.reactionsCount || {},
    totalReactions: reactionData.totalReactions || 0,
    userReaction: reactionData.userReaction || null,
    fileKeySignedUrl: fileKeySignedUrl[forumId] || '',
    thumbnailSignedUrl: thumbnailSignedUrl[forumId] || '',
    authorSignedUrl: authorSignedUrl[forumId] || '',
    authorImageUri,
  };
};


export const enrichForumPost = async (posts, myId) => {
  return Promise.all(
    posts.map(async post => {
      const forumId = post.forum_id;
      const fileKey = post?.fileKey;
      const authorFileKey = post?.author_fileKey;
      const thumbnailFileKey = post?.thumbnail_fileKey;

      const [reactionData, commentCount, fileKeySignedUrl, authorSignedUrl, thumbnailSignedUrl] = await Promise.all([
        fetchForumReactionsRaw(forumId, myId),
        fetchCommentCount(forumId),
        fileKey ? getSignedUrl(forumId, fileKey) : Promise.resolve({}),
        authorFileKey ? getSignedUrl(forumId, authorFileKey) : Promise.resolve({}),
        thumbnailFileKey ? getSignedUrl(forumId, thumbnailFileKey) : Promise.resolve({}),
      ]);

      const authorImageUri = authorFileKey
        ? authorSignedUrl[forumId] || ''
        : generateAvatarFromName(post.author || 'U');

      return {
        ...post,
        commentCount: commentCount || 0,
        reactionsCount: reactionData.reactionsCount || {},
        totalReactions: reactionData.totalReactions || 0,
        userReaction: reactionData.userReaction || null,
        fileKeySignedUrl: fileKeySignedUrl[forumId] || '',
        thumbnailSignedUrl: thumbnailSignedUrl[forumId] || '',
        authorSignedUrl: authorSignedUrl[forumId] || '',
        authorImageUri,
      };
    })
  );
};


export default function useForumFetcher({ command, type, fetchLimit = 10, isConnected = true, preloadUrls, myId }) {
  const [localPosts, setLocalPosts] = useState([]);
  const [forumIds, setForumIds] = useState([]);
  const [paginationState, setPaginationState] = useState({
    lastEvaluatedKey: null,
    hasMorePosts: true,
    isLoading: false,
    isRefreshing: false,
  });

  const fetchPosts = useCallback(async (lastKey = null, isRefreshing = false) => {
    if (!isConnected || paginationState.isLoading) return;

    setPaginationState(prev => ({
      ...prev,
      isLoading: true,
      isRefreshing: isRefreshing || false,
    }));

    try {
      const requestData = {
        command,
        type,
        limit: fetchLimit,
        ...(lastKey && !isRefreshing && { lastEvaluatedKey: lastKey }),
      };

      const response = await withTimeout(apiClient.post(`/${command}`, requestData), 10000);
      const newPosts = response?.data?.response || [];

      if (!newPosts.length) {
        setPaginationState(prev => ({
          ...prev,
          hasMorePosts: false,
          isLoading: false,
          isRefreshing: false,
        }));
        return;
      }

      const forumIds = newPosts.map(post => post.forum_id);
      setForumIds(forumIds); 

      const enrichedPosts = await Promise.all(
        newPosts.map(async post => {
          const forumId = post.forum_id;
          const fileKey = post?.fileKey;
          const authorFileKey = post?.author_fileKey;
          const thumbnailFileKey = post?.thumbnail_fileKey;
      
          const [ fileKeySignedUrl, authorSignedUrl, thumbnailSignedUrl] = await Promise.all([
    
            fileKey ? getSignedUrl(forumId, fileKey) : Promise.resolve({}),
            authorFileKey ? getSignedUrl(forumId, authorFileKey) : Promise.resolve({}),
            thumbnailFileKey ? getSignedUrl(forumId, thumbnailFileKey) : Promise.resolve({}),
          ]);
      
          const authorImageUri = authorFileKey
            ? authorSignedUrl[forumId] || ''
            : generateAvatarFromName(post.author || 'U');
      
          return {
            ...post,
            fileKeySignedUrl: fileKeySignedUrl[forumId] || '',
            thumbnailSignedUrl: thumbnailSignedUrl[forumId] || '',
            authorSignedUrl: authorSignedUrl[forumId] || '',
            authorImageUri,
          };
        })
      );

      setLocalPosts(prev => {
        // When refreshing, replace all posts
        if (isRefreshing) {
          return enrichedPosts;
        }
        
        // Otherwise merge new posts, removing duplicates
        const combined = [...prev, ...enrichedPosts];
        return combined.filter(
          (post, index, self) => index === self.findIndex(p => p.forum_id === post.forum_id)
        );
      });

      setPaginationState(prev => ({
        ...prev,
        lastEvaluatedKey: response.data.lastEvaluatedKey || null,
        hasMorePosts: !!response.data.lastEvaluatedKey,
        isLoading: false,
        isRefreshing: false,
      }));


    } catch (error) {
      console.error('[useForumFetcher] Failed to fetch posts:', error);
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
    forumIds,
    hasMorePosts: paginationState.hasMorePosts,
    loading: paginationState.isLoading,
    loadingMore: paginationState.isLoading && !paginationState.isRefreshing,
    lastEvaluatedKey: paginationState.lastEvaluatedKey,
  };
}
