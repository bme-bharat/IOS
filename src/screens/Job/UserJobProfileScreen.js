import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Alert, Linking, ScrollView, ToastAndroid, SafeAreaView, Button, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Message from '../../components/Message';
import { useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import { showToast } from '../AppUtils/CustomToast';
import { useFileOpener } from '../helperComponents.jsx/fileViewer';
import { useNetwork } from '../AppUtils/IdProvider';
import apiClient from '../ApiClient';
import { generateAvatarFromName } from '../helperComponents.jsx/useInitialsAvatar';


const UserJobProfilescreen = () => {
  const { myId, myData } = useNetwork();
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(null);
  const scrollViewRef = useRef(null);
  const profileImage = useSelector(state => state.CompanyProfile.profile);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitleDelete, setModalTitleDelete] = useState('');
  const [modalMessageDelete, setModalMessageDelte] = useState('');

  const { openFile } = useFileOpener();
  const [loading, setLoading] = useState(false);

  const handleOpenResume = async () => {
    if (!profile?.resume_key) return;
    setLoading(true);
    try {
      await openFile(profile.resume_key);
    } finally {
      setLoading(false);
    }
  };


  // Handle delete confirmation
  const handleDelete1 = async () => {
    setModalTitleDelete('Confirm Deletion');
    setModalMessageDelte('Are you sure you want to delete this job profile? Deleting it will remove all job applications, this action cannot be undone.');
    setModalVisible(true);
  };
  // setModalMessageDelte("Are you sure you want to delete this job profile?\nDeleting it will remove all job applications,this action cannot be undone.");
  // Handle cancellation
  const onCancel = () => {
    setModalVisible(false);
  };

  useFocusEffect(
    useCallback(() => {

      if (scrollViewRef.current) {
        // Scroll to the top after fetching companies
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
      }
    }, [])
  );

  const formatDate = (dateInput) => {
    let date;

    // Handle string input in dd/mm/yyyy or ISO format
    if (typeof dateInput === 'string') {
      if (dateInput.includes('/')) {
        const [day, month, year] = dateInput.split('/').map(Number); // Convert to numbers
        date = new Date(year, month - 1, day); // Month is 0-based
      } else {
        date = new Date(dateInput); // Assume ISO or other parsable format
      }
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return 'Invalid Date';
    }

    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };


  useEffect(() => {
    if (myId) {
      fetchProfile();
    }
  }, [myId]);


  const onDeleteConfirm = async () => {
    try {
      const response = await apiClient.post('/deleteJobProfile', {
        command: 'deleteJobProfile',
        user_id: myId,
        resume_key: resumeUrl
      });

      if (response.data.status === 'success') {
        showToast("Your job profile has been successfully deleted", 'success');
        setModalVisible(false);

        navigation.goBack();

      } else {

        showToast("Something went wrong", 'error');

      }
    } catch (error) {
      showToast("You don't have an internet connection", 'error');

    }
  };

  const fetchProfile = async () => {
    try {
      const response = await apiClient.post('/getJobProfiles', {
        command: 'getJobProfiles',
        user_id: myId,
      });

      if (response.data.status === 'success') {
        const profileData = response.data.response[0];

        if (profileData) {
          setProfile(profileData);

          let first_name = profileData?.first_name

          if (profileData.fileKey && profileData.fileKey !== 'null') {
            const imgUrlResponse = await apiClient.post('/getObjectSignedUrl', {
              command: 'getObjectSignedUrl',
              key: profileData.fileKey,
            });
            setImageUrl(imgUrlResponse.data);
          } else {
            const initialAvatars = generateAvatarFromName(first_name)
        
            setImageUrl(initialAvatars);

          }

          if (profileData.resume_key) {
            const resumeUrlResponse = await apiClient.post('/getObjectSignedUrl', {
              command: 'getObjectSignedUrl',
              key: profileData.resume_key,
            });
            setResumeUrl(resumeUrlResponse.data);
          }
        } else {
          setProfile({ removed_by_author: true });

        }
      } else {
        setProfile({ removed_by_author: true });

      }
    } catch (error) {
      setProfile({ removed_by_author: true });

    }
  };

  useFocusEffect(
    useCallback(() => {
      if (myId) fetchProfile();
    }, [myId])
  );

  const handleUpdate = () => {
    navigation.navigate('UserJobProfileUpdate', { profile, imageUrl });
  };


  if (profile?.removed_by_author) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#075cab" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circle}
            onPress={() => navigation.navigate('UserJobProfileCreate')}
          >
            <Icon name="plus-circle-outline" size={18} color="#075cab" />
            <Text style={styles.shareText}>Create</Text>
          </TouchableOpacity>

        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>Create job profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} >
      <View style={styles.headerContainer}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#075cab" />
        </TouchableOpacity>

        {/* Profile Exists? Show Update Button; Otherwise, Show Create Profile Button */}
        <TouchableOpacity
          style={profile ? styles.circle : styles.circle}
          onPress={profile ? handleUpdate : () => navigation.navigate('UserJobProfileCreate')}
        >
          <Icon name={profile ? "pencil" : "plus-circle-outline"} size={18} color="#075cab" />
          <Text style={styles.shareText}>{profile ? "Update" : "Create"}</Text>
        </TouchableOpacity>
      </View>

      {profile ? (
        <ScrollView contentContainerStyle={styles.scrollViewContainer} showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false} ref={scrollViewRef}>

          <View style={[styles.postContainer]}>

            <View style={styles.imageContainer}>
              {typeof imageUrl === 'string' ? (
                <FastImage
                  source={{ uri: profileImage?.imageUrl }}
                  style={styles.detailImage}
                  resizeMode={FastImage.resizeMode.cover}
                  onError={() => { }}
                />
              ) : (
                <View
                  style={[
                    styles.detailImage,
                    { backgroundColor: imageUrl?.backgroundColor || '#ccc' },
                  ]}
                >
                  <Text style={{ color: imageUrl?.textColor || '#000', fontSize: 50, fontWeight: 'bold' }}>
                    {imageUrl?.initials}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.Heading}>

              <Text style={styles.title}>
                {(profile?.first_name || '').trimStart().trimEnd()} {(profile?.last_name || '').trimStart().trimEnd()}
              </Text>

              <View style={styles.textContainer}>
                <Text style={styles.label}>Email ID  </Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{(profile?.user_email_id || "").trimStart().trimEnd()}
                </Text>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.label}>Phone no.     </Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{profile?.user_phone_number || ""}
                </Text>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.label}>Location         </Text>
                <Text style={styles.colon}>:</Text>

                <Text style={styles.value}>{profile?.city}, {profile?.state || ""}
                </Text>
              </View>
              {(profile?.college?.trimStart().trimEnd()) ? (
                <View style={styles.textContainer}>
                  <Text style={styles.label}>College</Text>
                  <Text style={styles.colon}>:</Text>
                  <Text style={styles.value}>{profile?.college.trimStart().trimEnd()}</Text>
                </View>
              ) : null}

              <View style={styles.textContainer}>
                <Text style={styles.label}>Educational qualification          </Text>
                <Text style={styles.colon}>:</Text>

                <Text style={styles.value}>{(profile?.education_qualifications || "").trimStart().trimEnd()}
                </Text>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.label}>Date of birth      </Text>
                <Text style={styles.colon}>:</Text>

                <Text style={styles.value}>{profile?.date_of_birth ? formatDate(profile?.date_of_birth) : "NULL"}</Text>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.label}>Gender          </Text>
                <Text style={styles.colon}>:</Text>

                <Text style={styles.value}>{profile?.gender || ""}
                </Text>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.label}>Expert in              </Text>
                <Text style={styles.colon}>:</Text>

                <Text style={styles.value}>{(profile?.expert_in || "").trimStart().trimEnd()}
                </Text>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.label}>Experience             </Text>
                <Text style={styles.colon}>:</Text>

                <Text style={styles.value}>{profile?.work_experience || ""}
                </Text>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.label}>Preferred cities    </Text>
                <Text style={styles.colon}>:</Text>

                <Text style={[styles.value]}>
                  {(Array.isArray(profile?.preferred_cities)
                    ? profile?.preferred_cities.map(city => city.label).join(', ')
                    : profile?.preferred_cities || "").trimStart().trimEnd()}
                </Text>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.label}>Expected salary    </Text>
                <Text style={styles.colon}>:</Text>

                <Text style={styles.value}>{profile?.expected_salary || ""}
                </Text>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.label}>Domain strength    </Text>
                <Text style={styles.colon}>:</Text>

                <Text style={styles.value}>{profile?.domain_strength || ""}
                </Text>
              </View>

              {profile?.languages && profile?.languages.trim().length > 0 && (
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Languages known        </Text>
                  <Text style={styles.colon}>:</Text>
                  <Text style={[styles.value]}>
                    {(profile?.languages || "").trimStart().trimEnd()}
                  </Text>
                </View>
              )}

            </View>


            <TouchableOpacity onPress={handleOpenResume} disabled={loading} style={{ alignItems: 'center' }}>
              {loading ? (
                <ActivityIndicator size="small" color="#075cab" style={styles.viewResumeText} />
              ) : (
                <Text style={styles.viewResumeText}>View Resume</Text>
              )}
            </TouchableOpacity>


            <TouchableOpacity style={styles.buttonDelete} onPress={handleDelete1}>
              <Text style={styles.buttonTextDelte}>Delete</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      ) : (
        null
      )}


      <Message
        visible={modalVisible}
        onCancel={onCancel}
        onOk={onDeleteConfirm}
        title={modalTitleDelete}
        message={modalMessageDelete}
        iconType="warning"
      />

    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  container3: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  scrollViewContainer: {
    paddingBottom: "20%", // Space for the sticky button
    top: 20,
  },

  imageContainer: {
    marginBottom: 20,
    width: 140,
    height: 140,
    alignSelf: 'center'
  },
  buttonDelete: {
    alignSelf: 'center', // Centers the button
    width: 90, // Adjusts the button width to be smaller
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#FF0000',
    borderWidth: 1,
    marginVertical: 20,
  },
  buttonTextDelte: {
    color: '#FF0000',
    fontWeight: '600',
    fontSize: 16,
  },

  detailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    overflow: 'hidden',
    backgroundColor: '#ccc',
    alignItems:'center',
    justifyContent:'center'
  },
  textContainer: {

    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    backgroundColor: 'white',
    shadowColor: '#0d6efd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10

  },
  Heading: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 5

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
    fontSize: 18,
    fontWeight: '600',

    textAlign: 'center',
    color: "black",
    marginTop: 20,
  },

  viewResumeText: {
    textAlign: 'center',
    color: '#075cab',
    fontSize: 16,
    fontWeight: "500",
    marginTop: 20
  },
  resumeButtonText: {
    color: '#075cab',
    fontSize: 16,
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

  backButton: {
    alignSelf: 'flex-start',
    padding: 10,
  },
  createButton: {
    backgroundColor: '#075cab',
    borderRadius: 50,
    padding: 10,
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

});

export default UserJobProfilescreen;

