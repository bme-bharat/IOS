

import { StyleSheet, Text, View, Button, TouchableOpacity, Linking, SafeAreaView, ActivityIndicator, ScrollView, Share } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import maleImage from '../../images/homepage/dummy.png';
import femaleImage from '../../images/homepage/female.jpg';
import companyImage from '../../images/homepage/buliding.jpg';
import VideoPlayer from 'react-native-video-controls';

import ParsedText from 'react-native-parsed-text';
import apiClient from '../ApiClient';
import { useNetwork } from '../AppUtils/IdProvider';
import { getTimeDisplay } from '../helperComponents.jsx/signedUrls';
import { ForumBody } from '../Forum/forumBody';
import { openMediaViewer } from '../helperComponents.jsx/mediaViewer';
const ResourcesDetails = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { myId, myData } = useNetwork();
    const { resourceID } = route.params || {};
    const [postData, setPostData] = useState(null);
    const [mediaUrl, setMediaUrl] = useState(null);
    const [authorImageUrl, setAuthorImageUrl] = useState(null);
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState(null);
    const [expandedPosts, setExpandedPosts] = useState({});

    const toggleFullText = (forumId) => {
        setExpandedTexts((prev) => ({
            ...prev,
            [forumId]: !prev[forumId],
        }));
    };

    const getText1 = (text, forumId) => {
        if (expandedPosts[forumId] || text.length <= 200) {
            return text;
        }
        return text.slice(0, 200) + ' ...';
    };



    const [loading, setLoading] = useState(false);

    const fetchResourceDetails = async () => {
        setLoading(true);
        try {
            const res = await apiClient.post('/getResourcePost', {
                command: 'getResourcePost',
                user_id: myId,
                resource_id: resourceID,
            });

            const responseData = res?.data;

            if (responseData?.status === 'success') {
                const post = responseData.response?.[0];



                if (post) {
                    setPostData(post);

                    // Fetch media URLs
                    if (post.fileKey) fetchMediaUrl(post.fileKey, 'content');
                    if (post.thumbnail_fileKey) fetchMediaUrl(post.thumbnail_fileKey, 'thumbnail');
                    if (post.author_fileKey) fetchMediaUrl(post.author_fileKey, 'author');
                } else {
                    setPostData({ removed_by_author: true });
                }
            } else {

                setPostData({ removed_by_author: true });
            }
        } catch (error) {

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (!myId || !resourceID) return;

        fetchResourceDetails();
    }, [myId, resourceID]);



    const handleUrlPress = (url) => {
        Linking.openURL(url)
            .catch((err) => {
                console.error("Failed to open URL: ", err);
                // Show a toast message if URL fails to open
                Toast.show({
                    type: 'error',
                    position: 'bottom',
                    text1: 'Failed to open the link',
                    text2: 'Please try again later.',
                });
            });
    };


    const fileTypeMap = {
        'vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', icon: 'file-word', color: '#075cab' },
        'vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', icon: 'file-excel', color: '#075cab' },
        'vnd.openxmlformats-officedocument.presentationml.presentation': { ext: 'pptx', icon: 'file-powerpoint', color: '#075cab' },
        'application/pdf': { ext: 'pdf', icon: 'file-pdf-box', color: '#075cab' },
        'application/msword': { ext: 'doc', icon: 'file-word', color: '#075cab' },
        'application/vnd.ms-excel': { ext: 'xls', icon: 'file-excel', color: '#075cab' },
        'application/vnd.ms-powerpoint': { ext: 'ppt', icon: 'file-powerpoint', color: '#075cab' },
        'text/plain': { ext: 'txt', icon: 'file-document', color: '#075cab' },
        'image/webp': { ext: 'webp', icon: 'file-image', color: '#075cab' },
        'sheet': { ext: 'xlsx', icon: 'file-excel', color: '#075cab' },
        'presentation': { ext: 'pptx', icon: 'file-powerpoint', color: '#075cab' },
        'msword': { ext: 'doc', icon: 'file-word', color: '#075cab' },
        'document': { ext: 'docx', icon: 'file-word', color: '#075cab' },
        'ms-excel': { ext: 'xls', icon: 'file-excel', color: '#075cab' },
        'ms-powerpoint': { ext: 'ppt', icon: 'file-powerpoint', color: '#075cab' },
        'plain': { ext: 'txt', icon: 'file-document', color: '#075cab' },
    }

    const [isVideoLoaded, setIsVideoLoaded] = useState(false);

    // Focus effect: start video when screen is focused
    useFocusEffect(
        useCallback(() => {
            if (fileExtension) {
                setIsVideoPlaying(true);
            }

            return () => {
                setIsVideoPlaying(false);

            };
        }, [fileExtension])
    );


    const handleVideoLoad = () => {
        setIsVideoLoaded(true);
        setIsVideoPlaying(true); // 🔥 start playing!
    };

    const handleOptionClick = (option) => {
        if (option === 'Contact') {
            setModalVisible1(true);
        } else if (option === 'Share') {
            shareJob(postData?.resource_id);
        }

    };


    const shareJob = async (forum_id) => {
        try {
            const baseUrl = 'https://bmebharat.com/Resource/'; // Replace with your actual base URL
            const jobUrl = `${baseUrl}${forum_id}`; // Assuming company.company_id is the unique identifier for the job

            const result = await Share.share({
                message: `Checkout this resource: ${jobUrl}`, // Add job link
            });


            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // Handle activity type if needed
                } else {
                    // Shared without a specific activity
                }
            } else if (result.action === Share.dismissedAction) {
                // User dismissed the share dialog
            }
        } catch (error) {
            // console.log('Error sharing the job:', error); // Check for errors
        }
    };

    const handleNavigate = (item) => {
        if (item.user_type === "company") {

            // Navigate to CompanyDetailsPage for company users
            navigation.navigate('CompanyDetailsPage', { userId: item.user_id });
        } else if (item.user_type === "users") {
            // Navigate to UserDetailsPage for regular users
            navigation.navigate('UserDetailsPage', { userId: item.user_id });
        }
    };
    const fetchMediaUrl = async (fileKey, type) => {
        try {
            setLoadingMedia(true);
            const mediaRes = await fetch(
                'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/getObjectSignedUrl',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
                    },
                    body: JSON.stringify({ command: 'getObjectSignedUrl', key: fileKey }),
                }
            );
            const mediaData = await mediaRes.json();
            if (type === 'author') {
                setAuthorImageUrl(mediaData);
            } else if (type === 'content') {
                setMediaUrl(mediaData);
            } else if (type === 'thumbnail') {
                setThumbnailUrl(mediaData);  // Store thumbnail URL
            }
        } catch (error) {
            console.error('Error fetching media URL:', error);
        } finally {
            setLoadingMedia(false);
        }
    };



    let authorImage = maleImage; // Default image
    if (postData?.author_gender === 'Female') {
        authorImage = femaleImage; // Female image
    } else if (postData?.user_type === 'company') {
        authorImage = companyImage; // Company image
    }

    const videoExtensions = ['mp4', 'mov', 'quicktime', 'avi', 'flv', 'wmv', 'mkv', 'webm', 'mpeg'];
    const fileExtension = postData?.fileKey ? postData.fileKey.split('.').pop().toLowerCase() : '';
    const [expandedTexts, setExpandedTexts] = useState({});
    const rawHtml = (postData?.resource_body || '').trim();
    const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(rawHtml);
    const forumBodyHtml = hasHtmlTags ? rawHtml : `<p>${rawHtml}</p>`;


    if (!postData) {
        // Post is not loaded yet or null
        return (
            <SafeAreaView style={styles.mainContainer}>

                <View style={styles.headerContainer1}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-left" size={24} color="#075cab" />
                    </TouchableOpacity>

                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Loading ...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (postData?.removed_by_author) {
        return (
            <SafeAreaView style={styles.mainContainer}>
                <View style={styles.headerContainer1}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-left" size={24} color="#075cab" />
                    </TouchableOpacity>

                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, color: 'gray' }}>This post was removed by the author</Text>
                </View>
            </SafeAreaView>
        );
    }
    return (

        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.headerContainer1}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color="#075cab" />
                </TouchableOpacity>


                <TouchableOpacity onPress={() => handleOptionClick('Share')} style={styles.dropdownItem}>
                    <Icon name="share-variant" size={17} color="#075cab" style={styles.icon} />
                    <Text style={styles.dropdownText}>Share</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.divider} />

            <ScrollView
                contentContainerStyle={{ paddingBottom: "20%", }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.container}>
                    {/* Author section */}
                    <View style={styles.authorContainer}>
                        {authorImageUrl ? (
                            <FastImage
                                source={{ uri: authorImageUrl }}
                                style={styles.authorImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <FastImage
                                source={authorImage}
                                style={styles.authorImage}
                                resizeMode="cover"
                            />
                        )}
                        <View style={styles.authorInfo}>
                            <View style={styles.authorNameRow}>
                                <Text style={styles.authorName} onPress={() => handleNavigate(postData)}>{postData?.author}</Text>

                                <Text style={styles.timeText}>
                                    {getTimeDisplay(postData?.posted_on)}
                                </Text>
                            </View>
                            <Text style={styles.authorCategory}>{postData?.author_category}</Text>
                        </View>
                    </View>
                    <Text style={styles.title}>{postData?.title}</Text>

                    <ForumBody
                        html={forumBodyHtml}
                        forumId={postData?.resource_id}
                        isExpanded={expandedTexts[postData?.resource_id]}
                        toggleFullText={toggleFullText}
                    // only meaningful here
                    />


                    {loadingMedia ? (
                        <ActivityIndicator size="small" color="#075cab" />
                    ) : mediaUrl && fileExtension ? (
                        <View style={styles.fileContainer} >
                            {['png', 'jpeg', 'jpg', 'webp'].includes(fileExtension) ? (
                                <TouchableOpacity onPress={() => openMediaViewer([{ type: 'image', url: mediaUrl }])}
                                    activeOpacity={1} >
                                    <FastImage
                                        source={{ uri: mediaUrl }}
                                        style={styles.resourceImage}
                                        resizeMode="contain"
                                    />
                                </TouchableOpacity>
                            ) : videoExtensions.includes(fileExtension) ? (
                                <View style={styles.videoContainer} >
                                    <Video
                                        source={{ uri: mediaUrl }}
                                        style={[styles.video, { backgroundColor: "#fff" }]}
                                        resizeMode="contain"
                                        onLoad={handleVideoLoad}
                                        paused={!isVideoPlaying}
                                        disableFullscreen={true}
                                        repeat
                                        controls
                                        onBack={() => null} // Optional: handle back button
                                        controlTimeout={2000} // Optional: hide controls after X ms
                                        tapAnywhereToPause={true}
                                        poster={thumbnailUrl} // Video poster thumbnail
                                    />

                                </View>
                            ) : fileExtension === 'pdf' ? (
                                <TouchableOpacity onPress={() => Linking.openURL(mediaUrl)} style={styles.pdfButton}>
                                    <Icon name="file-pdf-box" size={30} color="#075cab" />
                                    <Text style={styles.pdfText}>View/download</Text>
                                </TouchableOpacity>
                            ) : fileTypeMap[fileExtension] ? (
                                <TouchableOpacity onPress={() => Linking.openURL(mediaUrl)} style={styles.pdfButton}>
                                    <Icon name={fileTypeMap[fileExtension].icon} size={30} color={fileTypeMap[fileExtension].color} />
                                    <Text style={styles.pdfText}>View/download</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text>Unsupported file type</Text>
                            )}

                        </View>
                    ) : null}

                </View>
            </ScrollView>

        </SafeAreaView>

    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#fff' },
    backButton: { padding: 10, alignSelf: 'flex-start' },
    container: { padding: 10, },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,

    },
    headerContainer1: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        elevation: 1,  // for Android
        shadowColor: '#000',  // shadow color for iOS
        shadowOffset: { width: 0, height: 1 },  // shadow offset for iOS
        shadowOpacity: 0.1,  // shadow opacity for iOS
        shadowRadius: 2,  // shadow radius for iOS
    },

    pdfButton: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,

        borderRadius: 5,
        marginTop: 10,
    },

    scrollContainer: {

        paddingBottom: "20%", // Prevent cut off at bottom
    },

    pdfText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#075cab',
        fontWeight: 'bold',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    dropdownText: {
        fontSize: 16,
        color: '#075cab',
    },
    icon: {
        marginRight: 10,
    },
    divider: {
        borderBottomWidth: 0.5,
        borderBottomColor: "#ccc",
        // marginVertical: 10,
    },
    authorImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 5,
    },
    authorPlaceholder: {
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    authorInfo: {
        flex: 1,
    },
    authorNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    authorName: {
        fontSize: 16,
        color: 'black',
        fontWeight: '500',
        maxWidth: '70%'

    },
    authorCategory: {
        fontSize: 13,
        color: 'black',
        fontWeight: '300',
    },
    timeText: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        color: '#000',
        lineHeight: 21,

    },

    readMore: {
        color: 'gray', // Blue color for "Read More"
        fontWeight: '300', // Make it bold if needed
        fontSize: 13,
    },
    fileContainer: {
        marginTop: 10,
        borderRadius: 8,
        overflow: 'hidden',
    },
    resourceImage: {
        width: '100%',
        height: '100%',
    },
    videoContainer: {
        width: '100%',
        height: 250, // or '100%' based on screen space
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff', // white background
    },
    video: {
        width: '100%',
        height: '100%',
    },

    iconContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -25 }, { translateY: -25 }],
    },
});






export default ResourcesDetails;