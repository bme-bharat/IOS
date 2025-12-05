import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TextInput, Text, ToastAndroid, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView, Keyboard } from 'react-native';
import axios from 'axios';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CustomDropDownMenu from '../../components/DropDownMenu'; // Ensure this is imported
import { ExperienceType, HireType, industrySkills, industryType, SalaryType, topTierCities } from '../../assets/Constants'; // Import constants
import Icon from 'react-native-vector-icons/MaterialIcons';

import Message from '../../components/Message';
import Message3 from '../../components/Message3';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDispatch, useSelector } from 'react-redux';
import { updateJobPost } from '../Redux/Job_Actions';
import { showToast } from '../AppUtils/CustomToast';
import apiClient from '../ApiClient';
import { useNetwork } from '../AppUtils/IdProvider';
import AppStyles from '../AppUtils/AppStyles';
import { EventRegister } from 'react-native-event-listeners';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';

import { colors, dimensions } from '../../assets/theme.jsx';

const CompanyJobEditScreen = ({ route }) => {
  const { myId, myData } = useNetwork();

  const { jobPosts: jobs } = useSelector(state => state.jobs);
  const dispatch = useDispatch();
  const { post } = route.params;
  const navigation = useNavigation();
  const [jobEditFormData, setJobEditFormData] = useState({
    job_title: "",
    industry_type: "",
    job_description: "",
    experience_required: "",
    speicializations_required: "",
    Package: "",
    required_expertise: "",
    required_qualifications: "",
    working_location: '',

  });
  const [hasChanges, setHasChanges] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [expertiseKey, setExpertiseKey] = useState(Date.now());
  const [expertiseOptions, setExpertiseOptions] = useState([]);


  useEffect(() => {
    if (post) {
      setJobEditFormData({
        job_title: post.job_title || "",
        industry_type: post.industry_type || "",
        preferred_languages: post.preferred_languages || "",
        job_description: post.job_description || "",
        working_location: post.working_location || "",
        experience_required: post.experience_required || "",
        speicializations_required: post.speicializations_required || "",
        Package: post.Package || "",
        required_expertise: post.required_expertise || "",
        required_qualifications: post.required_qualifications || ""
      });
      setSelectedSkills(post.required_expertise ? post.required_expertise.split(',').map(s => s.trim()) : []);
      setSelectedCities(post.working_location ? post.working_location.split(',').map(c => c.trim()) : []);
      setExpertiseOptions(industrySkills[post.industry_type] || []);

    }
  }, [post]);

  const handleSkillSelect = (selected) => {
    if (!selectedSkills.includes(selected.label)) {
      if (selectedSkills.length >= 3) {
        showToast('You can select up to 3 skills', 'info');
        return;
      }
      const updated = [...selectedSkills, selected.label];
      setSelectedSkills(updated);
      handleChange('required_expertise', updated.join(', '));
    }
  };

  const removeSkill = (skill) => {
    const updated = selectedSkills.filter(s => s !== skill);
    setSelectedSkills(updated);
    handleChange('required_expertise', updated.join(', '));
  };

  const handleCitySelect = (selected) => {
    if (!selectedCities.includes(selected.label)) {
      if (selectedCities.length >= 5) {
        showToast('You can select up to 5 cities', 'info');
        return;
      }
      const updated = [...selectedCities, selected.label];
      setSelectedCities(updated);
      handleChange('working_location', updated.join(', '));
    }
  };

  const removeCity = (city) => {
    const updated = selectedCities.filter(c => c !== city);
    setSelectedCities(updated);
    handleChange('working_location', updated.join(', '));
  };

  const renderSelectedItems = (items, onRemove) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {items.map(item => (
        <View key={item} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eee', padding: 6, paddingHorizontal: 10, borderRadius: 18, marginBottom:10 }}>
          <Text style={{ marginRight: 8, fontSize: 12 }}>{item}</Text>
          <TouchableOpacity
            onPress={() => onRemove(item)}
            style={{
              width: 16,
              height: 16,
              borderRadius: 9,
              backgroundColor: '#999',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 4,
              
            }} >
            <Text style={{ color: '#fff', fontSize: 10 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const handleChange = (key, value) => {
    const trimmedValue = value.replace(/^\s+/, "");

    if (value.startsWith(" ")) {
      showToast('Leading spaces are not allowed', 'error');
      return;
    }

    if (key === 'industry_type') {
      setJobEditFormData(prevState => ({
        ...prevState,
        [key]: trimmedValue,
      }));

      const updatedSkills = [];
      setSelectedSkills(updatedSkills);
      setExpertiseOptions(industrySkills[value] || []);
      handleChange('required_expertise', '');

      setHasChanges(true);
      return;
    }

    setJobEditFormData(prevState => ({
      ...prevState,
      [key]: trimmedValue,
    }));

    setHasChanges(true);
  };



  const JobEditHandle = () => {
    try {
      const trimmedData = {
        job_title: jobEditFormData.job_title?.trim() || "",
        industry_type: jobEditFormData.industry_type?.trim() || "",
        job_description: jobEditFormData.job_description?.trim() || "",
        experience_required: jobEditFormData.experience_required?.trim() || "",
        speicializations_required: jobEditFormData.speicializations_required?.trim() || "",
        Package: jobEditFormData.Package?.trim() || "",
        working_location: jobEditFormData.working_location?.trim() || "",
        required_expertise: jobEditFormData.required_expertise?.trim() || "",
        required_qualifications: jobEditFormData.required_qualifications?.trim() || "",
        preferred_languages: jobEditFormData.preferred_languages?.trim() || ""
      };

      for (const [key, value] of Object.entries(trimmedData)) {
        if (key !== "preferred_languages" && !value) {
          showToast(`${key.replace(/_/g, " ")} is mandatory`, 'info');
          return;
        }
      }

      setHasChanges(false);

      const existingJob = jobs.find(job => String(job.post_id) === String(post.post_id));

      const updatedJobData = {
        ...existingJob,
        ...trimmedData,
      };

      apiClient.post("/updateAJobPost", {
        command: "updateJobPost",
        company_id: myId,
        post_id: post.post_id,
        ...updatedJobData,
      })
        .then(() => {
          showToast("Job post updated successfully", 'success');

          EventRegister.emit('onJobUpdated', {
            updatedPost: {
              ...updatedJobData,
              post_id: post.post_id,           // ✅ Ensure post_id is present
              fileKey: post.fileKey || "",     // ✅ Optional but recommended
            },
          });


          dispatch(updateJobPost(updatedJobData));

          setTimeout(() => {
            navigation.goBack();
          }, 100);
        })
        .catch(() => {
          showToast("You don't have an internet connection", 'error');
        });
    } catch (error) {
      console.error('Edit error', error);
      showToast('Something went wrong', 'error');
    }
  };




  const hasUnsavedChanges = Boolean(hasChanges);
  const [pendingAction, setPendingAction] = React.useState(null);


  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges) return;

      e.preventDefault();

      setPendingAction(e.data.action);
      setShowModal(true);
    });

    return unsubscribe;
  }, [hasUnsavedChanges, navigation]);

  const handleLeave = () => {
    setHasChanges(false);
    setShowModal(false);

    if (pendingAction) {
      navigation.dispatch(pendingAction);
      setPendingAction(null);
    }
  };

  const handleStay = () => {
    setShowModal(false);
  };



  return (
    <SafeAreaView style={styles.container5}>
      <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.backButton} activeOpacity={0.8} onPress={() => navigation.goBack()}>
        <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

      </TouchableOpacity>
      </View>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 5, paddingBottom: '30%' }}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}  // Adjust for better visibility when keyboard opens
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity activeOpacity={1}>

          <Text style={[styles.title,{paddingTop:10}]}>Job title <Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={[styles.input]}
            editable={false}
            onChangeText={text => handleChange('job_title', text)}

            placeholderTextColor="gray"
            defaultValue={jobEditFormData.job_title}
          />

          <Text style={[styles.title]}>Industry type <Text style={{ color: 'red' }}>*</Text></Text>
          <CustomDropDownMenu
            items={industryType}
            onSelect={(item) => handleChange('industry_type', item.label)}
            buttonStyle={styles.dropdownButton}
            buttonTextStyle={styles.dropdownButtonText}
            placeholder={jobEditFormData.industry_type || ""} // Show the current value or placeholder
          />


          <Text style={[styles.title]}> Required qualification <Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={[styles.input]}

            multiline
            placeholderTextColor="gray"
            onChangeText={text => handleChange('required_qualifications', text)}
            value={jobEditFormData.required_qualifications}
          />


          <Text style={[styles.title]}> Required expertise <Text style={{ color: 'red' }}>*</Text></Text>
          <CustomDropDownMenu
            key={expertiseKey}
            items={expertiseOptions.map(item => ({ label: item, value: item }))}
            onSelect={handleSkillSelect}
            buttonStyle={styles.dropdownButton}
            buttonTextStyle={styles.dropdownButtonText}
            placeholder="Select skills"
            multiSelect
          />
          {renderSelectedItems(selectedSkills, removeSkill)}



          <Text style={[styles.title]}> Required experience <Text style={{ color: 'red' }}>*</Text></Text>
          <CustomDropDownMenu
            items={ExperienceType}
            onSelect={(item) => handleChange('experience_required', item.label)}
            buttonStyle={styles.dropdownButton}
            buttonTextStyle={styles.dropdownButtonText}

            placeholder={jobEditFormData.experience_required || ""} // Show the current value or placeholder
          />

          <Text style={[styles.title]}> Required speicializations <Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={[styles.input]}

            placeholderTextColor="gray"
            multiline
            onChangeText={text => handleChange('speicializations_required', text)}
            value={jobEditFormData.speicializations_required}
          />


          <Text style={[styles.title]}> Job description <Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={[styles.input]}
            multiline
            placeholderTextColor="gray"
            onChangeText={text => handleChange('job_description', text)}
            value={jobEditFormData.job_description}
          />



          <Text style={[styles.title]}> Work location <Text style={{ color: 'red' }}>*</Text></Text>
          <CustomDropDownMenu
            items={topTierCities.map(city => ({ label: city, value: city }))}
            onSelect={handleCitySelect}
            buttonStyle={styles.dropdownButton}
            buttonTextStyle={styles.dropdownButtonText}
            placeholder="Select cities"
            multiSelect
          />
          {renderSelectedItems(selectedCities, removeCity)}



          <Text style={[styles.title]}> Salary package <Text style={{ color: 'red' }}>*</Text></Text>
          <CustomDropDownMenu
            items={SalaryType}
            onSelect={(item) => handleChange('Package', item.label)}
            buttonStyle={styles.dropdownButton}
            buttonTextStyle={styles.dropdownButtonText}
            placeholder={jobEditFormData.Package || ""}
          />

          <View style={styles.inputstyle}>
            <Text style={styles.title}> Required languages </Text>

            <TextInput
              style={[styles.input]}  // Use minHeight instead of height
              placeholderTextColor="gray"
              multiline
              onChangeText={text => handleChange('preferred_languages', text)}
              value={jobEditFormData.preferred_languages}
            />
          </View>



          <View style={{ flexDirection: "row", justifyContent: 'space-evenly', top: 20 }}>


            <TouchableOpacity
              style={AppStyles.Postbtn}
              onPress={JobEditHandle}
            >
              <Text style={AppStyles.PostbtnText}>Update</Text>
            </TouchableOpacity>
            {/* 
          <TouchableOpacity onPress={confirmDelete} style={styles.delteButton}>
            <Text style={styles.delete}>Delete</Text>
          </TouchableOpacity> */}

          </View>


          <Message3
            visible={showModal}
            onClose={() => setShowModal(false)}  // Optional if you want to close it from outside
            onCancel={handleStay}  // Stay button action
            onOk={handleLeave}  // Leave button action
            title="Are you sure?"
            message="Your updates will be lost if you leave this page. This action cannot be undone."
            iconType="warning"  // You can change this to any appropriate icon type
          />
        </TouchableOpacity>
      </KeyboardAwareScrollView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container4: {
    flexGrow: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 5,

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
    padding: 10
  },

  container5: {
    backgroundColor: 'white',

  },

  container: {
    flexGrow: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    paddingBottom: "20%"
  },
  delteButton: {
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
  title: {
    color: colors.text_primary,
    fontSize: 15,
    fontWeight: '500',
    marginVertical: 5,
    paddingHorizontal: 5,
  },


  heading: {
    fontSize: 20,
    fontWeight: '500',
    color: '#075cab',
    textAlign: 'center',
    marginBottom: 20,
  },

  input: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text_secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  button: {
    alignSelf: 'center', // Centers the button
    width: 90, // Adjusts the button width to be smaller
    paddingVertical: 5,

    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#075cab',
    borderWidth: 1,
    marginVertical: 10,
  },

  label: {
    color: '#075cab',
    fontWeight: '500',
    fontSize: 16,
  },

  dropdownButton: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom:10
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text_secondary,
    flex: 1,
    paddingVertical: 5,
  },


  delete: {
    color: '#FF0000',
    fontWeight: '600',
    fontSize: 16,
  }
});

export default CompanyJobEditScreen;