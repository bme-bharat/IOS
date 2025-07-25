import React, { useState, useEffect, useCallback, useRef, Profiler, useMemo } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, Dimensions, Modal, StyleSheet, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, SafeAreaView, ActivityIndicator, ToastAndroid, Linking, RefreshControl, Share, ScrollView } from "react-native";
import Video from "react-native-video";
import { useIsFocused } from "@react-navigation/native";
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import maleImage from '../../images/homepage/dummy.png';
import femaleImage from '../../images/homepage/female.jpg';
import companyImage from '../../images/homepage/buliding.jpg'
import FastImage from "react-native-fast-image";
import ParsedText from "react-native-parsed-text";
import apiClient from "../ApiClient";
import { useDispatch, useSelector } from "react-redux";
import { clearResourcePosts, updateOrAddResourcePosts } from "../Redux/Resource_Actions";
import Fuse from "fuse.js";

import { useFileOpener } from "../helperComponents.jsx/fileViewer";

import { useConnection } from "../AppUtils/ConnectionProvider";
import AppStyles from "../../assets/AppStyles";
import { getTimeDisplay, getTimeDisplayForum, highlightMatch } from "../helperComponents.jsx/signedUrls";
import { openMediaViewer } from "../helperComponents.jsx/mediaViewer";
import { ForumBody, normalizeHtml, } from "../Forum/forumBody";
import { EventRegister } from "react-native-event-listeners";

const videoExtensions = [
    '.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm',
    '.m4v', '.3gp', '.3g2', '.f4v', '.f4p', '.f4a', '.f4b', '.qt', '.quicktime'
];
const extensionMap = {
    'vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/pdf': 'pdf',
    'vnd.ms-excel': 'xls',
    'application/msword': 'doc',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.ms-powerpoint': 'ppt',
    'text/plain': 'txt',
    'image/webp': 'webp',
    'sheet': 'xlsx',
    'presentation': 'pptx',
    'msword': 'doc',
    'document': 'docx',
    'ms-excel': 'xls',
    'ms-powerpoint': 'ppt',
    'plain': 'txt',
};
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']; // or more if needed

const fileIcons = {
    pdf: 'file-pdf-box',
    doc: 'file-word-box',
    docx: 'file-word-box',
    xls: 'file-excel-box',
    xlsx: 'file-excel-box',
    ppt: 'file-powerpoint-box',
    pptx: 'file-powerpoint-box',
    txt: 'file-document-outline',
    jpeg: 'file-image',
    jpg: 'file-image',
    png: 'file-image',
    webp: 'file-image',
};
const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');
const maxAllowedHeight = Math.round(deviceHeight * 0.6);

const ResourcesList = ({ navigation, route }) => {

    const posts = useSelector(state => state.resources.resourcePosts);
    const dispatch = useDispatch();
    const { isConnected } = useConnection();
    const videoRefs = useRef({});
    const [localPosts, setLocalPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const listRef = useRef(null);
console.log('localPosts',localPosts[0])
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
            console.log('[onResourcePostCreated] New post received:', newPost);

            try {
                const postWithMedia = await fetchMediaForPost(newPost);
                console.log('[onResourcePostCreated] Post with media:', postWithMedia);

                setLocalPosts((prevPosts) => {
                    const alreadyExists = prevPosts.some(p => p.resource_id === postWithMedia.resource_id);
                    if (alreadyExists) {
                        console.log('[onResourcePostCreated] Post already exists, skipping.');
                        return prevPosts;
                    }
                    console.log('[onResourcePostCreated] Adding new post to localPosts');
                    return [postWithMedia, ...prevPosts];
                });

            } catch (error) {
                console.error('[onResourcePostCreated] Failed to fetch media for post:', error);
            }
        });

        return () => {
            EventRegister.removeEventListener(listener);
            console.log('[onResourcePostCreated] Listener removed');
        };
    }, []);

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
                    const postWithMedia = await fetchMediaForPost(post);

                    return {
                        ...postWithMedia,
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


    const getMappedExtension = (fileKey = '') => {
        const rawExt = fileKey?.split('.').pop()?.toLowerCase();
        return extensionMap[rawExt] || rawExt;
      };
      
    const fetchMediaForPost = async (post) => {
        const mediaData = { resource_id: post.resource_id };

        if (post.fileKey) {
            try {
                const res = await apiClient.post('/getObjectSignedUrl', {
                    command: "getObjectSignedUrl",
                    key: post.fileKey
                });

                const url = res.data;

                if (url) {
                    mediaData.fileUrl = url;

                    if (videoExtensions.some(ext => post.fileKey.toLowerCase().endsWith(ext))) {
                        mediaData.videoUrl = url;

                        // Fetch video thumbnail
                        if (post.thumbnail_fileKey) {
                            try {
                                const thumbRes = await apiClient.post('/getObjectSignedUrl', {
                                    command: "getObjectSignedUrl",
                                    key: post.thumbnail_fileKey
                                });
                                mediaData.thumbnailUrl = thumbRes.data;

                                await new Promise((resolve) => {
                                    Image.getSize(mediaData.thumbnailUrl, (width, height) => {
                                        mediaData.aspectRatio = width / height;
                                        resolve();
                                    }, resolve);
                                });
                            } catch (error) {
                                mediaData.thumbnailUrl = null;
                                mediaData.aspectRatio = 1;
                            }
                        } else {
                            mediaData.thumbnailUrl = null;
                            mediaData.aspectRatio = 1;
                        }
                    } else if (documentExtensions.some(ext => post.fileKey.toLowerCase().endsWith(ext))) {
                        mediaData.documentUrl = url;
                    } else {

                        await new Promise((resolve) => {
                            Image.getSize(url, (width, height) => {
                                mediaData.aspectRatio = width / height;
                                resolve();
                            }, resolve);
                        });
                        mediaData.imageUrl = url;
                    }
                }
            } catch (error) {
                mediaData.imageUrl = null;
                mediaData.videoUrl = null;
                mediaData.documentUrl = null;
            }
        }

        if (post.author_fileKey) {
            try {
                const authorImageRes = await apiClient.post('/getObjectSignedUrl', {
                    command: "getObjectSignedUrl",
                    key: post.author_fileKey
                });
                mediaData.authorImageUrl = authorImageRes.data;
            } catch (error) {
                mediaData.authorImageUrl = null;
            }
        }

        return { ...post, ...mediaData };
    };






    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (!isFocused || viewableItems.length === 0) {
            return;
        }

        // Get all visible videos sorted by index
        const visibleVideos = viewableItems
            .filter((item) => item.item.videoUrl && item.item.resource_id)
            .sort((a, b) => a.index - b.index);

        if (visibleVideos.length > 0) {
            const firstVisibleVideo = visibleVideos[0]; // Get the first visible video
            const currentPlaying = viewableItems.find((item) => item.item.resource_id === activeVideo);

            // **If the currently playing video is scrolled away, pause it**
            if (activeVideo && !viewableItems.some((item) => item.item.resource_id === activeVideo)) {
                setActiveVideo(null);
            }

            // **Start the new video if needed**
            if (!activeVideo || firstVisibleVideo.item.resource_id !== activeVideo) {
                setActiveVideo(firstVisibleVideo.item.resource_id);
            }
        } else {
            // **No videos in view, stop playback**
            setActiveVideo(null);
        }
    }).current;




    useEffect(() => {
        if (!isFocused) {
            setActiveVideo(null);
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


    const renderItem = useCallback(({ item }) => {
        let height;
        if (item.extraData?.aspectRatio) {
          const aspectRatioHeight = Math.round(deviceWidth / item.extraData?.aspectRatio);
    
          height = aspectRatioHeight > maxAllowedHeight ? maxAllowedHeight : aspectRatioHeight;
        } else {
    
          height = deviceWidth;
        }
        const urlWithoutQuery = item.fileKey?.split('?')[0];
        let fileExtension = urlWithoutQuery?.split('.').pop()?.toLowerCase();

        const validExtensions = new Set(Object.values(extensionMap));

        const isValidFileKey = (fileKey = '') => {
            const extension = fileKey?.split('.').pop()?.toLowerCase();
            const mappedExtension = extensionMap[extension] || extension;
            return validExtensions.has(mappedExtension);
          };
          

        const getFileIcon = (fileKey) => {
            if (!fileKey) return 'file-document';

            const parts = fileKey.split('.');
            let extension = parts.length > 1 ? parts.pop().toLowerCase() : '';
            extension = extensionMap[extension] || extension;
            const icon = fileIcons[extension] || 'file-document';

            return icon;
        };


        if (extensionMap[fileExtension]) {
            fileExtension = extensionMap[fileExtension];
        }

        const isDocument = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension);

        return (
            <TouchableOpacity activeOpacity={1}>
                <View style={styles.comments}>
                    <View style={styles.dpContainer}>
                        <TouchableOpacity style={styles.dpContainer1} onPress={() => handleNavigate(item)} activeOpacity={1}>
                            <FastImage
                                source={
                                    item.author_fileKey
                                        ? { uri: item.authorImageUrl }
                                        : item.user_type === 'company'
                                            ? companyImage
                                            : item.user_type === 'BME_EDITOR' || item.user_type === 'BME_ADMIN' || item.author_gender === 'Male'
                                                ? maleImage
                                                : femaleImage
                                }
                                style={styles.image1}
                            />
                        </TouchableOpacity>
                        <View style={styles.textContainer}>
                            <View style={styles.title3}>
                                <TouchableOpacity onPress={() => handleNavigate(item)}>
                                    <Text style={{ flex: 1, alignSelf: 'flex-start', color: 'black', fontSize: 15, fontWeight: '500' }}>
                                        {(item.author || '').trimStart().trimEnd()}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <View>
                                    <Text style={styles.title}>{item.author_category || ''}</Text>
                                </View>
                                <View>
                                    <Text style={[styles.date1]}>{getTimeDisplayForum(item.posted_on)}</Text>
                                </View>
                            </View>
                        </View>

                    </View>

                    <View style={{ paddingHorizontal: 15, marginVertical: 5 }}>
                        {/* <Text style={styles.title1}>{item?.title}</Text> */}
                        <Text  style={styles.title1}>{highlightMatch(item?.title || '', searchQuery)}</Text>

                        <ForumBody
                            html={normalizeHtml(item?.resource_body, searchQuery)}
                            forumId={item.resource_id}
                            isExpanded={expandedTexts[item.resource_id]}
                            toggleFullText={toggleFullText}
                        />
                    </View>


                    {item?.fileKey && isValidFileKey(item.fileKey) && (
                        <TouchableOpacity
                            style={styles.centeredFileContainer}
                            onPress={() => handleOpenResume(item.fileKey)}
                        >
                            <Icon name={getFileIcon(item.fileKey)} size={50} color="#075cab" />
                            {loading1 ? (
                                <ActivityIndicator size="small" color="#075cab" style={styles.viewResumeText} />
                            ) : (
                                <Text style={styles.actionText}>View</Text>
                            )}
                        </TouchableOpacity>
                    )}


                    {/* Video Display */}
                    {item.videoUrl && (
                        <TouchableOpacity activeOpacity={1} style={{ paddingHorizontal: 5, }}>

                            <Video
                                ref={(ref) => {
                                    if (ref) {
                                        videoRefs.current[item.resource_id] = ref;
                                    }
                                }}
                                source={{ uri: item.videoUrl }}
                                style={{
                                    width: '100%',
                                    height:height,

                                }}
                                controls
                                paused={activeVideo !== item.resource_id}
                                resizeMode="cover"
                                poster={item.thumbnailUrl}
                                repeat
                                posterResizeMode="cover"
                                controlTimeout={2000}

                            />
                        </TouchableOpacity>
                    )}

                    {item.imageUrl && !isDocument && !item.videoUrl && (
                        <TouchableOpacity activeOpacity={1} style={{ paddingHorizontal: 5 }} onPress={() => openMediaViewer([{ type: 'image', url: item.imageUrl }])}>
                            <FastImage source={{ uri: item.imageUrl }} style={{ width: '100%', aspectRatio: item.aspectRatio || 1 }} />
                        </TouchableOpacity>
                    )}


                    <TouchableOpacity style={styles.shareButton} onPress={() => shareResource(item.resource_id)}>
                        <Icon name="share" size={22} color="#075cab" />
                        <Text style={styles.iconTextUnderlined}>Share</Text>
                    </TouchableOpacity>

                </View>
            </TouchableOpacity>
        );
    }, [activeVideo, expandedTexts,]);

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
            <SafeAreaView style={{ flex: 1, backgroundColor: 'whitesmoke' }}>
                <View style={styles.searchContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-left" size={24} color="#075cab" />
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
                                    <Icon name="close-circle" size={20} color="gray" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity

                                    style={styles.searchIconButton}
                                >
                                    <Icon name="magnify" size={20} color="#075cab" />
                                </TouchableOpacity>

                            )}
                        </View>
                    </View>
                    <TouchableOpacity style={AppStyles.circle}
                        onPress={() => navigation.navigate("ResourcesPost")} activeOpacity={0.8}>
                        <Icon name="plus-circle-outline" size={18} color="#075cab" style={styles.postIcon} />
                        <Text style={AppStyles.shareText}>Contribute</Text>
                    </TouchableOpacity>

                </View>

                <TouchableWithoutFeedback
                    onPress={() => {
                        Keyboard.dismiss();
                        searchInputRef.current?.blur?.();

                    }}
                >
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
                            contentContainerStyle={{ paddingBottom: '20%' }}
                            style={styles.scrollView}
                        />
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator color={'#075cab'} size="large" />
                        </View>
                    )}
                </TouchableWithoutFeedback>
            </SafeAreaView>
        </Profiler>
    );
};


const styles = StyleSheet.create({

    scrollView: {
        flex: 1,
        backgroundColor: "#f9f9f9",
    },

    centeredFileContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        backgroundColor:'red'
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
        marginBottom: 10,
    },

    image1: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderRadius: 100,
    },

    title: {
        fontSize: 13,
        color: 'black',
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
        fontSize: 13,
        color: '#666',
        // marginBottom: 5,
        fontWeight: '300',


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
        // marginBottom: 10,
        paddingHorizontal: scale(15),

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
        height: 30,
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
        backgroundColor: 'whitesmoke',

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
