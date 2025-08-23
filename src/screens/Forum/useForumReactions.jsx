import { EventRegister } from 'react-native-event-listeners';
import apiClient from '../ApiClient';
import { useState, useCallback } from 'react';
import { getSignedUrl } from '../helperComponents/signedUrls';
import { generateAvatarFromName } from '../helperComponents/useInitialsAvatar';


export const useForumReactionUsers = (forumId) => {
  const [getting, setGetting] = useState(false);
  const [gettingMore, setGettingMore] = useState(false);
  const [availableReactions, setAvailableReactions] = useState([]);
  const [usersByReaction, setUsersByReaction] = useState([]);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const enrichWithProfileUrls = async (users) => {
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        if (!user.fileKey) {
          return {
            ...user,
            userAvatar: generateAvatarFromName(user.author),
          };
        }

        try {
          const signedUrl = await getSignedUrl(user.user_id, user.fileKey);
          const profileUrl = signedUrl?.[user.user_id] || null;

          if (profileUrl) {
            return {
              ...user,
              profileUrl,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch signed URL for user ${user.user_id}:`, error);
        }

        return {
          ...user,
          userAvatar: generateAvatarFromName(user.author),
        };
      })
    );

    return enrichedUsers;
  };

  const fetchUsers = useCallback(
    async (reactionType = null, highlightId = null, loadMore = false) => {
      if (!forumId || (loadMore && !lastEvaluatedKey)) return;

      if (loadMore) {
        setGettingMore(true);
      } else {
        setGetting(true);
        setHasMore(true); // Reset when fetching fresh data
      }

      try {
        const payload = {
          command: 'listAllForumReactions',
          forum_id: forumId,
          limit: 10,
          reaction_type: reactionType || 'All',

        };

        if (!loadMore && reactionType === 'All' && highlightId) {
          payload.reaction_id = highlightId;
        }

        if (loadMore) {
          payload.lastEvaluatedKey = lastEvaluatedKey;
        }

        const response = await apiClient.post('/listAllForumReactions', payload);
        let rawUsers = response.data.user_reactions || [];

        // If there's a reaction_id_response, remove it from rawUsers and place it at the top
        let topUser = null;
        if (!loadMore && response.data.reaction_id_response) {
          const highlightUser = response.data.reaction_id_response;
          rawUsers = rawUsers.filter(u => u.reaction_id !== highlightUser.reaction_id);
          topUser = highlightUser;
        }

        const enrichedUsers = await enrichWithProfileUrls(rawUsers);
        const enrichedTopUser = topUser ? await enrichWithProfileUrls([topUser]) : [];

        const finalUsers = topUser
          ? [...enrichedTopUser, ...enrichedUsers]
          : enrichedUsers;

        if (loadMore) {
          setUsersByReaction(prev => [...prev, ...finalUsers]);
        } else {
          setUsersByReaction(finalUsers);
        }

        setAvailableReactions(response.data.reactions || []);
        setLastEvaluatedKey(response.data.lastEvaluatedKey || null);
        setHasMore(rawUsers.length > 0 && !!response.data.lastEvaluatedKey);
      } catch (err) {
        console.error('[ReactionUsers] Fetch error:', err);
      } finally {
        if (loadMore) {
          setGettingMore(false);
        } else {
          setGetting(false);
        }
      }
    },
    [forumId, lastEvaluatedKey]
  );


  const resetUsers = () => {
    setUsersByReaction([]);
    setAvailableReactions([]);
    setLastEvaluatedKey(null);
    setHasMore(true);
  };

  return {
    usersByReaction,
    fetchUsers,
    getting,
    gettingMore,
    availableReactions,
    resetUsers,
    hasMore,
    lastEvaluatedKey,
  };
};

export default function useForumReactions(myId) {
  const handleReactionUpdate = async (forumId, reactionType, item = {}) => {
    const payload = {
      command: 'addOrUpdateForumReaction',
      forum_id: forumId,
      user_id: myId,
      reaction_type: reactionType,
    };

    try {
      const res = await apiClient.post('/addOrUpdateForumReaction', payload);

    } catch (err) {
      return {

      }
    }
  };

  return {
    handleReactionUpdate,

  };
}

export const fetchForumReactionsRaw = async (forumId, userId) => {
  try {
    const response = await apiClient.post('/getForumReactionsCount', {
      command: 'getForumReactionsCount',
      forum_id: forumId,
      user_id: userId,
    });

    if (!response?.data) {
      throw new Error('Invalid API response structure');
    }

    const { data } = response;

    let reactionsCount = {};
    if (data.reactions && typeof data.reactions === 'object' && !Array.isArray(data.reactions)) {
      reactionsCount = data.reactions;
    }

    const userReaction = data?.user_reaction?.reaction_type || null;

    const totalReactions = typeof data?.total_reactions === 'number'
      ? data.total_reactions
      : Object.values(reactionsCount).reduce((sum, count) => sum + count, 0);

    return {
      reactionsCount,
      userReaction,
      totalReactions: totalReactions,
    };

  } catch (error) {

    return {
      reactionsCount: {},
      userReaction: null,
      totalReactions: 0,
    };
  }
};

export const reactionConfig = [
  { type: 'Like', emoji: '👍', color: 'text-blue-600', label: 'Like', outlineIcon: 'thumb-up-outline' },
  { type: 'Insightful', emoji: '💡', color: 'text-yellow-500', label: 'Insightful', outlineIcon: 'lightbulb-on-outline' },
  { type: 'Support', emoji: '🤝', color: 'text-green-500', label: 'Support', outlineIcon: 'handshake-outline' },
  { type: 'Funny', emoji: '😂', color: 'text-yellow-400', label: 'Funny', outlineIcon: 'emoticon-excited-outline' },
  { type: 'Thanks', emoji: '🙏', color: 'text-rose-500', label: 'Thanks', outlineIcon: 'hand-heart-outline' },
];