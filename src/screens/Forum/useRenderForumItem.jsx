import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, Share, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ForumBody, normalizeHtml } from './forumBody';
import useForumReactions, { fetchForumReactionsRaw, reactionConfig } from './useForumReactions';
import { getTimeDisplayForum } from '../helperComponents/signedUrls';
import { useNavigation } from '@react-navigation/native';
import { useNetwork } from '../AppUtils/IdProvider';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { enrichForumPost } from './useForumFetcher';
import Markdown from 'react-native-markdown-display';

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');
const maxAllowedHeight = Math.round(deviceHeight * 0.6);

export default function useRenderForumItem({
  localPosts,
  setLocalPosts,
  forumIds,
  searchResults,        // Add this
  setSearchResults,
  activeVideo,
  videoEndStates,
  setVideoEndStates,
  isFocused,
  videoRefs,
  activeReactionForumId,
  setActiveReactionForumId,
  openCommentSheet,
  searchQuery,
  openMediaViewer,
  reactionSheetRef,
  context = "latest"   
}) {
  const [interactions, setInteractions] = useState({});

  useEffect(() => {
    if (forumIds.length > 0) {
      enrichForumPost(localPosts, myId).then(enriched => {
        const interactionsMap = enriched.reduce((acc, post) => {
          acc[post.forum_id] = {
            commentCount: post.commentCount || 0,
            reactionsCount: post.reactionsCount || {},
            totalReactions: post.totalReactions || 0,
            userReaction: post.userReaction || null,
          };
          return acc;
        }, {});
        setInteractions(interactionsMap);
      });
    }
  }, [forumIds, localPosts, myId]);

  const navigation = useNavigation();
  const [expandedTexts, setExpandedTexts] = useState({});
  const { myId, myData } = useNetwork();
  const { handleReactionUpdate } = useForumReactions(myId);


  const [reactions, setReactions] = useState([])

  // useEffect(() => {
  //   if (!forumIds.length || !myId) return;

  //   const fetchAllReactions = async () => {
  //     try {
  //       const results = await Promise.all(
  //         forumIds.map((id) => fetchForumReactionsRaw(id, myId))
  //       );

  //       const combined = forumIds.map((forumId, index) => ({
  //         forumId,
  //         ...results[index],
  //       }));

  //       setReactions(combined);
  //     } catch (e) {
  //       console.error('Failed to fetch forum reactions', e);
  //       setReactions([]);
  //     }
  //   };

  //   fetchAllReactions();
  // }, [forumIds, myId]);

  const handleNavigate = (item) => {
    setTimeout(() => {
      if (item.user_type === "company") {
        navigation.navigate('CompanyDetailsPage', { userId: item.user_id });
      } else if (item.user_type === "users") {
        navigation.navigate('UserDetailsPage', { userId: item.user_id });
      }
    }, 100);
  };

  const toggleFullText = (id) => {
    setExpandedTexts(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sharePost = async (item) => {
    try {
      const baseUrl = 'https://bmebharat.com/latest/comment/';
      const jobUrl = `${baseUrl}${item.forum_id}`;

      const result = await Share.share({
        message: `Checkout this post: ${jobUrl}`, // Added message prefix
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared without specifying activity type
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const updatePostReaction = (forumId, selectedType, currentReaction) => {
    // Update localPosts if this post exists there
    setInteractions(prev => {
      const existing = prev[forumId] || {
        commentCount: 0,
        reactionsCount: {},
        totalReactions: 0,
        userReaction: 'None'
      };

      let newTotal = Number(existing.totalReactions || 0);
      const hadReaction = existing.userReaction && existing.userReaction !== 'None';

      if (selectedType === 'None' && hadReaction) newTotal -= 1;
      else if (!hadReaction) newTotal += 1;

      const reactionsCount = { ...existing.reactionsCount };

      if (hadReaction) {
        reactionsCount[existing.userReaction] =
          Math.max((reactionsCount[existing.userReaction] || 1) - 1, 0);
      }

      if (selectedType !== 'None') {
        reactionsCount[selectedType] = (reactionsCount[selectedType] || 0) + 1;
      }

      return {
        ...prev,
        [forumId]: {
          ...existing,
          userReaction: selectedType === 'None' ? 'None' : selectedType,
          totalReactions: newTotal,
          reactionsCount
        }
      };
    });


    // Also update searchResults if this post exists there
    if (searchResults) {
      setSearchResults(prev => prev.map(p => {
        if (p.forum_id !== forumId) return p;
        let newTotal = Number(p.totalReactions || 0);
        const hadReaction = currentReaction && currentReaction !== 'None';
        if (selectedType === 'None' && hadReaction) newTotal -= 1;
        else if (!hadReaction) newTotal += 1;
        return {
          ...p,
          userReaction: selectedType === 'None' ? null : selectedType,
          totalReactions: newTotal,
        };
      }));
    }
  };


  const renderItem = useCallback(({ item }) => {

    const interactionData = interactions[item.forum_id] || {
      commentCount: 0,
      reactionsCount: {},
      totalReactions: 0,
      userReaction: 'None',
    };

    let height;
    if (item.extraData?.aspectRatio) {
      const aspectRatioHeight = Math.round(deviceWidth / item.extraData?.aspectRatio);

      height = aspectRatioHeight > maxAllowedHeight ? maxAllowedHeight : aspectRatioHeight;
    } else {

      height = deviceWidth;
    }

    return (
      <View style={styles.comments}>
        {/* Author section */}
        <View style={styles.dpContainer}>
          <TouchableOpacity
            style={styles.dpContainer1}
            onPress={() => handleNavigate(item)}
            activeOpacity={0.8}
          >
            {item?.authorSignedUrl ? (
              <FastImage
                source={{ uri: item?.authorSignedUrl }}
                style={styles.image1}
              />
            ) : (
              <View style={[styles.dpContainer1, { backgroundColor: item?.authorImageUri?.backgroundColor }]}>
                <Text style={{ color: item?.authorImageUri?.textColor, fontWeight: 'bold' }}>
                  {item?.authorImageUri?.initials}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.textContainer}>
            <View style={styles.title3}>
              <TouchableOpacity onPress={() => handleNavigate(item)} style={{ flexDirection: 'row', alignItems: 'center' }} activeOpacity={1}>
                <Text style={{ flex: 1, alignSelf: 'flex-start', color: 'black', fontSize: 15, fontWeight: '500' }}>
                  {(item.author || '').trim()}
                </Text>

                {item.isTrending === 'yes' && context !== "trending" && (
                  <LinearGradient
                    colors={['#ff9966', '#ff5e62']} // smooth orange-red gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.trendingBadge}
                  >
                   
                    <Icon name="fire" size={14} color="#fff" />
                  </LinearGradient>
                )}

              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Text style={styles.title}>{item.author_category || ''}</Text>
              <Text style={styles.date1}>{getTimeDisplayForum(item.posted_on)}</Text>
            </View>
          </View>
        </View>

        {/* Post content */}
        <View style={{ paddingHorizontal: 10, marginBottom: 10 }}>
          <ForumBody
            html={normalizeHtml(item?.forum_body, searchQuery)}
            forumId={item.forum_id}
            isExpanded={expandedTexts[item.forum_id]}
            toggleFullText={toggleFullText}
          />
        </View>

        {/* <Markdown style={{ body: { fontSize: 15, lineHeight: 20 } }}>
          {item?.forum_body}
        </Markdown> */}

        {/* Media content */}
        {item.fileKey && (
          <TouchableOpacity style={{
            width: '100%', height: height,
            overflow: 'hidden',
            backgroundColor: '#fff'

          }}
            activeOpacity={1} >
            {item?.extraData?.type?.startsWith('video/') ? (
              <View style={{ position: 'relative' }}>

                <Video
                  ref={(ref) => {
                    if (ref) {
                      videoRefs[item.forum_id] = ref;
                    } else {
                      delete videoRefs[item.forum_id];
                    }
                  }}
                  source={{ uri: item?.fileKeySignedUrl }}
                  style={{
                    width: '100%',
                    height: height,
                    backgroundColor: '#fff'
                  }}
                  controls
                  paused={activeVideo !== item.forum_id || !isFocused}
                  resizeMode="cover"
                  poster={item?.thumbnailSignedUrl}
                  posterResizeMode='cover'

                  onEnd={() => {
                    setVideoEndStates(prev => {
                      // Only update if this is the currently active video
                      if (activeVideo === item.forum_id) {
                        return { ...prev, [item.forum_id]: true };
                      }
                      return prev;
                    });
                  }}
                  onPlay={() => {
                    setVideoEndStates(prev => {
                      const newState = { ...prev };
                      delete newState[item.forum_id];
                      return newState;
                    });
                  }}

                />

                {videoEndStates[item.forum_id] && (
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(0,0,0,0.5)'
                    }}
                    activeOpacity={0.7}
                    onPress={() => {
                      // Update the state to hide the retry icon immediately
                      setVideoEndStates(prev => ({ ...prev, [item.forum_id]: false }));

                      if (videoRefs[item.forum_id]) {
                        videoRefs[item.forum_id].seek(0);
                        videoRefs[item.forum_id].resume();
                      }
                    }}
                  >
                    <Icon name="replay" size={34} color="#fff" />
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#fff' }}>watch again</Text>
                  </TouchableOpacity>
                )}

              </View>

            ) : (
              <TouchableOpacity onPress={() => openMediaViewer([{ type: 'image', url: item?.fileKeySignedUrl }])} activeOpacity={1}>
                <FastImage
                  source={{ uri: item?.fileKeySignedUrl }}
                  style={{ width: '100%', height: height }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}


        <View style={styles.iconContainer}>
          <View>
            <TouchableOpacity
              onLongPress={() => setActiveReactionForumId(prev => prev === item.forum_id ? null : item.forum_id)}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={async () => {
                const currentReaction = interactionData.userReaction || 'None';
                const selectedType = currentReaction !== 'None' ? 'None' : 'Like';

                updatePostReaction(item.forum_id, selectedType, currentReaction);

                await handleReactionUpdate(item.forum_id, selectedType, item);
              }}
            >
              {interactionData.userReaction && interactionData.userReaction !== 'None' ? (
                <>
                  <Text style={{ fontSize: 15 }}>
                    {reactionConfig.find(r => r.type === interactionData.userReaction)?.emoji || '👍'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#777', marginLeft: 4 }}>
                    {reactionConfig.find(r => r.type === interactionData.userReaction)?.label || 'Like'}
                  </Text>
                </>
              ) : (
                <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                  <Icon name="thumb-up-outline" size={20} color="#999" />
                </View>
              )}

              <TouchableOpacity
                onPress={() => reactionSheetRef.current?.open(item.forum_id, 'All')}
                style={{ padding: 5, paddingHorizontal: 10 }}
              >
                {interactionData.totalReactions > 0 && (
                  <Text style={{ color: "#666" }}>({interactionData.totalReactions})</Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>

            {activeReactionForumId === item.forum_id && (
              <>
                <TouchableWithoutFeedback onPress={() => setActiveReactionForumId(null)}>
                  <View style={styles.reactionOverlay} />
                </TouchableWithoutFeedback>
                <View style={styles.reactionContainer}>
                  {reactionConfig.map(({ type, emoji }) => {
                    const isSelected = interactionData.userReaction === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={async () => {
                          const selectedType = isSelected ? 'None' : type;
                          const currentReaction = interactionData.userReaction || 'None';

                          updatePostReaction(item.forum_id, selectedType, currentReaction);
                          await handleReactionUpdate(item.forum_id, selectedType, item);

                          setActiveReactionForumId(null);
                        }}
                        style={[
                          styles.reactionButton,
                          isSelected && styles.selectedReaction
                        ]}
                      >
                        <Text style={{ fontSize: 20 }}>{emoji}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.iconContainer}>
          <View>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => openCommentSheet(item.forum_id, item.user_id, myId, item)}
            >
              <Icon name="comment-outline" size={17} color="#075cab" />
              <Text style={styles.iconTextUnderlined}>
                Comments{interactionData.commentCount > 0 ? ` ${interactionData.commentCount}` : ''}
              </Text>
            </TouchableOpacity>
          </View>
          <View>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="eye-outline" size={20} color="#075cab" />
              <Text style={styles.iconTextUnderlined}>Views {item.viewsCount || '0'}</Text>
            </TouchableOpacity>
          </View>
          <View>
            <TouchableOpacity style={styles.iconButton} onPress={() => sharePost(item)}>
              <Icon name="share-outline" size={21} color="#075cab" />
              <Text style={styles.iconTextUnderlined}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [
    localPosts, activeVideo, isFocused, expandedTexts, activeReactionForumId, handleNavigate, openMediaViewer, reactionSheetRef, deviceWidth
  ]);

  return renderItem;
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'whitesmoke',
  },


  comments: {
    paddingHorizontal: 5,
    // borderTopWidth: 0.5,
    // borderColor: '#ccc',
    paddingVertical: 10,
    backgroundColor: 'white',
    minHeight: 120,
    marginBottom: 5,

  },
  trendingHighlight: {
    borderWidth: 2,
    borderColor: '#FFD700', // gold border
    backgroundColor: '#fffbea', // subtle yellow background
    borderRadius: 8,
  },

  image1: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 100,
    backgroundColor: '#eee'
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 6
  },
  trendingBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#fff'
  },
  trendingIcon: {
    marginLeft: 4
  },


  title: {
    fontSize: 13,
    color: '#666',
    // marginBottom: 5,
    fontWeight: '300',
    textAlign: 'justify',
    alignItems: 'center',
  },

  title3: {
    fontSize: 15,
    color: 'black',
    // marginBottom: 5,
    fontWeight: '500',
    flexDirection: 'row',  // Use row to align items horizontally
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
    backgroundColor: 'red'

  },

  readMore: {
    color: 'gray', // Blue color for "Read More"
    fontWeight: '300', // Make it bold if needed
    fontSize: 13,
  },

  dpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10

  },
  dpContainer1: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center'

  },
  textContainer: {
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 10,

  },
  iconContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 30
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

  },
  iconText: {
    fontSize: 12,
    color: '#075cab',
  },

  iconTextUnderlined: {
    fontSize: 13,
    fontWeight: '500',
    color: '#075cab',
    marginLeft: 1,
    marginRight: 3
  },

  label: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reactionContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    borderRadius: 40,
    flexDirection: 'row',
  },
  reactionButton: {
    padding: 8,
    margin: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  selectedReaction: {
    backgroundColor: '#c2d8f0',
  },


});