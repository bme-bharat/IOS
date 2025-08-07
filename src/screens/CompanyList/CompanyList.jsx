

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Modal, Linking, Platform, Share, RefreshControl, Alert, SafeAreaView, Animated, FlatList, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { useNavigation, useFocusEffect, useScrollToTop } from '@react-navigation/native';
import { COLORS } from '../../assets/Constants';
import FastImage from 'react-native-fast-image';
import default_image from '../../images/homepage/buliding.jpg'
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../ApiClient';
import Fuse from 'fuse.js';
import { useNetwork } from '../AppUtils/IdProvider';
import { useConnection } from '../AppUtils/ConnectionProvider';
import { getSignedUrl, highlightMatch, useLazySignedUrls } from '../helperComponents.jsx/signedUrls';
import AppStyles from '../AppUtils/AppStyles';
import { generateAvatarFromName } from '../helperComponents.jsx/useInitialsAvatar';

const defaultImage = Image.resolveAssetSource(default_image).uri;
const CompanyListScreen = () => {
  const navigation = useNavigation();
  const { myId, myData } = useNetwork();
  const { isConnected } = useConnection();

  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyImageUrls, setCompanyImageUrls] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollViewRef = useRef(null);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [hasMoreCompanies, setHasMoreCompanies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [companyCount, setCompanyCount] = useState(0);
  const [searchCount, setSearchCount] = useState(0);
  const [fetchLimit, setFetchLimit] = useState(20);


  const withTimeout = (promise, timeout = 10000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout)),
    ]);
  };

  const fetchCompanies = async (lastEvaluatedKey = null) => {
    if (!isConnected || loading || loadingMore) return;

    lastEvaluatedKey ? setLoadingMore(true) : setLoading(true);

    try {
      const requestData = {
        command: "listAllCompanies",
        limit: fetchLimit,
        ...(lastEvaluatedKey && { lastEvaluatedKey }),
      };

      const res = await withTimeout(apiClient.post('/listAllCompanies', requestData), 10000);

      const companies = res.data.response || [];
      setCompanyCount(res.data.count);
      if (!companies.length) {
        setLastEvaluatedKey(null);
        setHasMoreCompanies(false);
        return;
      }

      // Only add avatar data to companies that don't have a fileKey
      const companiesWithAvatars = companies.map(company => {
        // If fileKey exists, return the company as-is
        if (company.fileKey) {
          return company;
        }
        // Otherwise, add generated avatar
        return {
          ...company,
          companyAvatar: generateAvatarFromName(company.company_name)
        };
      });

      setCompanies(prev => {
        const existingIds = new Set(prev.map(c => c.company_id));
        const newUniqueCompanies = companiesWithAvatars.filter(c => !existingIds.has(c.company_id));
        return [...prev, ...newUniqueCompanies];
      });

      setLastEvaluatedKey(res.data.lastEvaluatedKey || null);
      setHasMoreCompanies(!!res.data.lastEvaluatedKey);

    } catch (error) {
      console.error('❌ Error in fetchCompanies:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };




  const {
    getUrlFor,
    onViewableItemsChanged,
    viewabilityConfig
  } = useLazySignedUrls(companies, getSignedUrl, 5, {
    idField: 'company_id',
    fileKeyField: 'fileKey',
  });



  useEffect(() => {
    fetchCompanies();
  }, []);


  const searchInputRef = useRef(null);

  const handleRefresh = useCallback(async () => {
    if (!isConnected) {

      return;
    }
    setIsRefreshing(true);
    setSearchQuery('');

    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }

    setCompanies([]);

    setCompanyImageUrls({});
    setHasMoreCompanies(true);
    setLastEvaluatedKey(null);

    await fetchCompanies();
    setIsRefreshing(false);
  }, []);


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



  const handleSearch = async (text) => {
    setSearchQuery(text);

    if (text.trim() === '') {
      setSearchResults([]);
      setSearchCount(0);
      return;
    }

    try {
      const requestData = {
        command: 'searchCompanies',
        searchQuery: text.trim(),
      };

      const res = await withTimeout(apiClient.post('/searchCompanies', requestData), 10000);
      const companies = res?.data?.response || [];
      const count = res?.data?.count || companies.length;
      scrollViewRef.current?.scrollToOffset({ offset: 0, animated: true });

      // Only fetch signed URLs for companies that have a fileKey
      const companiesWithFileKey = companies.filter(company => company.fileKey);
      const urlPromises = companiesWithFileKey.map(company =>
        getSignedUrl(company.company_id, company.fileKey)
      );
      const signedUrlsArray = await Promise.all(urlPromises);
      const signedUrlMap = Object.assign({}, ...signedUrlsArray);

      // Process companies with conditional avatar generation
      const companiesWithImage = companies.map(company => {
        const baseCompany = {
          ...company,
          // Only set imageUrl if fileKey exists
          imageUrl: company.fileKey ? (signedUrlMap[company.company_id] || defaultImage) : null,
        };

        // Only add avatar if no fileKey exists
        return company.fileKey ? baseCompany : {
          ...baseCompany,
          companyAvatar: generateAvatarFromName(company.company_name)
        };
      });

      setSearchResults(companiesWithImage);
      setSearchCount(count);

    } catch (error) {
      console.error('[handleSearch] Error searching companies:', error);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setSearchTriggered(true);
    }
  };



  const shareJob = async (company) => {
    if (!company?.company_id) {

      return;
    }

    try {
      const baseUrl = 'https://bmebharat.com/company/';
      const companyUrl = `${baseUrl}${company.company_id}`;

      const result = await Share.share({
        message: `Checkout this company: ${companyUrl}`,
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


  const navigateToDetails = (company) => {
    navigation.navigate('CompanyDetails', { userId: company.company_id, profile : company});
  };


  const renderCompanyItem = ({ item, index }) => {
    if (!item) return

    const imageUrl = getUrlFor(item.company_id);
    const resizeMode = imageUrl?.includes('buliding.jpg') ? 'cover' : 'contain';

    return (
      <TouchableOpacity activeOpacity={1} style={{ paddingHorizontal: 10 }}>
        <TouchableOpacity style={styles.card} activeOpacity={1} onPress={() => navigateToDetails(item)} >

          <TouchableOpacity style={AppStyles.cardImage1} onPress={() => navigateToDetails(item)} activeOpacity={0.8} >
      
            {imageUrl ? (
              <FastImage
                source={{ uri: imageUrl, priority: FastImage.priority.normal }}
                cache="immutable"
                style={AppStyles.cardImage}
                resizeMode={resizeMode}
                onError={() => { }}
              />
            ) : (
              <View style={[AppStyles.avatarContainer, { backgroundColor: item.companyAvatar?.backgroundColor }]}>
                <Text style={[AppStyles.avatarText, { color: item.companyAvatar?.textColor }]}>
                  {item.companyAvatar?.initials}
                </Text>
              </View>
            )}
     
          </TouchableOpacity>
          <View style={styles.textContainer}>
            {myId === item.company_id && (
              <TouchableOpacity style={styles.createPostButton}>
                <Icon
                  onPress={() => navigation.navigate('CompanyProfile')}
                  name="pencil"
                  size={25}
                  color="#075cab"
                />
              </TouchableOpacity>
            )}

            <View style={styles.row}>
              <View style={styles.labelAndIconContainer}>
                <Icon name='office-building-marker-outline' size={20} marginRight={5} color={'black'} />
                <Text style={styles.label}>Company </Text>
              </View>
              <Text style={styles.colon}>:</Text>

              <Text style={styles.value}>
                <Text numberOfLines={1} style={styles.companyName}>{highlightMatch(item?.company_name || '', searchQuery)}</Text>

              </Text>
            </View>
            <View style={styles.row}>
              <View style={styles.labelAndIconContainer}>
                <Icon name="domain" size={20} color="black" style={styles.icon} />
                <Text style={styles.label}>Category </Text>
              </View>
              <Text style={styles.colon}>:</Text>

              <Text numberOfLines={1} style={styles.value}>
                {highlightMatch(item?.category || '', searchQuery)}
              </Text>
            </View>
            <View style={styles.row}>
              <View style={styles.labelAndIconContainer}>
                <Icon name="map-marker" size={20} color="black" style={styles.icon} />
                <Text style={styles.label}>City          </Text>
              </View>
              <Text style={styles.colon}>:</Text>

              <Text style={styles.value}>
                {highlightMatch(item?.company_located_city || '', searchQuery)}
              </Text>
            </View>
            <View style={styles.row}>
              <View style={styles.labelAndIconContainer}>
                <Icon name="map-marker" size={20} color="black" style={styles.icon} />
                <Text style={styles.label}>State       </Text>
              </View>
              <Text style={styles.colon}>:</Text>

              <Text style={styles.value}>
                {highlightMatch(item?.company_located_state || '', searchQuery)}
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.viewMoreButton} onPress={() => navigateToDetails(item)}>
                <Text style={styles.viewMore}>See more...</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => shareJob(item)} style={styles.shareButton}>
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
      <View style={styles.container} >
        {/* Search and Refresh */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#075cab" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder='Search'
                ref={searchInputRef}
                placeholderTextColor="gray"
                value={searchQuery}
                onChangeText={handleDebouncedTextChange}

              />
              {searchTriggered ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSearchTriggered(false);
                    setSearchResults([]);
                    setSearchCount(0);

                  }}
                  style={AppStyles.iconButton}
                >
                  <Icon name="close-circle" size={20} color="gray" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={AppStyles.searchIconButton}
                >
                  <Icon name="magnify" size={20} color="#075cab" />
                </TouchableOpacity>

              )}
            </View>
          </View>
        </View>

        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            searchInputRef.current?.blur?.();

          }}
        >
          {!loading ? (
            <FlatList
              data={!searchTriggered || searchQuery.trim() === '' ? companies : searchResults}
              renderItem={renderCompanyItem}
              ref={scrollViewRef}
              keyExtractor={(item, index) => `${item.company_id}-${index}`}
              onEndReached={() => {
                if (!searchQuery && hasMoreCompanies && !loadingMore) {
                  fetchCompanies(lastEvaluatedKey);
                }
              }}
              contentContainerStyle={{ paddingBottom: '20%' }}
              onEndReachedThreshold={0.5}
              showsVerticalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              onScrollBeginDrag={() => {
                Keyboard.dismiss();
                searchInputRef.current?.blur?.();

              }}
              ListFooterComponent={() =>
                loadingMore && (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="small" color="#075cab" />
                  </View>
                )
              }
              ListHeaderComponent={
                <View>
                  {!loading && (
                    <>
                      <Text style={styles.companyCount}>
                        {searchTriggered ? `${searchResults.length} companies found` : `${companyCount} companies found`}
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


              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
              }
              ListEmptyComponent={
                (!searchTriggered && companies.length === 0) ||
                  (searchTriggered && searchResults.length === 0) ? (
                  <View style={{ alignItems: 'center', marginTop: 40 }}>
                    <Text style={{ fontSize: 16, color: '#666' }}>No companies found</Text>
                  </View>
                ) : null
              }
            />


          ) : (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#075cab" />
            </View>
          )}

        </TouchableWithoutFeedback>
      </View>
    </SafeAreaView>
  )

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'whitesmoke',

  },

  container1: {
    flex: 1,
    backgroundColor: 'whitesmoke',

  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingBottom: 20
  },

  icon1: {
    opacity: 0.8,

  },

  icon: {
    opacity: 0.8,
    marginRight: 5,
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'whitesmoke',

  },
  backButton: {
    padding: 10,
    alignSelf: 'center',

  },
  searchContainer: {
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

  shareButton: {
    // marginTop: 15,
    // alignSelf: 'flex-end',
    padding: 10,
    marginLeft: 10,
  },

  labelAndIconContainer: {
    flexDirection: 'row',
    flex: 1, // Take up available space
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,

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

  title: {
    fontSize: 15,
    color: 'black',
    marginLeft: 8,
    lineHeight: 20,
    flexShrink: 1,
  },

  jobCount: {
    fontSize: 13,
    fontWeight: '300',
    marginVertical: 10,
    marginHorizontal: 10,
    color: 'black',
  },

  refreshIconContainer: {
    marginLeft: 10,
  },
  companyCount: {
    fontSize: 14,
    fontWeight: '400',
    color: 'black',
    padding: 5,
    paddingHorizontal: 15,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    top: -12
  },

  createPostButton: {
    position: 'absolute',
    top: -140,
    right: -5,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    marginBottom: 10,
    backgroundColor: "white",
    borderRadius: 10,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    margin: 'auto',
  },
  cardImage1: {
    width: 140,
    height: 140,
    borderRadius: 100,
    alignSelf: 'center',
    marginTop: 10,
  },

  textContainer: {
    padding: 16,
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',        // Align buttons in a row
    justifyContent: 'space-between',  // Spread buttons across the row
    // marginTop: 10,               // Add top margin for some space
    alignItems: 'center',        // Vertically center buttons
  },
  viewMoreButton: {
    // marginTop: 10,
    backgroundColor: COLORS.primary,
    // borderRadius: 4,
    flex: 1,
    // marginRight: 10,
  },
  viewMore: {
    // padding: 20,
    color: "#075cab",
    textAlign: 'left',
    fontSize: 15,
    fontWeight: '500',
  },
  noCompaniesText: {
    color: 'black', margin: 'auto', textAlign: "center", marginTop: 300, fontSize: 18, fontWeight: '400'
  },

  scrollView: {
    flex: 1,
    paddingHorizontal: 10,
  },
});

export default CompanyListScreen;