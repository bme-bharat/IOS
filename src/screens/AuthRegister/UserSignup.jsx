import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Image,
  Keyboard,
  Modal,
  Alert,
  DatePickerAndroid,
  ActionSheetIOS,
} from 'react-native';
import MerticalIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../assets/Constants';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomDropdown from '../../components/CustomDropDown';
import { stateCityData } from '../../assets/Constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import RNFS from 'react-native-fs';
import DateTimePicker from '@react-native-community/datetimepicker';
import messaging, { getMessaging, getToken } from '@react-native-firebase/messaging';
import Message1 from '../../components/Message1';
import ImagePicker from 'react-native-image-crop-picker';
import ImageResizer from 'react-native-image-resizer';
import { getApp } from '@react-native-firebase/app';
import { showToast } from '../AppUtils/CustomToast';
import apiClient from '../ApiClient';
import AppStyles from '../AppUtils/AppStyles';
import DeviceInfo from 'react-native-device-info';
import { colors, dimensions } from '../../assets/theme';
import ArrowDown from '../../assets/svgIcons/arrow-down.svg';

const UserSignupScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedCategory, selectedProfile, fullPhoneNumber } = route.params;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [collage, setCollage] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);



  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertIconType, setAlertIconType] = useState('success');
  // const [dateOfBirth, setDateOfBirth] = useState(null);
  // const [showDatePicker, setShowDatePicker] = useState(false);
  const [isMediaSelection, setIsMediaSelection] = useState(false);
  // State verification
  const [firstNameVerify, setFirstNameVerify] = useState(false);
  const [lastNameVerify, setLastNameVerify] = useState(false);
  const [emailVerify, setEmailVerify] = useState(false);
  const [collageVerify, setCollageVerify] = useState(false);
  const [genderVerify, setGenderVerify] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  const states = Object.keys(stateCityData);
  const cities = selectedState ? stateCityData[selectedState] : [];

  const handleFirstname = (e) => {
    let firstNameVar = e.nativeEvent.text.trim();

    // Allow only alphabetic characters and spaces
    firstNameVar = firstNameVar.replace(/[^a-zA-Z ]/g, '');

    // Ensure no multiple spaces in between
    firstNameVar = firstNameVar.replace(/\s+/g, ' ');

    setFirstName(firstNameVar);
    setFirstNameVerify(firstNameVar.length > 2);
  };

  const handleLastName = (e) => {
    let lastNameVar = e.nativeEvent.text.trim();

    // Allow only alphabetic characters and spaces
    lastNameVar = lastNameVar.replace(/[^a-zA-Z ]/g, '');

    // Ensure no multiple spaces in between
    lastNameVar = lastNameVar.replace(/\s+/g, ' ');

    setLastName(lastNameVar);
    setLastNameVerify(lastNameVar.length > 0);
  };


  const [emailVerify1, setEmailVerify1] = useState(false); // Email verification status
  const [otpTimer, setOtpTimer] = useState(0);
  const [modalVisibleemail, setModalVisibleemail] = useState(false);
  const [otp1, setOtp1] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false); // Track if OTP is sent

  const intervalRef = useRef(null);

  const startOtpTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setOtpTimer(30);
    setIsOtpSent(true);

    intervalRef.current = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev === 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsOtpSent(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const verifyOtp = async () => {
    if (!otp1 || !email) {

      return;
    }

    try {

      const response = await apiClient.post(
        '/verifyEmailOtp',
        {
          command: 'verifyEmailOtp',
          email: email,
          otp: otp1
        }
      );

      if (response.status === 200 && response.data.status === 'success') {
        setEmailVerify1(true)
        showToast("Email verified", 'success');
        setIsOtpSent(false);

        setModalVisibleemail(false);
      } else {
        showToast(response.data.errorMessage, 'error');

      }
    } catch (error) {

      showToast("Something went wrong\nTry again later", 'error');
    } finally {

    }
  };


  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/resendEmailOtp',
        { command: 'resendEmailOtp', email }
      );

      if (response.status === 200 && response.data.status === 'success') {

        showToast("OTP sent", 'success');

        startOtpTimer();
      } else {

        showToast(response.data.message || 'Failed to resend OTP.', 'error');
      }
    } catch (error) {

      showToast("Please try again later", 'error');
    } finally {
      setLoading(false);
    }
  };


  const sendEmailOtp = async () => {
    if (!emailVerify) {
      showToast("Enter a valid email Id", 'info');
      return;
    }

    try {
      setLoading(true);
      console.log("Sending OTP to email:", email);

      const checkEmailResponse = await apiClient.post(
        '/sendUpdateEmailOtp',
        { command: 'sendUpdateEmailOtp', email }
      );

      console.log("Check email response:", checkEmailResponse.data);

      if (
        checkEmailResponse.data.statusCode === 500 &&
        checkEmailResponse.data.status === 'error'
      ) {
        console.error("Error from server (check email):", checkEmailResponse.data.errorMessage);
        showToast(checkEmailResponse.data.errorMessage, 'error');
        setLoading(false);
        return;
      }

      const response = await apiClient.post(
        '/sendUpdateEmailOtp',
        {
          command: 'sendUpdateEmailOtp',
          email,
          mode: "signup"
        }
      );

      console.log("OTP send response:", response.data);

      if (response.data.statusCode === 200) {
        if (response.data.status === 'success') {
          setOtpTimer(30);
          startOtpTimer();
          setIsOtpSent(true);
          setModalVisibleemail(true);
          showToast("OTP sent", 'success');
        } else {
          console.warn("OTP send failed:", response.data.successMessage);
          showToast(response.data.successMessage || 'Failed to send OTP', 'error');
        }
      } else {

        showToast(response.data.errorMessage, 'error');
      }
    } catch (error) {
      console.error("Exception in sendEmailOtp:", error);
      showToast(error, 'error');
    } finally {
      setLoading(false);
    }
  };



  const handleEmail = (e) => {
    let emailVar = e.nativeEvent.text.trim();

    if (emailVar.includes(' ')) {

      showToast("Enter a valid email Id ", 'error');

    } else {

      setEmail(emailVar);
      setEmailVerify(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailVar));
    }
  };




  const handleCollage = (e) => {
    const collageVar = e.nativeEvent.text;
    setCollage(collageVar);
    setCollageVerify(collageVar.length > 0);
  };

  const handleGender = (selectedGender) => {
    setSelectedGender(selectedGender);
    setGenderVerify(selectedGender.length > 0);
  };


  const [imageUri, setImageUri] = useState(null);
  const [fileUri, setFileUri] = useState(null);
  const [fileType, setFileType] = useState('');

  const handleImageSelection = () => {
    const hasImage = !!imageUri;

    const options = hasImage
      ? ['Remove Image', 'Cancel']
      : ['Take Photo', 'Choose from Gallery', 'Cancel'];

    const cancelButtonIndex = options.indexOf('Cancel');
    const destructiveButtonIndex = hasImage ? 0 : undefined;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        userInterfaceStyle: 'light',
      },
      (buttonIndex) => {
        const selected = options[buttonIndex];

        if (selected === 'Remove Image') {
          handleDeleteImage();
        } else if (selected === 'Choose from Gallery') {
          openGallery();
        } else if (selected === 'Take Photo') {
          openCamera();
        }
      }
    );
  };





  const handleDeleteImage = async () => {
    if (!imageUri) return;

    try {

      const fileKey = '';
      const deleteSuccess = await deleteFileFromS3(fileKey);

      if (deleteSuccess) {

        setImageUri(null);
        setFileUri(null);
        setFileType(null);

      }
    } catch (error) {
      showToast("Error removing image", 'error');

    }
  };
  const deleteFileFromS3 = async (key) => {
    try {
      const response = await apiClient.post(
        '/deleteFileFromS3',
        { command: 'deleteFileFromS3', key },

      );

      if (response.status === 200) {
        return true;
      } else {

      }
    } catch (error) {

    }
    return false;
  };

  const [fcmToken, setFcmToken] = useState('');


  useEffect(() => {
    const getFcmToken = async () => {
      try {
        const app = getApp();
        const messaging = getMessaging(app);
        const token = await getToken(messaging);
        setFcmToken(token);

      } catch (error) {

      }
    };

    getFcmToken();
  }, []);



  const createUserSession = async (userId) => {
    try {
      let tokenToSend = fcmToken;

      if (!tokenToSend) {
        try {
          const app = getApp();
          const messaging = getMessaging(app);
          tokenToSend = await getToken(messaging);

        } catch (fetchError) {

          tokenToSend = "FCM_NOT_AVAILABLE";
        }
      }

      const deviceModel = await DeviceInfo.getModel(); // your existing usage

      const deviceInfo = {
        os: Platform.OS,
        // osVersion: DeviceInfo.getSystemVersion(),
        deviceName: await DeviceInfo.getDeviceName(),
        model: deviceModel,
        // brand: DeviceInfo.getBrand(),
        appVersion: DeviceInfo.getVersion(),
        // buildNumber: DeviceInfo.getBuildNumber(),
        userAgent: await DeviceInfo.getUserAgent(),
        ipAddress: await DeviceInfo.getIpAddress(),
      };

      const payload = {
        command: 'createUserSession',
        user_id: userId,
        fcm_token: tokenToSend,
        deviceInfo: deviceInfo,

      };

      const response = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/createUserSession',
        payload,
        {
          headers: {
            'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
          },
        }
      );

      if (response.data.status === 'success') {
        const sessionId = response.data.data.session_id;
        await AsyncStorage.setItem('userSession', JSON.stringify({ sessionId }));

      } else {
        showToast("Session creation failed\nSomething went wrong", 'error');

      }
    } catch (error) {
      showToast("Session creation failed\nSomething went wrong", 'error');
    }
  };


  const openCamera = () => {
    ImagePicker.openCamera({
      mediaType: 'photo',
      cropping: true,
      width: 800,
      height: 800,
      cropperCircleOverlay: false,
      compressImageQuality: 0.7,
    })
      .then((image) => {
        const initialImageSize = image.size / 1024 / 1024;
        console.log(`Initial image size: ${initialImageSize.toFixed(2)} MB`);

        const uri = image.path;
        setImageUri(uri);
        setFileUri(uri);
        setIsMediaSelection(false);
        setFileType(image.mime);

        if (image.size < 1024 * 10) {
          console.log("Image size is less than 100KB, no compression needed.");
          return;
        }

        ImageResizer.createResizedImage(uri, 800, 600, 'JPEG', 80)
          .then((resizedImage) => {
            const resizedImageSize = resizedImage.size / 1024 / 1024;
            console.log(`Resized image size: ${resizedImageSize.toFixed(2)} MB`);

            if (resizedImageSize > 5) {
              showToast("Image size shouldn't exceed 5MB", 'error');
              return;
            }

            setImageUri(resizedImage.uri);
            setFileUri(resizedImage.uri);
          })
          .catch((err) => {
            console.error('Image Resizing Error: ', err);
          });
      })
      .catch((error) => {
        if (error.code !== 'E_PICKER_CANCELLED') {
          console.error('Camera error: ', error);
        }
      });
  };


  const openGallery = () => {
    ImagePicker.openPicker({
      mediaType: 'photo',
      cropping: true,
      width: 800,
      height: 800,
      cropperCircleOverlay: false,
      compressImageQuality: 0.7,

    })
      .then((image) => {
        // Log the image size before resizing
        const initialImageSize = image.size / 1024 / 1024; // Size in MB
        console.log(`Initial image size: ${initialImageSize.toFixed(2)} MB`);

        const uri = image.path;
        setImageUri(uri);
        setFileUri(uri);
        setIsMediaSelection(false); // Exit media selection mode
        setFileType(image.mime);

        // Check if the original image size is less than 100KB
        if (image.size < 1024 * 10) { // 100KB in bytes
          console.log("Image size is less than 100KB, no compression needed.");
          return; // Exit the function, no compression needed
        }

        // Optionally, you can resize the image further if needed
        ImageResizer.createResizedImage(uri, 800, 600, 'JPEG', 80)
          .then((resizedImage) => {
            // Log the resized image size
            const resizedImageSize = resizedImage.size / 1024 / 1024; // Size in MB
            console.log(`Resized image size: ${resizedImageSize.toFixed(2)} MB`);

            // If the resized image size is more than 5MB, show a toast message
            if (resizedImageSize > 5) {

              showToast("Image size shouldn't exceed 5MB", 'error');

              return; // Exit function to prevent further processing
            }

            setImageUri(resizedImage.uri);
            setFileUri(resizedImage.uri);
          })
          .catch((err) => {
            console.error('Image Resizing Error: ', err);
          });
      })
      .catch((error) => {
        if (error.code === 'E_PICKER_CANCELLED') {
          // User canceled the image picker
        } else {
          console.error('Error picking image: ', error);
        }
      });
  };






  async function uriToBlob(uri) {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  }


  const handleUploadImage = async () => {

    if (!imageUri) {

      return null;
    }

    try {

      const fileStat = await RNFS.stat(fileUri);
      const fileSize = fileStat.size;

      if (fileSize > FILE_SIZE_LIMIT_KB * 1024) {

        showToast("Image size shouldn't exceed 5MB", 'error');

        return null;
      }

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

        const fileBlob = await uriToBlob(fileUri);

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': fileType,
          },
          body: fileBlob,
        });

        if (uploadRes.status === 200) {

          // showToast("File uploaded", 'success');

          return fileKey;
        } else {
          throw new Error('Failed to upload file to S3');
        }
      } else {
        throw new Error(res.data.errorMessage || 'Failed to get upload URL');
      }
    } catch (error) {

      showToast("An error occurred during file upload", 'error');
      return null;
    } finally {

    }
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const minimumDate = new Date(1900, 0, 1);
  const maximumDate = new Date(2011, 11, 31);



  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };


  const UserSubmit = async () => {

    if (!firstNameVerify) return showToast("First name is required");
    if (!emailVerify) return showToast("Email is required");
    if (!genderVerify) return showToast("Gender is required");
    if (!dateOfBirth) return showToast("Date of birth is required");
    if (!selectedState) return showToast("State is required");
    if (!selectedCity) return showToast("City is required");
    // if (!collageVerify) return showToast("College name is required");

    if (imageUri) {
      try {
        const fileStats = await RNFS.stat(fileUri);
        const fileSizeInKB = fileStats.size / 1024;
        if (fileSizeInKB > 5000) {
          showToast("Image size shouldn't exceed 5MB", 'error');
          return;
        }
      } catch (error) {
        return
      }
    }

    try {
      const imageFileKey = imageUri ? await handleUploadImage(fileUri, fileType) : null;
      const formattedDOB = dateOfBirth
        ? `${dateOfBirth.getDate().toString().padStart(2, '0')}/${(dateOfBirth.getMonth() + 1).toString().padStart(2, '0')}/${dateOfBirth.getFullYear()}`
        : '';

      const payload = {
        command: "signUpUsers",
        select_your_profile: selectedProfile,
        category: selectedCategory,
        first_name: firstName,
        last_name: lastName,
        user_email_id: email,
        user_phone_number: fullPhoneNumber,
        city: selectedCity,
        state: selectedState,
        college: collage,
        gender: selectedGender,
        fileKey: imageFileKey,
        date_of_birth: formattedDOB,
        is_email_verified: emailVerify1
      };

      const response = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/signUpUsers',
        payload,
        {
          headers: {
            'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
          }
        }
      );

      if (response.data.status === 'success') {
        await AsyncStorage.setItem('normalUserData', JSON.stringify(response.data.user_details));

        const userData = await AsyncStorage.getItem('normalUserData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          const userId = parsedUserData.user_id;

          await createUserSession(userId);

          const sessionData = await AsyncStorage.getItem('userSession');
          if (sessionData) {
            const parsedSessionData = JSON.parse(sessionData);
            const sessionId = parsedSessionData.sessionId;
            // console.log("Session ID retrieved: ", sessionId);
          }
        }

        setAlertTitle('Success!');
        setAlertMessage(
          <Text style={{ textAlign: 'center' }}>
            You have successfully signed up!
            {'\n\n'}
            Enjoy <Text style={{ color: '#000', fontWeight: 'bold' }}>Your 30-Days Free Trial</Text>!
            {'\n'}
            Experience all the premium features of our app at no cost for 30 days. Dive in and explore everything we have to offer.
          </Text>
        );
        setAlertIconType('congratulations');
        setShowAlert(true);
      } else {
        console.log("Signup Failed Response:", response.data);
        const message = response.data.errorMessage || 'Something went wrong';
        showToast(message, 'error');

      }
    } catch (err) {
      console.error("Signup Error:", err); // Logs full error object

      if (err.response) {
        console.log("Error Response Data:", err.response.data);       // Detailed error message from server
        console.log("Error Response Status:", err.response.status);   // HTTP status code
        console.log("Error Response Headers:", err.response.headers); // Response headers

        showToast(`Server Error: ${err.response.status} - ${err.response.data.message || 'An error occurred'}`);
      } else if (err.request) {
        console.log("Error Request:", err.request); // The request was made but no response was received
        showToast('You don’t have an internet connection');
      } else {
        console.log("General Error Message:", err.message); // Error setting up the request
        showToast(`Error: ${err.message}`);
      }
    }

  };

  const FILE_SIZE_LIMIT_MB = 5;
  const FILE_SIZE_LIMIT_KB = FILE_SIZE_LIMIT_MB * 1024;

  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: false, // disables swipe back on iOS
      headerLeft: () => null, // hides back button
    });
  }, [navigation]);


  return (
    <View style={{ backgroundColor: COLORS.white, flex: 1 }}>

      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.replace("ProfileType")} style={styles.backButton}>
        <Icon name="arrow-back" size={24} color="#075cab" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={{ paddingBottom: '20%', paddingHorizontal: 10, }}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        <TouchableOpacity activeOpacity={1}>
          <TouchableOpacity onPress={handleImageSelection} style={styles.imageContainer}>
            <Image
              source={imageUri ? { uri: imageUri } : require('../../images/homepage/dummy.png')}
              style={styles.image}
            />
            <TouchableOpacity style={styles.cameraIconContainer} onPress={handleImageSelection}>
              <Icon name="camera-enhance" size={22} color="#333" />
            </TouchableOpacity>
          </TouchableOpacity>

          <Text style={styles.label}>First name <Text style={{ color: 'red' }}>*</Text></Text>
          <View style={styles.inputbox}>
            <MerticalIcon name='account-circle' size={20} color="gray" />
            <TextInput
              style={styles.inputText}
              placeholderTextColor="gray"
              onChange={handleFirstname}
            />
            {firstName.length <= 2 ? null : firstNameVerify ?
              <MerticalIcon name='check-circle' color='green' size={14} /> :
              <MerticalIcon name='close-circle-outline' color='red' size={16} />}
          </View>
          {firstName.length < 1 ? null : !firstNameVerify &&
            <Text style={styles.errorText}>Name should be more than 3 characters</Text>}

          <Text style={styles.label}>Last name</Text>
          <View style={styles.inputbox}>
            <MerticalIcon name='account-circle' size={20} color="gray" />
            <TextInput
              style={styles.inputText}
              onChange={handleLastName}
              placeholderTextColor="gray"
            />
          </View>

          <Text style={styles.label}>Email ID <Text style={{ color: 'red' }}>*</Text></Text>

            <View style={styles.inputbox1}>
              <MerticalIcon name="email-outline" size={20} color="gray" />
              <TextInput
                style={styles.inputText}
                placeholderTextColor="gray"
                onChange={handleEmail}
              />

              {emailVerify1 ? (
                <MerticalIcon name="check-circle" color="green" size={14} style={{ marginLeft: 5, }} />
              ) : email.length > 0 ? (
                <TouchableOpacity style={styles.button1} onPress={sendEmailOtp} disabled={loading}>
                  <Text style={styles.buttonText3}>
                    {loading ? 'Sending' : 'Verify'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

    

          <Text style={styles.label}>Phone no.<Text style={{ color: 'red' }}>*</Text></Text>
          <View style={styles.inputbox}>
            <MerticalIcon name='phone' size={20} color="gray" />
            <TextInput
              style={styles.inputText}
              value={fullPhoneNumber}
              editable={false}

            />
          </View>

          <Text style={[styles.label,]}>Gender <Text style={{ color: 'red' }}>*</Text></Text>
          <CustomDropdown
            label="Gender"
            data={['Male', 'Female', 'Other']}
            selectedItem={selectedGender} // Ensure gender selection is displayed
            onSelect={handleGender}
            placeholder="Select gender"
            placeholderTextColor="gray"
            buttonStyle={[styles.dropdownButton,]}
            buttonTextStyle={styles.dropdownButtonText}
          />

          <Text style={styles.label}>Date of birth <Text style={{ color: 'red' }}>*</Text></Text>

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.inputbox}
          >
            <Text style={styles.dateText}>
              {dateOfBirth ? formatDate(dateOfBirth) : 'Select date of birth'}
            </Text>
            <ArrowDown width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth || new Date(2011, 0, 1)}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
            />
          )}

          <Text style={[styles.label,]}>State <Text style={{ color: 'red' }}>*</Text></Text>
          <View>
            <CustomDropdown
              label="State"
              data={states}
              selectedItem={selectedState}
              onSelect={(state) => {
                setSelectedState(state);
                setSelectedCity('');
              }}
              placeholder="Select state"
              placeholderTextColor="gray"
              buttonStyle={[styles.dropdownButton,]}
              buttonTextStyle={styles.dropdownButtonText}
            />

            <Text style={[styles.label,]}>City <Text style={{ color: 'red' }}>*</Text></Text>
            <CustomDropdown
              label="City"
              data={cities}
              selectedItem={selectedCity}
              onSelect={(city) => setSelectedCity(city)}
              disabled={!selectedState}
              placeholder="Select city"
              placeholderTextColor="gray"
              buttonStyle={[styles.dropdownButton,]}
              buttonTextStyle={styles.dropdownButtonText}
            />

          </View>
          <Text style={styles.label}>Institute / Company</Text>
          <View style={styles.inputbox}>
            <MerticalIcon name='domain' size={20} color="gray" />
            <TextInput
              style={styles.inputText}
              onChange={handleCollage}
              placeholderTextColor="gray"
            />
            {/* {collage.length < 1 ? null : collageVerify ?
            <MerticalIcon name="check-circle" color="green" size={20} />
<MerticalIcon name="close-circle-outline" color="red" size={20} /> */}

          </View>

          {/* {collage.length < 1 ? null : !collageVerify &&
          <Text style={styles.errorText}>Please enter your college</Text>} */}


          <TouchableOpacity
            style={AppStyles.Postbtn}
            onPress={UserSubmit}
          >
            <Text style={AppStyles.PostbtnText}>Submit</Text>
          </TouchableOpacity>

          <Message1
            visible={showAlert}
            title={alertTitle}
            message={alertMessage}
            iconType={alertIconType}
            onOk={() => {
              if (hasNavigated) return;
              setHasNavigated(true);
              setShowAlert(false);
              // showToast('Signup successful', 'success');
              setTimeout(() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'UserBottom' }],
                });
              }, 300);
            }}
          />

        </TouchableOpacity>
      </ScrollView>
      <Modal
        visible={modalVisibleemail}
        animationType="slide"
        onRequestClose={() => setModalVisibleemail(false)}
        transparent={true}
      >
        <View style={styles.modalContaineremail}>
          <View style={styles.modalContentemail}>
            {/* Close Icon */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisibleemail(false);
                setOtp1(['', '', '', '', '', '']);
              }}
            >
              <MerticalIcon name="close" size={24} color="black" />

            </TouchableOpacity>

            <Text style={styles.modalTitleemail}></Text>
            <TextInput
              style={styles.inputemail}
              value={otp1}
              onChangeText={(value) => {
                setOtp1(value);
                if (value.length === 6) {
                  Keyboard.dismiss(); // Dismiss keyboard when 6 digits are entered
                }
              }}
              placeholder="Enter OTP"
              keyboardType="numeric"
              placeholderTextColor="gray"
              maxLength={6}
            />
            <TouchableOpacity style={styles.buttonemail} onPress={verifyOtp}>
              <Text style={styles.buttonTextemail}>Verify OTP</Text>
            </TouchableOpacity>

            {/* Resend OTP Button inside the Modal */}
            {otpTimer > 0 ? (
              <Text style={styles.buttonTextemailresend}>Resend in {otpTimer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                <Text style={styles.buttonemailResend}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  backButton: {
    padding: 10,
    alignSelf: 'flex-start'
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  dateButton: {
    // padding: 10,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  dateText: {
    color: colors.text_secondary,
    fontSize: 14,
    fontWeight:'500',
    paddingVertical: 12,
    // paddingHorizontal: 20,
    flex: 1,

  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  okButton: {
    backgroundColor: '#075cab',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  okButtonText: {
    color: 'white',
    fontSize: 16,
  },
  imageContainer: {
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    width: 140,
    marginBottom: 20,
    alignSelf: 'center',
    position: 'relative',
    resizeMode: 'contain'
  },

  image: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,

  },



  label: {
    color: "black",
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 5,

  },
  inputbox: {
    minHeight: 40,
    maxHeight: 150,
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,

  },
  button: {
    backgroundColor: '#075cab',
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
  },
  datePickerButton: {
    backgroundColor: COLORS.lightGray,
    //padding: 10,
    borderRadius: 5,
    marginVertical: 20,
    flexDirection: 'row',
    marginHorizontal: 10

  },
  datePickerButtonText: {
    textAlign: 'start',
    color: 'black',
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    marginLeft: 20, color: 'firebrick', textAlign: 'center', fontSize: 14
  },
  modalContaineremail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Background overlay
  },
  modalContentemail: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  heading: {

    marginHorizontal: 4,
    color: "black",
    fontSize: 15,
    fontWeight: "500"

  },
  button1: {

    // flex: 1,
    // alignSelf:'flex-end',
    // backgroundColor: '#075cab',
    justifyContent: 'center',
    alignItems: 'center',

    // borderRadius: 15,
    // marginVertical: 20,
    // margin: 10
  },
  buttonText3: {

    color: '#075cab',
    fontSize: 14,
    fontWeight: '600'
  },
  inputbox1: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom:10
  },
  inputText: {
    paddingHorizontal: 20,
    height: 40,
    width: '80%',
    color: colors.text_secondary,
  },
  modalTitleemail: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    // backgroundColor: '#ccc',
    borderRadius: 15,
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  inputemail: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
    color: 'black'
  },
  buttonemail: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  buttonTextemail: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: '500',
  },
  buttonTextemailresend: {
    color: 'firebrick',
    fontSize: 13,
    fontWeight: '400',
  },
  buttonemailResend: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownButton: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10

  },
  dropdownButtonText: {
    fontSize: 14,
    color: colors.text_secondary,
    flex: 1,
  },
});

export default UserSignupScreen;

