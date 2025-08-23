
import React, { useState, useEffect, useCallback, useRef, Profiler, useMemo } from "react";
import { View, Text, TouchableOpacity, TextInput, Dimensions, StyleSheet, Keyboard, ActivityIndicator, RefreshControl, InputAccessoryView } from "react-native";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useIsFocused } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import apiClient from "../ApiClient";
import { useNetwork } from "../AppUtils/IdProvider";
import { showToast } from "../AppUtils/CustomToast";
import CommentsSection from "../AppUtils/Comments";
import { useBottomSheet } from "../AppUtils/SheetProvider";
import CommentInputBar from "../AppUtils/InputBar";
import { useConnection } from "../AppUtils/ConnectionProvider";
import { getSignedUrl } from "../helperComponents/signedUrls";
import { openMediaViewer } from "../helperComponents/mediaViewer";
import ReactionSheet from "../helperComponents/ReactionUserSheet";
import { useForumMedia } from "../helperComponents/forumViewableItems";
import { fetchCommentCount } from "../AppUtils/CommentCount";
import useRenderForumItem from './useRenderForumItem';
import { fetchForumReactionsRaw } from './useForumReactions';
import useForumFetcher, { enrichForumPost } from './useForumFetcher';
import { generateAvatarFromName } from '../helperComponents/useInitialsAvatar';
import scrollAnimations from '../helperComponents/scrollAnimations';
import AppStyles from '../AppUtils/AppStyles';
import Animated from "react-native-reanimated";
import { FeedStyles as styles } from "../Styles/FeedStyles";
import ShimmerSkeleton from "../Skeleton";


const { height: screenHeight } = Dimensions.get('window');

const TrendingPosts = () => {
    const navigation = useNavigation();
    const { onScroll, headerStyle, bottomStyle } = scrollAnimations();
    const { myId, myData } = useNetwork();
    const { isConnected } = useConnection();
    const [hasFetchedPosts, setHasFetchedPosts] = useState(false);
    const { openSheet, closeSheet } = useBottomSheet();
    const videoRefs = useRef({});


    const [searchQuery, setSearchQuery] = useState('');
    const [activeVideo, setActiveVideo] = useState(null);
    const isFocused = useIsFocused();

    const [searchCount, setSearchCount] = useState(false);
    const [videoEndStates, setVideoEndStates] = useState({});

    const [searchResults, setSearchResults] = useState([]);
    const isRefreshingRef = useRef(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTriggered, setSearchTriggered] = useState(false);
    const searchInputRef = useRef(null);

    const listRef = useRef(null);

    const withTimeout = (promise, timeout = 10000) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout)),
        ]);
    };

    const reactionSheetRef = useRef(null);
    const [activeReactionForumId, setActiveReactionForumId] = useState(null);



    const {
        localPosts,
        fetchPosts,
        loading,
        forumIds,
        loadingMore,
        hasMorePosts,
        lastEvaluatedKey,
        setLocalPosts,
    } = useForumFetcher({
        command: 'getAllForumPosts',
        type: 'Trending',
        fetchLimit: 10,
        isConnected,
        myId
    });

    const {

        onViewableItemsChanged,
        viewabilityConfig,
    } = useForumMedia(localPosts, isFocused, setActiveVideo);


    useEffect(() => {
        if (!hasFetchedPosts) {
            fetchPosts();
            setHasFetchedPosts(true);
        }
    }, [hasFetchedPosts]);


    const handleEndReached = useCallback(() => {
        if (loading || loadingMore || !hasMorePosts) return;
        fetchPosts(lastEvaluatedKey);
    }, [loading, loadingMore, hasMorePosts, lastEvaluatedKey, fetchPosts]);


    const commentSectionRef = useRef();
    const bottomSheetRef = useRef(null);


    const openCommentSheet = (forum_id, user_id, myId, item) => {

        openSheet(
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                <CommentsSection
                    forum_id={forum_id}
                    currentUserId={myId}
                    ref={commentSectionRef}
                    closeBottomSheet={() => {
                        console.log('[Comment Sheet] Closing sheet');
                        bottomSheetRef.current?.scrollTo(0);
                    }}
                />

                <InputAccessoryView backgroundColor="#f2f2f2">
                    <CommentInputBar
                        storedUserId={myId}
                        forum_id={forum_id}
                        item={item}
                        onCommentAdded={(newCommentData) => {
                            console.log('[Comment Added] New comment:', newCommentData);
                            commentSectionRef.current?.handleCommentAdded(newCommentData);
                        }}
                        onEditComplete={(updatedComment) => {
                            console.log('[Comment Edited] Updated comment:', updatedComment);
                            commentSectionRef.current?.handleEditComplete(updatedComment);
                        }}
                    />
                </InputAccessoryView>
            </View>,
            -screenHeight * 0.9
        );
    };

    const renderItem = useRenderForumItem({
        localPosts,
        setLocalPosts,
        forumIds,
        searchResults,
        setSearchResults,
        activeVideo,
        videoEndStates,
        setVideoEndStates,
        isFocused,
        videoRefs,
        activeReactionForumId,
        setActiveReactionForumId,
        openCommentSheet,
        myId,
        searchQuery,
        openMediaViewer,
        reactionSheetRef,
        context: "trending"
    });

    const handleRefresh = useCallback(async () => {

        if (!isConnected) {

            showToast('No internet connection', 'error');
            return;
        }

        if (isRefreshingRef.current) {

            return;
        }

        try {

            isRefreshingRef.current = true;
            setIsRefreshing(true);

            setSearchQuery('');
            setSearchTriggered(false);
            setSearchResults([]);
            setActiveVideo(null);
            setVideoEndStates({});
            searchInputRef.current?.blur();

            await fetchPosts(null, true);

        } catch (error) {

        } finally {
            setIsRefreshing(false);

            setTimeout(() => {
                isRefreshingRef.current = false;

            }, 300);
        }
    }, [
        fetchPosts,
        isConnected,
        showToast,
        searchQuery,
        activeVideo,

    ]);

    const debounceTimeout = useRef(null);

    const handleDebouncedTextChange = useCallback((text) => {
        setSearchQuery(text);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        const trimmedText = text.trim();

        if (trimmedText === '') {
            setSearchTriggered(false);
            setSearchResults([]);
            return;
        }

        debounceTimeout.current = setTimeout(() => {
            handleSearch(trimmedText);
        }, 300);
    }, [handleSearch]);


    const handleSearch = useCallback(async (text) => {
        if (!isConnected) {
            showToast('No internet connection', 'error');
            return;
        }

        setSearchQuery(text);
        const trimmedText = text.trim();

        if (trimmedText === '') {
            setSearchResults([]);
            return;
        }

        try {
            const requestData = {
                command: 'searchTrendingForumPosts',
                searchQuery: trimmedText,
            };

            const res = await withTimeout(apiClient.post('/searchLatestForumPosts', requestData), 10000);
            const forumPosts = res.data.response || [];
            const count = res.data.count || forumPosts.length;

            // Match the same enrichment pattern as useForumFetcher
            const postsWithMedia = await Promise.all(
                forumPosts.map(async post => {
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

            setSearchResults(postsWithMedia);

            // ✅ Scroll to top of list
            listRef.current?.scrollToOffset({ offset: 0, animated: true });

        } catch (error) {
            console.error('[handleSearch] Failed to search posts:', error);
        } finally {
            setSearchTriggered(true);
        }
    }, [isConnected, myId]);




    const onRender = (id, phase, actualDuration) => {
        // console.log(`[Profiler] ${id} - ${phase}`);
        // console.log(`Actual render duration: ${actualDuration}ms`);
    };


    return (
        <Profiler id="ForumListCompanylatest" onRender={onRender}>
            <View style={{ flex: 1, backgroundColor: 'whitesmoke', }}>
               
                <Animated.View style={[AppStyles.headerContainer, headerStyle]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={24} color="#075cab" />
                    </TouchableOpacity>
                    <View style={AppStyles.searchContainer}>
                        <View style={AppStyles.inputContainer}>
                            <TextInput
                                ref={searchInputRef}
                                style={AppStyles.searchInput}
                                placeholder="Search"
                                placeholderTextColor="gray"
                                value={searchQuery}
                                onChangeText={handleDebouncedTextChange}
                            />


                            {searchQuery.trim() !== '' ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSearchQuery('');
                                        setSearchTriggered(false);
                                        setSearchResults([]);

                                    }}
                                    activeOpacity={0.8}
                                    style={AppStyles.iconButton}
                                >
                                    <Icon name="close-circle" size={20} color="gray" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    activeOpacity={1}
                                    style={AppStyles.searchIconButton}
                                >
                                    <Icon name="magnify" size={20} color="#075cab" />
                                </TouchableOpacity>

                            )}

                        </View>
                    </View>

                    <TouchableOpacity
                        style={AppStyles.circle}
                        onPress={() => { navigation.navigate('ForumPost'); }}
                        activeOpacity={1}
                    >
                        <Text style={AppStyles.shareText}>Post</Text>
                    </TouchableOpacity>
             
                </Animated.View>

                <Animated.FlatList
                    data={!searchTriggered || searchQuery.trim() === '' ? localPosts : searchResults}
                    renderItem={renderItem}
                    ref={listRef}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onScrollBeginDrag={() => {
                        Keyboard.dismiss();
                        searchInputRef.current?.blur?.();

                    }}
                    onScroll={onScroll}
                    scrollEventThrottle={16}

                    keyExtractor={(item, index) => `${item.forum_id}-${index}`}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}


                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                    }

                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.3}
                     contentContainerStyle={AppStyles.scrollView}
                    ListHeaderComponent={
                        <>
                            {searchTriggered && searchResults.length > 0 && (
                                <Text style={styles.companyCount}>
                                    {searchResults.length} results found
                                </Text>
                            )}
                        </>
                    }
                    ListEmptyComponent={
                        (searchTriggered && searchResults.length === 0) ? (
                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <Text style={{ fontSize: 16, color: '#666' }}>No posts found</Text>
                            </View>
                        ) : null
                    }

                    ListFooterComponent={
                        loadingMore || loading ? (
                            <View >
                                <ShimmerSkeleton />
                            </View>
                        ) : null
                    }

                />


                <ReactionSheet ref={reactionSheetRef} />

            </View>
        </Profiler>
    );
};



export default TrendingPosts;