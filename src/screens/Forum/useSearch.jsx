import apiClient from "../ApiClient";
import { fetchCommentCount } from "../AppUtils/CommentCount";
import { showToast } from "../AppUtils/CustomToast";
import { getSignedUrl } from "../helperComponents/signedUrls";
import { generateAvatarFromName } from "../helperComponents/useInitialsAvatar";
import { fetchForumReactionsRaw } from "./useForumReactions";

// forumSearchUtil.js
export const searchForumPostsWithEnrichment = async ({
    text,
    myId,
    isConnected,
    withTimeout
}) => {
    if (!isConnected) {
        showToast?.('No internet connection', 'error');
        return { posts: [], count: 0 };
    }

    const trimmedText = text.trim();
    if (trimmedText === '') {
        return { posts: [], count: 0 };
    }

    try {
        const requestData = {
            command: 'searchForumPosts',
            searchQuery: trimmedText,
        };

        const res = await withTimeout(
            apiClient.post('/searchLatestForumPosts', requestData),
            10000
        );

        const forumPosts = res.data.response || [];
        const count = res.data.count || forumPosts.length;

        const postsWithMedia = await Promise.all(
            forumPosts.map(async post => {
                const forumId = post.forum_id;
                const fileKey = post?.fileKey;
                const authorFileKey = post?.author_fileKey;
                const thumbnailFileKey = post?.thumbnail_fileKey;

                const [
                    reactionData,
                    commentCount,
                    fileKeySignedUrl,
                    authorSignedUrl,
                    thumbnailSignedUrl
                ] = await Promise.all([
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

        return { posts: postsWithMedia, count };
    } catch (error) {
        console.error('[searchForumPostsWithEnrichment] Failed to search posts:', error);
        return { posts: [], count: 0 };
    }
};
