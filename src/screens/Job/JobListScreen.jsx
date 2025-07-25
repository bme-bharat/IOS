
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Linking, Modal, RefreshControl, Share, SafeAreaView, Alert, Keyboard, FlatList, TouchableWithoutFeedback } from 'react-native';
import axios from 'axios';
import { useFocusEffect, useNavigation, useNavigationState, useScrollToTop } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../assets/Constants';
import FastImage from 'react-native-fast-image';
import apiClient from '../ApiClient';
import { setJobImageUrls, updateOrAddJobPosts } from '../Redux/Job_Actions';
import { useSelector } from 'react-redux';
import Fuse from 'fuse.js';
import { useNetwork } from '../AppUtils/IdProvider';
import { showToast } from '../AppUtils/CustomToast';
import { useConnection } from '../AppUtils/ConnectionProvider';
import AppStyles from '../../assets/AppStyles';
import { getSignedUrl, highlightMatch, useLazySignedUrls } from '../helperComponents.jsx/signedUrls';
import buliding from '../../images/homepage/buliding.jpg';
import { EventRegister } from 'react-native-event-listeners';
import { generateAvatarFromName } from '../helperComponents.jsx/useInitialsAvatar';
const Company = Image.resolveAssetSource(buliding).uri;


const ProductsList = React.lazy(() => import('../Products/ProductsList'));
const CompanySettingScreen = React.lazy(() => import('../Profile/CompanySettingScreen'));
const CompanyHomeScreen = React.lazy(() => import('../CompanyHomeScreen'));
const PageView = React.lazy(() => import('../Forum/PagerViewForum'));

const JobListScreen = () => {
  const navigation = useNavigation();

  const tabNameMap = {
    CompanyJobList: "Jobs",
    Home: 'Home3',
    CompanySetting: 'Settings',
    ProductsList: 'Products'
  };

  const tabConfig = [
    { name: "Home", component: CompanyHomeScreen, focusedIcon: 'home', unfocusedIcon: 'home-outline', iconComponent: Icon },
    { name: "Jobs", component: JobListScreen, focusedIcon: 'briefcase', unfocusedIcon: 'briefcase-outline', iconComponent: Icon },
    { name: "Feed", component: PageView, focusedIcon: 'rss', unfocusedIcon: 'rss-box', iconComponent: Icon },
    { name: "Products", component: ProductsList, focusedIcon: 'shopping', unfocusedIcon: 'shopping-outline', iconComponent: Icon },
    { name: "Settings", component: CompanySettingScreen, focusedIcon: 'cog', unfocusedIcon: 'cog-outline', iconComponent: Icon },
  ];

  const parentNavigation = navigation.getParent();
  const currentRouteName = parentNavigation?.getState()?.routes[parentNavigation.getState().index]?.name;


  const { myId } = useNetwork();
  const { isConnected } = useConnection();


  const { jobPosts: jobs } = useSelector(state => state.jobs);
  const jobImageUrls = useSelector(state => state.jobs.jobImageUrls);
  const storeProfile = useSelector(state => state.CompanyProfile.profile);



  const flatListRef = useRef(null);
  const scrollOffsetY = useRef(0);


  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollOffsetY.current = offsetY;
  };

  const [localJobs, setLocalJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchLimit, setFetchLimit] = useState(20);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const [profile, setProfile] = useState(false)
  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [profileCreated, setProfileCreated] = useState(false)

  useEffect(() => {
    const onJobCreated = async (data) => {
      const { newPost } = data;

      try {
        const signedMap = await getSignedUrl(newPost.post_id, newPost.fileKey || '');
        const imageUrl = signedMap[newPost.post_id] || Company;

        const jobWithImage = {
          ...newPost,
          imageUrl,
          companyAvatar: generateAvatarFromName(newPost.company_name)
        };

        setLocalJobs(prevJobs => {
          const filtered = prevJobs.filter(job => job.post_id !== jobWithImage.post_id);
          return [jobWithImage, ...filtered];
        });
      } catch (err) {
        // Error handling
      }
    };

    const onJobUpdated = async (data) => {
      const { updatedPost } = data;

      try {
        const signedMap = await getSignedUrl(updatedPost.post_id, updatedPost.fileKey || '');
        const imageUrl = signedMap[updatedPost.post_id] || Company;

        const updatedJobWithImage = {
          ...updatedPost,
          imageUrl,
          companyAvatar: generateAvatarFromName(updatedPost.company_name)
        };

        setLocalJobs(prevJobs =>
          prevJobs.map(job =>
            String(job.post_id) === String(updatedPost.post_id) ? { ...job, ...updatedJobWithImage } : job
          )
        );
      } catch (err) {
        // Error handling
      }
    };

    const onJobDeleted = (data) => {
      const { postId } = data;

      setLocalJobs(prevJobs =>
        prevJobs.filter(job => String(job.post_id) !== String(postId))
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



  const fetchProfile1 = async () => {
    try {
      const response = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/getJobProfiles',
        {
          command: 'getJobProfiles',
          user_id: myId,
        },
        {
          headers: {
            'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
          },
        }
      );

      if (response.data.status === 'error') {
        console.log('response.data.status', response.data)
        setProfileCreated(false);

      } else if (response.data.status === 'success') {

        const profileData = response.data.response && response.data.response[0];
        if (profileData) {
          setProfileCreated(true);

        } else {
          setProfileCreated(false);

        }
      }
    } catch (error) {

    }
  };

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
      if (isConnected) {
        checkForNewJobs();
      }
    }, 10000); // every 10 seconds

    return () => clearInterval(interval);
  }, [isConnected]);


  const checkForNewJobs = async () => {
    const now = Math.floor(Date.now() / 1000);

    try {
      const response = await apiClient.post('/getNewJobPostsCount', {
        command: 'getNewJobPostsCount',
        user_id: myId,
        lastVisitedTime: lastCheckedTimeRef.current,
      });

      const { count = 0, company_ids = [] } = response?.data || {};

      const filteredCompanyIds = company_ids.filter(id => id !== myId);
      const filteredCount = filteredCompanyIds.length;

      if (filteredCount > 0) {
        setNewJobCount(filteredCount);
        setShowNewJobAlert(true);
      } else {
        setShowNewJobAlert(false);
      }

    } catch (error) {

    }
  };





  const fetchProfile = async () => {
    if (!myId) return;

    try {
      const response = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/getUserDetails',
        { command: 'getUserDetails', user_id: myId },
        { headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' } }
      );

      if (response.data.status === 'success') {
        const profileData = response.data.status_message;

        setProfile(profileData);

      }
    } catch (error) {

    }
  };

  useEffect(() => {
    fetchProfile();
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchProfile1();
    }, [])
  );


  const navigateToDetails = (job) => {
    navigation.navigate("JobDetail", { post_id: job.post_id, post: job });
  };

  const withTimeout = (promise, timeout = 10000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout)),
    ]);
  };

  const [companyCount, setCompanyCount] = useState(0);

  const fetchJobs = async (lastEvaluatedKey = null) => {
    if (!isConnected) return;
    if (loading || loadingMore) return;

    lastEvaluatedKey ? setLoadingMore(true) : setLoading(true);
    const startTime = Date.now();

    try {
      const requestData = {
        command: "getAllJobPosts",
        limit: fetchLimit,
        ...(lastEvaluatedKey && { lastEvaluatedKey }),
      };

      const res = await withTimeout(apiClient.post('/getAllJobPosts', requestData), 10000);
      const jobs = res.data.response || [];
      setCompanyCount(res.data.count);

      if (!jobs.length) {
        setLastEvaluatedKey(null);
        setHasMoreJobs(false);
        return;
      }

      // Only add avatar data to jobs that don't have a fileKey
      const jobsWithAvatars = jobs.map(job => {
        // If fileKey exists, return the job as-is
        if (job.fileKey) {
          return job;
        }
        // Otherwise, add generated avatar
        return {
          ...job,
          companyAvatar: generateAvatarFromName(job.company_name)
        };
      });

      // Append new jobs to localJobs state
      setLocalJobs(prevJobs => {
        const existingIds = new Set(prevJobs.map(job => job.post_id));
        const newUniqueJobs = jobsWithAvatars.filter(job => !existingIds.has(job.post_id));
        return [...prevJobs, ...newUniqueJobs];
      });

      setLastEvaluatedKey(res.data.lastEvaluatedKey || null);
      setHasMoreJobs(!!res.data.lastEvaluatedKey);

      const responseTime = Date.now() - startTime;
      if (responseTime < 400) {
        setFetchLimit(prev => Math.min(prev + 5, 10));
      } else if (responseTime > 1000) {
        setFetchLimit(prev => Math.max(prev - 2, 1));
      }

    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };


  useEffect(() => {

    fetchJobs();

  }, []);


  const {
    getUrlFor,
    onViewableItemsChanged,
    viewabilityConfig
  } = useLazySignedUrls(localJobs, getSignedUrl, 5, {
    idField: 'post_id',
    fileKeyField: 'fileKey',
  });




  const searchInputRef = useRef(null);

  const refreshCooldown = useRef(false);

  const handleRefresh = async () => {
    if (!isConnected) {

      return;
    }

    if (refreshCooldown.current) return;

    refreshCooldown.current = true;

    setIsRefreshing(true);

    setSearchQuery('');
    setSearchTriggered(false);
    setSearchResults([]);
    setLastEvaluatedKey(null);

    setHasMoreJobs(true);
    setLastEvaluatedKey(null);
    setNewJobCount(0);
    setShowNewJobAlert(false);
    updateLastCheckedTime(Math.floor(Date.now() / 1000));
    setLocalJobs([])
    await fetchJobs();

    setIsRefreshing(false);

    setTimeout(() => {
      refreshCooldown.current = false;
    }, 3000);

  };


  const handleSearch = useCallback(async (text) => {
    if (!isConnected) {
      showToast('No internet connection', 'error');
      return;
    }

    setSearchQuery(text);

    if (text.trim() === '') {
      setSearchResults([]);
      return;
    }

    try {
      const requestData = {
        command: "searchJobPosts",
        searchQuery: text,
      };

      const res = await withTimeout(apiClient.post('/searchJobPosts', requestData), 10000);
      const jobs = res.data.response || [];
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

      // Get signed URLs only for jobs that have fileKey
      const jobsWithFileKey = jobs.filter(job => job.fileKey);
      const urlPromises = jobsWithFileKey.map(job =>
        getSignedUrl(job.post_id, job.fileKey)
      );

      const signedUrlsArray = await Promise.all(urlPromises);
      const rawSignedUrlMap = Object.assign({}, ...signedUrlsArray);

      // Embed imageUrl and avatar into each job
      const jobsWithImage = jobs.map(job => {
        const baseJob = {
          ...job,
          // Only set imageUrl if fileKey exists and we got a signed URL
          imageUrl: job.fileKey ? (rawSignedUrlMap[job.post_id] || Company) : null,
        };

        // Only generate avatar if no fileKey exists
        return job.fileKey ? baseJob : {
          ...baseJob,
          companyAvatar: generateAvatarFromName(job.company_name)
        };
      });

      setSearchResults(jobsWithImage);

    } catch (error) {
      console.error('Search error:', error);
      showToast('Failed to perform search', 'error');
    } finally {
      setSearchTriggered(true);
    }
  }, [isConnected]);

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
      handleSearch(trimmedText);  // Call actual search function
    }, 300);
  }, [handleSearch]);





  const shareJob = async (job) => {
    try {

      const baseUrl = 'https://bmebharat.com/jobs/post/';
      const jobUrl = `${baseUrl}${job.post_id}`;


      const result = await Share.share({
        message: `Checkout this job: ${jobUrl}`,
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


  const handleNavigate = (company_id) => {
    navigation.navigate('CompanyDetailsPage', { userId: company_id });
  };

  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);


  const renderJob = ({ item: job }) => {
    const imageUrl = getUrlFor(job.post_id);

    const resizeMode = imageUrl?.includes('buliding.jpg') ? 'cover' : 'contain';

    return (
      <TouchableOpacity style={{ paddingHorizontal: 10, paddingBottom: 5, }} activeOpacity={1}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigateToDetails(job)}
          activeOpacity={1}
        >
          <View style={AppStyles.cardImage1}>
            {imageUrl ? (
              <FastImage
                source={{ uri: imageUrl, priority: FastImage.priority.normal }}
                cache="immutable"
                style={AppStyles.cardImage}
                resizeMode={resizeMode}
                onError={() => { }}
              />
            ) : (
              <View style={[AppStyles.avatarContainer, { backgroundColor: job.companyAvatar?.backgroundColor }]}>
                <Text style={[AppStyles.avatarText, { color: job.companyAvatar?.textColor }]}>
                  {job.companyAvatar?.initials}
                </Text>
              </View>
            )}
          </View>



          <View style={styles.textContainer}>
            <Text numberOfLines={1} style={styles.title1}>
              {highlightMatch(job.job_title || '', searchQuery)}
            </Text>

            <View style={styles.detailContainer}>
              <View style={styles.lableIconContainer}>
                <Icon name="office-building-marker-outline" size={20} color="black" style={styles.icon} />
                <Text style={styles.label}>Company</Text>
              </View>
              <Text style={styles.colon}>:</Text>

              <TouchableOpacity onPress={() => handleNavigate(job.company_id)} style={styles.value} activeOpacity={0.8}>
                <Text numberOfLines={1} style={styles.companyName}>{highlightMatch(job.company_name || '', searchQuery)}</Text>
              </TouchableOpacity>

            </View>

            <View style={styles.detailContainer}>
              <View style={styles.lableIconContainer}>
                <Icon name="currency-inr" size={20} color="black" style={styles.icon} />
                <Text style={styles.label}>Package</Text>
              </View>
              <Text style={styles.colon}>:</Text>
              <Text numberOfLines={1} style={styles.value}>{highlightMatch(job.Package || "", searchQuery)}</Text>
            </View>

            <View style={styles.detailContainer}>
              <View style={styles.lableIconContainer}>
                <Icon name="map-marker" size={20} color="black" style={styles.icon} />
                <Text style={styles.label}>Location</Text>

              </View>
              <Text style={styles.colon}>:</Text>
              <Text numberOfLines={1} style={styles.value}>
                {highlightMatch(
                  `${job.company_located_state || ""}, ${job.company_located_city || ""}`,
                  searchQuery,
                )}

              </Text>

            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.viewMoreButton} onPress={() => navigateToDetails(job)}>
                <Text style={styles.viewMore}> See more...</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => shareJob(job)} style={styles.shareButton}>
                <Icon name="share" size={24} color="#075cab" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };



  return (
    <SafeAreaView style={styles.container1}>

      <View style={styles.container}>
        <View style={AppStyles.headerContainer}>
          <View style={AppStyles.searchContainer}>
            <View style={AppStyles.inputContainer}>
              <TextInput
                ref={searchInputRef}
                style={AppStyles.searchInput}
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
                  activeOpacity={0.8}
                  style={AppStyles.iconButton}
                >
                  <Icon name="close-circle" size={20} color="gray" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={1}
                  style={AppStyles.searchIconButton}
                >
                  <Icon name="magnify" size={20} color="#075cab" />
                </TouchableOpacity>

              )}

            </View>
          </View>


          {isConnected && (
            <TouchableOpacity
              style={AppStyles.circle}
              onPress={() => {
                if (profile?.user_type === 'company') {
                  navigation.navigate("CompanyJobPost");
                } else {
                  if (profileCreated) {
                    navigation.navigate("UserJobProfile");
                  } else {
                    navigation.navigate("UserJobProfileCreate");
                  }
                }
              }}
              activeOpacity={0.5}
            >
              <Icon name="plus-circle-outline" size={16} color="#075cab" />
              <Text style={AppStyles.shareText}>
                {storeProfile?.user_type === 'company' ? 'Post' : 'Job profile'}
              </Text>
            </TouchableOpacity>
          )}


        </View>

        {showNewJobAlert && (
          <TouchableOpacity onPress={handleRefresh} style={{ position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: '#075cab', padding: 10, borderRadius: 10, zIndex: 10 }}>
            <Text style={{ color: 'white' }}>{newJobCount} new job{newJobCount > 1 ? 's' : ''} available — Tap to refresh</Text>
          </TouchableOpacity>
        )}


        {!loading ? (
          <FlatList
            data={!searchTriggered ? localJobs : searchResults}
            renderItem={({ item }) => renderJob({ item })}
            ref={flatListRef}
            onScroll={event => {
              handleScroll(event);
              Keyboard.dismiss();
              searchInputRef.current?.blur?.();
            }}
            scrollEventThrottle={16}
            onScrollBeginDrag={() => {
              Keyboard.dismiss();
              searchInputRef.current?.blur?.();
            }}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item, index) => `${item.post_id}-${index}`}
            contentContainerStyle={styles.scrollView}
            onEndReached={() => !searchQuery && hasMoreJobs && fetchJobs(lastEvaluatedKey)}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              (searchTriggered && searchResults.length === 0) ? (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <Text style={{ fontSize: 16, color: '#666' }}>No jobs found</Text>
                </View>
              ) : null
            }
            ListHeaderComponent={
              <View>
                {!loading && (
                  <>
                    <Text style={styles.companyCount}>
                      {searchTriggered ? `${searchResults.length} jobs found` : `${companyCount} jobs found`}
                    </Text>

                    {searchTriggered && searchResults.length > 0 && (
                      <Text style={styles.companyCount}>
                        Showing results for{" "}
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#075cab' }}>
                          "{searchQuery}"
                        </Text>
                      </Text>
                    )}
                  </>
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
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={'#075cab'} size="large" />
          </View>
        )}

      </View>


      <View style={styles.bottomNavContainer}>
        {tabConfig.map((tab, index) => {
          const isFocused = currentRouteName === tab.name;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => {
                const targetTab = tab.name;

                if (isFocused) {
                  if (scrollOffsetY.current > 0) {
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

                    setTimeout(() => {
                      handleRefresh();
                    }, 300);
                  } else {
                    handleRefresh();
                  }
                } else {
                  navigation.navigate(targetTab);
                }
              }}

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

const styles = StyleSheet.create({

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


  container1: {
    flex: 1,
    backgroundColor: 'whitesmoke',

  },
  container: {
    flex: 1,
    backgroundColor: 'whitesmoke',

  },

  companyCount: {
    fontSize: 14,
    fontWeight: '400',
    color: 'black',
    padding: 5,
    paddingHorizontal: 15,
  },


  scrollView: {
    paddingBottom: '10%',
  },


  shareButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },

  backButton: {
    alignSelf: 'flex-start',
    padding: 10
  },


  card: {
    width: '100%',
    backgroundColor: "white",
    borderRadius: 10,
  },

  
  textContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,

  },
  title1: {
    fontSize: 16,
    fontWeight: '500',
    color: "black",
    marginBottom: 8,
    // textAlign: 'justify',
  },
  title: {
    fontSize: 14,
    color: 'black',
    marginTop: 9,
    fontWeight: "300",
    // gap:8,
    lineHeight: 24,
  },
  viewMoreButton: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  viewMoreText: {
    color: "#075cab",
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',        // Align buttons in a row
    justifyContent: 'space-between',  // Spread buttons across the row
    // marginTop: 10,               // Add top margin for some space
    alignItems: 'center',        // Vertically center buttons
  },
  viewMore: {
    // padding: 20,
    color: "#075cab",
    textAlign: 'left',
    fontSize: 16,
    fontWeight: '700',
  },
  createPostButton: {
    position: 'absolute',
    bottom: 60, // Adjust this value to move the button up or down
    right: 30, // Adjust this value to move the button left or right
    width: 50, // Set the width of the button
    height: 50,
    borderRadius: 30,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',


    backgroundColor: "#075cab"
  },
  createPostButton1: {
    position: 'absolute',
    top: -150,
    right: -5,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },


  detailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10
  },
  lableIconContainer: {
    flexDirection: 'row',
    flex: 1, // Take up available space
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
  },
  icon: {
    opacity: 0.8,
    marginRight: 5,
  },
  label: {
    flex: 1, // Take up available space
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
  },
  refreshControlContainer: {
    paddingTop: 60, // Offset for header height to prevent overlap with refresh control
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

});


export default JobListScreen;


