

import { StyleSheet, Text, View, Button, TouchableOpacity, Linking, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
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
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';
import { getTimeDisplay } from '../helperComponents/signedUrls';

const EnquiryDetails = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { enquiryID } = route.params || {};
    const [postData, setPostData] = useState(null);
    const [mediaUrl, setMediaUrl] = useState(null);
    const [authorImageUrl, setAuthorImageUrl] = useState(null);
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const { myId, myData } = useNetwork();



    const [expandedPosts, setExpandedPosts] = useState({});

    const toggleFullText = (forumId) => {
        setExpandedPosts((prev) => ({
            ...prev,
            [forumId]: !prev[forumId], // Toggle only the selected post
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
        setLoading(true)
        try {
            const res = await axios.post(
                'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/getEnquiryDetailsById',
                { command: 'getEnquiryDetailsById', user_id: myId, enquiry_id: enquiryID },
                { headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' } }
            );

            if (res.data.status === 'success') {
                console.log(res.data)
                if (res.data.status === 'success' && res.data.response.length > 0) {
                    setPostData(res.data.response[0]);
                } else {
                
                    setPostData(null);
                }

                if (res.data.response[0]?.enquiry_fileKey) {
                    fetchMediaUrl(res.data.response[0].enquiry_fileKey, 'content');
                }
                if (res.data.response[0]?.thumbnail_fileKey) {
                    fetchMediaUrl(res.data.response[0].thumbnail_fileKey, 'thumbnail');
                }
                // Fetch author image URL if author has fileKey
                if (res.data.response[0]?.user_fileKey) {
                    fetchMediaUrl(res.data.response[0].user_fileKey, 'author');
                }
            }
        } catch (error) {
     
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        if (!enquiryID) return;

        fetchResourceDetails();
    }, [ enquiryID]);



    const handleUrlPress = (url) => {
        Linking.openURL(url)
            .catch((err) => {
                showToast("Failed to open the link", 'error');

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


    const handleNavigate = (item) => {
        console.log('item',item)
        const userType = item.enquired_user_type || item.user_type;

        if (userType === "company") {
            navigation.navigate('CompanyDetailsPage', { userId: item.user_id });
        } else if (userType === "users") {
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
                setThumbnailUrl(mediaData);
            }
        } catch (error) {
     
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
    const fileExtension = postData?.enquiry_fileKey ? postData.enquiry_fileKey.split('.').pop().toLowerCase() : '';
    const [isFallbackVisible, setIsFallbackVisible] = useState(false);

    useEffect(() => {
        if (!postData) {
            const timer = setTimeout(() => {
                setIsFallbackVisible(true);
            }, 1000); // Adjust delay as needed

            return () => clearTimeout(timer); // Cleanup if post comes in
        } else {
            setIsFallbackVisible(false); // Reset fallback visibility if post is available
        }
    }, [postData]);

    return (

        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color="#075cab" />
                </TouchableOpacity>

            </View>
            <View style={styles.divider} />

            {postData && Object.keys(postData).length > 0 ? (
                <ScrollView
                    contentContainerStyle={{ paddingBottom: "20%", paddingHorizontal: 10 }}
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
                                    <Text style={styles.authorName} onPress={() => handleNavigate(postData)}>
                                        {postData?.first_name}</Text>
                                    <Text style={styles.timeText}>
                                        {getTimeDisplay(postData?.enquired_on)}
                                    </Text>
                                </View>
                                <Text style={styles.authorCategory}>{postData?.company_category}</Text>
                            </View>
                        </View>

                        {/* Content section */}
                        <Text style={styles.title}>{postData?.service_title}</Text>

                        <Text style={styles.title}>{postData?.enquiry_description}</Text>

                        <TouchableOpacity onPress={() => toggleFullText(postData?.enquiry_id)} activeOpacity={1} style={styles.textContainer}>
                            <Text style={styles.body}>
                                <ParsedText
                                    style={{ color: 'black' }}
                                    parse={[
                                        {
                                            pattern: /(?:https?:\/\/[^\s/$.?#].[^\s]*|www\.[^\s]+)/g,
                                            style: { color: '#075cab', textDecorationLine: 'underline' },
                                            onPress: handleUrlPress,
                                            renderText: (matchingString) =>
                                                matchingString.startsWith(' ') ? matchingString : ` ${matchingString}`,
                                        },
                                    ]}
                                >
                                    {getText1((postData?.resource_body || '').trimStart().trimEnd(), postData?.enquiry_id)}
                                </ParsedText>
                                {postData?.resource_body?.length > 200 && !expandedPosts[postData?.enquiry_id] && (
                                    <Text style={styles.readMore}> Read More</Text>
                                )}
                            </Text>
                        </TouchableOpacity>



                        {loadingMedia ? (
                            <ActivityIndicator size="small" color="#075cab" />
                        ) : mediaUrl && fileExtension ? (
                            <View style={styles.fileContainer}>
                                {(fileExtension === 'pdf' || fileTypeMap[fileExtension]) ? (
                                    <TouchableOpacity onPress={() => Linking.openURL(mediaUrl)} style={styles.pdfButton}>
                                        <Icon
                                            name={fileTypeMap[fileExtension]?.icon || 'file-download'}
                                            size={50}
                                            color={fileTypeMap[fileExtension]?.color || '#075cab'}
                                        />
                                        <Text style={styles.pdfText}>View/download</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text>Unsupported file type</Text>
                                )}
                            </View>

                        ) : null}

                    </View>
                </ScrollView>

            ) : isFallbackVisible ? (
                <Text style={{ fontWeight: '400', textAlign: 'center', padding: 10, fontSize: 16 }}>
                    This post was removed by the author
                </Text>
            ) : null}

        </SafeAreaView>

    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#fff' },
    backButton: { padding: 10, alignSelf: 'flex-start' },
    container: { padding: 10 },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,

    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
          borderBottomWidth: 1,
        borderColor: '#f0f0f0'
    
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
        maxWidth:'70%'
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
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 10,
        color: '#333',
    },
    body: {
        fontSize: 15,
        color: 'black',
        marginTop: -5,
        marginBottom: 10,
        fontWeight: '400',
        alignItems: 'center',
        lineHeight: 23,
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
        height: 250,
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






export default EnquiryDetails;