import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Alert, Linking, ScrollView, ToastAndroid, Button, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Message from '../../components/Message';
import { useSelector } from 'react-redux';
import { Image as FastImage } from 'react-native';
import { showToast } from '../AppUtils/CustomToast';
import { useFileOpener } from '../helperComponents/fileViewer';
import { useNetwork } from '../AppUtils/IdProvider';
import apiClient from '../ApiClient';
import { generateAvatarFromName } from '../helperComponents/useInitialsAvatar';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import Edit from '../../assets/svgIcons/edit.svg';
import Add from '../../assets/svgIcons/add.svg';

import { colors, dimensions } from '../../assets/theme.jsx';
import { commonStyles } from '../AppUtils/AppStyles.js';

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
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circle}
            onPress={() => navigation.navigate('UserJobProfileCreate')}
          >
            <Edit width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

            <Text style={styles.shareText}>Create</Text>
          </TouchableOpacity>

        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>Create job profile</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} >
      <View style={styles.headerContainer}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

        </TouchableOpacity>

        {/* Profile Exists? Show Update Button; Otherwise, Show Create Profile Button */}
        {profile !== null && (
          <TouchableOpacity
            style={styles.circle}
            onPress={
              profile
                ? handleUpdate
                : () => navigation.navigate('UserJobProfileCreate')
            }
          >
            <Edit
              width={dimensions.icon.medium}
              height={dimensions.icon.medium}
              color={colors.primary}
            />
            <Text style={styles.shareText}>
              {profile ? "Update" : "Create"}
            </Text>
          </TouchableOpacity>
        )}

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

                  onError={() => { }}
                />
              ) : (
                <View
                  style={[
                    styles.detailImage,
                    { backgroundColor: imageUrl?.backgroundColor },
                  ]}
                >
                  <Text style={[commonStyles.avatarText, { color: imageUrl?.textColor },]}>
                    {imageUrl?.initials}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.Heading}>

              <Text style={commonStyles.title}>
                {(profile?.first_name || '').trimStart().trimEnd()} {(profile?.last_name || '').trimStart().trimEnd()}
              </Text>

              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Email ID  </Text>
                <Text style={commonStyles.colon}>:</Text>
                <Text style={commonStyles.value}>{(profile?.user_email_id || "").trimStart().trimEnd()}
                </Text>
              </View>

              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Phone no.     </Text>
                <Text style={commonStyles.colon}>:</Text>
                <Text style={commonStyles.value}>{profile?.user_phone_number || ""}
                </Text>
              </View>

              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Location         </Text>
                <Text style={commonStyles.colon}>:</Text>

                <Text style={commonStyles.value}>{profile?.city}, {profile?.state || ""}
                </Text>
              </View>
              {(profile?.college?.trimStart().trimEnd()) ? (
                <View style={commonStyles.labValContainer}>
                  <Text style={commonStyles.label}>College</Text>
                  <Text style={commonStyles.colon}>:</Text>
                  <Text style={commonStyles.value}>{profile?.college.trimStart().trimEnd()}</Text>
                </View>
              ) : null}

              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Educational qualification          </Text>
                <Text style={commonStyles.colon}>:</Text>

                <Text style={commonStyles.value}>{(profile?.education_qualifications || "").trimStart().trimEnd()}
                </Text>
              </View>

              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Date of birth      </Text>
                <Text style={commonStyles.colon}>:</Text>

                <Text style={commonStyles.value}>{profile?.date_of_birth ? formatDate(profile?.date_of_birth) : "NULL"}</Text>
              </View>

              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Gender          </Text>
                <Text style={commonStyles.colon}>:</Text>

                <Text style={commonStyles.value}>{profile?.gender || ""}
                </Text>
              </View>

              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Industry type              </Text>
                <Text style={commonStyles.colon}>:</Text>

                <Text style={commonStyles.value}>{(profile?.industry_type || "").trimStart().trimEnd()}
                </Text>
              </View>

              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Expert in              </Text>
                <Text style={commonStyles.colon}>:</Text>
                <View style={{ flex: 2 }}>
                  {profile.expert_in.split(",").map((skill, index) => (
                    <Text key={index} style={commonStyles.value}>
                      {skill.trim()},
                    </Text>
                  ))}
                </View>

              </View>

              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Experience             </Text>
                <Text style={commonStyles.colon}>:</Text>

                <Text style={commonStyles.value}>{profile?.work_experience || ""}
                </Text>
              </View>

              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Preferred cities    </Text>
                <Text style={commonStyles.colon}>:</Text>

                <Text style={[commonStyles.value]}>
                  <View style={{ flexDirection: "column", flex: 1 }}>
                    {profile.preferred_cities
                      .split(",")
                      .map((city, index) => (
                        <Text key={index} style={commonStyles.value}>
                          {city.trim()}
                        </Text>
                      ))}
                  </View>
                </Text>
              </View>

              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Expected salary    </Text>
                <Text style={commonStyles.colon}>:</Text>

                <Text style={commonStyles.value}>{profile?.expected_salary || ""}
                </Text>
              </View>

              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Domain strength    </Text>
                <Text style={commonStyles.colon}>:</Text>

                <Text style={commonStyles.value}>{profile?.domain_strength || ""}
                </Text>
              </View>

              {profile?.languages && profile?.languages.trim().length > 0 && (
                <View style={commonStyles.labValContainer}>
                  <Text style={commonStyles.label}>Languages known        </Text>
                  <Text style={commonStyles.colon}>:</Text>
                  <View style={{ flex: 2 }}>
                    {profile.languages.split(",").map((language, index) => (
                      <Text key={index} style={commonStyles.value}>
                        {language.trim()}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

            </View>


            <TouchableOpacity onPress={handleOpenResume} disabled={loading} style={{ alignItems: 'center', padding: 10, }}>
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

    </View>
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
    alignItems: 'center',
    justifyContent: 'center'
  },
  textContainer: {

    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    backgroundColor: 'white',
    shadowColor: '#000',
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
    color: colors.text_secondary,
    fontWeight: '500',
    fontSize: 13,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',

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
  title: {
    color: colors.text_primary,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    color: "black",
    marginBottom: 10
  },

  viewResumeText: {
    textAlign: 'center',
    color: '#075cab',
    fontSize: 16,
    fontWeight: "500",
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
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'

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

