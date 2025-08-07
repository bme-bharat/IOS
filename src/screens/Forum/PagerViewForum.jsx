
import { TabView, TabBar } from 'react-native-tab-view';
import React, { useState, useEffect, useCallback, useRef, Profiler, useMemo } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, textInputRef, TextInput, Dimensions, Modal, StyleSheet, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, SafeAreaView, ActivityIndicator, Linking, Share, Button, RefreshControl, Animated, PanResponder, ScrollView, Platform, InputAccessoryView, InteractionManager } from "react-native";
import Video from "react-native-video";
import { useFocusEffect, useNavigation, useScrollToTop } from '@react-navigation/native';
import { useIsFocused } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from "react-native-fast-image";
import apiClient from "../ApiClient";
import { useDispatch, useSelector } from "react-redux";
import { clearPosts, setCommentsCount, updateOrAddPosts } from "../Redux/Forum_Actions";
import { useNetwork } from "../AppUtils/IdProvider";
import { showToast } from "../AppUtils/CustomToast";
import CommentsSection from "../AppUtils/Comments";
import { useBottomSheet } from "../AppUtils/SheetProvider";
import CommentInputBar from "../AppUtils/InputBar";
import { EventRegister } from "react-native-event-listeners";
import { useConnection } from "../AppUtils/ConnectionProvider";
import { getSignedUrl, getTimeDisplay, getTimeDisplayForum } from "../helperComponents.jsx/signedUrls";
import { openMediaViewer } from "../helperComponents.jsx/mediaViewer";

import ReactionSheet from "../helperComponents.jsx/ReactionUserSheet";
import { useForumMedia } from "../helperComponents.jsx/forumViewableItems";
import { fetchCommentCount, fetchCommentCounts } from "../AppUtils/CommentCount";
import useRenderForumItem from './useRenderForumItem';
import { fetchForumReactionsRaw, reactionConfig } from './useForumReactions';
import useForumFetcher, { enrichForumPost } from './useForumFetcher';
import { generateAvatarFromName } from '../helperComponents.jsx/useInitialsAvatar';

const JobListScreen = React.lazy(() => import('../Job/JobListScreen'));
const ProductsList = React.lazy(() => import('../Products/ProductsList'));
const CompanySettingScreen = React.lazy(() => import('../Profile/CompanySettingScreen'));
const CompanyHomeScreen = React.lazy(() => import('../CompanyHomeScreen'));

const initialLayout = { width: Dimensions.get('window').width };
const { height: screenHeight } = Dimensions.get('window');

const PageView = () => {
  const navigation = useNavigation();

  const tabConfig = [
    { name: "Home", component: CompanyHomeScreen, focusedIcon: 'home', unfocusedIcon: 'home-outline', iconComponent: Icon },
    { name: "Jobs", component: JobListScreen, focusedIcon: 'briefcase', unfocusedIcon: 'briefcase-outline', iconComponent: Icon },
    { name: "Feed", component: PageView, focusedIcon: 'rss', unfocusedIcon: 'rss-box', iconComponent: Icon },
    { name: "Products", component: ProductsList, focusedIcon: 'shopping', unfocusedIcon: 'shopping-outline', iconComponent: Icon },
    { name: "Settings", component: CompanySettingScreen, focusedIcon: 'cog', unfocusedIcon: 'cog-outline', iconComponent: Icon },
  ];

  const parentNavigation = navigation.getParent();
  const currentRouteName = parentNavigation?.getState()?.routes[parentNavigation.getState().index]?.name;

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'all', title: 'All' },
    { key: 'latest', title: 'Latest' },
    { key: 'trending', title: 'Trending' },
    // { key: 'post', title: 'Post' },
  ]);

  // Create refs to track video components in each tab
  const tabVideoRefs = useRef({
    all: useRef({}),
    latest: useRef({}),
    trending: useRef({}),
    post: useRef({})
  });


  useEffect(() => {
    const listener = EventRegister.addEventListener('onForumPostCreated', ({ newPost, profile }) => {
      console.log("New forum post created:", newPost);

      // Switch to "All" tab
      setIndex(0);

      // Pause any videos in the current tab (before switching)
      pauseVideosInTab(routes[index].key);

      // Optionally: trigger refresh logic inside AllPosts via ref/event/state if needed
    });

    return () => {
      EventRegister.removeEventListener(listener);
    };
  }, [index, routes]);


  // Function to pause all videos in a specific tab
  const pauseVideosInTab = (tabKey) => {
    Object.values(tabVideoRefs.current[tabKey] || {}).forEach(videoRef => {
      if (videoRef && typeof videoRef.setNativeProps === 'function') {
        videoRef.setNativeProps({ paused: true });
      }
    });
  };

  const handleTabChange = (newIndex) => {
    // Pause current tab videos
    pauseVideosInTab(routes[index].key);

    InteractionManager.runAfterInteractions(() => {
      setIndex(newIndex);
      // Videos in new tab will auto-play based on visibility
    });
  };

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'all':
        return <AllPosts
          videoRefs={tabVideoRefs.current.all}
          isTabActive={index === 0}
          key="all"

        />;
      case 'latest':
        return <LatestPosts
          videoRefs={tabVideoRefs.current.latest}
          isTabActive={index === 1}
          key="latest"

        />;
      case 'trending':
        return <TrendingPosts
          videoRefs={tabVideoRefs.current.trending}
          isTabActive={index === 2}
          key="trending"

        />;
      // case 'post':
      //   return <ForumPostScreenCopy
      //     videoRefs={tabVideoRefs.current.post}
      //     isTabActive={index === 3}
      //   />;
      default: return null;
    }
  };


  useEffect(() => {
    const listener = EventRegister.addEventListener('navigateToAllTab', () => {
      // Set the tab index to 0 (All tab)
      setIndex(0);
      // Pause any videos in other tabs
      pauseVideosInTab(routes[index].key);
    });

    return () => {
      EventRegister.removeEventListener(listener);
    };
  }, [index, routes]);


  return (
    <SafeAreaView style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleTabChange}
        // initialLayout={initialLayout}
        renderTabBar={props => (
          <View style={styles.tabBarContainer}>
            <View style={styles.swipeableTabs}>
              <TabBar
                {...props}
                indicatorStyle={styles.indicator}
                style={styles.tabBar}
                labelStyle={styles.label}
                activeColor="#075cab"
                inactiveColor="#666"
                pressColor="rgba(7, 92, 171, 0.1)" // ripple effect color
              />
            </View>

            <TouchableOpacity
              style={[
                styles.navigationTab,
                index === 3 && styles.activeNavigationTab // if you had a post tab at index 3
              ]}
              onPress={() => {
                pauseVideosInTab(routes[index].key);
                navigation.navigate('ForumPost');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.navigationTabText}>
                Post
              </Text>
            </TouchableOpacity>
          </View>
        )}

        lazy
      />
      <View style={styles.bottomNavContainer}>
        {tabConfig.map((tab, index) => {
          const isFocused = currentRouteName === tab.name;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate(tab.name)}
              style={styles.navItem}
              activeOpacity={0.8}
            >
              <tab.iconComponent
                name={isFocused ? tab.focusedIcon : tab.unfocusedIcon}
                size={22}
                color={isFocused ? '#075cab' : 'black'}
              />
              <Text style={[styles.navText, { color: isFocused ? '#075cab' : 'black' }]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

// All Posts Component
const AllPosts = ({ scrollRef, videoRefs, isTabActive }) => {

  const { myId, myData } = useNetwork();
  const { isConnected } = useConnection();
  const [scrollY, setScrollY] = useState(0);
  const [hasFetchedPosts, setHasFetchedPosts] = useState(false);
  const { openSheet, closeSheet } = useBottomSheet();


  useEffect(() => {
    const reactionListener = EventRegister.addEventListener(
      'onForumReactionUpdated',
      ({ forum_id, reaction_type }) => {

        if (!isFocused) return;

        setLocalPosts(prev => {
          return prev.map(post => {
            if (post.forum_id !== forum_id) return post;


            let newTotal = Number(post.totalReactions || 0);
            let newReaction = reaction_type;

            const hadReaction = post.userReaction && post.userReaction !== 'None';
            const oldReaction = post.userReaction;

            if (reaction_type === 'None') {
              if (hadReaction) newTotal -= 1;
              newReaction = null;
            } else if (!hadReaction) {
              newTotal += 1;
            } else if (oldReaction !== reaction_type) {
              // Reaction changed (e.g., Like -> Love), count remains

            }

            const updatedPost = {
              ...post,
              userReaction: newReaction,
              totalReactions: newTotal,
            };


            return updatedPost;
          });
        });
      }
    );

    return () => {
      EventRegister.removeEventListener(reactionListener);

    };
  }, []);


  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);
  const isFocused = useIsFocused();

  const [searchCount, setSearchCount] = useState(false);
  const [videoEndStates, setVideoEndStates] = useState({});

  const [searchResults, setSearchResults] = useState(false);
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
    type: 'All',
    fetchLimit: 10,
    isConnected,
    myId
  });

  const {
    getMediaForItem,
    getAuthorImage,
    preloadUrls,
    onViewableItemsChanged,
    viewabilityConfig,
    version,
  } = useForumMedia(localPosts, isTabActive, isFocused, setActiveVideo);

  const missedEventsRef = useRef({
    created: [],
    deleted: [],
    updated: [],
    commentAdded: [],
    commentDeleted: [],
  });

  useEffect(() => {
    const listener = EventRegister.addEventListener('onForumPostCreated', async ({ newPost }) => {
      if (!isFocused) {
        missedEventsRef.current.created.push(newPost);
        return;
      }
    
      try {
        const enrichedPost = await enrichForumPost(newPost, myId);
        setLocalPosts((prev) => [enrichedPost, ...prev]);
      } catch (error) {
        setLocalPosts((prev) => [newPost, ...prev]);
      }
    
      setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 1000);
    });
    

    const deleteListener = EventRegister.addEventListener('onForumPostDeleted', ({ forum_id }) => {
      if (!isFocused) {
        missedEventsRef.current.deleted.push(forum_id);
        return;
      }
      

      setLocalPosts((prev) => prev.filter((post) => post.forum_id !== forum_id));
    });

    const updateListener = EventRegister.addEventListener('onForumPostUpdated', async ({ updatedPost }) => {
      if (!isFocused) {
        missedEventsRef.current.updated.push(updatedPost);
        return;
      }
    
      try {
        const enrichedPost = await enrichForumPost(updatedPost, myId);
        setLocalPosts((prev) =>
          prev.map((post) =>
            post.forum_id === enrichedPost.forum_id ? enrichedPost : post
          )
        );
      } catch {
        setLocalPosts((prev) =>
          prev.map((post) =>
            post.forum_id === updatedPost.forum_id ? updatedPost : post
          )
        );
      }
    });
    

    // 🔻 Listener to DECREASE comment count on deletion
    const commentDeletedListener = EventRegister.addEventListener('onCommentDeleted', ({ forum_id }) => {
      if (!isFocused) return;

      setLocalPosts(prev =>
        prev.map(post => {
          if (post.forum_id === forum_id) {
            return {
              ...post,
              commentCount: Math.max((post.commentCount || 0) - 1, 0),
              comments_count: Math.max((post.comments_count || 0) - 1, 0),
            };
          }
          return post;
        })
      );
    });

    // 🔺 Listener to INCREASE comment count on comment added
    const commentAddedListener = EventRegister.addEventListener('onCommentAdded', ({ forum_id }) => {
      setLocalPosts(prev =>
        prev.map(post => {
          if (post.forum_id === forum_id) {
            return {
              ...post,
              commentCount: (post.commentCount || 0) + 1,
              comments_count: (post.comments_count || 0) + 1,
            };
          }
          return post;
        })
      );
    });

    return () => {
      EventRegister.removeEventListener(listener);
      EventRegister.removeEventListener(deleteListener);
      EventRegister.removeEventListener(updateListener);
      EventRegister.removeEventListener(commentDeletedListener);
      EventRegister.removeEventListener(commentAddedListener);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const processMissedEvents = async () => {
        for (const newPost of missedEventsRef.current.created) {
          try {
            const enrichedPost = await enrichForumPost(newPost, myId);
            setLocalPosts((prev) => [enrichedPost, ...prev]);
          } catch {
            setLocalPosts((prev) => [newPost, ...prev]);
          }
        }
        
        for (const updatedPost of missedEventsRef.current.updated) {
          try {
            const enrichedPost = await enrichForumPost(updatedPost, myId);
            setLocalPosts((prev) =>
              prev.map((post) =>
                post.forum_id === enrichedPost.forum_id ? enrichedPost : post
              )
            );
          } catch {
            setLocalPosts((prev) =>
              prev.map((post) =>
                post.forum_id === updatedPost.forum_id ? updatedPost : post
              )
            );
          }
        }        
  
        // Clear the missed events after handling
        missedEventsRef.current = {
          created: [],
          deleted: [],
          updated: [],
          commentAdded: [],
          commentDeleted: [],
        };
      };
  
      processMissedEvents();
    }, [])
  );
  
  
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
    isTabActive: isTabActive && isFocused,
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
    getMediaForItem,
    getAuthorImage,
    openMediaViewer,
    reactionSheetRef,
    styles,
  });


  const lastCheckedTimeRef = useRef(Math.floor(Date.now() / 1000));
  const [lastCheckedTime, setLastCheckedTime] = useState(lastCheckedTimeRef.current);
  const [newJobCount, setNewJobCount] = useState(0);
  const [showNewJobAlert, setShowNewJobAlert] = useState(false);

  const updateLastCheckedTime = (time) => {
    lastCheckedTimeRef.current = time;
    setLastCheckedTime(time);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewJobs();
    }, 10000); // every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const checkForNewJobs = async () => {
    const now = Math.floor(Date.now() / 1000);

    try {
      const response = await apiClient.post('/getNewLatestForumPostsCount', {
        command: 'getNewLatestForumPostsCount',
        user_id: myId,
        lastVisitedTime: lastCheckedTimeRef.current,
      });

      const { count = 0, user_ids = [] } = response?.data || {};
      const filteredUserIds = user_ids.filter(id => id !== myId);
      const filteredCount = filteredUserIds.length;

      if (filteredCount > 0) {
        setNewJobCount(filteredCount);
        setShowNewJobAlert(true);
      } else {

        setShowNewJobAlert(false);
      }
    } catch (error) {

    }
  };


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

      setLocalPosts([])

      setSearchQuery('');
      setSearchTriggered(false);
      setSearchResults([]);
      setActiveVideo(null);
      setVideoEndStates({});
      searchInputRef.current?.blur();

      setNewJobCount(0);
      setShowNewJobAlert(false);
      const newCheckTime = Math.floor(Date.now() / 1000);
      updateLastCheckedTime(newCheckTime);

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
    updateLastCheckedTime,
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
        command: 'searchLatestForumPosts',
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

  const [showSearchBar, setShowSearchBar] = useState(false);
  const searchBarRef = useRef(null);
  const searchBarHeight = useRef(new Animated.Value(0)).current;
  const searchBarOpacity = useRef(new Animated.Value(0)).current;
  const searchButtonOpacity = useRef(new Animated.Value(1)).current;

  const toggleSearchBar = () => {
    if (showSearchBar) {
      // Animation for hiding search bar
      Animated.parallel([
        Animated.timing(searchBarHeight, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(searchBarOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(searchButtonOpacity, {
          toValue: 1,
          duration: 200,
          delay: 100,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setShowSearchBar(false);
        setSearchQuery('');
        setSearchTriggered(false);
        setSearchResults([]);
        Keyboard.dismiss();
      });
    } else {
      setShowSearchBar(true);
      // Animation for showing search bar
      Animated.parallel([
        Animated.timing(searchBarHeight, {
          toValue: 60, // Adjust this based on your search bar height
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(searchBarOpacity, {
          toValue: 1,
          duration: 200,
          delay: 100,
          useNativeDriver: false,
        }),
        Animated.timing(searchButtonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        searchBarRef.current?.focus();
      });
    }
  };

  useEffect(() => {
    if (showSearchBar) {
      const timeout = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [showSearchBar]);

  return (
    <Profiler id="ForumListCompanylatest" onRender={onRender}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'whitesmoke', }}>

        <Animated.View
          style={{
            position: 'absolute',
            top: 15,
            right: 15,
            zIndex: 10,
            shadowOffset: { width: 0, height: 1 },
            opacity: searchButtonOpacity,
            transform: [
              {
                scale: searchButtonOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity onPress={toggleSearchBar} style={{
            backgroundColor: 'red',
            padding: 10,
            borderRadius: 30,
            backgroundColor: '#075cab',
            borderRadius: 30,
            elevation: 3,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 3,
          }}>
            <Icon name="magnify" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>


        <Animated.View
          style={{
            height: searchBarHeight,
            opacity: searchBarOpacity,
            paddingHorizontal: 15,
            backgroundColor: 'white',
            // paddingVertical: 8,
            elevation: 3,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
            flexDirection: 'row',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: 10,
              paddingHorizontal: 15,
              paddingVertical: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Icon name="magnify" size={20} color="#075cab" style={{ marginRight: 8 }} />
            <TextInput
              ref={searchInputRef}
              style={{ flex: 1, padding: 0, color: 'black' }}
              placeholder="Search posts..."
              placeholderTextColor="gray"
              value={searchQuery}
              onChangeText={handleDebouncedTextChange}
              autoFocus={showSearchBar}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchTriggered(false);
                  setSearchResults([]);
                }}
              >
                <Icon name="close-circle" size={20} color="gray" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={toggleSearchBar}
            style={{ padding: 10 }}
          >
            <Text style={{ color: '#075cab' }}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>


        {showNewJobAlert && (
          <TouchableOpacity onPress={handleRefresh} style={{ position: 'absolute', top: 10, alignSelf: 'center', backgroundColor: '#075cab', padding: 10, borderRadius: 10, zIndex: 10 }}>
            <Text style={{ color: 'white', fontWeight: '500' }}>{newJobCount} new post{newJobCount > 1 ? 's' : ''} available — Tap to refresh</Text>
          </TouchableOpacity>
        )}
        <View style={styles.container}>




          <FlatList
            data={!searchTriggered || searchQuery.trim() === '' ? localPosts : searchResults}
            renderItem={renderItem}
            ref={listRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => {
              Keyboard.dismiss();
              searchInputRef.current?.blur?.();

              if (showSearchBar && !searchTriggered) {
                toggleSearchBar(); // This will trigger the hide animation
              }

            }}
            onScroll={(e) => {
              const currentScrollY = e.nativeEvent.contentOffset.y;
              if (Math.abs(currentScrollY - scrollY) > 5 && activeReactionForumId) {
                setActiveReactionForumId(null);
              }
              setScrollY(currentScrollY);
            }}
            scrollEventThrottle={16}

            keyExtractor={(item, index) => `${item.forum_id}-${index}`}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}


            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }

            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: '10%' }}
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
              loadingMore ? (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color="#075cab" />
                </View>
              ) : null
            }

          />



        </View>
        <ReactionSheet ref={reactionSheetRef} />

      </SafeAreaView>
    </Profiler>
  );
};

// Latest Posts Component
const LatestPosts = ({ scrollRef, videoRefs, isTabActive }) => {

  const { myId, myData } = useNetwork();
  const { isConnected } = useConnection();
  const [scrollY, setScrollY] = useState(0);
  const [hasFetchedPosts, setHasFetchedPosts] = useState(false);
  const { openSheet, closeSheet } = useBottomSheet();

  useEffect(() => {
    const listener = EventRegister.addEventListener('onCommentAdded', ({ forum_id }) => {
      setLocalPosts(prev =>
        prev.map(post => {
          if (post.forum_id === forum_id) {
            return {
              ...post,
              commentCount: (post.commentCount || 0) + 1,
              comments_count: (post.comments_count || 0) + 1,
            };
          }
          return post;
        })
      );
    });

    const deleteListener = EventRegister.addEventListener('onCommentDeleted', ({ forum_id }) => {
      setLocalPosts(prev =>
        prev.map(post => {
          if (post.forum_id === forum_id) {
            return {
              ...post,
              commentCount: Math.max((post.commentCount || 0) - 1, 0),
              comments_count: Math.max((post.comments_count || 0) - 1, 0),
            };
          }
          return post;
        })
      );
    });

    return () => {
      EventRegister.removeEventListener(listener);
      EventRegister.removeEventListener(deleteListener);
    };
  }, []);


  useEffect(() => {
    const reactionListener = EventRegister.addEventListener(
      'onForumReactionUpdated',
      ({ forum_id, reaction_type }) => {

        setLocalPosts(prev => {
          return prev.map(post => {
            if (post.forum_id !== forum_id) return post;


            let newTotal = Number(post.totalReactions || 0);
            let newReaction = reaction_type;

            const hadReaction = post.userReaction && post.userReaction !== 'None';
            const oldReaction = post.userReaction;

            if (reaction_type === 'None') {
              if (hadReaction) newTotal -= 1;
              newReaction = null;
            } else if (!hadReaction) {
              newTotal += 1;
            } else if (oldReaction !== reaction_type) {

            }

            const updatedPost = {
              ...post,
              userReaction: newReaction,
              totalReactions: newTotal,
            };


            return updatedPost;
          });
        });
      }
    );

    return () => {
      EventRegister.removeEventListener(reactionListener);

    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);
  const isFocused = useIsFocused();
  const [searchResults, setSearchResults] = useState(false);
  const isRefreshingRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const searchInputRef = useRef(null);
  const [videoEndStates, setVideoEndStates] = useState({});

  const listRef = useRef(null);


  const reactionSheetRef = useRef(null);
  const [activeReactionForumId, setActiveReactionForumId] = useState(null);

  const {
    localPosts,
    fetchPosts,
    loading,
    loadingMore,
    hasMorePosts,
    lastEvaluatedKey,
    setLocalPosts
  } = useForumFetcher({
    command: 'getLatestPosts',
    type: 'Latest',
    fetchLimit: 10,
    isConnected,
    preloadUrls
  });


  const {
    getMediaForItem,
    getAuthorImage,
    preloadUrls,
    onViewableItemsChanged,
    viewabilityConfig,
    version,
  } = useForumMedia(localPosts, isTabActive, isFocused, setActiveVideo);


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
    isTabActive: isTabActive && isFocused,
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
    getMediaForItem,
    getAuthorImage,
    openMediaViewer,
    reactionSheetRef,
    styles,
  });


  const handleRefresh = useCallback(async () => {
    if (!isConnected) {

      return;
    }
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    setSearchQuery('');
    setSearchTriggered(false);
    setSearchResults([]);

    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }

    setLocalPosts([]);

    await fetchPosts(null);

    setIsRefreshing(false);

    setTimeout(() => {
      isRefreshingRef.current = false;
    }, 300);
  }, [fetchPosts]);


  const onRender = (id, phase, actualDuration) => {
    // console.log(`[Profiler] ${id} - ${phase}`);
    // console.log(`Actual render duration: ${actualDuration}ms`);
  };


  return (
    <Profiler id="ForumListCompanylatest" onRender={onRender}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'whitesmoke', }}>

        <View style={styles.container}>



          {!loading ? (
            <FlatList
              data={!searchTriggered || searchQuery.trim() === '' ? localPosts : searchResults}
              renderItem={renderItem}
              ref={listRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={() => {
                Keyboard.dismiss();
                searchInputRef.current?.blur?.();

              }}
              onScroll={(e) => {
                const currentScrollY = e.nativeEvent.contentOffset.y;
                if (Math.abs(currentScrollY - scrollY) > 5 && activeReactionForumId) {
                  setActiveReactionForumId(null);
                }
                setScrollY(currentScrollY);
              }}
              scrollEventThrottle={16}
              keyExtractor={(item, index) => `${item.forum_id}-${index}`}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
              }

              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: '10%' }}
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
                loadingMore ? (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color="#075cab" />
                  </View>
                ) : null
              }

            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color={'#075cab'} size="large" />
            </View>
          )}


        </View>
        <ReactionSheet ref={reactionSheetRef} />

      </SafeAreaView>
    </Profiler>
  );
};

// Trending Posts Component
const TrendingPosts = ({ scrollRef, videoRefs, isTabActive }) => {

  const { myId, myData } = useNetwork();
  const [scrollY, setScrollY] = useState(0);
  const { isConnected } = useConnection();
  const [hasFetchedPosts, setHasFetchedPosts] = useState(false);
  const { openSheet, closeSheet } = useBottomSheet();
  const [videoEndStates, setVideoEndStates] = useState({});

  useEffect(() => {
    const listener = EventRegister.addEventListener('onCommentAdded', ({ forum_id }) => {
      setLocalPosts(prev =>
        prev.map(post => {
          if (post.forum_id === forum_id) {
            return {
              ...post,
              commentCount: (post.commentCount || 0) + 1,
              comments_count: (post.comments_count || 0) + 1,
            };
          }
          return post;
        })
      );
    });

    const deleteListener = EventRegister.addEventListener('onCommentDeleted', ({ forum_id }) => {
      setLocalPosts(prev =>
        prev.map(post => {
          if (post.forum_id === forum_id) {
            return {
              ...post,
              commentCount: Math.max((post.commentCount || 0) - 1, 0),
              comments_count: Math.max((post.comments_count || 0) - 1, 0),
            };
          }
          return post;
        })
      );
    });

    return () => {
      EventRegister.removeEventListener(listener);
      EventRegister.removeEventListener(deleteListener);
    };
  }, []);


  useEffect(() => {
    const reactionListener = EventRegister.addEventListener(
      'onForumReactionUpdated',
      ({ forum_id, reaction_type }) => {

        setLocalPosts(prev => {
          return prev.map(post => {
            if (post.forum_id !== forum_id) return post;

            console.log('[Reaction Update] Updating post:', post.forum_id);

            let newTotal = Number(post.totalReactions || 0);
            let newReaction = reaction_type;

            const hadReaction = post.userReaction && post.userReaction !== 'None';
            const oldReaction = post.userReaction;

            if (reaction_type === 'None') {
              if (hadReaction) newTotal -= 1;
              newReaction = null;
            } else if (!hadReaction) {
              newTotal += 1;
            } else if (oldReaction !== reaction_type) {
              // Reaction changed (e.g., Like -> Love), count remains
              console.log('[Reaction Update] Changed from', oldReaction, 'to', reaction_type);
            }

            const updatedPost = {
              ...post,
              userReaction: newReaction,
              totalReactions: newTotal,
            };

            console.log('[Reaction Update] Updated post:', updatedPost);

            return updatedPost;
          });
        });
      }
    );

    return () => {
      EventRegister.removeEventListener(reactionListener);

    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);
  const isFocused = useIsFocused();

  const [searchResults, setSearchResults] = useState(false);
  const isRefreshingRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const searchInputRef = useRef(null);


  const reactionSheetRef = useRef(null);
  const [activeReactionForumId, setActiveReactionForumId] = useState(null);




  const {
    localPosts,
    fetchPosts,
    loading,
    loadingMore,
    hasMorePosts,
    lastEvaluatedKey,
    setLocalPosts
  } = useForumFetcher({
    command: 'getAllTrendingPosts',
    type: 'Trending',
    fetchLimit: 10,
    isConnected,
    preloadUrls
  });


  const {
    getMediaForItem,
    getAuthorImage,
    preloadUrls,
    onViewableItemsChanged,
    viewabilityConfig,
    version,
  } = useForumMedia(localPosts, isTabActive, isFocused, setActiveVideo);


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
          // onEditComment={handleEditComment}
          ref={commentSectionRef}
          closeBottomSheet={() => bottomSheetRef.current?.scrollTo(0)}

        />

        <InputAccessoryView backgroundColor="#f2f2f2">
          <CommentInputBar
            storedUserId={myId}
            forum_id={forum_id}
            item={item}
            onCommentAdded={(newCommentData) => {
              commentSectionRef.current?.handleCommentAdded(newCommentData);
            }}
            onEditComplete={(updatedComment) => {
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
    isTabActive: isTabActive && isFocused,
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
    getMediaForItem,
    getAuthorImage,
    openMediaViewer,
    reactionSheetRef,
    styles,
  });


  const handleRefresh = useCallback(async () => {
    if (!isConnected) {

      return;
    }
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    setSearchQuery('');
    setSearchTriggered(false);
    setSearchResults([]);

    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }

    setLocalPosts([]);

    await fetchPosts(null);

    setIsRefreshing(false);

    setTimeout(() => {
      isRefreshingRef.current = false;
    }, 300);
  }, [fetchPosts]);



  const onRender = (id, phase, actualDuration) => {
    // console.log(`[Profiler] ${id} - ${phase}`);
    // console.log(`Actual render duration: ${actualDuration}ms`);
  };


  return (
    <Profiler id="ForumListCompanylatest" onRender={onRender}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'whitesmoke', }}>

        <View style={styles.container}>

          {!loading ? (
            <FlatList
              data={!searchTriggered || searchQuery.trim() === '' ? localPosts : searchResults}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={() => {
                Keyboard.dismiss();
                searchInputRef.current?.blur?.();

              }}
              onScroll={(e) => {
                const currentScrollY = e.nativeEvent.contentOffset.y;
                if (Math.abs(currentScrollY - scrollY) > 5 && activeReactionForumId) {
                  setActiveReactionForumId(null);
                }
                setScrollY(currentScrollY);
              }}
              scrollEventThrottle={16}
              keyExtractor={(item, index) => `${item.forum_id}-${index}`}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
              }

              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: '10%' }}
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
                loadingMore ? (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color="#075cab" />
                  </View>
                ) : null
              }

            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color={'#075cab'} size="large" />
            </View>
          )}


        </View>
        <ReactionSheet ref={reactionSheetRef} />

      </SafeAreaView>
    </Profiler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'whitesmoke',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },


  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navText: {
    fontSize: 12,
    color: 'black',
    marginTop: 2,
  },

  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 4, // Add elevation to match Material Design tabs
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  swipeableTabs: {
    flex: 1,
  },
  navigationTab: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 4,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  activeNavigationTab: {
    backgroundColor: 'rgba(7, 92, 171, 0.1)',
  },
  navigationTabText: {
    color: '#075cab',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    backgroundColor: '#fff',
    elevation: 0, // Remove default elevation from TabBar since container has it
  },
  indicator: {
    backgroundColor: '#075cab',
    height: 3,
  },
  label: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },


});

export default PageView;