


import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,

  Linking,
  Share,
  Keyboard,
  ActivityIndicator,
  InputAccessoryView,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import { Image as FastImage } from 'react-native';
import { BackHandler } from 'react-native';
import apiClient from '../ApiClient';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';
import { useBottomSheet } from '../AppUtils/SheetProvider';
import CommentsSection from '../AppUtils/Comments';
import CommentInputBar from '../AppUtils/InputBar';
import { EventRegister } from 'react-native-event-listeners';
import { useConnection } from '../AppUtils/ConnectionProvider';
import { getSignedUrl, getTimeDisplay, getTimeDisplayForum } from '../helperComponents/signedUrls';
import { openMediaViewer } from '../helperComponents/mediaViewer';
import ReactionSheet from '../helperComponents/ReactionUserSheet';
import { ForumBody, normalizeHtml } from './forumBody';
import { generateAvatarFromName } from '../helperComponents/useInitialsAvatar';
import useForumReactions, { fetchForumReactionsRaw } from './useForumReactions';
import ArrowleftIcon from '../../assets/svgIcons/back.svg';
import ShareIcon from '../../assets/svgIcons/share.svg';
import Comment from '../../assets/svgIcons/comment.svg';
import Thumb from '../../assets/svgIcons/thumb.svg';


import { colors, dimensions } from '../../assets/theme.jsx';

const screenHeight = Dimensions.get('window').height;
const { width } = Dimensions.get('window');
const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');

const CommentScreen = ({ route }) => {
  const { highlightId, highlightReactId, forum_id, url } = route.params;

  const { myId, myData } = useNetwork();
  const { isConnected } = useConnection();
  const { openSheet, closeSheet } = useBottomSheet();

  const [post, setPost] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaUrl1, setMediaUrl1] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation();
  const [count, setCount] = useState();
  const [errorMessage, setErrorMessage] = useState();
  const [loading, seLoading] = useState();

  const commentSectionRef = useRef();

  useEffect(() => {
    if (highlightId) {
      const timeout = setTimeout(() => {
        openCommentsSheet();
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [highlightId]);

  useEffect(() => {
    if (highlightReactId && reactionSheetRef.current) {
      // Delay to ensure sheet is mounted
      const timeout = setTimeout(() => {
        reactionSheetRef.current?.open(forum_id, 'All', highlightReactId);
      }, 1000); // Give enough time for ReactionSheet to mount

      return () => clearTimeout(timeout);
    }
  }, [highlightReactId, forum_id]);

  const reactionSheetRef = useRef();
  const [reaction, setReaction] = useState()

  useEffect(() => {
    async function logReactions() {
      try {
        const reactions = await fetchForumReactionsRaw(forum_id, myId);
        setReaction(reactions);

      } catch (error) {

      }
    }
    logReactions();
  }, []);

  const { handleReactionUpdate } = useForumReactions(myId);

  const reactionConfig = [
    { type: 'Like', emoji: '👍', color: 'text-blue-600', label: 'Like', outlineIcon: 'thumb-up-outline' },
    { type: 'Insightful', emoji: '💡', color: 'text-yellow-500', label: 'Insightful', outlineIcon: 'lightbulb-on-outline' },
    { type: 'Support', emoji: '🤝', color: 'text-green-500', label: 'Support', outlineIcon: 'handshake-outline' },
    { type: 'Funny', emoji: '😂', color: 'text-yellow-400', label: 'Funny', outlineIcon: 'emoticon-excited-outline' },
    { type: 'Thanks', emoji: '🙏', color: 'text-rose-500', label: 'Thanks', outlineIcon: 'hand-heart-outline' },
  ];

  const selectedReaction = reactionConfig.find(r => r.type === reaction?.userReaction && reaction?.userReaction !== 'None');

  const [showReactions, setShowReactions] = useState(false);

  const openCommentsSheet = () => {
    if (!post) return;
    openSheet(
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        {/* Container with column layout */}
        <View style={{ flex: 1 }}>
          {/* Comments list fills space above input */}
          <CommentsSection
            forum_id={forum_id}
            currentUserId={myId}
            ref={commentSectionRef}
            highlightCommentId={highlightId}
          />
        </View>

        <CommentInputBar
          storedUserId={myId}
          forum_id={forum_id}
          item={post}
          onCommentAdded={(newCommentData) => {
            commentSectionRef.current?.handleCommentAdded(newCommentData);
          }}
          onEditComplete={(updatedComment) => {
            commentSectionRef.current?.handleEditComplete(updatedComment);
          }}
        />
        {/* Fixed input bar at bottom */}

      </View>,
      -screenHeight 
    );
  };



  const withTimeout = (promise, timeout = 5000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout)),
    ]);
  };

  const fetchPosts = async () => {
    if (!isConnected) {

      return;
    }

    seLoading(true);


    try {
      const requestData = {
        command: 'getForumPost',
        forum_id: forum_id,
      };

      const res = await withTimeout(apiClient.post('/getForumPost', requestData), 5000);


      // Handle both array and object formats
      const postData = Array.isArray(res.data.response)
        ? res.data.response[0]
        : res.data.response;


      // If post is missing or empty object
      if (!postData || Object.keys(postData).length === 0) {

        setErrorMessage('This post was removed by the author');
        setMediaUrl('');
        setMediaUrl1('');
        seLoading(false);
        return;
      }

      // ✅ Clear any previous error
      setErrorMessage('');

      // Set post and comments
      setPost(postData);
      await fetchCommentsCount(forum_id);


      const mediaUrlPromise = postData.fileKey
        ? getSignedUrl('mediaUrl', postData.fileKey)
        : Promise.resolve({ mediaUrl: '' });


      const mediaUrl1Promise = postData.author_fileKey
        ? getSignedUrl('mediaUrl1', postData.author_fileKey)
        : Promise.resolve({ mediaUrl1: '' });

      const [mediaRes, authorMediaRes] = await Promise.all([mediaUrlPromise, mediaUrl1Promise]);

      setMediaUrl(mediaRes.mediaUrl || '');

      if (authorMediaRes.mediaUrl1) {

        setMediaUrl1(authorMediaRes.mediaUrl1);
      } else {
        const fallbackName = postData?.author || 'BME';
        const avatarData = generateAvatarFromName(fallbackName);

        setMediaUrl1(avatarData);
      }

      seLoading(false);
    } catch (error) {

      if (error.message === 'Network Error' || !error.response) {
        showToast('Network error, please check your connection', 'error');
        setErrorMessage('Network error, please check your connection');
      } else {
        setErrorMessage('This post was removed by the author');
      }

      setMediaUrl('');

      setMediaUrl1('');
      seLoading(false);
    }
  };




  useEffect(() => {
    fetchPosts();
  }, [forum_id]);

  const shareJob = async (item) => {
    try {
      const baseUrl = 'https://bmebharat.com/latest/comment/';
      const jobUrl = `${baseUrl}${item.forum_id}`;

      const result = await Share.share({
        message: `Checkout this post: ${jobUrl}`,
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

  const fetchCommentsCount = async (forum_id) => {
    try {
      const requestData = {
        command: "getForumCommentsCount",
        forum_id
      };
      const res = await withTimeout(apiClient.post('/getForumCommentsCount', requestData), 10000);

      if (res.data.status === 'success') {
        const commentCount = res.data.count;
        setCount(commentCount)

      } else {

      }
    } catch (error) {

    }
  };

  useEffect(() => {
    // Replace this with the ID of the post you want to track
    const trackedForumId = forum_id; // make sure this comes from props or state

    const commentDeletedListener = EventRegister.addEventListener('onCommentDeleted', ({ forum_id }) => {
      if (forum_id === trackedForumId) {
        setCount(prevCount => Math.max(prevCount - 1, 0));
      }
    });

    const commentAddedListener = EventRegister.addEventListener('onCommentAdded', ({ forum_id }) => {
      if (forum_id === trackedForumId) {
        setCount(prevCount => prevCount + 1);
      }
    });

    return () => {
      EventRegister.removeEventListener(commentDeletedListener);
      EventRegister.removeEventListener(commentAddedListener);
    };
  }, [forum_id]);



  const handleNavigate = (item) => {
    if (item.user_type === "company") {
      navigation.navigate('CompanyDetailsPage', { userId: item.user_id });
    } else if (item.user_type === "users") {

      navigation.navigate('UserDetailsPage', { userId: item.user_id });
    }
  };

  useEffect(() => {
    const handleBackPress = () => {
      if (isModalVisible) {
        setModalVisible(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      backHandler.remove();
    };
  }, [isModalVisible]);



  // const toggleFullText = () => {
  //   setExpandedTexts((prev) => !prev);
  // };


  const toggleFullText = (id) => {
    setExpandedTexts(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const [expandedTexts, setExpandedTexts] = useState({});

  const videoExtensions = [
    '.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm',
    '.m4v', '.3gp', '.3g2', '.f4v', '.f4p', '.f4a', '.f4b', '.qt', '.quicktime'
  ];

  const isVideo = post?.fileKey && videoExtensions.some(ext => post.fileKey.endsWith(ext));


  if (loading) {
    // Post is not loaded yet or null
    return (
      <View style={styles.outerContainer}>

        <View style={styles.headerContainer1}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Home3');
              }
            }}
          >
            <ArrowleftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

          </TouchableOpacity>

        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size='small' color='#075cab' />
        </View>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.outerContainer}>
        <View style={styles.headerContainer1}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Home3');
              }
            }}
          >
            <ArrowleftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

          </TouchableOpacity>

        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>{errorMessage}</Text>
        </View>
      </View>
    );
  }

  const maxAllowedHeight = Math.round(deviceHeight * 0.6);

  let height;
  if (post?.extraData?.aspectRatio) {
    const aspectRatioHeight = Math.round(deviceWidth / post.extraData?.aspectRatio);

    height = aspectRatioHeight > maxAllowedHeight ? maxAllowedHeight : aspectRatioHeight;
  } else {

    height = deviceWidth;
  }

  return (
    <View style={styles.outerContainer}>
      <View style={styles.headerContainer1}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home3');
            }
          }}
        >
          <ArrowleftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

        </TouchableOpacity>

      </View>


      <>
        <ScrollView contentContainerStyle={styles.scrollViewContent}
          onScrollBeginDrag={() => Keyboard.dismiss()}
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.headerContainer}>
            <View style={styles.leftHeader}>
              {typeof mediaUrl1 === 'string' && mediaUrl1 !== '' ? (
                <FastImage
                  source={{ uri: mediaUrl1 }}
                  style={styles.profileIcon}
                  resizeMode="cover"
                  onError={(e) => {
                    console.log('Image load failed:', e.nativeEvent);
                  }}
                />
              ) : (
                <View
                  style={[
                    styles.profileIcon,
                    {
                      backgroundColor: mediaUrl1?.backgroundColor || '#ccc',
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: mediaUrl1?.textColor || '#000',
                      fontWeight: 'bold',
                      fontSize: 16,
                    }}
                  >
                    {mediaUrl1?.initials || ''}
                  </Text>
                </View>
              )}


              <View style={styles.authorInfo}>
                <Text style={styles.author} onPress={() => handleNavigate(post)}>{post?.author || ''}</Text>
                <Text style={styles.authorCategory}>{post?.author_category || ''}</Text>
              </View>
            </View>

            <View style={styles.rightHeader}>
              <Text style={styles.timeText}>
                {getTimeDisplayForum(post?.posted_on)}
              </Text>
            </View>
          </View>

            <ForumBody
              html={normalizeHtml(post?.forum_body, '')}
              forumId={post?.forum_id}
              isExpanded={expandedTexts[post?.forum_id]}
              toggleFullText={toggleFullText}
              ignoredDomTags={['font']}
            />
       
          {mediaUrl ? (
            isVideo ? (

              <Video
                source={{ uri: mediaUrl }}
                style={{
                  width: '100%',
                  height: height,
                }}
                controls
                repeat={true}
                paused={false}
                resizeMode="contain"
                poster={url ? { uri: url } : undefined} // ✅ ensure poster is an object
                posterResizeMode="cover"
              />

            ) : (
              <TouchableOpacity
                onPress={() => openMediaViewer([{ type: 'image', url: mediaUrl }])}
                activeOpacity={1}
              >
                <Image
                  source={{ uri: mediaUrl }}
                  style={[styles.image, { width: '100%', height: height }]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )
          ) : null}


          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 40, }}>
            <View>
              <TouchableOpacity
                onPress={async () => {
                  const selectedType = reaction?.userReaction && reaction?.userReaction !== 'None' ? 'None' : 'Like';

                  setReaction(prev => {
                    const currentReaction = prev?.userReaction || 'None';
                    let newTotal = Number(prev?.totalReactions || 0);
                    const hadReaction = currentReaction && currentReaction !== 'None';

                    const updatedCounts = { ...prev?.reactionsCount };

                    if (selectedType === 'None' && hadReaction) {
                      updatedCounts[currentReaction] = Math.max(0, (updatedCounts[currentReaction] || 1) - 1);
                      newTotal -= 1;
                    } else if (!hadReaction) {
                      updatedCounts['Like'] = (updatedCounts['Like'] || 0) + 1;
                      newTotal += 1;
                    } else if (hadReaction && currentReaction !== 'Like') {
                      updatedCounts[currentReaction] = Math.max(0, (updatedCounts[currentReaction] || 1) - 1);
                      updatedCounts['Like'] = (updatedCounts['Like'] || 0) + 1;
                    }

                    return {
                      ...prev,
                      userReaction: selectedType === 'None' ? null : 'Like',
                      totalReactions: newTotal,
                      reactionsCount: updatedCounts,
                    };
                  });

                  await handleReactionUpdate(forum_id, selectedType);
                }}

                onLongPress={() => {
                  setShowReactions(true);
                }}

                activeOpacity={0.7}
                style={{
                  
                  padding: 4,
                  flexDirection: 'row',
                  alignItems: 'center',

                }}
              >
                {selectedReaction ? (
                  <>
                    <Text style={{ fontSize: 16 }}>{selectedReaction.emoji} </Text>
                    {/* <Text style={{ fontSize: 12, color: '#777' }}>{selectedReaction.label}</Text> */}
                  </>
                ) : (
                  <>
                    {/* <Text style={{ fontSize: 12, color: '#777', marginRight: 6 }}>React: </Text> */}
                    <Thumb width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                  </>
                )}
                {reaction?.totalReactions > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      reactionSheetRef.current?.open(post?.forum_id, 'All');
                    }}
                    style={{ paddingHorizontal: 8 }}
                  >
                    <Text style={{ color: '#333', fontSize: 12, fontWeight: '500' }}>
                      ({reaction?.totalReactions})
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              <View style={{
                position: 'absolute',
                top: -60,
                left: 0
              }}>
                {showReactions && (
                  <>
                    <TouchableWithoutFeedback onPress={() => setShowReactions(false)}>
                      <View
                        style={{
                          position: 'absolute',
                          top: -1000,
                          left: -1000,
                          right: -1000,
                          bottom: -1000,
                          zIndex: 0,
                        }}
                      />
                    </TouchableWithoutFeedback>

                    <View
                      style={styles.reactionContainer}
                    >
                      {reactionConfig.map(({ type, emoji, label }) => {
                        const isSelected = reaction?.userReaction === type;
                        return (
                          <TouchableOpacity
                            key={type}
                            onPress={async () => {
                              setReaction(prev => {
                                const currentReaction = prev?.userReaction || 'None';
                                let newTotal = Number(prev?.totalReactions || 0);
                                const hadReaction = currentReaction && currentReaction !== 'None';

                                const updatedCounts = { ...prev?.reactionsCount };

                                if (type === 'None' && hadReaction) {
                                  updatedCounts[currentReaction] = Math.max(0, (updatedCounts[currentReaction] || 1) - 1);
                                  newTotal -= 1;
                                } else if (!hadReaction) {
                                  updatedCounts[type] = (updatedCounts[type] || 0) + 1;
                                  newTotal += 1;
                                } else if (hadReaction && currentReaction !== type) {
                                  updatedCounts[currentReaction] = Math.max(0, (updatedCounts[currentReaction] || 1) - 1);
                                  updatedCounts[type] = (updatedCounts[type] || 0) + 1;
                                }

                                return {
                                  ...prev,
                                  userReaction: type === 'None' ? null : type,
                                  totalReactions: newTotal,
                                  reactionsCount: updatedCounts,
                                };
                              });

                              await handleReactionUpdate(forum_id, type);
                              setShowReactions(false); // hide the popup after selection
                            }}


                            style={styles.reactionButton}
                          >
                            <Text style={{ fontSize: 20 }}>{emoji}</Text>
                            {/* <Text style={{ fontSize: 8 }}>{label}</Text> */}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}
              </View>
            </View>


          </View>


          {/* <View style={styles.divider} /> */}

          <View style={styles.iconContainer}>

            <TouchableOpacity
              style={styles.commentButton}
              onPress={() => {
                openCommentsSheet();
              }}
            >
              <Comment width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

              <Text style={styles.iconText}>
                Comments{count > 0 ? ` ${count}` : ''}
              </Text>
            </TouchableOpacity>


            <TouchableOpacity onPress={() => shareJob(post)} style={styles.dropdownItem}>
              <ShareIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

              <Text style={styles.dropdownText}>Share</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        <ReactionSheet ref={reactionSheetRef} />

      </>

    </View>
  );
};

const styles = StyleSheet.create({
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',

  },
  inputBar: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: 'black',
    paddingVertical: 6,
  },

  submitButton: {
    marginLeft: 10,
    backgroundColor: '#075cab',
    padding: 8,
    borderRadius: 20,
  },

  outerContainer: {
    flex: 1,
    backgroundColor: 'white',
  },

  erroText: {
    fontWeight: '400',
    textAlign: 'center',
    padding: 10,
    fontSize: 16
  },

  scrollViewContent: {
    top: 10,
    flexGrow: 1,
    paddingBottom: '20%',
paddingHorizontal:5
  },

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,

  },
  headerContainer1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10

  },

  leftHeader: {
    flexDirection: 'row', // Row layout for profile icon and text
    alignItems: 'flex-start', // Align items at the top
  },

  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#eee'
  },
  authorInfo: {
    flexDirection: 'column', // Stack author name and category vertically
  },

  // Author styling
  author: {
    fontSize: 16,
    fontWeight: '600',
    color:colors.text_primary,
    color: 'black'
  },

  // Author Category Styling
  authorCategory: {
    fontSize: 13,
    fontWeight: '300',
    alignSelf: 'flex-start',
    color: 'black'
  },


  rightHeader: {
    alignItems: 'flex-end', // Align time to the right
  },


  mediaContainer: {
    width: width,
    height: width,
    marginTop: 10,
    borderRadius: 10,
    // borderWidth:1,
    alignSelf: 'center',
    borderColor: '#f0f0f0',
    paddingHorizontal: 2,
    backgroundColor: 'white'
  },

  image: {
    width: '100%',
    height: '100%',
    // borderRadius: 10,

  },

  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space out the icons
    paddingVertical: 10,

  },

  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    marginRight: 5,
    marginLeft: 3
  },

  iconText: {
    fontSize: 15,
    color: '#075cab',
    textAlign: "left",
    fontWeight: '500',
    paddingHorizontal: 4,
  },

  dropdownText: {
    fontSize: 15,
    color: '#075cab',
    fontWeight: '500',
  },


  textContainer: {
    paddingHorizontal: 10
  },
  body: {
    fontSize: 15,
    color: 'black',
    fontWeight: '400',
    textAlign: 'justify',
    alignItems: 'center',
    lineHeight: 23,

  },

  readMore: {
    color: 'gray', // Blue color for "Read More"
    fontWeight: '300', // Make it bold if needed
    fontSize: 13,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 200, // Adjust to make the modal appear from the top
    marginHorizontal: 5,
    borderRadius: 20,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  stickyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 10,
    height: 50,
    marginHorizontal: 5,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,

  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },


  commentCount: {
    fontSize: 15,
    marginLeft: 8, // Optional: Add space between "Comments" text and count
    color: 'black',
  },
  modalHeader: {
    flexDirection: 'row', // Align items horizontally in one row
    alignItems: 'center', // Vertically align the elements in the center
    padding: 10, // Adjust padding as necessary
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 20,
  },

  commentItem: {
    paddingVertical: 10,
    borderRadius: 8,
  },
  highlightedComment: {
    borderWidth: 0.5,
    borderColor: 'black', // Highlighted border color
  },
  commentHeader: {
    flexDirection: 'row',

  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    alignSelf: 'flex-start',
  },
  commentTextContainer: {
    flex: 1,
  },
  authorText: {
    fontWeight: '500',
    fontSize: 13,
    color: "black",
    alignSelf: 'flex-start',
  },
  commentText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
    color: "black",
    textAlign: 'justify',
  },
  timestampText: {
    fontSize: 11,
    fontWeight: '400',
    color: 'gray',
    marginTop: 5,
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
  buttonContainer: {
    flexDirection: 'row',
    position: "absolute",
    top: 10,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer1: {
    flex: 1,
    backgroundColor: 'white',

  },
  closeButton1: {
    position: 'absolute',
    top: 70, // Adjust for your layout
    left: 10, // Adjust for your layout
    zIndex: 1, // Ensure it appears above the video
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 5,
    borderRadius: 30,
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  modalVideo: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 10,
  },
  button: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '300',
    color: '#666',
  },
  reactionButton: {
    padding: 8,
    margin: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  reactionContainer: {
    position: 'absolute',

    left: 0,
    borderRadius: 40,
    flexDirection: 'row',
  },
});

export default CommentScreen; 
