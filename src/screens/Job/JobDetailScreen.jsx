
import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Modal, ToastAndroid, Linking, RefreshControl, Pressable, TouchableWithoutFeedback, Share, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Image as FastImage } from 'react-native';
import default_image from '../../images/homepage/buliding.jpg'
import ImageViewer from 'react-native-image-zoom-viewer';
import apiClient from '../ApiClient';
import ContactSupplierModal from '../helperComponents/ContactsModal';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';
import { openMediaViewer } from '../helperComponents/mediaViewer';
import { generateAvatarFromName } from '../helperComponents/useInitialsAvatar';
import AppStyles, { commonStyles } from '../AppUtils/AppStyles';
import { openLink } from '../AppUtils/openLinks';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import ShareIcon from '../../assets/svgIcons/share.svg';
import { colors, dimensions } from '../../assets/theme';


const defaultImage = Image.resolveAssetSource(default_image).uri;
const JobDetailScreen = ({ route }) => {
  const { myId, myData } = useNetwork();

  const { post_id } = route.params || {};
  const routePost = route.params?.post;
  const [profileCreated, setProfileCreated] = useState(false)
  const navigation = useNavigation();
  const [post, setPost] = useState([])

  const [jobImageUrls, setJobImageUrls] = useState({});
  const [isApplied, setIsApplied] = useState(false);
  const [isModalVisibleImage, setModalVisibleImage] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalVisible1, setModalVisible1] = useState(false);


  const openModal = (type) => {
    setModalVisible(true);
  };


  const fetchProfile1 = async () => {
    if (!myId) return;

    try {
      const response = await apiClient.post('/getUserDetails', {
        command: 'getUserDetails',
        user_id: myId,
      });

      if (response.data.status === 'success') {
        const profileData = response.data.status_message;
        setProfile(profileData);
      }
    } catch (error) {
      console.error('❌ Error in fetchProfile1:', error);
    }
  };




  const fetchProfile = async () => {
    try {
      const response = await apiClient.post('/getJobProfiles', {
        command: 'getJobProfiles',
        user_id: myId,
      });

      if (response.data.status === 'error') {
        setProfileCreated(false);
      } else if (response.data.status === 'success') {
        const profileData = response.data.response?.[0];
        setProfileCreated(!!profileData); // true if profileData exists, false otherwise
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      setProfileCreated(false); // Optional fallback
    }
  };



  useEffect(() => {
    fetchProfile();
    fetchProfile1();
  }, [myId])
  const withTimeout = (promise, timeout = 5000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout)),
    ]);
  };

  const fetchJobs = async () => {
    try {
      const requestData = {
        command: 'getJobPost',
        post_id: post_id,
      };

      const res = await withTimeout(apiClient.post('/getJobPost', requestData), 5000);

      const hasValidResponse = res.data.response?.length > 0;

      if (hasValidResponse) {
        const jobData = res.data.response[0];

        if (!jobData.fileKey) {
          // fallback avatar
          const avatar = generateAvatarFromName(jobData.company_name);
          jobData.companyAvatar = avatar;

          setJobImageUrls(prev => ({
            ...prev,
            [jobData.post_id]: { type: "avatar", value: avatar },
          }));

          setPost(jobData);
          return;
        }

        // fileKey exists → try fetching signed URL
        try {
          const imgRes = await apiClient.post('/getObjectSignedUrl', {
            command: 'getObjectSignedUrl',
            key: jobData.fileKey,
          });

          if (imgRes.data) {
            setJobImageUrls(prev => ({
              ...prev,
              [jobData.post_id]: { type: "url", value: imgRes.data },
            }));
          } else {
            const avatar = generateAvatarFromName(jobData.company_name);
            jobData.companyAvatar = avatar;
            setJobImageUrls(prev => ({
              ...prev,
              [jobData.post_id]: { type: "avatar", value: avatar },
            }));
          }
        } catch (error) {
          console.warn('Error fetching image URL, falling back to avatar:', error);
          const avatar = generateAvatarFromName(jobData.company_name);
          jobData.companyAvatar = avatar;
          setJobImageUrls(prev => ({
            ...prev,
            [jobData.post_id]: { type: "avatar", value: avatar },
          }));
        }

        setPost(jobData);
      } else {
        setPost({ removed_by_author: true });
      }
    } catch (error) {
      showToast('Network error', 'error');
    }
  };




  useEffect(() => {
    if (routePost) {
      setPost(routePost);
      const fileKey = routePost?.fileKey || routePost?.company_file_key
      console.log('fileKey', fileKey)
      if (fileKey) {
        (async () => {
          try {
            const imgRes = await apiClient.post('/getObjectSignedUrl', {
              command: 'getObjectSignedUrl',
              key: fileKey,
            });

            if (imgRes.data) {
              setJobImageUrls(prev => ({
                ...prev,
                [routePost.post_id]: { type: "url", value: imgRes.data },
              }));
            } else {
              const avatar = generateAvatarFromName(routePost.company_name);
              setJobImageUrls(prev => ({
                ...prev,
                [routePost.post_id]: { type: "avatar", value: avatar },
              }));
            }
          } catch (error) {
            const avatar = generateAvatarFromName(routePost.company_name);
            setJobImageUrls(prev => ({
              ...prev,
              [routePost.post_id]: { type: "avatar", value: avatar },
            }));
          }
        })();
      } else {
        const avatar = generateAvatarFromName(routePost.company_name);
        setJobImageUrls(prev => ({
          ...prev,
          [routePost.post_id]: { type: "avatar", value: avatar },
        }));
      }
    } else {
      console.log('No routePost found, fetching from API'); // 🟡 LOG: from API
      fetchJobs();
    }
  }, []);






  useEffect(() => {
    fetchAppliedJobs();
  }, [])


  const shareJob = async (post) => {
    try {
      const baseUrl = 'https://bmebharat.com/jobs/post/';
      const jobUrl = `${baseUrl}${post.post_id}`;

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




  const fetchAppliedJobs = async () => {
    try {
      const response = await apiClient.post('/getUsersAppliedJobs', {
        command: 'getUsersAppliedJobs',
        user_id: myId,
      });

      if (response.data.status === "success" && response.data.response) {
        const appliedJobsList = response.data.response;

        const appliedJob = appliedJobsList.find(job => job.post_id === post_id);
        setIsApplied(appliedJob?.applied_status === "Applied");

      } else {
        setIsApplied(false);
      }
    } catch (error) {

    }
  };



  const handleApplyJob = async () => {
    if (!profileCreated) {

      showToast('Please create your job profile before applying', 'info');

      setTimeout(() => {
        navigation.navigate('UserJobProfileCreate');
      }, 300);

      return;
    }

    if (isApplied) {

      handleRevoke(post.job_title);
    } else {
      try {
        const response = await apiClient.post('/applyJobs', {
          command: 'applyJobs',
          company_id: post.company_id,
          user_id: myId,
          post_id: post.post_id,
        });

        if (response.data.status === 'success') {
          setIsApplied(true);

          showToast('Job application successful', 'success');

        } else {
          showToast('Something went wrong', 'error');

        }
      } catch (error) {

        showToast('Something went wrong', 'error');

      }
    }
  };


  const confirmAction = () => {
    handleRevoke();
    setModalVisible(false);
  };


  const handleRevoke = async () => {
    try {

      const response = await apiClient.post('/revokeJobs', {
        command: "revokeJobs",
        company_id: post.company_id,
        user_id: myId,
        post_id: post.post_id,
      });

      if (response.data.status === 'success') {
        setIsApplied(false);
        showToast('The application has been successfully revoked', 'success');
        setTimeout(() => {
          navigation.goBack()
        },100)
      } else {
        showToast('Something went wrong', 'error');

      }
    } catch (error) {
      showToast('Network error', 'error');

    }
  };

  const handleNavigate = (company_id) => {
    navigation.navigate('CompanyDetailsPage', { userId: company_id });
  };

  const toggleModal = useCallback(() => setModalVisibleImage(!isModalVisibleImage), [isModalVisibleImage]);

  const handleCancel = () => {
    toggleModal(false);

  };

  const jobImage = jobImageUrls[post?.post_id];

  if (!post) {

    return (
      <View style={styles.container}>

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
            <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

          </TouchableOpacity>

        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size='small' color='#075cab' />
        </View>
      </View>
    );
  }

  if (post?.removed_by_author) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Home3'); // Fallback to a safe screen
              }
            }}
          >
            <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

          </TouchableOpacity>

        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>This post was removed by the author</Text>
        </View>
      </View>
    );
  }
  return (

    <View style={styles.container}>
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
          <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

        </TouchableOpacity>

        <TouchableOpacity onPress={() => shareJob(post)} style={AppStyles.circle}>
          <ShareIcon width={24} height={24} color={'#075cab'} />
          <Text style={AppStyles.shareText}> Share </Text>

        </TouchableOpacity>
      </View>

      <>
        {post ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: '30%', paddingTop: 5, paddingHorizontal:5 }}>

            <TouchableOpacity
              onPress={() => {
                if (jobImage?.type === "url") {
                  openMediaViewer([{ type: "image", url: jobImage.value }]);
                }
              }}
              activeOpacity={1}
              style={styles.imageContainer}
            >
              {jobImage?.type === "url" ? (
                <FastImage
                  source={{ uri: jobImage.value }}
                  style={styles.detailImage}

                />
              ) : (
                <View
                  style={[
                    AppStyles.avatarContainerDetails,
                    { backgroundColor: jobImage?.value?.backgroundColor },
                  ]}
                >
                  <Text
                    style={[
                      AppStyles.avatarText,
                      { color: jobImage?.value?.textColor },
                    ]}
                  >
                    {jobImage?.value?.initials}
                  </Text>
                </View>
              )}
            </TouchableOpacity>


            <View style={styles.textContainer1}>
              <Text style={commonStyles.title}>{post?.job_title || 'No Title'}</Text>
            </View>
            <View style={commonStyles.labValContainer}>
              <Text style={commonStyles.label}>Company</Text>
              <Text style={commonStyles.colon}>:</Text>
              <Text style={commonStyles.value} onPress={() => handleNavigate(post?.company_id)} >{post?.company_name || ''}</Text>
            </View>


            <View style={commonStyles.labValContainer}>

              <Text style={commonStyles.label}>Category</Text>

              <Text style={commonStyles.colon}>:</Text>
              <Text style={commonStyles.value}>{post?.company_category || ''}</Text>
            </View>

            {post?.Website ? (
              <View style={commonStyles.labValContainer}>

                <Text style={commonStyles.label}>Website</Text>

                <Text style={commonStyles.colon}>:</Text>
                <Text style={commonStyles.value}>
                  <TouchableOpacity activeOpacity={1} onPress={() => openLink(post.Website)}>
                    <Text style={[commonStyles.value, { color: "#075cab", textDecorationLine: "underline" }]}>
                      {post.Website.trim()}
                    </Text>
                  </TouchableOpacity>
                </Text>

              </View>
            ) : null}

            <View style={commonStyles.labValContainer}>

              <Text style={commonStyles.label}>Industry type</Text>

              <Text style={commonStyles.colon}>:</Text>
              <Text style={commonStyles.value}>{post?.industry_type || ''}</Text>
            </View>

            {post?.required_qualifications?.trim() && (
              <View style={commonStyles.labValContainer}>

                <Text style={commonStyles.label}>Required qualification</Text>

                <Text style={commonStyles.colon}>:</Text>
                <Text style={commonStyles.value}>{post?.required_qualifications.trim()}</Text>
              </View>
            )}

            {post?.required_expertise?.trim() && (
              <View style={commonStyles.labValContainer}>

                <Text style={commonStyles.label}>Required expertise</Text>

                <Text style={commonStyles.colon}>:</Text>
                <Text style={commonStyles.value}>{post?.required_expertise.trim()}</Text>
              </View>
            )}

            {post?.experience_required?.trim() && (
              <View style={commonStyles.labValContainer}>

                <Text style={commonStyles.label}>Required experience</Text>

                <Text style={commonStyles.colon}>:</Text>
                <Text style={commonStyles.value}>{post?.experience_required.trim()}</Text>
              </View>
            )}

            <View style={commonStyles.labValContainer}>

              <Text style={[commonStyles.label]}>Required speicializations </Text>

              <Text style={commonStyles.colon}>:</Text>

              <Text style={[commonStyles.value]}>{post?.speicializations_required || ''}</Text>
            </View>

            {post?.working_location?.trim() && (
              <View style={commonStyles.labValContainer}>

                <Text style={commonStyles.label}>Work location</Text>

                <Text style={commonStyles.colon}>:</Text>
                <View style={{ flexDirection: "column", flex: 2 }}>
                  {post.working_location
                    .split(",")
                    .map((city, index) => (
                      <Text key={index} style={commonStyles.value}>
                        {city.trim()}
                      </Text>
                    ))}
                </View>
              </View>
            )}


            <View style={commonStyles.labValContainer}>

              <Text style={commonStyles.label}>Salary package</Text>

              <Text style={commonStyles.colon}>:</Text>
              <Text style={commonStyles.value}>{post?.Package || ''}</Text>
            </View>

            {post?.job_description?.trimStart().trimEnd() ? (
              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Job description</Text>
                <Text style={commonStyles.colon}>:</Text>
                <Text style={commonStyles.value}>{post?.job_description.trim()}</Text>
              </View>
            ) : null}



            {post?.preferred_languages?.trimStart().trimEnd() ? (
              <View style={commonStyles.labValContainer}>

                <Text style={[commonStyles.label]}>Required languages</Text>

                <Text style={commonStyles.colon}>:</Text>

                <View style={{ flexDirection: "column", flex: 2 }}>
                  {post.preferred_languages
                    .split(",")
                    .map((language, index) => (
                      <Text key={index} style={commonStyles.value}>
                        {language.trim()}
                      </Text>
                    ))}
                </View>
              </View>
            ) : null}

            <View style={commonStyles.labValContainer}>

              <Text style={commonStyles.label}>Posted on</Text>

              <Text style={commonStyles.colon}>:</Text>
              <Text style={commonStyles.value}>
                {
                  post?.job_post_created_on
                    ? (() => {
                      const date = new Date(post?.job_post_created_on * 1000);
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = String(date.getFullYear());

                      return `${day}-${month}-${year}`;
                    })()
                    : ''
                }
              </Text>

            </View>

            {myId !== post?.company_id && (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible1(true);
                  }}
                  style={{ padding: 10 }}
                >
                  <Text style={styles.contact}>Contact details</Text>
                </TouchableOpacity>

                <ContactSupplierModal
                  visible={modalVisible1}
                  onClose={() => {
                    setModalVisible1(false);
                  }}
                  company_id={post?.company_id}
                />
              </>
            )}

          </ScrollView>
        ) : null}



        {(profile?.user_type === 'users') && (
          <TouchableOpacity
            style={[
              styles.applyButton,
              isApplied && styles.applyButtonRevoke,
            ]}
            onPress={() => {
              if (!profileCreated) {

                showToast("Job profile doesn't exists. Create one before applying for a job", 'info');

                setTimeout(() => {
                  navigation.navigate('UserJobProfileCreate');
                }, 300);
              } else {
                if (isApplied) {
                  openModal('revoke');
                } else {
                  handleApplyJob();
                }
              }
            }}

            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, isApplied && styles.revokeText]}>
              {isApplied ? 'Revoke' : 'Apply'}
            </Text>
          </TouchableOpacity>
        )}
      </>


      <Modal visible={isModalVisibleImage} transparent={true} animationType="slide"
        onRequestClose={handleCancel}>
        <View style={styles.modalContainerImage}>
          <ImageViewer
            imageUrls={[{ url: jobImageUrls[post?.post_id] }]}
            enableSwipeDown={true}
            onSwipeDown={toggleModal}
            showIndicators={false}
            renderIndicator={() => null}
          />
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton1}>
            <Icon name="close" size={24} color="white" />
          </TouchableOpacity>

        </View>
      </Modal>

      <Modal
        transparent={true}
        animationType="fade"
        visible={isModalVisible}

      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Confirm revocation
            </Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to revoke your application?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText1}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={confirmAction}
              >
                <Text style={styles.buttonText2}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>




    </View >

  );
};




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffff',

  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },

  backButton: {
    alignSelf: 'flex-start',
    padding: 10,

  },

  value: {
    flex: 2, // Take the remaining space
    flexShrink: 1,
    color: colors.text_secondary,
    fontWeight: '500',
    fontSize: 13,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
  },

  textContainer1: {
    textAlign: 'center',
    padding: 10,

  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text_primary,
    paddingHorizontal: 12,
  },

  textContainer: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  detailContainer: {

    flexDirection: 'row',  // Align label and detail in a row
    alignItems: 'center',  // Center the items vertically
    elevation: 3, // Android shadow
    backgroundColor: 'white',
    shadowColor: '#000', // iOS shadow color
    shadowOffset: { width: 0, height: 2 }, // iOS shadow offset
    shadowOpacity: 0.2, // iOS shadow opacity
    shadowRadius: 3, // iOS shadow radius
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10
  },


  label: {
    flex: 1, // Take up available space
    color: colors.text_primary,
    fontWeight: '500',
    fontSize: 13,
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

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  icon: {
    marginRight: 10,
  },

  dropdownText: {
    fontSize: 16,
    color: '#075cab',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    alignSelf: 'center',
    paddingHorizontal: 10

  },

  detailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
  
  body: {
    fontSize: 16,
    color: '#333',
    textAlign: 'justify',
    lineHeight: 22

  },
  modalContainerImage: { flex: 1, backgroundColor: 'white' },
  closeButton1: { position: 'absolute', top: 70, right: 10 },
  modalImage: { width: '100%', height: '100%', resizeMode: 'contain' },

  createPostButton: {
    position: 'absolute',
    bottom: 80,
    right: 10,
    width: 35,
    height: 35,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: "#075cab"
  },
  noPostsText: {
    fontWeight: '400',
    textAlign: 'center',
    padding: 10,
    fontSize: 16

  },
  contact: {
    fontSize: 15,
    fontWeight: '500',
    color: '#075cab',
    textDecorationLine: 'underline',
    marginTop: 10,
    textAlign: 'center'
  },

  applyButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    width: 80,
    paddingVertical: 8,
    borderRadius: 25,
    borderColor: '#075cab',
    borderWidth: 1,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },

  },


  applyButtonRevoke: {
    borderColor: '#FF0000',

  },

  buttonText: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    transition: 'color 0.3s ease',
  },

  revokeText: {
    color: '#FF0000',
  },

  buttonActive: {
    opacity: 0.8,
  },

  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalMessage: {
    fontSize: 15,
    color: 'black',
    marginBottom: 20,
    textAlign: 'center', // Centered message
    fontWeight: '400',
    lineHeight: 23,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
    margin: 10
  },

  buttonText1: {
    color: 'red',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonText2: {
    color: 'green',
    fontSize: 17,
    fontWeight: '600',
  },

  phoneNumber: {
    color: '#075cab',
    fontWeight: 'bold',
    padding: 10,

  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalContent: {
    width: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },

  modalText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#000',
  },

  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,

    borderRadius: 20,
  },
  closeButtonText: {
    color: '#075cab',
    fontSize: 16,
  },


});


export default JobDetailScreen;