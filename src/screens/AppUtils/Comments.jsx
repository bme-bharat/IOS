import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Image, Keyboard, TouchableWithoutFeedback, Animated, Pressable } from 'react-native';
import apiClient from '../ApiClient';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { EventRegister } from 'react-native-event-listeners';
import maleImage from '../../images/homepage/dummy.png';
import femaleImage from '../../images/homepage/female.jpg';
import companyImage from '../../images/homepage/buliding.jpg'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useBottomSheet } from './SheetProvider';
import { showToast } from './CustomToast';
import { useConnection } from './ConnectionProvider';
import { getTimeDisplay } from '../helperComponents.jsx/signedUrls';
import { generateAvatarFromName } from '../helperComponents.jsx/useInitialsAvatar';

const defaultImageUriCompany = Image.resolveAssetSource(companyImage).uri;
const defaultImageUriFemale = Image.resolveAssetSource(femaleImage).uri;
const defaultImageUriMale = Image.resolveAssetSource(maleImage).uri;

const CommentsSection = forwardRef(({ forum_id, currentUserId, onEditComment, highlightCommentId }, ref) => {
    const profile = useSelector(state => state.CompanyProfile.profile);
    console.log('profile', profile)
    const navigation = useNavigation();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dropdownVisible, setDropdownVisible] = useState({});
    const { closeSheet } = useBottomSheet();
    const flatListRef = useRef(null);
    const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
    const [fetchLimit, setFetchLimit] = useState(10);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const { isConnected } = useConnection();

    const withTimeout = (promise, timeout = 5000) =>
        Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out")), timeout)
            ),
        ]);


    const fetchComments = async (isLoadMore = false) => {
        if (!isConnected) {

            return;
        }
        if (isLoadMore) {
            if (isFetchingMore || !hasMore) return;
            setIsFetchingMore(true);
        } else {
            setLoading(true);
            setHasMore(true);
            setLastEvaluatedKey(null);
        }

        try {
            const startTime = Date.now();

            const requestData = {
                command: 'listAllComments',
                forum_id,
                lastEvaluatedKey: isLoadMore ? lastEvaluatedKey : null,
                limit: fetchLimit,
                comment_id: !isLoadMore ? highlightCommentId : null,
            };

            const res = await withTimeout(apiClient.post('/listAllComments', requestData), 5000);

            if (res?.data?.status === 'success' && Array.isArray(res.data.response)) {
                let rawComments = res.data.response;
                const highlightedList = res.data.comment_id_response;

                let highlightedComment = null;
                if (!isLoadMore && Array.isArray(highlightedList) && highlightedList.length > 0) {
                    highlightedComment = highlightedList[0];
                }

                // Filter out highlighted comment from rawComments (avoid duplicates)
                if (highlightedComment) {
                    rawComments = rawComments.filter(c => c.comment_id !== highlightedComment.comment_id);
                }

                // Sort regular comments
                rawComments = rawComments.sort((a, b) => b.commented_on - a.commented_on);

                // Signed URL for normal comments
                let signedComments = await Promise.all(rawComments.map(getSignedUrlForComment));

                // On initial load, add highlighted comment at the top
                if (!isLoadMore && highlightedComment) {
                    const signedHighlighted = await getSignedUrlForComment(highlightedComment);
                    signedComments = [signedHighlighted, ...signedComments];
                    triggerFlash(highlightedComment.comment_id);
                }

                // On loadMore, double check highlightedComment is not re-added again
                const currentCommentIds = new Set((isLoadMore ? comments : []).map(c => c.comment_id));
                signedComments = signedComments.filter(c => !currentCommentIds.has(c.comment_id));

                // Set state
                if (isLoadMore) {
                    setComments(prev => [...prev, ...signedComments]);
                } else {
                    setComments(signedComments);
                }

                // Pagination key
                setLastEvaluatedKey(res.data.lastEvaluatedKey || null);
                setHasMore(Boolean(res.data.lastEvaluatedKey));

                // Adjust fetch limit by timing
                const duration = Date.now() - startTime;
                if (duration < 1000) {
                    setFetchLimit(prev => Math.min(prev + 5, 50));
                } else if (duration > 1500) {
                    setFetchLimit(prev => Math.max(prev - 5, 5));
                }
            } else {
                if (!isLoadMore) setComments([]);
                setHasMore(false);
            }
        } catch (err) {
            const logPayload = {
                forum_id,
                lastEvaluatedKey,
                highlightCommentId,
                error: err?.message || err,
            };
            if (!isLoadMore) {
                console.log('[fetchComments] Initial fetch failed:', logPayload);
                setError('Failed to load comments.');
            } else {
                console.log('[fetchComments] Pagination fetch failed:', logPayload);
            }
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };


    const getSignedUrlForComment = async (comment) => {
        if (!comment.fileKey) {
            const name = comment.author || 'Unknown';
            const avatarProps = generateAvatarFromName(name);

            return {
                ...comment,
                avatarProps, // fallback to initials-based avatar
            };
        }

        try {
            const res = await apiClient.post('/getObjectSignedUrl', {
                command: 'getObjectSignedUrl',
                key: comment.fileKey,
            });

            if (typeof res.data === 'string' && res.data.startsWith('http')) {
                return {
                    ...comment,
                    signedUrl: res.data,
                };
            }

            if (res?.data?.status === 'success' && res.data.response?.signedUrl) {
                return {
                    ...comment,
                    signedUrl: res.data.response.signedUrl,
                };
            }
        } catch (e) {
            console.warn('Error fetching signed URL for comment:', e);
        }
        return comment;
    };


    useEffect(() => {
        setLoading(true);
        setError(null);

        const timer = setTimeout(() => {
            fetchComments();
        }, 1000);

        return () => clearTimeout(timer);
    }, [forum_id || highlightCommentId]);

    const animatedValuesRef = useRef({});

    const triggerFlash = (commentId) => {
        if (!animatedValuesRef.current[commentId]) {
            animatedValuesRef.current[commentId] = new Animated.Value(0);
        }

        animatedValuesRef.current[commentId].setValue(0);

        Animated.sequence([
            Animated.timing(animatedValuesRef.current[commentId], {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }),
            Animated.delay(600),
            Animated.timing(animatedValuesRef.current[commentId], {
                toValue: 0,
                duration: 600,
                useNativeDriver: false,
            }),
        ]).start();
    };




    const onEndReached = () => {
        if (!loading && !isFetchingMore && hasMore) {
            fetchComments(true);
        }
    };


    const handleEditComplete = (updatedComment) => {
        setComments((prev) => {
            const updated = prev.map((comment) =>
                comment.comment_id === updatedComment.comment_id
                    ? { ...comment, text: updatedComment.text }
                    : comment
            );
            // Scroll to top on next tick
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 100);
            return updated;
        });
    };

    const handleCommentAdded = (newComment) => {
        setComments((prev) => {
            const updated = [newComment, ...prev];
            // Scroll to top on next tick to ensure FlatList gets updated
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 100);
            return updated;
        });
    };


    useImperativeHandle(ref, () => ({
        fetchComments,
        handleEditComplete,
        handleCommentAdded,
    }));

    const handleDropdownToggle = (commentId, forceClose = false) => {
        setDropdownVisible((prev) => {
            if (forceClose) return {};
            const isOpen = prev[commentId];
            return isOpen ? {} : { [commentId]: true };
        });

    };

    const deleteComment = async (commentId) => {
        try {
            const response = await apiClient.post('/deleteComment', {
                command: 'deleteComment',
                user_id: currentUserId,
                comment_id: commentId,
            });

            if (response.data.status === 'success') {
                showToast("Comment deleted", 'success');

                setComments(prevComments => prevComments.filter(comment => comment.comment_id !== commentId));
                EventRegister.emit('onCommentDeleted', {
                    forum_id: forum_id,
                    comment_id: commentId  // Add this to notify which comment was deleted
                });

                // If we're deleting the comment that's currently being edited
                EventRegister.emit('onEditCommentCancelled');

                setDropdownVisible({});
            } else {
                alert('Failed to delete comment. Please try again.');
            }
        } catch (error) {
            alert('Error deleting comment. Please check your connection and try again.');
        }
    };

    const handleEditComment = (commentId, text) => {
        // Trigger event for CommentInputBar
        EventRegister.emit('onEditComment', { comment_id: commentId, text });
    };


    const blockUser = async (userId) => {
        try {
            const payload = {
                command: 'blockUser',
                blocked_by_user_id: currentUserId,
                blocked_user_id: userId,
            };

            const response = await apiClient.post('/blockUser', payload);

            console.log('response?.data?', response?.data);

            if (response?.data?.status === 'success') {
                showToast(response?.data?.successMessage, 'success');
                setComments(prev => prev.filter(comment => comment.user_id !== userId));
            } else {
                showToast('Failed to block user. Please try again.', 'error');
            }
        } catch (error) {
            showToast('Error blocking user. Please check your connection and try again.', 'error');
        } finally {
            setDropdownVisible({});
        }
    };



    const handleNavigate = (item) => {
        setDropdownVisible({});
        closeSheet();
        setTimeout(() => {
            if (item.user_type === "company") {
                navigation.navigate('CompanyDetailsPage', { userId: item.user_id });
            } else if (item.user_type === "users") {
                navigation.navigate('UserDetailsPage', { userId: item.user_id });
            }
        }, 300);
    };

    const [expandedComments, setExpandedComments] = useState({});
    const toggleExpand = (commentId) => {
        setExpandedComments((prev) => ({
            ...prev,
            [commentId]: !prev[commentId],
        }));
    };

    const renderComment = ({ item }) => {
        const imageUrl = item.signedUrl;
        const isNotAdmin = item.user_type !== "BME_ADMIN";
        const safeTrim = (str) => (typeof str === 'string' ? str.trim() : '');

        const isForumOwner = currentUserId && safeTrim(currentUserId) === safeTrim(item.forum_owner_id);
        const isCommentOwner = currentUserId && safeTrim(currentUserId) === safeTrim(item.user_id);
        const forumOwnerType = profile?.user_type || "";

        const canDelete = currentUserId && isNotAdmin && (isCommentOwner || (isForumOwner && !isCommentOwner));

        const canEdit = currentUserId && isNotAdmin && isCommentOwner;

        const canBlock =
            currentUserId &&
            isNotAdmin &&
            isForumOwner &&
            !isCommentOwner && ((forumOwnerType === "company" ? item.user_type === "company" : true));

        const animatedValue = animatedValuesRef.current[item.comment_id];

        const animatedBackground = animatedValue
            ? animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['white', '#e0e0e0'], // subtle flash gray
            })
            : 'white';

        const animatedBorderColor = animatedValue
            ? animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', '#075cab'], // your theme primary
            })
            : 'transparent';

        const animatedBorderWidth = animatedValue
            ? animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
            })
            : 0;





        return (
            <>
                {Object.values(dropdownVisible).some(Boolean) && (
                    <Pressable
                        onPress={() => setDropdownVisible({})}
                        style={StyleSheet.absoluteFill}
                    />
                )}

                <TouchableOpacity
                    onPress={() => handleDropdownToggle(item.comment_id, true)}
                    // onLongPress={() => handleDropdownToggle(item.comment_id)}
                    activeOpacity={0.8} >
                    <Animated.View
                        style={[
                            styles.commentItem,
                            {
                                backgroundColor: animatedBackground,
                                borderLeftWidth: animatedBorderWidth,
                                borderLeftColor: animatedBorderColor,

                            },
                        ]}
                    >

                        <TouchableOpacity onPress={() => handleNavigate(item)}>
                            <View style={styles.imageContainer}>
                                {item.signedUrl ? (
                                    <FastImage
                                        source={{ uri: item.signedUrl }}
                                        style={styles.profileIcon}
                                        resizeMode="cover"
                                        onError={() => {
                                            // Optional: you can fallback to initials if loading fails
                                        }}
                                    />
                                ) : item.avatarProps ? (
                                    <View
                                        style={[
                                            styles.profileIcon,
                                            { backgroundColor: item.avatarProps.backgroundColor, justifyContent: 'center', alignItems: 'center' },
                                        ]}
                                    >
                                        <Text style={{ color: item.avatarProps.textColor, fontWeight: 'bold' }}>
                                            {item.avatarProps.initials}
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={[styles.profileIcon, { backgroundColor: '#ccc' }]} />
                                )}
                            </View>
                        </TouchableOpacity>


                        <View style={styles.commentContent}>
                            <View style={styles.authorRow}>
                                <Text style={styles.authorText} onPress={() => handleNavigate(item)}>{item.author}</Text>
                                <Text style={styles.timestampText}>{getTimeDisplay(item.commented_on)}</Text>

                                {(isCommentOwner || isForumOwner) && (
                                    <TouchableOpacity
                                        onPress={() => handleDropdownToggle(item.comment_id)}
                                        style={styles.menuIconContainer}
                                    >
                                        <Icon name="dots-vertical" size={20} color="#555" />
                                    </TouchableOpacity>
                                )}


                            </View>

                            {item.text && (
                                <>
                                    <Text style={styles.commentText} numberOfLines={expandedComments[item.comment_id] ? undefined : 3}>
                                        {item.text.trim()}
                                    </Text>

                                    {item.text.trim().length > 100 && ( // Optional threshold
                                        <TouchableOpacity onPress={() => toggleExpand(item.comment_id)}>
                                            <Text style={styles.readMoreText}>
                                                {expandedComments[item.comment_id] ? 'Read Less' : 'Read More'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}


                        </View>

                        {dropdownVisible[item.comment_id] && (
                            <View style={styles.buttonContainer}>
                                {canDelete && (
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => {
                                            deleteComment(item.comment_id);
                                            setDropdownVisible({});
                                        }}
                                    >
                                        <Icon name="delete" size={18} color="red" />
                                    </TouchableOpacity>
                                )}
                                {canEdit && (
                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() => {
                                            handleEditComment(item.comment_id, item.text);
                                            setDropdownVisible(false);
                                        }}
                                    >
                                        <Icon name="pencil" size={18} color="#075cab" />
                                    </TouchableOpacity>
                                )}
                                {canBlock && (
                                    <TouchableOpacity
                                        style={styles.blockButton}
                                        onPress={() => blockUser(item.user_id)}
                                    >
                                        <Icon name="block-helper" size={18} color="orange" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                    </Animated.View>
                </TouchableOpacity>
            </>
        );
    };

    if (loading) {
        return <View style={{ alignSelf: 'center', marginTop: 200 }}><ActivityIndicator size="small" color={"#075cab"} /></View>
    }

    if (error) {
        return <Text style={styles.errorText}>{error}</Text>;
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <FlatList
                ref={flatListRef}
                data={comments}
                keyExtractor={(item, index) => item?.comment_id?.toString() || `index-${index}`}
                renderItem={renderComment}
                keyboardShouldPersistTaps="handled"
                extraData={dropdownVisible}
                ListEmptyComponent={<Text style={styles.emptyText}>No comments yet</Text>}
                contentContainerStyle={{ paddingBottom: '50%' }}
                showsVerticalScrollIndicator={false}
                onEndReached={onEndReached}
                ListFooterComponent={isFetchingMore ? <ActivityIndicator size="small" color={"#075cab"} /> : null}

            />
        </TouchableWithoutFeedback>
    );

});

const styles = StyleSheet.create({
    commentItem: {
        padding: 7,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'flex-start',
        margin: 5,
        borderRadius: 12,
    },

    imageContainer: {
        marginRight: 10,
    },

    profileIcon: {
        width: 35,
        height: 35,
        borderRadius: 20,
        backgroundColor: '#eee',
    },

    commentContent: {
        flex: 1,
    },

    authorRow: {
        flexDirection: 'row',
        // justifyContent: 'space-between',
        alignItems: 'center',

    },

    authorText: {
        fontWeight: '500',
        fontSize: 15,
        maxWidth: '70%',
        paddingHorizontal: 2
    },

    timestampText: {
        color: '#666',
        fontSize: 13,
        fontWeight: "300",
        maxWidth: '30%',
        textAlign: 'right',
        marginLeft: 20,
    },
    menuIconContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginLeft: 'auto',
    },
    fullScreenOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },

    commentText: {
        marginTop: 2,
        fontSize: 15,
        lineHeight: '20',
        paddingHorizontal: 2,
        color: "#333"
    },

    readMoreText: {
        color: '#075cab',
        fontWeight: '500',
        marginTop: 4,
    },
    
    buttonContainer: {
        flexDirection: 'row',
        position: "absolute",
        top: 10,
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
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 10,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
    },
});

export default CommentsSection;
