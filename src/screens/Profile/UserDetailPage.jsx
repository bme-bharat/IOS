
import React, { useCallback, useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity, Modal, ScrollView, SafeAreaView, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import apiClient from '../ApiClient';
import { useSelector } from 'react-redux';
import maleImage from '../../images/homepage/dummy.png';
import femaleImage from '../../images/homepage/female.jpg';
import default_image1 from '../../images/homepage/image.jpg'
import { openMediaViewer } from '../helperComponents/mediaViewer';
import { MyPostBody } from '../Forum/forumBody';
import { generateAvatarFromName } from '../helperComponents/useInitialsAvatar';



const defautImage = Image.resolveAssetSource(default_image1).uri;
const defaultMaleImage = Image.resolveAssetSource(maleImage).uri;
const defaultFemaleImage = Image.resolveAssetSource(femaleImage).uri;

const UserDetailsPage = () => {
  const navigation = useNavigation();
  const myprofile = useSelector(state => state.CompanyProfile.profile);
  const [profile, setProfile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const route = useRoute()
  const [isModalVisibleImage, setModalVisibleImage] = useState(false);
  const { userId } = route.params;
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([]);
  const [resources, setResorces] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [lastEvaluatedKeyResources, setLastEvaluatedKeyResources] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [imageUrlsresources, setImageUrlsResources] = useState({});


  const fetchPosts = async (refresh = false, lastKey = null) => {
    if (loading || loadingMore) return;

    lastKey ? setLoadingMore(true) : null;

    try {
      const requestData = {
        command: "getUsersAllForumPosts",
        user_id: userId,
        limit: 3,
      };

      if (lastKey) {
        requestData.lastEvaluatedKey = lastKey;
      }

      const res = await apiClient.post('/getUsersAllForumPosts', requestData, {

      });

      let newProducts = res.data.response || [];

      newProducts.sort((a, b) => b.posted_on - a.posted_on);


      const urlsObject = {};
      await Promise.all(
        newProducts.map(async (post) => {
          if (post.fileKey && post.fileKey.trim() !== "") {
            try {
              const res = await apiClient.post(
                "/getObjectSignedUrl",
                {

                  command: "getObjectSignedUrl",
                  key: post.thumbnail_fileKey || post.fileKey,

                }
              );
              const img_url = res.data
              if (img_url) {
                urlsObject[post.forum_id] = img_url;
              }
            } catch (error) {
              // console.error("Error getting signed URL for post:", error);
            }
          }
        })
      );

      setProducts((prev) => (refresh ? newProducts : [...prev, ...newProducts]));
      setImageUrls((prev) => {
        const updatedUrls = { ...prev, ...urlsObject };
        newProducts.forEach((post) => {
          if (!post.fileKey || post.fileKey.trim() === "") {
            delete updatedUrls[post.forum_id]; // Remove from state
          }
        });
        return updatedUrls;
      });

      // console.log("Before updating, lastEvaluatedKey:", lastEvaluatedKey);
      if (res.data.lastEvaluatedKey) {
        setLastEvaluatedKey(res.data.lastEvaluatedKey);
        // console.log("Updated lastEvaluatedKey:", res.data.lastEvaluatedKey);
      } else {
        setLastEvaluatedKey(null);
        // console.log("No more pages to fetch.");
      }
    } catch (error) {
      // console.error("Error fetching posts", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };


  const fetchResources = async (refresh = false, lastKey = null) => {
    if (loading || loadingMore) return;

    lastKey ? setLoadingMore(true) : null;

    try {
      const requestData = {
        command: "getUsersAllResourcePosts",
        user_id: userId,
        limit: 10,
      };

      if (lastKey) {
        requestData.lastEvaluatedKey = lastKey;
      }

      const res = await apiClient.post(`/getUsersAllResourcePosts`, requestData);

      let newProducts = res.data.response || [];

      newProducts.sort((a, b) => b.posted_on - a.posted_on);

      // Fetch signed image URLs
      const urlsObject = {};
      await Promise.all(
        newProducts.map(async (post) => {
          if (post.fileKey) {
            try {
              const res = await apiClient.post(
                "/getObjectSignedUrl",
                {


                  command: "getObjectSignedUrl",
                  key: post.thumbnail_fileKey || post.fileKey,

                }
              );
              const img_url = res.data;
              if (img_url) {
                urlsObject[post.resource_id] = img_url;
              }
            } catch (error) {

            }
          }
        })
      );

      setResorces((prev) => (refresh ? newProducts : [...prev, ...newProducts]));

      setImageUrlsResources((prev) => ({ ...prev, ...urlsObject }));


      if (res.data.lastEvaluatedKey) {
        setLastEvaluatedKeyResources(res.data.lastEvaluatedKey);

      } else {
        setLastEvaluatedKeyResources(null);

      }
    } catch (error) {

    } finally {
      setLoadingMore(false);
    }
  };




  useEffect(() => {
    fetchPosts(true);
  }, [userId])

  useEffect(() => {
    fetchResources(true);
  }, [userId])







  const forumDetails = (forum_id) => {
    navigation.navigate("Comment", { forum_id });
  };




  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size="small" color="#075cab" style={{ marginVertical: 10 }} />;
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/getUserDetails', {
        command: 'getUserDetails',
        user_id: userId,
      });
  
      if (response.data.status === 'success') {
        const profileData = response.data.status_message;
        setProfile(profileData);
  
        if (profileData.fileKey && profileData.fileKey !== 'null') {
          const res = await apiClient.post('/getObjectSignedUrl', {
            command: 'getObjectSignedUrl',
            key: profileData.fileKey,
          });
          const imgUrlData = res.data;
          if (imgUrlData && typeof imgUrlData === 'string') {
            setImageUrl(imgUrlData);
          } else {
            // fallback to generated avatar
            const displayName =
              profileData.company_name?.trim() ||
              `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() ||
              'Bme';
            setImageUrl(generateAvatarFromName(displayName));
          }
        } else {
          // fallback to generated avatar
          const displayName =
            profileData.company_name?.trim() ||
            `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() ||
            'Bme';
          setImageUrl(generateAvatarFromName(displayName));
        }
      }
    } catch (error) {
      // fallback to generated avatar on error
      const displayName =
        profile?.company_name?.trim() ||
        `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
        'Unknown';
      setImageUrl(generateAvatarFromName(displayName));
    } finally {
      setLoading(false);
    }
  };
  


  const { width } = Dimensions.get('window');
  useEffect(() => {
    if (userId) fetchProfile();

  }, [userId])

  const toggleModal = useCallback(() => setModalVisibleImage(!isModalVisibleImage), [isModalVisibleImage]);


  const ProfileHeader = ({ profile, imageUrl, toggleModal, isModalVisibleImage, handleCancel }) => (
    <View style={styles.profileBox}>

<View style={styles.imageContainerprofile}>
  {typeof imageUrl === 'string' ? (
    <TouchableOpacity onPress={() => openMediaViewer([{ type: 'image', url: imageUrl }])}>
      <FastImage
        source={{ uri: imageUrl }}
        style={styles.imagerprofile}
        resizeMode="contain"
        onError={() => setImageUrl(null)}
      />
    </TouchableOpacity>
  ) : (
    <View
      style={[
        styles.imagerprofile,
        { backgroundColor: imageUrl?.backgroundColor || '#ccc' },
      ]}
    >
      <Text style={{ color: imageUrl?.textColor || '#000', fontSize: 50, fontWeight: 'bold' }}>
        {imageUrl?.initials || '?'}
      </Text>
    </View>
  )}
</View>


      <Text style={[styles.title1, { textAlign: 'center', marginBottom: 20 }]}>
        {profile?.first_name} {profile?.last_name}
      </Text>

      <View style={styles.textContainer}>


        <View style={styles.title}>
          <View style={styles.lableIconContainer}>
            <Text style={styles.label}>Profile </Text>
          </View>

          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{profile?.select_your_profile || ""}</Text>
        </View>


        <View style={styles.title}>
          <View style={styles.lableIconContainer}>
            <Text style={styles.label}>Category </Text>
          </View>

          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{profile?.category || ""}</Text>
        </View>


        <View style={styles.title}>
          <View style={styles.lableIconContainer}>
            <Text style={styles.label}>State </Text>
          </View>

          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{profile?.state || ""}</Text>
        </View>


        <View style={styles.title}>
          <View style={styles.lableIconContainer}>
            <Text style={styles.label}>City </Text>
          </View>

          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{profile?.city || ""}</Text>
        </View>


        <View style={styles.title}>
          <View style={styles.lableIconContainer}>
            <Text style={styles.label}>Gender </Text>
          </View>

          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{profile?.gender || ""}</Text>
        </View>


        {profile?.college ? (
          <View style={styles.title}>
            <View style={styles.lableIconContainer}>
              <Text style={styles.label}>College </Text>
            </View>

            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{profile?.college || ""}</Text>
          </View>
        ) : null}

      </View>

      {/* Modal for image preview */}
      <Modal visible={isModalVisibleImage} transparent={true} onRequestClose={handleCancel} animationType='slide'>
        <View style={styles.modalContainerImage}>
          <FastImage
            source={imageUrl ? { uri: imageUrl } : null}
            style={styles.modalImage}
            resizeMode='contain'
            onError={() => setImageUrl(null)}
          />
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton1}>
            <Icon name="close" size={25} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
  const handleCancel = () => {
    toggleModal();
    setModalVisibleImage(false);
  };
  const [activeTab, setActiveTab] = useState('forum');

  // Handle the button press for switching tabs
  const handleTabPress = (tab) => {
    setActiveTab(tab);
  };




  const getSlicedTitle = (title) => {
    const maxLength = 20;
    if (title.length > maxLength) {
      return title.slice(0, maxLength).trim() + '...';
    }
    return title;
  };

  const renderItemResources = ({ item }) => {
    // Default to an image if fileKey is null or empty
    const fileUrl = item.fileKey && item.fileKey.trim() !== "" ? imageUrlsresources[item.resource_id] : defautImage;
    const thumbnail = item.thumbnail_fileKey && item.thumbnail_fileKey.trim() !== "" ? imageUrlsresources[item.resource_id] : defautImage;

    const fileTypeedit = item.fileKey && item.fileKey.trim() !== "" ? item.fileKey.split('.').pop().toLowerCase() : null;

    const fileIconName = {
      pdf: 'file-pdf-box',
      doc: 'file-word',
      msword: 'file-word',
      document: 'file-word',

      docx: 'file-word',
      xls: 'file-excel',
      xlsx: 'file-excel',
      ppt: 'file-powerpoint',
      presentation: 'file-powerpoint',
      pptx: 'file-powerpoint',
    };

    // Convert timestamp to date
    const formattedDate = new Date(item.posted_on * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/ /g, '-');

    // Define video file extensions
    const videoExtensions = ['mp4', 'mov', 'quicktime', 'avi', 'flv', 'wmv', 'mkv', 'webm', 'mpeg'];
    const isVideo = item.fileKey && videoExtensions.some(ext => item.fileKey.toLowerCase().endsWith(ext));

    return (
      <TouchableOpacity
        style={styles.cardresources}
        activeOpacity={1}
        onPress={() => navigation.navigate('ResourceDetails', { resourceID: item.resource_id })}
      >

        <View style={styles.imageContainer}>
          {isVideo ? (

            <FastImage source={{ uri: thumbnail }} style={styles.image} resizeMode="contain" />

          ) : fileTypeedit && fileIconName[fileTypeedit] ? (
            <View style={styles.iconContainer}>
              <Icon name={fileIconName[fileTypeedit]} size={40} color="#075cab" />
            </View>
          ) : (
            <FastImage source={{ uri: fileUrl }} style={styles.image} resizeMode="contain" />
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.body} numberOfLines={1}>{getSlicedTitle(item.title || "")}</Text>
          {/* <Text style={styles.body} numberOfLines={1}>{item.resource_body || ""}</Text> */}
          <MyPostBody
            html={item.resource_body}
            forumId={item?.resource_id}
            numberOfLines={2}
          />
          <Text style={styles.labelProduct}>{formattedDate || ""}</Text>

        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    const fileUrl = imageUrls[item.forum_id] || defautImage;
    const thumbnail = imageUrls[item.forum_id] || defautImage;

    const formattedDate = new Date(item.posted_on * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/ /g, '-');

    const videoExtensions = ['.mp4', '.mov', '.quicktime', '.avi', '.flv', '.wmv', '.mkv', '.webm', '.mpeg'];

    const isVideo = item?.fileKey && videoExtensions.some(ext => item.fileKey.endsWith(ext));

    return (


      <TouchableOpacity style={styles.card} activeOpacity={1} onPress={() => forumDetails(item.forum_id)}>

        <View style={styles.imageContainer}>
          {isVideo ? (
            <TouchableOpacity style={styles.videoContainer} activeOpacity={1} onPress={() => forumDetails(item.forum_id)}>
              <FastImage
                source={{ uri: thumbnail }}
                style={styles.image}
                resizeMode="contain"
              />

            </TouchableOpacity>
          ) : (
            fileUrl ? (
              <FastImage
                source={{ uri: fileUrl }}
                style={styles.image}
                resizeMode="contain"
              />
            ) : null
          )}

        </View>

        <View style={styles.textContainer}>

          {/* <Text style={styles.body} numberOfLines={1} >{(item.forum_body || "")}</Text> */}
          <MyPostBody
            html={item.forum_body}
            forumId={item?.forum_id}
            numberOfLines={2}
          />
          <Text style={styles.labelProduct}>{formattedDate || ""}</Text>

        </View>

      </TouchableOpacity>

    );
  };



  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="#075cab" />
      </TouchableOpacity>

      <FlatList
        data={activeTab === 'forum' ? products : resources}
        keyExtractor={(item) =>
          activeTab === 'forum' ? item.forum_id.toString() : item.resource_id.toString()
        }
        renderItem={activeTab === 'forum' ? renderItem : renderItemResources}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 10 }}
        contentContainerStyle={{ paddingBottom: '20%', paddingTop: 10 }}
        onEndReached={() => {
          if (activeTab === 'forum') {
            if (lastEvaluatedKey) fetchPosts(false, lastEvaluatedKey);
          } else {
            if (lastEvaluatedKeyResources) fetchResources(false, lastEvaluatedKeyResources);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={<Text style={styles.emptyText}>No posts found.</Text>}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <ProfileHeader
              profile={profile}
              imageUrl={imageUrl}
              toggleModal={toggleModal}
              isModalVisibleImage={isModalVisibleImage}
              handleCancel={handleCancel}
            />
            <View style={styles.divider} />
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'forum' && styles.activeTabButton]}
                onPress={() => handleTabPress('forum')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'forum' && styles.activeTabButtonText]}>
                  Forum
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'resources' && styles.activeTabButton]}
                onPress={() => handleTabPress('resources')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'resources' && styles.activeTabButtonText]}>
                  Resources
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
      />
    </SafeAreaView>
  );

};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',

  },

  tabContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-around',
  },
  emptyText: {
    textAlign: 'center',
    color: 'black',
    marginTop: 20,
    fontSize: 16,
  },
  tabButton: {
    width: 120,  // Fixed width for compact button
    paddingVertical: 8,
    paddingHorizontal: 10,
    // borderRadius: 6,
    alignItems: 'center',

    // backgroundColor: '#ffffff', 
    // shadowColor: '#dc3545',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 3,
    // elevation: 2,
  },
  activeTabButton: {
    backgroundColor: '#fff',
    borderColor: '#075cab',
    borderBottomWidth: 0.5,
  },
  tabButtonText: {
    color: 'black', // Text color for visibility
    fontWeight: '600',
    fontSize: 15,
  },
  activeTabButtonText: {
    color: '#075cab', // Active tab text color
  },

  body: {
    fontSize: 15,
    color: 'black',
    fontWeight: '400',
  },

  labelProduct: {
    fontSize: 13,
    color: 'black',
    fontWeight: '300',
  },

  container1: {
    flex: 1,
    backgroundColor: 'white',

    marginLeft: 0,
    width: '100%',
  },
  divider: {
    borderBottomWidth: 0.2,
    borderBottomColor: "#ccc",
    marginVertical: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,

  },


  lableIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '35%', // Label and icon occupy 35% of the row
  },

  imageContainer: {
    width: 150,
    height: 140,
    alignSelf: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    padding: 10,
    
  },

  imageContainerprofile: {
    width: 140,
    height: 140,
    borderRadius: 75,
    alignSelf: 'center',
    marginBottom: 20,

  },
  imagerprofile: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    alignItems:'center',
    justifyContent:'center'
  },

  image: {
    width: '100%',
    height: '100%',

  },
  title1: {
    flexDirection: 'row',
    fontSize: 15,
    fontWeight: '500',
    color: 'black',
    marginBottom: 5,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: 10,

  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 12,  // Space between rows
    width: '48%', // Default width for larger screens (two cards per row)
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    height: 230,
  },

  cardresources: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,  // Space between rows
    width: '48%', // Default width for larger screens (two cards per row)
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,

  },
  cardContainer: {
    flexDirection: 'row', // To allow two cards in a row
    flexWrap: 'wrap', // Ensure the items wrap to the next row
    justifyContent: 'space-between', // Space the cards out evenly
    marginHorizontal: 10,
  },

  cardSmallScreen: {
    width: '100%', // One card per row on smaller screens
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white', // Semi-transparent background
    padding: 20,
    borderWidth: 1,
    width: 'auto',
    justifyContent: 'center',
    alignItems: 'center'

  },
  closeIconContainer: {
    position: 'absolute',
    top: 30,
    right: 10,
    zIndex: 1,
  },
  warningContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 50,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Add shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  deletionText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'justify',
    lineHeight: 22,
    marginBottom: 25,
  },
  deletionText1: {
    fontSize: 16,
    color: 'black',
    textAlign: 'justify',
    lineHeight: 22,
    marginBottom: 25,
    fontWeight: '500',
  },
  otpInput: {
    height: 50,
    width: '80%',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: 'black',
    alignSelf: 'center',  // Centers input horizontally
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 15,
  },
  confirmButton: {
    // backgroundColor: '#e53935',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginHorizontal: 10,
    // borderWidth: 1,
    // borderColor: '#ccc',

  },
  confirmButtonText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    // backgroundColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginHorizontal: 10,

  },
  cancelButtonText: {
    color: 'green',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  verifyButton: {
    // backgroundColor: '#4caf50',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  verifyButtonText: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resendContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  resendButtonText: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 14,
    color: 'black',
  },


  title: {
    flexDirection: 'row',  // Align label and detail in a row
    alignItems: 'center',  // Center the items vertically
    marginVertical: 5,
    elevation: 3, // Android shadow
    backgroundColor: 'white',
    shadowColor: '#0d6efd', // iOS shadow color
    shadowOffset: { width: 0, height: 2 }, // iOS shadow offset
    shadowOpacity: 0.2, // iOS shadow opacity
    shadowRadius: 3, // iOS shadow radius
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginVertical: 5,
    marginHorizontal: 10

  },
  label: {
    flex: 1, // Take up available space
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
  },
  label1: {
    width: '40%', // Occupies 35% of the row
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    // textAlign: 'justify',
    alignSelf: "flex-start"
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
  colon: {
    width: 20, // Fixed width for the colon
    textAlign: 'center', // Center the colon
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    alignSelf: 'flex-start',

  },
  deleteAccountButton: {
    justifyContent: "center",
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
    width: 'auto', // Ensure it doesn't take full width
    alignSelf: 'center',
    minWidth: 120, // Optional: ensures a minimum size for the button
    maxWidth: 200,
  },
  deleteAccountButtonText: {
    color: "red",
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 5,
  },
  createPostButton: {
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
  signOutButton: {
    paddingVertical: 10,  // Adjust padding for the desired button height
    paddingHorizontal: 15, // Adjust padding to fit icon and text nicely
    justifyContent: "center",
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 30,
    marginBottom: 10,
    borderRadius: 5,
    width: 'auto', // Ensure it doesn't take full width
    alignSelf: 'center',
    minWidth: 120, // Optional: ensures a minimum size for the button
    maxWidth: 200,
  },
  signOutButtonText: {
    color: "#075cab",
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 5,
    alignSelf: 'center'
  },

  modalContainerImage: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton1: {
    position: 'absolute',
    top: 70,
    right: 20,
  },
  modalImage: {
    width: '100%',
    height: '100%',

    borderRadius: 10,
  },




  loadingText: {
    color: 'black', margin: 'auto', textAlign: "center", marginTop: 300, fontSize: 18, fontWeight: '400'
  },

});





export default UserDetailsPage