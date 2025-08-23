import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, Image, StyleSheet, ToastAndroid, TouchableOpacity, Text, Alert, TextInput, RefreshControl, Share, SafeAreaView, Keyboard, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import Video from 'react-native-video';
import FastImage from 'react-native-fast-image';
import Message from '../../components/Message';

import defaultImage from '../../images/homepage/image.jpg'

import { useDispatch } from 'react-redux';
import { deleteResourcePost } from '../Redux/Resource_Actions';
import { showToast } from '../AppUtils/CustomToast';
import apiClient from '../ApiClient';
import { useNetwork } from '../AppUtils/IdProvider';
import { EventRegister } from 'react-native-event-listeners';
import { MyPostBody } from '../Forum/forumBody';
import { deleteS3KeyIfExists } from '../helperComponents/s3Helpers';
import { getSignedUrl } from '../helperComponents/signedUrls';

const defaultLogo = Image.resolveAssetSource(defaultImage).uri;

const YourResourcesList = ({ navigation, route }) => {
  const { myId, myData } = useNetwork();

  const [allForumPost, setAllForumPost] = useState([]);

  const [imageUrls, setImageUrls] = useState({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollViewRef = useRef(null)
  const [fileKeyToDelete, setFileKeyToDelete] = useState(null);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResourceCreated = async ({ newPost }) => {
      const enrichedPost = await fetchSignedUrlForPost(newPost, setImageUrls);
      setAllForumPost(prev => [enrichedPost, ...(Array.isArray(prev) ? prev : [])]);
    };

    const handleResourceUpdated = async ({ updatedPost }) => {
      const enrichedPost = await fetchSignedUrlForPost(updatedPost, setImageUrls);
      setAllForumPost(prev =>
        (Array.isArray(prev) ? prev : []).map(post =>
          post.resource_id === enrichedPost.resource_id ? enrichedPost : post
        )
      );
    };

    const handleResourceDeleted = ({ deletedPostId }) => {
      setAllForumPost(prev =>
        (Array.isArray(prev) ? prev : []).filter(post => post.resource_id !== deletedPostId)
      );
      setImageUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[deletedPostId];
        return newUrls;
      });
    };

    const createListener = EventRegister.addEventListener('onResourcePostCreated', handleResourceCreated);
    const updateListener = EventRegister.addEventListener('onResourcePostUpdated', handleResourceUpdated);
    const deleteListener = EventRegister.addEventListener('onResourcePostDeleted', handleResourceDeleted);

    return () => {
      EventRegister.removeEventListener(createListener);
      EventRegister.removeEventListener(updateListener);
      EventRegister.removeEventListener(deleteListener);
    };
  }, []);



  const fetchSignedUrlForPost = async (post, setImageUrls) => {
    try {
      const isVideo = post?.extraData?.type?.startsWith("video");
      const fileKeyToUse = isVideo ? post.thumbnail_fileKey : post.fileKey;

      if (!fileKeyToUse) return { ...post, signedUrl: defaultLogo };

      const signedUrl = await getSignedUrl(post.resource_id, fileKeyToUse);

      setImageUrls(prev => ({
        ...prev,
        [post.resource_id]: signedUrl || defaultLogo,
      }));

      return { ...post, signedUrl: signedUrl || defaultLogo };
    } catch (e) {
      return { ...post, signedUrl: defaultLogo };
    }
  };


  useEffect(() => {
    fetchResources();
  }, [])

  const fetchResources = async (loadMore = false) => {
    if (!myId) return;
    setLoading(true);
    try {
      const response = await apiClient.post("/getUsersAllResourcePosts", {
        command: "getUsersAllResourcePosts",
        user_id: myId,
        limit: 10,
        lastEvaluatedKey: loadMore ? lastEvaluatedKey : null,
      });

      if (response.data.status === "success") {
        const posts = response.data.response || [];

        if (posts.length === 0 && !loadMore) {
          setAllForumPost({ removed_by_author: true });
          return;
        }

        posts.sort((a, b) => b.posted_on - a.posted_on);

        if (loadMore) {
          setAllForumPost(prev => [...prev, ...posts]);
        } else {
          setAllForumPost(posts);
        }

        setLastEvaluatedKey(response.data.lastEvaluatedKey);

        const urlsObject = {};

        await Promise.all(
          posts.map(async (post) => {
            try {
              const mimeType = post?.extraData?.type || "";
              const isVideo = mimeType.startsWith("video");
              const isImage = mimeType.startsWith("image");

              let fileKeyToUse = null;
              if (isVideo) fileKeyToUse = post.thumbnail_fileKey;
              else if (isImage) fileKeyToUse = post.fileKey;

              if (fileKeyToUse) {
                const signedUrl = await getSignedUrl(post.resource_id, fileKeyToUse);
                urlsObject[post.resource_id] = signedUrl || defaultLogo;
              } else {
                urlsObject[post.resource_id] = defaultLogo;
              }
            } catch (error) {
              urlsObject[post.resource_id] = defaultLogo;
            }
          })
        );

        setImageUrls(prev => ({ ...prev, ...urlsObject }));
      } else {
        setAllForumPost({ removed_by_author: true });
      }
    } catch (error) {
      setAllForumPost({ removed_by_author: true });
      setLoading(false);
    } finally {
      setIsLoadingMore(false);
      setLoading(false);
    }
  };


  const loadMorePosts = () => {
    if (lastEvaluatedKey && !isLoadingMore) {
      setIsLoadingMore(true);

      setTimeout(() => {
        fetchResources(true).finally(() => {

        });
      }, 500);
    }
  };


  useFocusEffect(
    useCallback(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    }, [])
  );


  const handleEditPress = (post, imageUrl) => {
    navigation.navigate("ResourcesEdit", { post, imageUrl });
  };


  const handleDelete = (forum_id, fileKey, thumbnail_fileKey) => {
    const filesToDelete = [fileKey, thumbnail_fileKey];


    setPostToDelete(forum_id);
    setFileKeyToDelete(filesToDelete);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirmation(false);

    if (fileKeyToDelete?.length > 0) {
      try {
        for (const key of fileKeyToDelete) {
          if (key) {

            await deleteS3KeyIfExists(key); // ✅ use utility function
          }
        }
      } catch (error) {

        return;
      }
    }

    try {
      const response = await apiClient.post('/deleteResourcePost', {
        command: "deleteResourcePost",
        user_id: myId,
        resource_id: postToDelete,
      });

      if (response.data.status === 'success') {

        EventRegister.emit('onResourcePostDeleted', {
          deletedPostId: postToDelete,
        });

        dispatch(deleteResourcePost(postToDelete));
        setAllForumPost(prevPosts =>
          prevPosts.filter(post => post.resource_id !== postToDelete)
        );

        showToast("Resource post deleted", 'success');
      } else {
        throw new Error("Failed to delete post.");
      }
    } catch (error) {
      console.error("❌ Error deleting post:", error);
    }
  };


  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setPostToDelete(null);
    setFileKeyToDelete(null);
  };


  const RenderPostItem = ({ item }) => {
    const mimeType = item?.extraData?.type || "";
    const isVideo = mimeType.startsWith("video");
    const isImage = mimeType.startsWith("image");
    const isDocument = mimeType.startsWith("application");

    const rawFileUrl = imageUrls[item.resource_id];
    const fileUrl = typeof rawFileUrl === "object"
      ? Object.values(rawFileUrl)[0]   // take first value
      : rawFileUrl || item.fileUrl || item.imageUrl || defaultLogo;


    const formattedDate = new Date(item.posted_on * 1000)
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() =>
          navigation.navigate("ResourceDetails", { resourceID: item.resource_id })
        }
      >
        <View style={styles.postContainer}>
          <View style={styles.imageContainer}>
            {isDocument ? (
              <View style={styles.documentContainer}>
                <Icon name="file-document" size={50} color="#075cab" />
                <Text style={styles.docText}>
                  {item.extraData?.fileName
                    ?.split(".")
                    ?.pop()
                    ?.toUpperCase() || "DOC"}
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: fileUrl }}
                style={styles.image}
                resizeMode="contain"
              />
            )}
          </View>

          <View style={styles.textContainer}>
            <View style={styles.productDetails}>
              <Text numberOfLines={1} style={styles.value}>
                {item.title || ""}
              </Text>

              <MyPostBody
                html={item.resource_body}
                forumId={item.resource_id}
                numberOfLines={2}
              />
            </View>

            <Text style={styles.value}>{formattedDate || ""}</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditPress(item, fileUrl)}
              >
                <Icon name="pencil" size={20} style={{ color: "#075cab" }} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() =>
                  handleDelete(item.resource_id, item.fileKey, item.thumbnail_fileKey)
                }
              >
                <Icon name="delete" size={20} color="#FF0000" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  const keyExtractor = (item) => {
    return item.forum_id ? item.forum_id.toString() : `${item.forum_id}_${item.posted_on}`;
  };

  if (
    loading ||
    !allForumPost ||
    allForumPost.length === 0 ||
    allForumPost?.removed_by_author
  ) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
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
            <Icon name="arrow-left" size={24} color="#075cab" />
          </TouchableOpacity>

          {!loading && (
            <TouchableOpacity
              style={styles.circle}
              onPress={() => navigation.navigate('ResourcesPost')}
            >
              <Ionicons name="add-circle-outline" size={18} color="#075cab" />
              <Text style={styles.shareText}>Contribute</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {loading ? (
            <ActivityIndicator size="small" color="#075cab" />
          ) : (
            <Text style={{ fontSize: 16, color: 'gray' }}>No resources available</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#075cab" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.circle}
          onPress={() => navigation.navigate('ResourcesPost')}>
          <Ionicons name="add-circle-outline" size={18} color="#075cab" />
          <Text style={styles.shareText}>Contribute</Text>
        </TouchableOpacity>
      </View>


      <FlatList
        data={allForumPost}
        renderItem={RenderPostItem}
        contentContainerStyle={{ paddingBottom: '20%' }}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        ref={scrollViewRef}
        onScrollBeginDrag={() => Keyboard.dismiss()}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        // refreshControl={
        //   <RefreshControl
        //     refreshing={isRefreshing}
        //     onRefresh={handleRefresh}
        //   />
        // }
        bounces={false}
      />

      {showDeleteConfirmation && (
        <Message
          visible={showDeleteConfirmation}
          onCancel={cancelDelete}
          onOk={confirmDelete}
          title="Delete Confirmation"
          iconType="warning"
          message="Are you sure you want to delete this post?"
        />
      )}

      <Toast />
    </SafeAreaView>
  );
};




const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 20,
    marginTop: 10,
    color: "#075cab"
  },
  cricle: {
    marginRight: 10,
    width: 30, // Set the width of the circle
    height: 30, // Set the height of the circle
    borderRadius: 30, // Make it circular
    backgroundColor: '#075cab', // Background color of the circle
    alignItems: 'center', // Center the icon horizontally
    justifyContent: 'center', // Center the icon vertically
    elevation: 5, // Add shadow for Android
    shadowColor: '#000', // Shadow color for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow offset for iOS
    shadowOpacity: 0.3, // Shadow opacity for iOS
    shadowRadius: 4, // Shadow radius for iOS
  },
  postContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    marginHorizontal: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#ddd',
    shadowColor: '#000',
    top: 10

  },
  noPostsText: {
    color: 'black',
    textAlign: "center",
    fontSize: 18,
    fontWeight: '400',
    padding: 10,
  },
  noPostsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButton: {
    alignSelf: 'flex-start',
    padding: 10
  },
  loaderContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loaderContainer1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    padding: 10,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  circle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // paddingVertical: 10,
    paddingHorizontal: 5,
    // marginTop: 10,
    borderRadius: 8,

  },
  shareText: {
    color: '#075cab',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,

  },
  searchInput: {
    flex: 1,
    height: 30,
    marginHorizontal: 10,
    paddingHorizontal: 10,
    color: "black",
    fontSize: 14,
    paddingTop: 0,
    paddingBottom: 0,
    lineHeight: 20,
  },

  plusicon: {
    left: -19,
    color: 'white',
    backgroundColor: '#075cab',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  createPostButton: {
    position: 'absolute',
    bottom: 40,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: "#075cab"
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    // backgroundColor:'red',
    alignItems: 'center',
    marginTop: 10
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
  documentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', // Light gray background for contrast
    borderRadius: 10,
    padding: 10,
  },
  docText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#075cab',
  },


  textContainer: {
    flex: 2,
    padding: 15,
    gap: 8,
  },
  productDetails: {
    flex: 1, // Take remaining space
    // marginLeft: 15,
  },

  value: {
    flex: 2, // Take the remaining space
    flexShrink: 1,
    color: 'black',
    fontWeight: '400',
    fontSize: 14,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
    marginBottom: 5,
  },

  downtext: {
    fontSize: 15,
    marginLeft: 10,
    color: 'gray',
    fontWeight: "450"
  },
  body1: {
    fontSize: 14,
    margin: 10,
    marginBottom: 5,
    textAlign: 'left',
    color: 'black',
    fontWeight: "300"
  },
  label: {
    color: 'black',
    fontSize: 13,
    fontWeight: '300',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,

  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    // elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 1 },
  },
  editButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: "#075cab",
  },
  deleteButtonText: {
    color: "#FF0000",
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
    backgroundColor: '#ffffff',
    // elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 1 },

  },

  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    left: 10
  },
  shareButtonText: {
    color: "#075cab",
  },
  confirmationContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -120 }],
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    width: 320,
    alignItems: 'center',
    zIndex: 999,
    elevation: 10, // For shadow effect on Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 15,
  },
  confirmationText: {
    fontSize: 15,
    textAlign: 'center',
    color: 'black',
    marginBottom: 25,
  },
  confirmationButtons: {
    flexDirection: 'row',


  },
  confirmButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconStyle: {
    backgroundColor: 'whitesmoke',
    borderRadius: 25,
    padding: 10,
    marginBottom: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },


});



export default YourResourcesList

