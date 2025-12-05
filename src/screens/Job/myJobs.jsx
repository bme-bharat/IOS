


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, RefreshControl, FlatList, ActivityIndicator, TextInput } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Message from '../../components/Message';
import { useDispatch } from 'react-redux';
import { showToast } from '../AppUtils/CustomToast';
import apiClient from '../ApiClient';
import { useNetwork } from '../AppUtils/IdProvider';
import { EventRegister } from 'react-native-event-listeners';
import { getSignedUrl } from '../helperComponents/signedUrls';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import Add from '../../assets/svgIcons/add.svg';

import { colors, dimensions } from '../../assets/theme.jsx';
import { commonStyles } from '../AppUtils/AppStyles.js';

const YourComapanyPostedJob = () => {
  const navigation = useNavigation();
  const { myId, myData } = useNetwork();
  const [posts, setPosts] = useState([]);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const scrollViewRef = useRef(null);
  const dispatch = useDispatch();


  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);

  const withTimeout = (promise, timeout = 10000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout)),
    ]);
  };

  useEffect(() => {
    const onJobCreated = async (data) => {
      const { newPost } = data;
      console.log('newPost', newPost);

      // Insert or replace (upsert), newest at the top
      setPosts(prevJobs => {
        const filtered = prevJobs.filter(job => job.post_id !== newPost.post_id);
        return [newPost, ...filtered];
      });
    };

    const onJobUpdated = async (data) => {
      const { updatedPost } = data;

      setPosts(prevJobs =>
        prevJobs.map(job =>
          job.post_id === updatedPost.post_id ? updatedPost : job
        )
      );
    };

    const onJobDeleted = (data) => {
      const { postId } = data;

      setPosts(prevJobs =>
        prevJobs.filter(job => job.post_id !== postId)
      );
    };

    const createdListener = EventRegister.addEventListener('onJobPostCreated', onJobCreated);
    const updatedListener = EventRegister.addEventListener('onJobUpdated', onJobUpdated);
    const deletedListener = EventRegister.addEventListener('onJobDeleted', onJobDeleted);

    return () => {
      EventRegister.removeEventListener(createdListener);
      EventRegister.removeEventListener(updatedListener);
      EventRegister.removeEventListener(deletedListener);
    };
  }, []);


  const fetchCompanyJobPosts = async (lastEvaluatedKey = null) => {
    if (loading || loadingMore) return;

    lastEvaluatedKey ? setLoadingMore(true) : setLoading(true);

    try {
      const requestData = {
        command: "getCompanyAllJobPosts",
        company_id: myId,
        limit: 10,
      };

      if (lastEvaluatedKey) {
        requestData.lastEvaluatedKey = lastEvaluatedKey;
      }

      const response = await withTimeout(apiClient.post('/getCompanyAllJobPosts', requestData), 10000);

      if (response.data.status === 'success') {
        const jobs = response.data.response || [];
        const sortedJobs = jobs.sort((a, b) => b.job_post_created_on - a.job_post_created_on);

        if (!lastEvaluatedKey) {
          setPosts(sortedJobs);
        } else {
          setPosts((prevPosts) => {
            const newJobs = sortedJobs.filter(
              (job) => !prevPosts.some((existing) => existing.job_post_id === job.job_post_id)
            );
            return [...prevPosts, ...newJobs];
          });
        }

        if (response.data.lastEvaluatedKey) {
          setLastEvaluatedKey(response.data.lastEvaluatedKey);
          setHasMoreJobs(true);
        } else {
          setHasMoreJobs(false);
        }
      }
    } catch (error) {
      setPosts({ removed_by_author: true });
      setPosts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
    }
  };



  useFocusEffect(
    useCallback(() => {
      fetchCompanyJobPosts();

      return () => {
        setLastEvaluatedKey(null);
        setHasMoreJobs(true);
      };
    }, [])
  );


  const handleEdit = (post) => {
    navigation.navigate('CompanyJobEdit', { post });
  };

  const searchInputRef = useRef(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }

    setPosts([]);

    setHasMoreJobs(true);
    setLastEvaluatedKey(null);

    await fetchCompanyJobPosts();

    setIsRefreshing(false);
  }, [fetchCompanyJobPosts]);

  const getSlicedTitle = (title) => {
    const maxLength = 20;  // Define the maximum length including spaces
    if (title.length > maxLength) {
      return title.slice(0, maxLength).trim() + '...'; // Trim to the max length and add ellipsis
    }
    return title; // Return the original title if it's already within the length limit
  };



  const confirmDelete = (post) => {
    setPostToDelete(post); // Set the post to delete
    setDeleteAlertVisible(true); // Show the custom delete confirmation alert
  };

  const cancelDelete = () => {
    setDeleteAlertVisible(false); // Close the alert without deleting
  };



  useFocusEffect(
    useCallback(() => {

      if (scrollViewRef.current) {
        // Scroll to the top after fetching companies
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
      }
    }, [])
  );

  const handleDelete = async () => {
    if (!postToDelete) return;

    try {
      const response = await apiClient.post('/deleteJobPost', {
        command: "deleteJobPost",
        company_id: postToDelete.company_id,
        post_id: postToDelete.post_id,
      });

      if (response.data.status === 'success') {
        // ✅ Emit deletion event
        EventRegister.emit('onJobDeleted', {
          postId: postToDelete.post_id,
        });

        showToast("Job deleted successfully", 'success');
      } else {
        showToast("Something went wrong", 'error');
      }
    } catch (error) {
      showToast("You don't have an internet connection", 'error');
    } finally {
      setDeleteAlertVisible(false);
    }
  };



  const renderJob = ({ item: post }) => (

    <TouchableOpacity
      key={post.post_id}
      activeOpacity={1}
      style={styles.postContainer}
      onPress={() => navigation.navigate('JobDetail', { post_id: post.post_id })}
    >
      <View style={styles.textContainer}>
        <View>
          <View style={commonStyles.valContainer}>
            <Text style={commonStyles.label}>Job Title</Text>
            <Text style={commonStyles.colon}>:</Text>
            <Text style={commonStyles.value}>{(getSlicedTitle(post.job_title || '')).trimStart().trimEnd()}</Text>
          </View>
          <View style={commonStyles.valContainer}>
            <Text style={commonStyles.label}>Industry Type</Text>
            <Text style={commonStyles.colon}>:</Text>
            <Text style={commonStyles.value}>{(post.industry_type || '').trimStart().trimEnd()}</Text>
          </View>
          <View style={commonStyles.valContainer}>
            <Text style={commonStyles.label}>Package</Text>
            <Text style={commonStyles.colon}>:</Text>
            <Text style={commonStyles.value}>{(post.Package || '').trimStart().trimEnd()}</Text>
          </View>
        </View>


        <View style={styles.iconContainer}>

          <TouchableOpacity style={[styles.actionButton,]} onPress={() => handleEdit(post)} activeOpacity={1}>
            <View style={styles.iconTextContainer}>

              <Text style={styles.buttonText}>Edit</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton]} onPress={() => confirmDelete(post)} activeOpacity={1}>
            <View style={styles.iconTextContainer}>

              <Text style={styles.deleteButtonText}>Delete</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("CompanyAppliedJob", { post })} style={[styles.actionButton]} activeOpacity={1}>
            <View style={styles.iconTextContainer}>
              <Text style={styles.buttonText}>View Applications</Text>
            </View>
          </TouchableOpacity>

        </View>


      </View>

    </TouchableOpacity>

  );


  if (!loading && posts.length === 0 || (posts.length === 1 && posts[0]?.removed_by_author)) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

          </TouchableOpacity>

          <TouchableOpacity style={styles.circle}
            onPress={() => navigation.navigate("CompanyJobPost")} activeOpacity={0.8}>
            <Add width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

            <Text style={styles.shareText}>Post a job</Text>
          </TouchableOpacity>

        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>No jobs available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

        </TouchableOpacity>

        <TouchableOpacity style={styles.circle}
          onPress={() => navigation.navigate("CompanyJobPost")} activeOpacity={0.8}>
          <Add width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

          <Text style={styles.shareText}>Post a job</Text>
        </TouchableOpacity>
      </View>

      <FlatList

        data={posts}
        renderItem={renderJob}
        keyExtractor={(item, index) => `${item.post_id}-${index}`}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasMoreJobs && fetchCompanyJobPosts(lastEvaluatedKey)}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        ListFooterComponent={() =>
          loadingMore && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#075cab" />
            </View>
          )
        }
      // ListHeaderComponent={() => (
      //   <View style={styles.headerContainer}>
      //     <Text style={styles.headerText}>Your Jobs: {posts.length}</Text>
      //   </View>
      // )}
      // ListEmptyComponent={
      //   posts.length === 0 ? (
      //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      //       <Text style={{ fontSize: 16, color: 'gray' }}>No jobs available</Text>
      //     </View>
      //   ) : null
      // }

      />

      < Message
        visible={isDeleteAlertVisible}
        onClose={cancelDelete}
        onCancel={cancelDelete}
        onOk={() => {
          setDeleteAlertVisible(false);
          handleDelete();
        }}
        title="Delete Confirmation"
        message="Are you sure you want to delete this job? deleting it will remove all job applications, this action cannot be undone?"
        iconType="warning"
      />

    </View>
  );
};



// Updated Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'whitesmoke',
  },

  container1: {
    flex: 1,
    padding: 10,
    backgroundColor: 'whitesmoke',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,
  },
  circle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // paddingVertical: 10,
    padding: 10,
    // marginTop: 10,
    borderRadius: 8,

  },
  shareText: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 4,

  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
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
    backgroundColor: 'whitesmoke',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  icon1: {
    opacity: 0.8,

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

  headerText: {
    color: 'black',
    fontSize: 15,
    fontWeight: '600'
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPostsText: {
    color: 'black',
    fontSize: 18,
    fontWeight: '400',
    padding: 10
  },
  postContainer: {
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#ccc',
    padding: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginHorizontal: 5,
    top: 5

  },
  textContainer: {
    flex: 1,

  },
  textContainer1: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '490',
    color: '#333',
    marginBottom: 5,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,

  },
  label: {
    flex: 1, // Take up available space
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',

  },
  colon: {
    width: 20, // Fixed width for the colon
    textAlign: 'center', // Center the colon
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    alignSelf: 'flex-start',

  },
  value: {
    flex: 2, // Take the remaining space
    flexShrink: 1,
    color: 'black',
    fontWeight: '400',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  actionButton: {
    padding: 8,
    borderRadius: 5,

  },
  deleteButtonText: {
    color: "#FF0000",
    fontSize: 15
  },
  buttonText: {
    marginLeft: 5,
    fontSize: 15,
    fontWeight: '500',
    color: "#075cab",
  },
  iconTextContainer: {
    flexDirection: 'row',
    // alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  applyButton: {
    color: '#075cab',
    fontWeight: '500',
    fontSize: 15,
    // textDecorationLine: 'underline',
  },
  createPostButton: {
    position: 'absolute',
    bottom: 60, // Adjust this value to move the button up or down
    right: 30, // Adjust this value to move the button left or right
    width: 50, // Set the width of the button
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: "#075cab"
  },
});

export default YourComapanyPostedJob;