import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const UserAppliedJobDetailsScreen = () => {
  const route = useRoute();
  const { jobDetails } = route.params; // Get the job details from params

  const navigation = useNavigation();
  const scrollViewRef = useRef(null)
  if (!jobDetails) {
    return <Text style={styles.loading}>
      <ActivityIndicator size="large" color="#075cab" />
    </Text>;
  }

  useFocusEffect(
    useCallback(() => {

      if (scrollViewRef.current) {

        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
      }
    }, [])
  );

  return (
    <SafeAreaView style={styles.container1} >
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#075cab" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} ref={scrollViewRef}>

        <Text style={styles.title}>{jobDetails.job_title}</Text>

        <View style={styles.detailContainer}>
          <Text style={styles.label}>Company              </Text>
          <Text style={styles.colon}>:</Text>

          <Text style={styles.detail}>{(jobDetails.company_name || '').trimStart().trimEnd()}</Text>
        </View>
        <View style={styles.detailContainer}>
          <Text style={styles.label}>Category            </Text>
          <Text style={styles.colon}>:</Text>

          <Text style={styles.detail}>{jobDetails.company_category || ''}</Text>
        </View>
        {jobDetails?.Website ? (
          <View style={styles.detailContainer}>
            <Text style={styles.label}>Website            </Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.detail}>{(jobDetails?.Website || '').trim()}</Text>
          </View>
        ) : null}


        <View style={styles.detailContainer}>
          <Text style={styles.label}>Location              </Text>
          <Text style={styles.colon}>:</Text>

          <Text style={styles.detail}>{jobDetails.company_located_city || ''}</Text>
        </View>


        <View style={styles.detailContainer}>
          <Text style={styles.label}>Industry type             </Text>
          <Text style={styles.colon}>:</Text>

          <Text style={styles.detail}>{jobDetails.industry_type || ''}</Text>
        </View>
        <View style={styles.detailContainer}>
          <Text style={styles.label}>Required qualification        </Text>
          <Text style={styles.colon}>:</Text>

          <Text style={styles.detail}>{(jobDetails.required_qualifications || '').trimStart().trimEnd()}</Text>
        </View>
        <View style={styles.detailContainer}>
          <Text style={styles.label}>Required expertise             </Text>
          <Text style={styles.colon}>:</Text>

          <Text style={styles.detail}>{(jobDetails.required_expertise || '').trimStart().trimEnd()}</Text>
        </View>
        <View style={styles.detailContainer}>
          <Text style={styles.label}>Required experience             </Text>
          <Text style={styles.colon}>:</Text>

          <Text style={styles.detail}>{(jobDetails.experience_required || '').trimStart().trimEnd()}</Text>
        </View>
        <View style={styles.detailContainer}>
          <Text style={styles.label}>Required speicializations          </Text>
          <Text style={styles.colon}>:</Text>

          <Text style={styles.detail}>{(jobDetails.speicializations_required || '').trimStart().trimEnd()}</Text>
        </View>

        <View style={styles.detailContainer}>
          <Text style={styles.label}>Salary package              </Text>
          <Text style={styles.colon}>:</Text>

          <Text style={styles.detail}>{jobDetails.Package || ''}</Text>
        </View>

        <View style={styles.detailContainer}>
          <Text style={styles.label}>Job description              </Text>
          <Text style={styles.colon}>:</Text>

          <Text style={styles.detail}>{(jobDetails.job_description || '').trimStart().trimEnd()}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container1: {
    flexGrow: 1,
    padding: 15,
    backgroundColor: 'white',
  },
  container: {
    flexGrow: 1,

    backgroundColor: 'whitesmoke',
    paddingBottom: "20%",
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'

  },

  detailContainer: {
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
  colon: {
    width: 20,
    textAlign: 'center',
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    alignSelf: 'flex-start',

  },
  label: {
    width: '35%', // Make label width consistent
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    // textAlign: 'left', // Align text to the left
    alignSelf: "flex-start", // Ensure left alignment
  },
  backButton: {
    padding: 10,

    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
    textAlign: 'center',
    marginVertical: 20,
  },
  fieldLabel: {
    color: "black",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 5,
    marginBottom: 5,
  },


  detail: {
    flex: 2, // Take the remaining space
    flexShrink: 1,
    color: 'black',
    fontWeight: '400',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',

  },

  detailValue: {
    fontSize: 15,
    color: "#212529",
    lineHeight: 25,
    fontWeight: "400",
    textAlign: 'justify'
  },
  loading: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 20,
    color: '#6c757d',
  },
});


export default UserAppliedJobDetailsScreen;