import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, Image, StyleSheet, ToastAndroid, TouchableOpacity, Text, Alert, TextInput, RefreshControl, Share, SafeAreaView, Keyboard, ActivityIndicator, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import Message from '../../components/Message';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '../ApiClient';
import { useNetwork } from '../AppUtils/IdProvider';

const CompanyGetallEnquiries = ({ navigation }) => {
  const route = useRoute();

  const { service_id } = route.params;
  const [allForumPost, setAllForumPost] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollViewRef = useRef(null)
  const { myId, myData } = useNetwork();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [noEnquiries, setNoEnquiries] = useState(false);

  const fetchPosts = async (lastEvaluatedKey = null) => {
    if (!myId || loading || loadingMore) return;

    lastEvaluatedKey ? setLoadingMore(true) : setLoading(true);

    try {
      if (!lastEvaluatedKey) {
        setAllForumPost([]);
      }

      const requestData = {
        command: "getEnquiredUsers",
        company_id: myId,
        service_id: service_id,
        limit: 10,
      };

      if (lastEvaluatedKey) {
        requestData.lastEvaluatedKey = lastEvaluatedKey;
      }

      const response = await apiClient.post("/getEnquiredUsers", requestData);

      if (response.data.status === "success") {
        const posts = response.data.response;

        if (!posts || posts.length === 0) {
          setNoEnquiries(true);
          setAllForumPost([]);
          setHasMorePosts(false);
          return;
        }

        setNoEnquiries(false); // reset if valid posts

        if (!lastEvaluatedKey) {
          setAllForumPost(posts);
        } else {
          const newPosts = posts.filter(
            (post) =>
              !allForumPost.some(
                (existingPost) => existingPost.forum_id === post.forum_id
              )
          );
          setAllForumPost((prevPosts) => [...prevPosts, ...newPosts]);
        }

        if (response.data.lastEvaluatedKey) {
          setLastEvaluatedKey(response.data.lastEvaluatedKey);
          setHasMorePosts(true);
        } else {
          setHasMorePosts(false);
        }
      } else {
        // Handle API error (like "You have not got any enquiries yet!")
        setNoEnquiries(true);
        setAllForumPost([]);
        setHasMorePosts(false);
      }
    } catch (error) {

      setNoEnquiries(true);
      setAllForumPost([]);
    }

    setLoading(false);
    setLoadingMore(false);
    setIsRefreshing(false);
  };



  useEffect(() => {
    fetchPosts();

  }, [])

  const searchInputRef = useRef(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setHasMorePosts(true);
    setLastEvaluatedKey(null);
    setAllForumPost([]);

    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }

    await fetchPosts();

    setIsRefreshing(false);
  }, []);


  const EnquiryDetails = (enquiryID) => {
    navigation.navigate("EnquiryDetails", { enquiryID });
  };


  if (noEnquiries && !loading && allForumPost?.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#075cab" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>No enquiries available</Text>
        </View>
      </SafeAreaView>
    );
  }


  const RenderPostItem = ({ item }) => {

    const formattedDate = new Date(item.enquired_on * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '/');


    return (
      <TouchableOpacity activeOpacity={1} onPress={() => {
        EnquiryDetails(item?.enquiry_id);
      }}>

        <View style={styles.postContainer}>
          <View style={styles.textContainer}>

            <View style={styles.title1}>
              <Text style={styles.label}>Enquired by      </Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{item?.first_name || ""}</Text>
            </View>

            <View style={styles.title1}>
              <Text style={styles.label}>Enquiry description              </Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{item?.enquiry_description || ""}</Text>
            </View>

            <View style={styles.title1}>
              <Text style={styles.label}>Enquired on   </Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{formattedDate || ""}</Text>
            </View>

          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const keyExtractor = (item) =>
    item.id ? item.id.toString() : Math.random().toString();


  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#075cab" />
        </TouchableOpacity>

      </View>

      {!loading ? (
        <FlatList
          data={allForumPost}
          renderItem={RenderPostItem}
          onScrollBeginDrag={() => Keyboard.dismiss()}
          contentContainerStyle={{ paddingBottom: '20%' }}
          keyExtractor={(item, index) => `${item.forum_id}-${index}`}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
          onEndReached={() => hasMorePosts && fetchPosts(lastEvaluatedKey)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            loadingMore && (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#075cab" />
              </View>
            )
          }

        />
      ) : (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="small" color="#075cab" />
        </View>
      )}

    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  documentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 10
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10
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
  noPostsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPostsText: {
    color: 'black',
    fontSize: 18,
    fontWeight: '400',
    padding: 10
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10
  },
  searchContainer: {
    flex: 1,
    padding: 10,
    alignSelf: 'center',
    backgroundColor: 'whitesmoke',
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
    color: 'white',
    backgroundColor: '#075cab',

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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
      borderBottomWidth: 1,
    borderColor: '#f0f0f0'

  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    // backgroundColor:'red',
    alignItems: 'center',
    padding: 10
  },

  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    // backgroundColor:'blue',
  },

  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 5
  },
  video: {
    width: 100,
    height: 100,
    borderRadius: 8

  },

  textContainer: {
    flex: 2,
    gap: 8,
    padding: 10
  },

  title: {
    fontSize: 15,
    fontWeight: '600',
    color: "black"

  },
  body: {
    textAlign: 'justify',
    fontSize: 15,
    color: 'black',
    fontWeight: '400',
  },

  downtext: {
    fontSize: 15,
    marginLeft: 10,
    color: 'gray',
    fontWeight: "450"
  },
  label: {
    flex: 1,
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left',
    alignSelf: 'flex-start',

  },

  colon: {
    width: 20, // Fixed width for the colon
    textAlign: 'center', // Center the colon
    color: 'black',
    fontWeight: '400',
    fontSize: 15,
    alignSelf: 'flex-start',
  },

  value: {
    flex: 2,
    flexShrink: 1,
    color: 'black',
    fontWeight: '400',
    fontSize: 14,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  title1: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignSelf: 'center'
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
export default CompanyGetallEnquiries;

