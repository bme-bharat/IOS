

import { StyleSheet, Text, View, ActivityIndicator, FlatList, Image, Linking, TouchableOpacity, SafeAreaView } from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FastImage from 'react-native-fast-image';
import defaultImage from '../../images/homepage/dummy.png';
import femaleImage from '../../images/homepage/female.jpg';
import { useFileOpener } from '../helperComponents/fileViewer';
import apiClient from '../ApiClient';

const CompanyGetAppliedJobsScreen = () => {
  const route = useRoute();
  const { userId } = route.params;
  const navigation = useNavigation()
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const scrollViewRef = useRef(null)
  const { openFile } = useFileOpener();
  const [loading1, setLoading1] = useState(false);

  const handleOpenResume = async () => {
    if (!posts[0]?.resume_key) return;
    setLoading1(true);
    try {
      await openFile(posts[0].resume_key);
    } finally {
      setLoading1(false);
    }
  };




  useFocusEffect(
    useCallback(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToOffset({ offset: 0, animated: false });
      }

    }, [])
  );



  useEffect(() => {
    if (!userId) return;

    const fetchPosts = async () => {
      try {
        const response = await apiClient.post('/getJobProfiles', {
          command: 'getJobProfiles',
          user_id: userId,
        });

        if (response.data.status === 'success') {
          const postsData = response.data.response;
          setPosts(postsData);

          const imageUrlsObject = {};

          await Promise.all(
            postsData.map(async (post) => {
              if (post.fileKey) {
                try {
                  const res = await apiClient.post('/getObjectSignedUrl', {
                    command: 'getObjectSignedUrl',
                    key: post.fileKey,
                  });
                  const img_url = res.data;
                  if (img_url) {
                    imageUrlsObject[post.seeker_id] = img_url;
                  }
                } catch (e) {
                  console.warn('Error fetching image URL for', post.seeker_id, e);
                }
              }
            })
          );

          setImageUrls(imageUrlsObject);
        } else {
          console.warn('API Error:', response.data.status_message);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [userId]);




  const defaultImageUrifemale = Image.resolveAssetSource(femaleImage).uri;
  const defaultImageUri = Image.resolveAssetSource(defaultImage).uri;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container} >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#075cab" />
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#075cab" />
          </View>
        ) : (
          <FlatList
            data={posts}
            ref={scrollViewRef}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: "20%" }}
            keyExtractor={(item) => item.user_id}
            bounces={false}
            renderItem={({ item }) => {
              // Determine image URL based on fileKey or gender
              let imageUrl = defaultImageUri;
              if (item.fileKey && imageUrls[item.seeker_id]) {
                imageUrl = imageUrls[item.seeker_id]; // Use the signed URL if fileKey is valid
              } else if (item.gender === 'Male') {
                imageUrl = defaultImageUri; // Default male image
              } else if (item.gender === 'Female') {
                imageUrl = defaultImageUrifemale; // Default female image
              }

              return (
                <TouchableOpacity activeOpacity={1}>
                <View style={styles.card}>
                  {imageUrl && (
                    <TouchableOpacity onPress={() => navigation.navigate('ImageView', { imageUrl })}>
                      <View style={styles.imageContainer}>
                        <Image source={{ uri: imageUrl }} style={styles.image}
                          resizeMode='cover' />
                      </View>
                    </TouchableOpacity>
                  )}

                  <Text style={styles.title}>{item.first_name} {item.last_name}</Text>
                  <View style={styles.detailsContainer}>

                    <View style={styles.detail}>
                      <Text style={styles.label}>Email ID       </Text>
                      <Text style={styles.colon}>:</Text>
                      <Text style={styles.value}>{(item.user_email_id || "").trimStart().trimEnd()}</Text>
                    </View>

                    <View style={styles.detail}>
                      <Text style={styles.label}>Phone no.     </Text>
                      <Text style={styles.colon}>:</Text>
                      <Text style={styles.value}>{(item.user_phone_number || "").trimStart().trimEnd()}</Text>
                    </View>
                    <View style={styles.detail}>
                      <Text style={styles.label}>Category          </Text>
                      <Text style={styles.colon}>:</Text>
                      <Text style={styles.value}>{(item.user_category || "").trimStart().trimEnd()}</Text>
                    </View>


                    <View style={styles.detail}>
                      <Text style={styles.label}>City          </Text>
                      <Text style={styles.colon}>:</Text>
                      <Text style={styles.value}>{(item.city || "").trimStart().trimEnd()}</Text>
                    </View>


                    <View style={styles.detail}>
                      <Text style={styles.label}>State          </Text>
                      <Text style={styles.colon}>:</Text>
                      <Text style={styles.value}>{(item.state || "").trimStart().trimEnd()}</Text>
                    </View>

                    {item.education_qualifications && item.education_qualifications.trim() !== "" && (
                      <View style={styles.detail}>
                        <Text style={styles.label}>Educational qualification</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.value}>{item.education_qualifications.trim()}</Text>
                      </View>
                    )}

                    <View style={styles.detail}>
                      <Text style={styles.label}>Date of birth          </Text>
                      <Text style={styles.colon}>:</Text>
                      <Text style={styles.value}>{(item.date_of_birth || "")}</Text>
                    </View>


                    {item.college && item.college.trim() !== "" && (
                      <View style={styles.detail}>
                        <Text style={styles.label}>College</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.value}>{item.college.trim()}</Text>
                      </View>
                    )}

                    {item.domain_strength && item.domain_strength.trim() !== "" && (
                      <View style={styles.detail}>
                        <Text style={styles.label}>Domain strength</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.value}>{item.domain_strength.trim()}</Text>
                      </View>
                    )}

                    {item.work_experience && item.work_experience.trim() !== "" && (
                      <View style={styles.detail}>
                        <Text style={styles.label}>Work experience</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.value}>{item.work_experience.trim()}</Text>
                      </View>
                    )}


                    {item.languages && item.languages.trim() !== "" && (
                      <View style={styles.detail}>
                        <Text style={styles.label}>Languages known</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.value}>{item.languages.trim()}</Text>
                      </View>
                    )}

                    {item.preferred_cities && item.preferred_cities.trim() !== "" && (
                      <View style={styles.detail}>
                        <Text style={styles.label}>Preferred cities</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.value}>{item.preferred_cities.trim()}</Text>
                      </View>
                    )}

                    {item.expected_salary && item.expected_salary.trim() !== "" && (
                      <View style={styles.detail}>
                        <Text style={styles.label}>Expected salary</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.value}>{item.expected_salary.trim()}</Text>
                      </View>
                    )}



                    {item.expert_in && item.expert_in.trim() !== "" && (
                      <View style={styles.detail}>
                        <Text style={styles.label}>Expert In</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.value}>{item.expert_in.trim()}</Text>
                      </View>
                    )}


                    <TouchableOpacity onPress={handleOpenResume} disabled={loading1} style={styles.viewResumeText}>
                      {loading1 ? (
                        <ActivityIndicator size="small" color="#075cab"  />
                      ) : (
                        <Text style={styles.pdfLink}>View Resume</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                </View>
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false} // Hide the vertical scrollbar
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'white',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,

  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center'
  },
  card: {
    marginBottom: 16,
    padding: 10,
    // Add other styling as needed
  },
  imageContainer: {
    alignSelf: 'center',
    width: 140,
    height: 140,
    borderRadius: 75,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: "black",
    marginTop: 20,
  },
  detailRow: {

    fontSize: 15,

    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 9,
    marginBottom: 12,
    shadowColor: '#0d6efd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  label: {

    width: '35%', // Occupies 35% of the row
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    // textAlign: 'justify',
    alignSelf: "flex-start"

  },
  value: {
    flex: 1, // Take the remaining space
    flexShrink: 1,
    color: 'black',
    fontWeight: '400',
    fontSize: 15,
    textAlign: 'justify', // Align text to the left
    alignSelf: 'flex-start'

  },
  colon: {
    width: 20, // Fixed width for the colon
    textAlign: 'center', // Center the colon
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    alignSelf: 'flex-start',

  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    elevation: 3, // Android shadow
    backgroundColor: 'white',
    shadowColor: '#0d6efd', // iOS shadow color
    shadowOffset: { width: 0, height: 2 }, // iOS shadow offset
    shadowOpacity: 0.2, // iOS shadow opacity
    shadowRadius: 3, // iOS shadow radius
    borderRadius: 10,
    padding: 10
  },
  pdfLink: {
    color: '#075cab',
    marginTop: 8,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "400",
  },
  viewResumeText: {
    textAlign: 'center',
    color: '#075cab',
    fontSize: 16,
    fontWeight: "500",
    marginTop: 20
  },
});

export default CompanyGetAppliedJobsScreen;

