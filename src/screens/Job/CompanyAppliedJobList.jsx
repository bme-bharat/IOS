import { StyleSheet, Text, View, ToastAndroid, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import apiClient from '../ApiClient';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';

import { colors, dimensions } from '../../assets/theme.jsx';
import { commonStyles } from '../AppUtils/AppStyles.js';

const CompanyAppliedJobScreen = () => {
  const { myId, myData } = useNetwork();
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef(null)
  const { post } = route.params;


  useEffect(() => {
    const fetchAppliedJobs = async () => {
      if (myId && post) {
        try {
          const response = await apiClient.post('/getJobAppliedCandidates', {
            command: 'getJobAppliedCandidates',
            company_id: myId,
            job_title: post.job_title,
          });

          if (response.data && response.data.response) {
            setAppliedJobs(response.data.response);
          } else if (response.data && response.data.errorMessage) {
            setError(response.data.errorMessage);
          }
        } catch (error) {

          showToast("You don't have an internet connection", 'error');

        } finally {
          setLoading(false);
        }
      }
    };

    fetchAppliedJobs();
  }, [myId, post]);




  useFocusEffect(
    useCallback(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToOffset({ offset: 0, animated: false });
      }

    }, [])
  );


  const getSlicedTitle = (title) => {
    const maxLength = 27;  // Define the maximum length including spaces
    if (title.length > maxLength) {
      return title.slice(0, maxLength).trim() + '...'; // Trim to the max length and add ellipsis
    }
    return title; // Return the original title if it's already within the length limit
  };


  const renderJobItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('CompanyGetAppliedJobs', { userId: item.user_id, post: item });
      }}
      activeOpacity={1}
      style={styles.jobCard}
    >

        <View style={commonStyles.valContainer}>
          <Text style={commonStyles.label}>First name        </Text>
          <Text style={commonStyles.colon}>:</Text>

          <Text style={commonStyles.value} numberOfLines={1}>{(getSlicedTitle(item.first_name || "").trimStart().trimEnd())}</Text>
        </View>
        <View style={commonStyles.valContainer}>
          <Text style={commonStyles.label}>Last name         </Text>
          <Text style={commonStyles.colon}>:</Text>

          <Text style={commonStyles.value}>{(item.last_name).trimStart().trimEnd()}</Text>
        </View>
        <View style={commonStyles.valContainer}>
          <Text style={commonStyles.label}>Email ID                 </Text>
          <Text style={commonStyles.colon}>:</Text>

          <Text style={commonStyles.value} numberOfLines={1}>{((item.user_email_id).trimStart().trimEnd())}</Text>
        </View>
        <View style={commonStyles.valContainer}>
          <Text style={commonStyles.label}>Phone no.    </Text>
          <Text style={commonStyles.colon}>:</Text>

          <Text style={commonStyles.value}>{item.user_phone_number}</Text>
        </View>

        <TouchableOpacity onPress={() => {
          navigation.navigate('CompanyGetAppliedJobs', { userId: item.user_id, post: item });
        }} activeOpacity={0.8} 
        style={styles.applyButton}>
          <Text style={styles.buttonText}>View profile</Text>
        </TouchableOpacity>

    </TouchableOpacity>
  );


  // if (loading) {
  //   return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;
  // }

  if (appliedJobs.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

          </TouchableOpacity>

        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>No jobs applications available</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#075cab" />
        </View>
      ) : appliedJobs.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Text style={styles.noJobsText}>No job applications found</Text>
        </View>
      ) : (
        <FlatList
          data={appliedJobs}
          ref={scrollViewRef}
          renderItem={renderJobItem}
          contentContainerStyle={{ paddingBottom: "20%" }}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item, index) => `appliedJobs-${index}`}
          bounces={false}
        />
      )}

      <Toast />
    </View>
  );


};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'whitesmoke',
  },


  loader: {
    marginTop: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,

  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },

  jobCard: {
    top: 5,
    marginHorizontal: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'white',
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

  applyButton: {
    flexDirection: 'row',
    // alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: '#fff',
    elevation:2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    alignSelf:'flex-end'
  },
  buttonText: {
    marginLeft: 5,
    fontSize: 15,
    fontWeight: '500',
    color: "#075cab",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noJobsText: {
    fontSize: 16,
    color: 'gray'
  },

});

export default CompanyAppliedJobScreen;