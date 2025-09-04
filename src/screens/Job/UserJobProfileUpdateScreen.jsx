

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,

} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DomainStrengthType, ExperienceType, industrySkills, industryType, SalaryType, topTierCities } from '../../assets/Constants';
import Message3 from '../../components/Message3';
import CustomDropDownMenu from '../../components/DropDownMenu';
import { types } from 'react-native-document-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { showToast } from '../AppUtils/CustomToast';
import apiClient from '../ApiClient';
import { useNetwork } from '../AppUtils/IdProvider';


const UserJobProfileUpdateScreen = () => {
  const navigation = useNavigation();
  const { myId, myData } = useNetwork();
  const route = useRoute();
  const { profile } = route.params || {};
  const [pdfUri, setPdfUri] = useState(null);
  const [pdfFileType, setPdfFileType] = useState('');
  const [brochureKey, setBrochureKey] = useState(null);
  const [loading, setLoading] = useState(false);

  const [postData, setPostData] = useState({
    industry_type: profile?.industry_type || '',
    domain_strength: profile?.domain_strength || '',
    work_experience: profile?.work_experience || '',
    preferred_cities: profile?.preferred_cities || '',
    expected_salary: profile?.expected_salary || '',
    languages: profile?.languages || '',
    resume_key: profile?.resume_key || '',
    expert_in: profile?.expert_in || '',
    education_qualifications: profile?.education_qualifications || '',
  });

  const citiesRef = useRef(null);
  const eduRef = useRef(null);
  const expertRef = useRef(null);
  const langRef = useRef(null);


  const focusCitiesInput = () => {
    if (citiesRef.current) {
      citiesRef.current.focus();
    }
  };
  const focusEduInput = () => {
    if (eduRef.current) {
      eduRef.current.focus();
    }
  };
  const focusExpertInput = () => {
    if (expertRef.current) {
      expertRef.current.focus();
    }
  };
  const focusLanguagesInput = () => {
    if (langRef.current) {
      langRef.current.focus();
    }
  };

  useEffect(() => {
    if (profile) {
      setPostData(prevData => ({
        ...prevData,
        ...profile,
      }));
    }
  }, [profile]);


  const handleInputChange = (key, value) => {
    const trimmedValue = value.replace(/^\s+/, '');

    if (value.startsWith(' ')) {
      showToast('Leading spaces are not allowed', 'error');
      return;
    }

    if (key === 'industry_type') {
      // Clear selected skills and expert_in
      const clearedSkills = [];

      setSelectedSkills(clearedSkills);
      setExpertiseOptions(industrySkills[value] || []);
      setExpertiseKey(Date.now()); // force re-render of skill dropdown

      setPostData(prevState => ({
        ...prevState,
        [key]: trimmedValue,
        expert_in: '', // clear this explicitly
      }));

      setHasChanges(true);
      return;
    }



    setPostData(prevState => ({
      ...prevState,
      [key]: trimmedValue,
    }));

    setHasChanges(true);
  };








  const [showModal1, setShowModal1] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [expertiseKey, setExpertiseKey] = useState(Date.now());
  const [expertiseOptions, setExpertiseOptions] = useState([]);

  const initialPostData = useMemo(() => ({
    industry_type: profile?.industry_type || '',
    domain_strength: profile?.domain_strength || '',
    work_experience: profile?.work_experience || '',
    preferred_cities: profile?.preferred_cities || '',
    expected_salary: profile?.expected_salary || '',
    languages: profile?.languages || '',
    resume_key: profile?.resume_key || '',
    expert_in: profile?.expert_in || '',
    education_qualifications: profile?.education_qualifications || '',
  }), [profile]);

  useEffect(() => {
    const hasAnyChanges = Object.keys(initialPostData).some(
      (key) => postData[key] !== initialPostData[key]
    );
    setHasChanges(hasAnyChanges);
  }, [postData, initialPostData]);

  useEffect(() => {
    if (profile) {
      setSelectedSkills(profile.expert_in ? profile.expert_in.split(',').map(s => s.trim()) : []);
      setSelectedCities(profile.preferred_cities ? profile.preferred_cities.split(',').map(c => c.trim()) : []);
      setExpertiseOptions(industrySkills[profile.industry_type] || []);
    }
  }, [profile]);


  const handleSkillSelect = (selected) => {
    if (!selectedSkills.includes(selected.label)) {
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
    setPostData(prev => ({
      ...prev,
      expert_in: updated.join(', '),
    }));
    setHasChanges(true);
  };


  const handleCitySelect = (selected) => {
    if (!selectedCities.includes(selected.label)) {
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
    setPostData(prev => ({
      ...prev,
      preferred_cities: updated.join(', '),
    }));
    setHasChanges(true);
  };

  const renderSelectedItems = (items, onRemove) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {items.map((item, index) => (
        <View
          key={`${item}-${index}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#eee',
            padding: 6,
            paddingHorizontal: 10,
            borderRadius: 18
          }}
        >
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
            <Text style={{ color: '#fff', fontSize: 10 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );


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


  const uploadFile = async (base64, type) => {
    try {
      const response = await apiClient.post('/uploadFile', {
        command: 'uploadFile',
        headers: { 'Content-Type': type },
        fileBuffer: base64,
      });

      if (response.data.statusCode === 200) {
        const responseBody = JSON.parse(response.data.body);
        setBrochureKey(responseBody.fileKey);
        return responseBody.fileKey;
      } else {

      }
    } catch (error) {
      showToast("Something went wrong", "info")

      throw error;
    }
  };
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const handleFileUpload = async () => {
    try {

      const result = await DocumentPicker.pick({
        type: [types.pdf],
      });

      if (result && result.length > 0) {
        const { uri, type } = result[0];
        const fileStats = await RNFS.stat(uri);
        const fileSize = fileStats.size;

        if (fileSize > MAX_FILE_SIZE) {

          showToast("File size must be less than 5MB", "error")
          return;
        }

        const base64 = await RNFS.readFile(uri, 'base64');
        const uploadedKey = await uploadFile(base64, type);

        if (postData.resume_key && postData.resume_key !== uploadedKey) {
          const deleted = await handleDeleteOldImage(postData.resume_key);
          if (!deleted) {

            showToast("Failed to delete the old resume. Please try again", "error")
            return;
          }
        }

        setPdfUri(uri);
        setBrochureKey(uploadedKey);

        setPostData(prevData => ({
          ...prevData,
          resume_key: uploadedKey,
        }));

      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // console.log('User cancelled document picker');
      } else {
        showToast("Failed to delete the old resume. Please try again", "error")
      }
    }
  };


  const handleDeleteOldImage = async (resume_key) => {
    try {
      const apiEndpoint = "https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/deleteFileFromS3";
      const deleteResponse = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
        },
        body: JSON.stringify({
          command: "deleteFileFromS3",
          key: resume_key,
        }),
      });

      const deleteResult = await deleteResponse.json();
      if (deleteResponse.ok && deleteResult.statusCode === 200) {

        return true;
      } else {

      }
    } catch (error) {

      return false;
    }
  };


  const handlePostSubmission = async () => {
    setLoading(true);
    setHasChanges(false);

    const mandatoryFields = [
      'domain_strength',
      'work_experience',
      'preferred_cities',
      'industry_type',
      'expert_in',
      'resume_key',
      'education_qualifications',
    ];

    for (const field of mandatoryFields) {
      const value = postData[field]?.trim?.();
      if (!value) {
        showToast(`${field.replace(/_/g, ' ')} is mandatory.`, 'info');
        setLoading(false);
        return;
      }
    }

    try {
      let documentFileKey = postData.resume_key;

      if (brochureKey && brochureKey !== postData.resume_key) {
        const deleted = await handleDeleteOldImage(postData.resume_key);
        if (!deleted) {
          Alert.alert('Error', 'Failed to delete the old resume. Please try again.');
          setLoading(false);
          return;
        }

        documentFileKey = await handleFileUpload(pdfUri, pdfFileType);
        if (!documentFileKey) {
          showToast('Failed to upload resume. Please try again.', 'error');
          setLoading(false);
          return;
        }
      }

      const postPayload = {
        command: 'updateJobProfile',
        user_id: myId,
        ...postData,
        resume_key: documentFileKey,
      };

      const res = await apiClient.post('/updateJobProfile', postPayload);

      if (res?.data?.status === 'success') {
        showToast('your job profile has been successfully updated', 'success');
        navigation.goBack();
      } else {
        const errMsg = res?.data?.message || 'Something went wrong. Please try again later.';
        showToast(errMsg, 'error');
      }
    } catch (error) {
      const isNetworkError =
        error?.message?.includes('Network') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('Failed to fetch') ||
        error?.isAxiosError;

      if (isNetworkError) {
        showToast('Network error. Please check your internet connection.', 'error');
      } else {
        console.error('Unhandled error:', error);
        showToast('Something went wrong. Please try again later.', 'error');
      }
    } finally {
      setLoading(false);
      setHasChanges(false);
    }
  };



  return (

    <SafeAreaView style={styles.container1}>
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          extraScrollHeight={20}
          style={styles.container}
        >
                    <Text style={styles.header}>Update job profile</Text>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.title]}>Industry Type <Text style={{ color: 'red' }}>*</Text></Text>
            <CustomDropDownMenu
              items={industryType}
              onSelect={(item) => handleInputChange('industry_type', item.label)}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
              placeholder={postData.industry_type || " "}
              placeholderTextColor="gray"

            />
          </View>


          <View style={styles.inputContainer}>
            <Text style={[styles.title]}>Expert In <Text style={{ color: 'red' }}>*</Text></Text>
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
          </View>

          <View style={styles.inputContainer}>
          <Text style={styles.title}>Domain Strength <Text style={{ color: 'red' }}>*</Text></Text>
        
            <CustomDropDownMenu
              items={DomainStrengthType}
              onSelect={(item) => handleInputChange('domain_strength', item.label)}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
              placeholderTextColor="gray"
              placeholder={postData.domain_strength || " "}

            />
          </View>

          <View style={styles.inputContainer}>

          <Text style={styles.title}>Execpted Salary <Text style={{ color: 'red' }}>*</Text></Text>
            <CustomDropDownMenu
              items={SalaryType}
              onSelect={(item) => handleInputChange('expected_salary', item.label)}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
              placeholderTextColor="gray"
              placeholder={postData.expected_salary || " "}
            />
          </View>
          <View style={styles.inputContainer}>
          <Text style={styles.title}>Work Experience <Text style={{ color: 'red' }}>*</Text></Text>
   
            <CustomDropDownMenu
              items={ExperienceType}
              onSelect={(item) => handleInputChange('work_experience', item.label)}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
              placeholder={postData.work_experience || " "}
              placeholderTextColor="gray"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.title]}>Preferred Cities <Text style={{ color: 'red' }}>*</Text></Text>
            <CustomDropDownMenu
              items={topTierCities.map(city => ({ label: city, value: city }))}
              onSelect={handleCitySelect}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
              placeholder="Select cities"
              multiSelect
            />
            {renderSelectedItems(selectedCities, removeCity)}
          </View>



          <Text style={styles.title}>Educational Qualification <Text style={{ color: 'red' }}>*</Text></Text>
          <TouchableOpacity style={styles.inputWrapper} activeOpacity={0.8} onPress={focusEduInput}>

            <TextInput
              style={[styles.input, { minHeight: 50,maxHeight:350 }]}
              value={postData.education_qualifications}
              ref={eduRef}
              multiline
              onChangeText={text => handleInputChange('education_qualifications', text)}
              placeholder={postData.education_qualifications || ""}
              placeholderTextColor="gray"
            />
            <Icon name="edit" size={18} color="#888" style={styles.inputIcon} />

          </TouchableOpacity>


          <Text style={styles.title}>Languages Known</Text>
          <TouchableOpacity style={styles.inputWrapper} activeOpacity={0.8} onPress={focusLanguagesInput}>

            <TextInput
              style={[styles.input, { minHeight: 50,maxHeight:350 }]}
              ref={langRef}
              value={postData.languages}
              multiline
              onChangeText={text => handleInputChange('languages', text)}
              placeholder={postData.languages || ""}
              placeholderTextColor="gray"
            />
            <Icon name="edit" size={18} color="#888" style={styles.inputIcon} />
          </TouchableOpacity>


          <TouchableOpacity style={styles.button} onPress={handleFileUpload}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.buttonText}>
                {postData.resume_key ? postData.resume_key : 'No Resume Selected'}
              </Text>

            </View>
            <Text style={styles.buttonText}> Upload CV</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>


            <TouchableOpacity
              style={[
                styles.buttonUpadte,
                (!hasChanges || loading) && styles.buttonDisabled
              ]}
              disabled={!hasChanges || loading}
              onPress={handlePostSubmission}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#999" />
              ) : (
                <Text
                  style={[
                    styles.buttonUpadteText,
                    (!hasChanges || loading) && styles.buttonTextDisabled
                  ]}
                >
                  Update
                </Text>
              )}
            </TouchableOpacity>

          </View>



          <Message3
            visible={showModal1}
            onClose={() => setShowModal1(false)}  // Optional if you want to close it from outside
            onCancel={handleStay}  // Stay button action
            onOk={handleLeave}  // Leave button action
            title="Are you sure ?"
            message="Your updates will be lost if you leave this page. This action cannot be undone."
            iconType="warning"  // You can change this to any appropriate icon type
          />
          <Toast />
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>

      <Toast />
    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    paddingBottom: '20%',
    flex: 1,
    backgroundColor: 'whitesmoke',
  },
  container1: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 25,
    textAlign: 'center',
    color: '#075cab',
    top: 10,
  },
  title: {
    color: 'black',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 10,
    marginTop:15,
  },
  title1: {
    color: 'black',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 10,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },

  inputIcon: {
    position: 'absolute',
    right: 5,
    top: 5,
    padding: 10
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
  backButton: {
    padding: 10,
    alignSelf: 'flex-start'

  },
  button: {

    padding: 5,
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonText: {
    color: '#075cab',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 13
  },


  buttonUpadte: {
    alignSelf: 'center', // Centers the button
    width: 90, // Adjusts the button width to be smaller
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#075cab',
    borderWidth: 1,
    marginVertical: 20,
  },
  buttonUpadteText: {
    color: '#075cab',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    borderColor: '#ccc',
    // backgroundColor: '#f2f2f2',
  },

  buttonTextDisabled: {
    color: '#999',
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


  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
    padding: 2
  },
});



export default UserJobProfileUpdateScreen;



