import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, Alert, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS } from '../../assets/Constants'; // Ensure COLORS has appropriate color values

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Message from '../../components/Message';
import apiClient from '../ApiClient';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';

const UserJobAppliedScreen = () => {
  const {myId, myData } = useNetwork();
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [companyid, setComapnyid] = useState(''); 
  const navigation = useNavigation();
  const scrollViewRef = useRef(null)
  const [showModal, setShowModal] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState('');
  const [loading, setLoading] = useState(true);


  useFocusEffect(
    useCallback(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToOffset({ offset: 0, animated: false });
      }

    }, [])
  );

  useFocusEffect(

    useCallback(() => {
      if (myId) {
        fetchAppliedJobs();
      }
    }, [myId])
  );


  const fetchAppliedJobs = async () => {
  
    try {
      const response = await apiClient.post('/getUsersAppliedJobs', {
        command: "getUsersAppliedJobs",
        user_id: myId,
      });
  
      if (response.data.status === "success" && Array.isArray(response.data.response) && response.data.response.length > 0) {
        console.log('response.data:', response.data);
        setComapnyid(response.data.response[0].company_id); 
        setAppliedJobs(response.data.response);
      } else {
        setAppliedJobs({ removed_by_author: true });
      }
    } catch (error) {
      console.error('Error fetching applied jobs:', error);
      setAppliedJobs({ removed_by_author: true });
    } finally {
    
    }
  };
  


  const handleRevoke = async (post_id) => {
    const jobToRevoke = appliedJobs.find(job => job.post_id === post_id);
    if (!jobToRevoke) {
      console.error("Job not found in state");
      return;
    }
  
    const { company_id } = jobToRevoke;
  
    try {
      const response = await apiClient.post('/revokeJobs', {
        command: "revokeJobs",
        company_id,
        user_id: myId,
        post_id
      });
  
      if (response.data.status === "success") {
        setAppliedJobs(prevJobs => prevJobs.filter(job => job.post_id !== post_id));
        showToast('The application has been successfully revoked', 'success');

      } else {
      
        showToast(
          `Failed to revoke: ${response.data.status_message || "Unknown error"}`,
          'error'
        );
      }
    } catch (error) {
      
      if (error.message === 'Network Error' || !error.response) {
        showToast("You don't have an internet connection", 'error');
      } else {
        showToast('Something went wrong', 'error');
      }
    } finally {
      setShowModal(false);
    }
  };
  
  


  const confirmRevoke = (post_id) => {
    setSelectedJobTitle(post_id);
    setShowModal(true); 
  };


  const handleDetails = (item) => {
    navigation.navigate('UserAppliedJobDetails', { jobDetails: item });
  };

  const navigateToDetails = (job) => {
    navigation.navigate("JobDetail", { post_id: job.post_id, post: job });
  };

  if (appliedJobs?.removed_by_author) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#075cab" />
          </TouchableOpacity>

        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>No jobs applied</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (

    <View style={styles.container1} >
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#075cab" />
        </TouchableOpacity>
      </View>


      {appliedJobs ? (
        <FlatList
          data={appliedJobs}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: '20%', marginTop: 5, }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.Title}>
                <Text style={styles.label}>Job Title</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{item?.job_title.trim()}</Text>
              </View>
              <View style={styles.Title}>
                <Text style={styles.label}>Company</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{item?.company_name.trim()}</Text>
              </View>
              <View style={styles.Title}>
                <Text style={styles.label}>Category</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{item?.company_category}</Text>
              </View>
              <View style={styles.Title}>
                <Text style={styles.label}>City</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{item?.company_located_city}</Text>
              </View>
              <View style={styles.Title}>
                <Text style={styles.label}>Salary package</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{item.Package || "N/A"}</Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={() => navigateToDetails(item)} style={styles.viewMoreButton}>
                  <Text style={styles.viewMoreText}>View More</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmRevoke(item.post_id)} style={styles.revokeButton}>
                  <Text style={styles.revokeButtonText}>Revoke</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.post_id}
        />
      ) : null }
      <Message
        visible={showModal}
        onClose={() => setShowModal(false)}
        onCancel={() => setShowModal(false)}
        onOk={() => handleRevoke(selectedJobTitle)}
        title="Confirm Deletion"
        message={`Are you sure you want to revoke the job ?`}
        iconType="warning"
      />

    </View>
  );

}; const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',

  },
  container1: {
    flex: 1,
    backgroundColor: 'whitesmoke',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: COLORS.black,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    borderWidth: 0.5,
    borderColor: '#ddd',
    shadowColor: '#0d6efd',
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 6,
    elevation: 5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Align buttons to the sides
    marginTop: 10,
  },
  backButton: {
    padding: 10,
    alignSelf: "flex-start",

  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: "#075cab",
  },

  viewMoreButton: {
    width: 120,  // Fixed width for compact button
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 5,
    alignItems: 'center',
    borderColor: '#075cab',
    borderWidth: 1.2,
    backgroundColor: '#ffffff', // White background color
    shadowColor: '#0d6efd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  viewMoreText: {
    color: '#075cab', // Text color for visibility
    fontWeight: '600',
    fontSize: 14,
  },
  revokeButton: {
    width: 120,  // Fixed width for compact button
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderColor: '#dc3545',
    borderWidth: 1.2,
    backgroundColor: '#ffffff', // White background color
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  revokeButtonText: {
    color: '#dc3545', // Text color for visibility
    fontWeight: '600',
    fontSize: 15,
  },

  noJobs: {
    color: 'black',
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    padding: 10,
  },
  colon: {
    width: 20, // Fixed width for the colon
    textAlign: 'center', // Center the colon
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
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
  value: {
    flex: 2, // Take the remaining space
    flexShrink: 1,
    color: 'black',
    fontWeight: '400',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
  },
  Title: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});


export default UserJobAppliedScreen;