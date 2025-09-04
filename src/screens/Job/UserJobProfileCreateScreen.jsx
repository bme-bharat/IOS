import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, SafeAreaView, Keyboard, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';
import CustomDropDownMenu from '../../components/DropDownMenu';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DomainStrengthType, ExperienceType, industrySkills, industryType, SalaryType, topTierCities } from '../../assets/Constants';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Message1 from '../../components/Message1';
import Message3 from '../../components/Message3';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';
import apiClient from '../ApiClient';
import AppStyles from '../AppUtils/AppStyles';


const UserJobProfileCreateScreen = () => {
  const navigation = useNavigation();
  const { myId, myData } = useNetwork();
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resumeKey, setResumeKey] = useState(null);

  const initialPostData = {
    expert_in: "",
    domain_strength: "",
    work_experience: "",
    preferred_cities: "",
    expected_salary: "",
    languages: "",
    resume_key: "",
    education_qualifications: "",
    industry_type: "",
  };

  const [postData, setPostData] = useState(initialPostData);
  const initialDataRef = useRef(initialPostData);
  const [expertiseOptions, setExpertiseOptions] = useState([]);
  const [expertiseKey, setExpertiseKey] = useState(Date.now());
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const handleIndustrySelect = (selectedItem) => {
    const { label } = selectedItem;

    // Reset required_expertise and selectedSkills
    handleInputChange('industry_type', label);
    handleInputChange('expert_in', '');
    setSelectedSkills([]); // Clear previously selected skills

    // Update skill options for the new industry
    setExpertiseOptions(industrySkills[label] || []);
    setExpertiseKey(Date.now()); // Re-render dropdown if needed
  };


  const handleSkillSelect = (selected) => {
    if (!selectedSkills.find(s => s === selected.label)) {
      if (selectedSkills.length >= 3) {
        showToast('You can select up to 3 skills', 'info');
        return;
      }
      const updated = [...selectedSkills, selected.label];
      setSelectedSkills(updated);
      handleInputChange('expert_in', updated.join(', '));
    }
  };

  const removeSkill = (skill) => {
    const updated = selectedSkills.filter(s => s !== skill);
    setSelectedSkills(updated);
    handleInputChange('expert_in', updated.length > 0 ? updated.join(', ') : '');
  };



  const handleCitySelect = (selected) => {
    if (!selectedCities.find(c => c === selected.label)) {
      if (selectedCities.length >= 5) {
        showToast('You can select up to 5 cities', 'info');
        return;
      }
      const updated = [...selectedCities, selected.label];
      setSelectedCities(updated);
      handleInputChange('preferred_cities', updated.join(', '));
    }
  };

  const removeCity = (city) => {
    const updated = selectedCities.filter(c => c !== city);
    setSelectedCities(updated);
    handleInputChange('preferred_cities', updated.length > 0 ? updated.join(', ') : '');
  };


  const renderSelectedItems = (items, onRemove) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {items.map(item => (
        <View key={item} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eee', padding: 6, paddingHorizontal: 10, borderRadius: 18 }}>
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
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10, }}>✕</Text>
          </TouchableOpacity>

        </View>
      ))}
    </View>
  );

  const isPostDataChanged = (current, initial) => {
    return Object.keys(initial).some(key => (current[key]?.trim() || '') !== (initial[key]?.trim() || ''));
  };

  useEffect(() => {
    setHasChanges(isPostDataChanged(postData, initialDataRef.current));
  }, [postData]);


  const [hasChanges, setHasChanges] = useState(false);
  const [showModal1, setShowModal1] = useState(false);

  useEffect(() => {

    const industryTypeChanged = postData?.industry_type?.trim() !== '';
    const titleChanged = postData.expert_in.trim() !== '';
    const bodyChangedDomain = postData.domain_strength.trim() !== '';
    const bodyChangedPreffed = postData.preferred_cities.trim() !== '';
    const bodyChangedsalary = postData.expected_salary.trim() !== '';
    const bodyChangedlanguage = postData.languages.trim() !== '';
    const bodyChangededucation_qualifications = postData.education_qualifications.trim() !== '';
    const bodyChangedresume = postData.resume_key.trim() !== '';
    setHasChanges(industryTypeChanged || titleChanged || bodyChangedDomain || bodyChangedPreffed || bodyChangedlanguage || bodyChangedsalary || bodyChangedresume || bodyChangededucation_qualifications);
  }, [postData]);


  const hasUnsavedChanges = Boolean(hasChanges);
  const [pendingAction, setPendingAction] = React.useState(null);


  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges) return;

      e.preventDefault();

      setPendingAction(e.data.action);
      setShowModal1(true);
    });

    return unsubscribe;
  }, [hasUnsavedChanges, navigation]);

  const handleLeave = () => {
    setHasChanges(false);
    setShowModal1(false);

    if (pendingAction) {
      navigation.dispatch(pendingAction);
      setPendingAction(null);
    }
  };

  const handleStay = () => {
    setShowModal1(false);
  };



  const handleInputChange = (key, value) => {
    let trimmedValue = value.replace(/^\s+/, "");
    if (value.startsWith(" ")) {
      showToast("Leading spaces are not allowed.", "error");
      return;
    }
    setPostData(prevState => ({
      ...prevState,
      [key]: trimmedValue,
    }));
  };




  const handleFileChange = async () => {
    try {
      // Open the document picker
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });

      // Get file size
      const fileSize = res[0].size;
      const MAX_SIZE = 5 * 1024 * 1024;

      if (res[0].type === 'application/pdf') {
        if (fileSize <= MAX_SIZE) {
          setFile(res[0]);
          setFileType(res[0].type);
        } else {
          showToast("File size must be less than 5MB.", 'error');
          setFile(null);
          setFileType(null);
        }
      } else {
        showToast('Please upload a PDF file.', 'error');
        setFile(null);
        setFileType(null);
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the document picker, no toast needed
      } else {
        showToast('An unexpected error occurred while picking the file.', 'error');
      }
    }
  };



  const handleUploadFile = async () => {
    setLoading(true);

    if (!file) {
      showToast('No file selected.', 'error');
      setLoading(false);
      return null;
    }

    try {
      // Get the actual file size
      const fileStat = await RNFS.stat(file.uri);
      const fileSize = fileStat.size;

      // Request upload URL from the backend
      const res = await apiClient.post('/uploadFileToS3', {
        command: 'uploadFileToS3',
        headers: {
          'Content-Type': fileType,
          'Content-Length': fileSize,
        },
      });

      if (res.data.status === 'success') {
        const uploadUrl = res.data.url;
        const fileKey = res.data.fileKey;

        // Convert the file to a Blob for upload
        const fileBlob = await uriToBlob(file.uri);

        // Upload the file to S3 using the PUT method (sending the Blob as body)
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': fileType,
          },
          body: fileBlob,
        });

        if (uploadRes.status === 200) {
          // No success toast here as requested
          setResumeKey(fileKey);
          return fileKey; // Return the file key for saving in post data
        } else {
          throw new Error('Failed to upload file to S3');
        }
      } else {
        throw new Error(res.data.errorMessage || 'Failed to get upload URL');
      }
    } catch (error) {
      if (!error.response) {
        // Network or internet error (no response)
        showToast("You don't have an internet connection", 'error');
      } else {
        showToast('Something went wrong', 'error');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };



  async function uriToBlob(uri) {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  }

  const deleteFileFromS3 = async (key) => {
    try {
      const response = await apiClient.post('/deleteFileFromS3', {
        command: 'deleteFileFromS3',
        key,
      });

      if (response.status === 200) {
        // console.log(`Deleted file: ${key}`);
        return true;
      }
      // console.error('Error deleting file:', response.data);
    } catch (error) {
      showToast("You don't have an internet connection", 'error');
      // console.error('Delete Error:', error);
    }
    return false;
  };


  const handleRemoveFile = async () => {
    if (resumeKey) {
      // Call the function to delete the file from S3
      const deleted = await deleteFileFromS3(resumeKey);

      if (deleted) {
        // If the file is successfully deleted, reset the state
        setFile(null);
        setResumeKey(null);
        setFileType(null);
        // No success toast here as requested
      } else {
        showToast("You don't have an internet connection", 'error');
      }
    } else {
      // If no resumeKey exists, just reset the file state
      setFile(null);
      setResumeKey(null);
      setFileType(null);
    }
  };


  const handlePostSubmission = async () => {
    console.log('🟡 Starting handlePostSubmission');
    setHasChanges(false);

    const trimmedPostData = {
      domain_strength: postData.domain_strength?.trim(),
      work_experience: postData.work_experience?.trim(),
      expert_in: postData.expert_in?.trim(),
      expected_salary: postData.expected_salary?.trim(),
      education_qualifications: postData.education_qualifications?.trim(),
      preferred_cities: postData.preferred_cities?.trim(),
      languages: postData.languages?.trim(),
      industry_type: postData.industry_type?.trim(),
    };

    console.log('📋 Trimmed Post Data:', trimmedPostData);

    // Mandatory field validation
    if (
      !trimmedPostData.domain_strength ||
      !trimmedPostData.work_experience ||
      !trimmedPostData.expert_in ||
      !trimmedPostData.expected_salary ||
      !trimmedPostData.education_qualifications
    ) {
      console.warn('⚠️ Mandatory fields missing!');
      showToast('Please fill all mandatory fileds, including CV', 'error');
      return;
    }

    console.log('📁 Attempting to upload file...');
    const uploadedFileKey = await handleUploadFile();
    console.log('✅ File uploaded key:', uploadedFileKey);

    if (!uploadedFileKey) {
      console.error('❌ File upload failed or invalid file');
      showToast('Please upload a valid PDF file', 'error');
      return;
    }

    try {
      const postPayload = {
        command: "createJobProfile",
        user_id: myId,
        domain_strength: trimmedPostData.domain_strength,
        work_experience: trimmedPostData.work_experience,
        preferred_cities: trimmedPostData.preferred_cities,
        expected_salary: trimmedPostData.expected_salary,
        industry_type: trimmedPostData.industry_type,
        languages: trimmedPostData.languages,
        education_qualifications: trimmedPostData.education_qualifications,
        expert_in: trimmedPostData.expert_in,
        resume_key: uploadedFileKey,
      };

      console.log('📦 Payload for submission:', postPayload);

      const res = await apiClient.post('/createJobProfile', postPayload);
      console.log('📨 API response:', res?.data);

      if (res?.data?.status === 'success') {
        showToast('Job profile created successfully', 'success');
        console.log('✅ Job profile created. Navigating back...');
        navigation.goBack();
      } else {
        console.warn('⚠️ Job profile may already exist');
        showToast('Your job profile already exists!', 'error');
      }
    } catch (error) {
      const isNetworkError =
        error?.message?.includes('Network') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('Failed to fetch') ||
        error?.isAxiosError;

      console.error('❌ Caught error during API call:', error);

      if (isNetworkError) {
        showToast("You don't have an internet connection", 'error');
      } else {
        showToast('Something went wrong.', 'error');
      }
    }

    setHasChanges(false);
    console.log('✅ handlePostSubmission complete');
  };




  const DomainStrength = (selectedItem) => {
    handleInputChange('domain_strength', selectedItem.label);
    // console.log('selectedItem', selectedItem.label);
  };

  const industry = (selectedItem) => {
    handleInputChange('industry_type', selectedItem.label);
    // console.log('selectedItem', selectedItem.label);
  };

  const Experience = (selectedItem) => {
    handleInputChange('work_experience', selectedItem.label);
    // console.log('selectedItem', selectedItem.label);
  };

  const Salary = (selectedItem) => {
    handleInputChange('expected_salary', selectedItem.label);
    // console.log('selectedItem', selectedItem.label);
  };


  return (

    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color="#075cab" />
      </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: '40%', paddingHorizontal: 10, backgroundColor: 'whitesmoke' }}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={20}

        >
          <Text style={styles.header}>Create job profile</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Industry type <Text style={{ color: 'red' }}>*</Text>
            </Text>
            <CustomDropDownMenu
              items={industryType}
              onSelect={handleIndustrySelect}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
              placeholderTextColor="gray"
              placeholder=""
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Expert In <Text style={{ color: 'red' }}>*</Text>
            </Text>
            <CustomDropDownMenu
              key={expertiseKey}
              items={expertiseOptions.map(item => ({ label: item, value: item }))}
              onSelect={handleSkillSelect}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
              placeholder="Select skills"
              multiSelect
            />
            {selectedSkills.length === 0 && (
              <Text style={styles.instructionText}>You can select up to 3 skills</Text>
            )}

            {renderSelectedItems(selectedSkills, removeSkill)}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label} >Domain Strength <Text style={{ color: 'red' }}>*</Text></Text>
            <CustomDropDownMenu
              items={DomainStrengthType}
              onSelect={DomainStrength}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}

              placeholderTextColor="gray"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label} >Experience <Text style={{ color: 'red' }}>*</Text></Text>
            <CustomDropDownMenu
              items={ExperienceType}
              onSelect={Experience}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}

              placeholderTextColor="gray"

            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label} >Expected Salary <Text style={{ color: 'red' }}>*</Text></Text>
            <CustomDropDownMenu
              items={SalaryType}
              onSelect={Salary}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}

              placeholderTextColor="gray"

            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Educational Qualification <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={[styles.input, { height: 90 }]}
              multiline
              onChangeText={(value) => handleInputChange('education_qualifications', value)}
              value={postData.education_qualifications} // Ensure controlled input
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Preferred Cities <Text style={{ color: 'red' }}>*</Text>
            </Text>
            <CustomDropDownMenu
              items={topTierCities.map(city => ({ label: city, value: city }))}
              onSelect={handleCitySelect}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
              placeholderTextColor="gray"
              placeholder="Select cities"
              multiSelect
            />
            {selectedCities.length === 0 && (
              <Text style={styles.instructionText}>You can select up to 5 cities</Text>
            )}

            {renderSelectedItems(selectedCities, removeCity)}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Languages Known </Text>
            <TextInput
              style={[styles.input, { height: 90 }]}
              multiline
              onChangeText={(value) => handleInputChange('languages', value)}
              value={postData.languages} // Ensure controlled input
            />
          </View>


          <View style={styles.uploadContainer}>
            {/* Upload Button */}
            <TouchableOpacity
              style={[styles.uploadButton, resumeKey ? { backgroundColor: '#ccc' } : {}]}  // Disable if resumeKey is present
              onPress={handleFileChange}
              disabled={!!resumeKey}  // Disable if resumeKey exists
            >
              <View style={styles.fileInfoContainer}>
                <Text style={styles.uploadButtonText}>
                  {resumeKey ? (
                    `Resume Key: ${resumeKey}` // Show resume key if available
                  ) : file ? (
                    file.name // Show file name
                  ) : (
                    <Text style={{ fontWeight: 'bold' }}>Upload Your Resume  <Text style={{ color: 'red' }}>*</Text></Text> // Bold text
                  )}
                </Text>

                {/* Show close button only if a file is uploaded and no resumeKey */}
                {file && !resumeKey && (
                  <TouchableOpacity style={styles.closeButton} onPress={handleRemoveFile}>
                    <Ionicons name="close" size={15} color="gray" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>

            {/* Loading indicator */}
            {loading && <Text style={{ textAlign: "center", color: 'black' }}>Uploading...</Text>}
          </View>

          <TouchableOpacity style={AppStyles.Postbtn} onPress={handlePostSubmission}>
            <Text style={AppStyles.PostbtnText}>Submit</Text>
          </TouchableOpacity>


          <Message3
            visible={showModal1}
            onClose={() => setShowModal1(false)}  // Optional if you want to close it from outside
            onCancel={handleStay}  // Stay button action
            onOk={handleLeave}  // Leave button action
            title="Are you sure ?"
            message="Your updates will be lost if you leave this page. This action cannot be undone."
            iconType="warning"  // You can change this to any appropriate icon type
          />
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </SafeAreaView>


  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'whitesmoke'
  },

  backButton: {
    padding: 10,
    alignSelf: 'flex-start',

  },
  instructionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
    paddingHorizontal:10
  },

  heading: {
    fontSize: 22,
    fontWeight: '500',
    color: "#075cab",
    marginBottom: 20,
    textAlign: "center"
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 25,
    textAlign: 'center',
    color: '#075cab',
    top: 10,
  },
  input: {
    height: 40,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
    color: '#222',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ddd'

  },
  uploadButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  uploadContainer: {
    marginVertical: 20,
    alignSelf: 'center'
  },

  fileInfoContainer: {
    flexDirection: 'row',  // Align file name and close button horizontally
    alignItems: 'center',  // Vertically center the text and icon
    justifyContent: "center",
    alignSelf: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },

  uploadButtonText: {
    flexShrink: 1,  // Allow the text to shrink if necessary, to prevent overflow
    // marginRight: 5,  
    // maxWidth: '90%',
    overflow: 'hidden',  // Prevent the text from overflowing the container
    textOverflow: 'ellipsis',  // Add ellipsis if the text is too long
    alignSelf: 'center',
  },

  closeButton: {
    position: 'absolute',
    top: -10,
    right: -25,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,

  },


  submitButton: {
    alignSelf: 'center', // Centers the button
    width: 120, // Adjusts the button width to be smaller
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#075cab',
    borderWidth: 1,
    // marginVertical: 20,
  },
  submitButtonText: {
    color: '#075cab',
    fontWeight: '500',
    fontSize: 16,
  },
  updateButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  updateButtonText: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownButton: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownItem: {
    padding: 10,
    backgroundColor: '#fff',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#000',
    marginLeft: 10,
    padding: 2
  },
  label: {
    marginBottom: 10,
    fontSize: 15,
    fontWeight: "500",
    color: 'black',
    paddingHorizontal: 10
  },
  inputContainer: {
    marginBottom: 15,
  },
});

export default UserJobProfileCreateScreen