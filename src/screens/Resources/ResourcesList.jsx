import React, { useState, useEffect, useCallback, useRef, Profiler, useMemo } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, Dimensions, Modal, StyleSheet, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, ActivityIndicator, ToastAndroid, Linking, RefreshControl, Share, ScrollView } from "react-native";
import Video from "react-native-video";
import { useIsFocused } from "@react-navigation/native";
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ParsedText from "react-native-parsed-text";
import apiClient from "../ApiClient";
import { useDispatch, useSelector } from "react-redux";
import { clearResourcePosts, updateOrAddResourcePosts } from "../Redux/Resource_Actions";


import { useFileOpener } from "../helperComponents/fileViewer";

import { useConnection } from "../AppUtils/ConnectionProvider";
import AppStyles from "../AppUtils/AppStyles";
import { getSignedUrl, getTimeDisplay, getTimeDisplayForum, highlightMatch } from "../helperComponents/signedUrls";
import { openMediaViewer } from "../helperComponents/mediaViewer";
import { ForumBody, normalizeHtml, } from "../Forum/forumBody";
import { EventRegister } from "react-native-event-listeners";
import { generateAvatarFromName } from "../helperComponents/useInitialsAvatar";
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import Search from '../../assets/svgIcons/search.svg';
import Close from '../../assets/svgIcons/close.svg';
import ShareIcon from '../../assets/svgIcons/share.svg';
import Add from '../../assets/svgIcons/add.svg';

import Pdf from '../../assets/svgIcons/pdf.svg';
import Excel from '../../assets/svgIcons/excel.svg';
import Word from '../../assets/svgIcons/word.svg';
import PPT from '../../assets/svgIcons/ppt.svg';
import File from '../../assets/svgIcons/file.svg';
import BMEVideoPlayer from "../BMEVideoPlayer";

import { colors, dimensions } from '../../assets/theme.jsx';


const videoExtensions = [
    '.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm',
    '.m4v', '.3gp', '.3g2', '.f4v', '.f4p', '.f4a', '.f4b', '.qt', '.quicktime'
];


const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');
const maxAllowedHeight = Math.round(deviceHeight * 0.6);

const ResourcesList = ({ navigation, route }) => {

    const dispatch = useDispatch();
    const profile = useSelector(state => state.CompanyProfile.profile);
    const { isConnected } = useConnection();
    const videoRefs = useRef({});
    const [localPosts, setLocalPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const listRef = useRef(null);
    const [activeVideo, setActiveVideo] = useState(null);
    const isFocused = useIsFocused();
    const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTriggered, setSearchTriggered] = useState(false);
    const [fetchLimit, setFetchLimit] = useState(1);
    const bottomSheetRef = useRef(null);
    const [expandedTexts, setExpandedTexts] = useState({});
    const { openFile } = useFileOpener();
    const [loading1, setLoading1] = useState(false);

    const handleOpenResume = async (fileKey) => {
        if (!fileKey) return;
        setLoading1(true);
        try {
            await openFile(fileKey);
        } finally {
            setLoading1(false);
        }
    };

    useEffect(() => {
        const listener = EventRegister.addEventListener('onResourcePostCreated', async ({ newPost }) => {
        console.log('newPost',newPost)
            try {
                // Author name from profile
                const name = profile?.company_name
                    ? profile.company_name
                    : `${profile?.first_name || ''} ${profile?.last_name || ''}`;
    
                const resourceId = newPost?.resource_id;
                const fileKey = newPost?.fileKey;
                const authorFileKey = newPost?.author_fileKey || profile?.fileKey;
    
                // Get signed URLs
                const fileKeySignedUrl = await getSignedUrl(resourceId, fileKey);
    
                let authorSignedUrl;
                if (authorFileKey) {
                    authorSignedUrl = await getSignedUrl(resourceId, authorFileKey);
                } else {
                    authorSignedUrl = generateAvatarFromName(name);
                }
    
                // Construct new post with all required fields
                const postWithMedia = {
                    ...newPost,
                    author: name,
                    author_category: profile?.category || '',
                    author_fileKey: authorFileKey || null,
                    user_type: profile?.user_type,
                    fileKeySignedUrl,
                    authorSignedUrl,
                };
    
                // Update state, prevent duplicates
                setLocalPosts((prevPosts) => {
                    const alreadyExists = prevPosts.some(p => p.resource_id === postWithMedia.resource_id);
                    if (alreadyExists) {
                        return prevPosts;
                    }
                    return [postWithMedia, ...prevPosts];
                });
    
            } catch (error) {
                console.error('[onResourcePostCreated] Failed to fetch media for post:', error);
            }
        });
    
        return () => {
            EventRegister.removeEventListener(listener);
        };
    }, [profile]);
    


    const withTimeout = (promise, timeout = 10000) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout)),
        ]);
    };


    const fetchPosts = async (lastKey = null) => {
        if (!isConnected) return;
        if (loading || loadingMore) return;

        const startTime = Date.now();
        lastKey ? setLoadingMore(true) : setLoading(true);

        try {
            const requestData = {
                command: 'getAllResourcePosts',
                limit: fetchLimit,
                ...(lastKey && { lastEvaluatedKey: lastKey }),
            };
            const response = await withTimeout(apiClient.post('/getAllResourcePosts', requestData), 10000);

            const newPosts = response?.data?.response || [];
            if (!newPosts.length) {
                setHasMorePosts(false);
                return;
            }

            const responseTime = Date.now() - startTime;
            if (responseTime < 500) {
                setFetchLimit(prev => Math.min(prev + 2, 30));
            } else if (responseTime > 1200) {
                setFetchLimit(prev => Math.max(prev - 1, 3));
            }

            const sortedNewPosts = newPosts.sort((a, b) => b.posted_on - a.posted_on);

            const postsWithExtras = await Promise.all(
                sortedNewPosts.map(async (post) => {
                    const name = post.author || '';
                    const fileKey = post?.fileKey;
                    const resourceId = post?.resource_id;
                    const authorFileKey = post?.author_fileKey;
                    const thumbnailFileKey = post?.thumbnail_fileKey;
                    const mimeType = post?.extraData?.mimeType || post?.extraData?.type || '';

                    // Always fetch main file URL
                    const fileKeySignedUrl = await getSignedUrl(resourceId, fileKey);

                    // Only fetch thumbnail if it's a video
                    let thumbnailSignedUrl = null;
                    if (mimeType.startsWith('video')) {
                        thumbnailSignedUrl = await getSignedUrl(resourceId, thumbnailFileKey);
                    }

                    let authorSignedUrl;
                    if (authorFileKey) {
                        authorSignedUrl = await getSignedUrl(resourceId, authorFileKey);
                    } else {
                        authorSignedUrl = generateAvatarFromName(name);
                    }

                    return {
                        ...post,
                        fileKeySignedUrl,
                        thumbnailSignedUrl,
                        authorSignedUrl,
                    };
                })
            );


            setLocalPosts(prevPosts => {
                const uniquePosts = [...prevPosts, ...postsWithExtras].filter(
                    (post, index, self) =>
                        index === self.findIndex(p => p.resource_id === post.resource_id)
                );
                return uniquePosts;
            });

            setHasMorePosts(!!response.data.lastEvaluatedKey);
            setLastEvaluatedKey(response.data.lastEvaluatedKey || null);
        } catch (error) {
            console.error('[fetchLatestPosts] error:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const documentExtensions = [
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt",
        "vnd.openxmlformats-officedocument.wordprocessingml.document",
        "vnd.openxmlformats-officedocument.presentationml.presentation",
        "vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "msword", 'webp'
    ];


    const fetchMediaForPost = async (post) => {
        // Early return if no fileKey
        if (!post.fileKey) return post;

        const mediaData = { resource_id: post.resource_id };

        try {
            // Fetch signed URL for the main file
            const res = await apiClient.post('/getObjectSignedUrl', {
                command: "getObjectSignedUrl",
                key: post.fileKey
            });

            const url = res.data;

            if (url) {
                mediaData.fileUrl = url;
            }
        } catch (error) {
            // If fetching fails, just skip URL
        }

        // Fetch author image if present
        if (post.author_fileKey) {
            try {
                const authorImageRes = await apiClient.post('/getObjectSignedUrl', {
                    command: "getObjectSignedUrl",
                    key: post.author_fileKey
                });
                mediaData.authorImageUrl = authorImageRes.data;
            } catch (error) {
                // Skip author image if fails
            }
        }

        return { ...post, ...mediaData };
    };

    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm'];
  
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (!viewableItems?.length) {
          setActiveVideo?.(null);
          return;
        }
    
        if (isFocused ) {
          const visibleItem = viewableItems.find(item => item.isViewable);
          if (visibleItem) {
            const { resource_id, fileKey } = visibleItem.item || {};
            const isVideo = fileKey && videoExtensions.some(ext => fileKey.toLowerCase().endsWith(ext));
    
            if (resource_id && isVideo) {
              setActiveVideo?.(resource_id);
            } else {
              setActiveVideo?.(null);
            }
    
          } else {
            setActiveVideo?.(null);
          }
        }
    
      }).current;


      useEffect(() => {
        if (!isFocused) {
          // Pause all videos when screen loses focus
          Object.values(videoRefs.current).forEach(ref => {
            if (ref && typeof ref.pause === 'function') {
              ref.pause(); // For players with a pause() method
            }
          });
        }
      }, [isFocused]);
      

    const toggleFullText = (forumId) => {
        setExpandedTexts((prev) => ({
            ...prev,
            [forumId]: !prev[forumId],
        }));
    };


    const handleNavigate = (item) => {
        if (bottomSheetRef.current) {
            bottomSheetRef.current.close();
        }

        if (item.user_type === "company") {
            navigation.navigate('CompanyDetailsPage', { userId: item.user_id });
        } else if (item.user_type === "users") {
            navigation.navigate('UserDetailsPage', { userId: item.user_id });
        }
    };


    const shareResource = async (resource_id) => {
        try {
            const baseUrl = 'https://bmebharat.com/Resource/';
            const jobUrl = `${baseUrl}${resource_id}`;

            const result = await Share.share({
                message: `Checkout this resource: ${jobUrl}`,
            });


            if (result.action === Share.sharedAction) {
                if (result.activityType) {

                } else {

                }
            } else if (result.action === Share.dismissedAction) {

            }
        } catch (error) {

        }
    };

    const getMediaCategory = (mimeType) => {
        if (!mimeType) return null;

        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';

        // All other supported document types
        return 'document';
    };

    const getFileIcon = (mimeType) => {
        if (!mimeType) return 'file-document';

        if (mimeType.includes('pdf')) return 'file-pdf-box';
        if (mimeType.includes('word')) return 'file-word-box';
        if (mimeType.includes('excel')) return 'file-excel-box';
        if (mimeType.includes('powerpoint')) return 'file-powerpoint-box';

        return 'file-document-box';
    };




    const MediaPreview = ({
        item,
        openMediaViewer,
        
        maxAllowedHeight
    }) => {
        const { Icon, color } = getFileIconData(item?.extraData?.name);
        const mimeType = item.extraData?.mimeType || item.extraData?.type || '';
        const mediaCategory = getMediaCategory(mimeType);
        const aspectRatio = item.extraData?.aspectRatio || 1;
        const height = Math.min(Math.round(deviceWidth / aspectRatio), maxAllowedHeight);
        const fileUrl = item.fileKeySignedUrl?.[item.resource_id] || '';

        if (!item.fileKey) return
        return (
            <View style={styles.mediaContainer}>
                {item?.extraData?.type?.startsWith("image/") ? (
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ paddingHorizontal: 5 }}
                        onPress={() => openMediaViewer([{ type: 'image', url: fileUrl }])}
                    >
                        <Image
                            source={{ uri: fileUrl }}
                            style={{
                                width: '100%',
                                aspectRatio: aspectRatio,
                            }}
                        />
                    </TouchableOpacity>
                ) : item?.extraData?.type?.startsWith("video/") ? (
                    <TouchableOpacity activeOpacity={1} style={{ paddingHorizontal: 5, height: height }}  >
                        <Video
                            ref={(ref) => {
                                if (ref) {
                                    videoRefs.current[item.resource_id] = ref;
                                }
                            }}
                            source={{ uri: fileUrl }}
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                            controls
                            paused={!isFocused || activeVideo !== item.resource_id }
                            repeat

                        />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.documentContainer} onPress={() => handleOpenResume(item.fileKey)}>
                        <Icon width={dimensions.icon.xl} height={dimensions.icon.xl} color={color} />
                        <Text style={[styles.docText, { color: color }]} >
                            {item?.extraData?.name?.split(".")?.pop()?.toUpperCase() || "DOC"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };


    const fileIcons = {
        PDF: { Icon: Pdf, color: colors.danger },
        XLS: { Icon: Excel, color: colors.success },
        XLSX: { Icon: Excel, color: colors.success },
        DOC: { Icon: Word, color: colors.primary },
        DOCX: { Icon: Word, color: colors.primary },
        PPT: { Icon: PPT, color: colors.warning },
        PPTX: { Icon: PPT, color: colors.warning },
        DEFAULT: { Icon: File, color: colors.gray },
    };

    const getFileIconData = (filename) => {
        const ext = filename?.split('.').pop()?.toUpperCase();
        return fileIcons[ext] || fileIcons.DEFAULT;
    };

    const renderItem = useCallback(({ item }) => {
        let height;
        if (item.extraData?.aspectRatio) {
            const aspectRatioHeight = Math.round(deviceWidth / item.extraData.aspectRatio);
            height = aspectRatioHeight > maxAllowedHeight ? maxAllowedHeight : aspectRatioHeight;
        } else {
            height = deviceWidth;
        }
        const { Icon, color } = getFileIconData(item?.extraData?.name);

        const fileUrl = item.fileKeySignedUrl?.[item.resource_id] || '';
        return (

            <TouchableOpacity style={styles.comments} activeOpacity={1}>
                <View style={styles.dpContainer}>
                    <TouchableOpacity style={styles.dpContainer1} onPress={() => handleNavigate(item)} activeOpacity={1}>
                        {item.author_fileKey ? (
                            <Image
                                source={{
                                    uri: item.authorSignedUrl?.[item.resource_id] || '', // safely extract signed URL
                                }}
                                style={styles.image1}
                            />
                        ) : (
                            <View
                                style={[
                                    styles.image1,
                                    {
                                        backgroundColor: item.authorSignedUrl?.backgroundColor || '#ccc',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    },
                                ]}
                            >
                                <Text style={{ color: item.authorSignedUrl?.textColor || '#000', fontWeight: 'bold' }}>
                                    {item.authorSignedUrl?.initials || ''}
                                </Text>
                            </View>
                        )}


                    </TouchableOpacity>
                    <View style={styles.textContainer}>
                        <View style={styles.title3}>
                            <TouchableOpacity onPress={() => handleNavigate(item)}>
                                <Text style={{ flex: 1, alignSelf: 'flex-start', color: colors.text_primary, fontSize: 16, fontWeight: '600' }}>
                                    {(item.author || '').trim()}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <Text style={styles.title}>{item.author_category || ''}</Text>
                            <Text style={styles.date1}>{getTimeDisplayForum(item.posted_on)}</Text>
                        </View>
                    </View>
                </View>

                <View style={{ paddingHorizontal: 10, marginVertical: 5 }}>
                    <Text style={styles.title1}>{highlightMatch(item?.title || '', searchQuery)}</Text>

                    <ForumBody
                        html={normalizeHtml(item?.resource_body, searchQuery)}
                        forumId={item.resource_id}
                        isExpanded={expandedTexts[item.resource_id]}
                        toggleFullText={toggleFullText}
                    />
                </View>
                <MediaPreview
                    item={item}
                    openMediaViewer={openMediaViewer}
                    
                    maxAllowedHeight={maxAllowedHeight}
                />

                {/* <View style={styles.mediaContainer}>
                    {item?.extraData?.type?.startsWith("image/") ? (
                        <Image
                            source={{ uri: fileUrl }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    ) : item?.extraData?.type?.startsWith("video/") ? (
                        <Video
                            ref={(ref) => {
                                if (ref) videoRefs.current[item.resource_id] = ref;
                            }}

                            source={{ uri: fileUrl }}
                            style={styles.video}
                            resizeMode="contain"
                            paused
                        />
                    ) : (
                        <View style={styles.documentContainer}>

                            <Icon width={dimensions.icon.xl} height={dimensions.icon.xl} color={color} />

                            <Text style={[styles.docText, { color: color }]} onPress={() => handleOpenResume(item.fileKey)}>
                                {item?.extraData?.name?.split(".")?.pop()?.toUpperCase() || "DOC"}
                            </Text>
                        </View>
                    )}
                </View> */}


                <TouchableOpacity style={styles.shareButton} onPress={() => shareResource(item.resource_id)}>
                    <ShareIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                    <Text style={styles.iconTextUnderlined}>Share</Text>
                </TouchableOpacity>
            </TouchableOpacity>

        );
    }, [activeVideo, expandedTexts]);


    const searchInputRef = useRef(null);
    const isRefreshingRef = useRef(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchResults, setSearchResults] = useState(false);

    const handleRefresh = useCallback(async () => {

        if (!isConnected) {

            return;
        }
        if (isRefreshing || isRefreshingRef.current) {
            return;
        }

        isRefreshingRef.current = true;
        setIsRefreshing(true);

        setSearchQuery('');
        if (searchInputRef.current) {
            searchInputRef.current.blur();
        }

        setSearchTriggered(false);
        setLocalPosts([]);
        setHasMorePosts(true);
        setLastEvaluatedKey(null);

        try {
            dispatch(clearResourcePosts());

            await fetchPosts();
        } catch (error) {
        }

        setIsRefreshing(false);

        setTimeout(() => {
            isRefreshingRef.current = false;
        }, 5000);
    }, [fetchPosts]);


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


    const handleSearch = async (text) => {
        if (!isConnected) {
            showToast('No internet connection', 'error')
            return;
        }

        const trimmedText = text.trim();

        if (trimmedText === '') {
            setSearchResults([]);
            return;
        }

        try {
            const requestData = {
                command: 'searchResources',
                searchQuery: trimmedText,
            };
            const res = await withTimeout(apiClient.post('/searchResources', requestData), 10000);
            listRef.current?.scrollToOffset({ offset: 0, animated: true });

            const forumPosts = res.data.response || [];
            const count = res.data.count || forumPosts.length;

            const postsWithMedia = await Promise.all(
                forumPosts.map((post) => fetchMediaForPost(post))
            );

            setSearchResults(postsWithMedia);

        } catch (error) {

        } finally {
            setSearchTriggered(true);
        }

    };



    const onRender = (id, phase, actualDuration) => {
        // console.log(`Component: ${id}, Phase: ${phase}, Actual Duration: ${actualDuration}ms`);
    };

    return (
        <Profiler id="ForumListCompanylatest" onRender={onRender}>
            <View style={{ flex: 1, backgroundColor: colors.app_background }}>
                <View style={styles.searchContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                    </TouchableOpacity>
                    <View style={styles.searchContainer1}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                ref={searchInputRef}
                                style={styles.searchInput}
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
                                    style={styles.iconButton}
                                >
                                    <Close width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity

                                    style={styles.searchIconButton}
                                >
                                    <Search width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                                </TouchableOpacity>

                            )}
                        </View>
                    </View>
                    <TouchableOpacity style={AppStyles.circle}
                        onPress={() => navigation.navigate("ResourcesPost")} activeOpacity={0.8}>
                        <Add width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                        <Text style={AppStyles.shareText}> Contribute</Text>
                    </TouchableOpacity>

                </View>

                <TouchableWithoutFeedback
                    onPress={() => {
                        Keyboard.dismiss();
                        searchInputRef.current?.blur?.();

                    }}
                >
                    <View style={{ flex: 1 }}>
                        {!loading ? (
                            <FlatList
                                ref={listRef}
                                data={!searchTriggered || searchQuery.trim() === '' ? localPosts : searchResults}
                                renderItem={renderItem}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                onScrollBeginDrag={() => {
                                    Keyboard.dismiss();
                                    searchInputRef.current?.blur?.();
                                }}
                                keyExtractor={(item, index) => `${item.resource_id}-${index}`}
                                onViewableItemsChanged={onViewableItemsChanged}
                                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                                ListEmptyComponent={
                                    (searchTriggered && searchResults.length === 0) ? (
                                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                                            <Text style={{ fontSize: 16, color: '#666' }}>No resources found</Text>
                                        </View>
                                    ) : null
                                }
                                ListHeaderComponent={
                                    <View>
                                        {searchTriggered && searchResults.length > 0 && (
                                            <Text style={styles.companyCount}>
                                                {searchResults.length} results found
                                            </Text>
                                        )}
                                    </View>
                                }
                                ListFooterComponent={
                                    loadingMore ? (
                                        <ActivityIndicator size="small" color="#075cab" style={{ marginVertical: 20 }} />
                                    ) : null
                                }
                                refreshControl={
                                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                                }
                                onEndReached={() => {
                                    if (hasMorePosts) {
                                        fetchPosts(lastEvaluatedKey);
                                    }
                                }}
                                onEndReachedThreshold={0.5}
                                contentContainerStyle={{ paddingBottom: '5%', }}

                            />
                        ) : (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <ActivityIndicator color={'#075cab'} size="large" />
                            </View>
                        )}

                        {loading1 && (
                            <View style={styles.overlay}>
                                <ActivityIndicator size="large" color="#fff" />
            
                            </View>
                        )}
                    </View>
                </TouchableWithoutFeedback>

            </View>
        </Profiler>
    );
};


const styles = StyleSheet.create({

    scrollView: {
        flex: 1,
        backgroundColor: "#f9f9f9",
    },
    image: {
        width: 100,
        height: 100,
        resizeMode: 'contain'
    },

    videoContainer: {

        flex: 1,
        justifyContent: 'center',
        marginLeft: 5
    },
    video: {
        width: 100,
        height: 100,

    },
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      },
    
      overlayText: {
        color: "#fff",
        marginTop: 10,
        fontSize: 16,
      },

    documentContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        padding: 10,
    },
    docText: {
        marginTop: 5,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#075cab',
    },

    centeredFileContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,

    },
    actionText: {
        marginTop: 5,
        fontSize: 12,
        color: '#075cab',
    },

    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignSelf: 'center',

    },

    comments: {
        borderTopWidth: 0.5,
        borderColor: '#ccc',
        paddingVertical: 10,
        backgroundColor: 'white',
        minHeight: 120,
        marginBottom: 5,
    },

    image1: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderRadius: 100,
    },

    title: {
        fontSize: 13,
        color: colors.text_secondary,
        fontWeight: '300',
        textAlign: 'justify',
        alignItems: 'center',

    },

    title3: {
        fontSize: 15,
        color: 'black',
        // marginBottom: 5,
        fontWeight: '500',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',


    },
    date1: {
        fontSize: 11,
        fontWeight: "300",
        color: colors.text_secondary,

    },
    title1: {
        fontSize: 14,
        fontWeight: '600',
        alignItems: 'center',
        color: '#000',
        lineHeight: 21,

    },

    readMore: {
        color: 'gray',
        fontWeight: '300',
        fontSize: 13,
    },

    dpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        paddingHorizontal: 10,

    },
    dpContainer1: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        alignSelf: 'flex-start',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'space-between',

    },
    searchContainer1: {
        flex: 1,
        flexDirection: 'row',
        alignSelf: 'center',
        padding: 10,
        borderRadius: 10,

    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        borderRadius: 10,
        backgroundColor: 'whitesmoke',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        backgroundColor: "whitesmoke",
        paddingHorizontal: 15,
        borderRadius: 10,
    },

    searchIconButton: {
        padding: 8,
        overflow: 'hidden',
        backgroundColor: '#e6f0ff',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    iconButton: {
        padding: 8,
        overflow: 'hidden',
        backgroundColor: '#e6f0ff',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,

    },

    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        padding: 10

    },
    iconText: {
        fontSize: 12,
        color: '#075cab',
    },

    backButton: {
        alignSelf: 'center',
        padding: 10

    },

    companyCount: {
        fontSize: 13,
        fontWeight: '400',
        color: 'black',
        paddingHorizontal: 10,
        paddingVertical: 5

    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
borderBottomWidth:0.5,
borderColor:'#f0f0f0'
    },

    iconTextUnderlined: {
        color: '#075cab',
        marginLeft: 1
    },

    closeButton: {
        position: 'absolute',
        top: 70,
        left: 10,
        zIndex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 5,
        borderRadius: 30,
    },

    commentItem: {
        flexDirection: "column",
        padding: 10,
        // borderBottomWidth: 1,
        // borderBottomColor: "#ddd",
        backgroundColor: "#fff",
        position: "relative",
    },
    commentHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    profileIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    authorContainer: {
        flexDirection: "row",  // Arrange items in a row
        alignItems: "center",  // Center vertically
        gap: 6,  // Space between author and time
    },
    authorText: {
        fontWeight: "500",
        color: "black",
        fontSize: 14,
    },
    timestampText: {
        fontSize: 12,
        fontWeight: "400",
        color: "gray",
    },
    commentTextContainer: {
        flex: 1,
        justifyContent: "center",
    },

    commentText: {
        fontSize: 14,
        color: "#333",
        marginTop: 4,
        lineHeight: 20,
    },

    buttonContainer: {
        flexDirection: 'row',
        position: "absolute",
        top: 2,
        right: 8,
        backgroundColor: "#fff",
        borderRadius: 8,

    },
    deleteButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginHorizontal: 3,
        backgroundColor: "#ffe6e6",
        borderRadius: 5,
    },
    editButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginHorizontal: 3,
        backgroundColor: "#e6f0ff",
        borderRadius: 5,
    },
    blockButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginHorizontal: 3,
        backgroundColor: "#fff3e6",
        borderRadius: 5,
    },
    stickyContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    stickyContainer1: {
        flexDirection: "row",
        alignItems: "center",
        // paddingVertical: 8,
        backgroundColor: "#f9f9f9",
        borderWidth: 1,
        borderColor: "#ccc",
        flex: 1,
        height: 40,
        borderRadius: 25,
        fontSize: 16,
        paddingRight: 5,
    },
    sheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        backgroundColor: "#fff",
    },

    sheetTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },

    closeButton1: {
        padding: 8,
    },

    input: {
        flex: 1,
        height: 30,
        borderRadius: 20,
        fontSize: 16,
        backgroundColor: "#f9f9f9",
        paddingHorizontal: 5,
        marginLeft: 10
    },
    submitButton: {
        backgroundColor: "#075cab",
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
        width: 30,
        height: 30,
    },


});


export default ResourcesList;
