

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  SafeAreaView,
  Modal, Image, Alert, Platform, Button,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CityType, COLORS, StateType, } from '../../assets/Constants';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';

import CustomDropdown from '../../components/CustomDropDown';
import { stateCityData } from '../../assets/Constants';
import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';
import ImagePicker from 'react-native-image-crop-picker';
import ImageResizer from 'react-native-image-resizer';

import RNFetchBlob from 'rn-fetch-blob';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging, { getMessaging, getToken } from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';
import { showToast } from '../AppUtils/CustomToast';
import apiClient from '../ApiClient';
import AppStyles from '../AppUtils/AppStyles';
import { ActionSheetIOS } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import Pdf from '../../assets/svgIcons/pdf.svg';
import Camera from '../../assets/svgIcons/camera.svg';
import Close from '../../assets/svgIcons/close.svg';
import Phone from '../../assets/svgIcons/phone.svg';
import Company from '../../assets/svgIcons/company.svg';
import Email from '../../assets/svgIcons/mail.svg';
import Sucess from '../../assets/svgIcons/success.svg';
import Web from '../../assets/svgIcons/web.svg';
import Register from '../../assets/svgIcons/register.svg';
import Location from '../../assets/svgIcons/location.svg';
import Info from '../../assets/svgIcons/information.svg';

import { colors, dimensions } from '../../assets/theme.jsx';


const CompanyUserSignupScreen = () => {

  const navigation = useNavigation();
  const route = useRoute();
  const { selectedProfile, selectedCategory, fullPhoneNumber } = route.params;

  const [imageUri, setimageUri] = useState(null);
  const [fileUri, setFileUri] = useState(null);
  const [fileType, setFileType] = useState('');
  const [isMediaSelection, setIsMediaSelection] = useState(false);
  const [fileKey, setFileKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [docUri, setdocUri] = useState(null)
  const [pdfFileType, setPdfFileType] = useState('');
  const [brochureKey, setBrochureKey] = useState(null);
  const [modalVisible, setModalVisible] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [emailVerify, setEmailVerify] = useState(false);
  const [cityVerify, setCityVerify] = useState(false);
  const [stateVerify, setStateVerify] = useState(false);

  const [otpTimer, setOtpTimer] = useState(0);
  const [modalVisibleemail, setModalVisibleemail] = useState(false);
  const [otp1, setOtp1] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [companyNameError, setCompanyNameError] = useState('');
  const [websiteError, setWebsiteError] = useState('');


  const handleCompanyName = (value) => {

    if (value.length === 1 && value[0] === ' ') {
      showToast("Leading spaces are not allowed", 'error');

      return;
    }

    const trimmedValue = value.replace(/^\s+/, '');
    setCompanyName(trimmedValue);

    if (trimmedValue.length > 0 && !/^[A-Za-z0-9][A-Za-z0-9 ]*$/.test(trimmedValue)) {

      showToast("Leading spaces are not allowed", 'error');

      return;
    }

    const visibleChars = trimmedValue.replace(/\s/g, '');
    if (visibleChars.length > 0 && visibleChars.length < 3) {
      setCompanyNameError('Company name must be at least 3 characters.');
    } else {
      setCompanyNameError('');
    }
  };


  const handleRegistrationNumber = (value) => {
    if (/^\s/.test(value)) {
      showToast("Leading spaces are not allowed", 'error');
      return;
    }

    const registrationNumberVar = value.trimStart();
    setRegistrationNumber(registrationNumberVar);
  };


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
      setLoading(true);
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

        setEmailVerify(true);
        setIsOtpSent(false);

        setModalVisibleemail(false); // Hide the modal on successful verification
      } else {

        showToast(response.data.errorMessage || 'Invalid OTP', 'success');
      }
    } catch (error) {

      showToast("Error verifying OTP", 'error');
    } finally {
      setLoading(false);
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

        showToast("Failed to resend\nTry again later", 'error');
      }
    } catch (error) {

      showToast("Failed to resend\nTry again later", 'error');

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
      console.log("Sending first request to /sendUpdateEmailOtp...");

      const checkEmailResponse = await apiClient.post(
        '/sendUpdateEmailOtp',
        {
          command: 'sendUpdateEmailOtp',
          email,
          mode: "signup"
        }
      );

      console.log("First response (email check):", checkEmailResponse?.data);

      if (
        checkEmailResponse?.data?.statusCode === 500 &&
        checkEmailResponse?.data?.status === 'error'
      ) {
        showToast(checkEmailResponse.data.errorMessage, 'error');
        setLoading(false);
        return;
      }

      console.log("Sending second request to /sendUpdateEmailOtp...");

      const response = await apiClient.post(
        '/sendUpdateEmailOtp',
        {
          command: 'sendUpdateEmailOtp',
          email,
          mode: "signup"
        }
      );

      console.log("Second response (send OTP):", response?.data);

      if (response?.data?.statusCode === 200) {
        if (response?.data?.status === 'success') {
          startOtpTimer();

          setIsOtpSent(true);
          setEmailVerify(true);
          setModalVisibleemail(true);

          showToast(response.data.successMessage, 'success');
        } else {
          showToast(response.data.successMessage, 'error');
        }
      } else {
        showToast(response.data.errorMessage, 'error');
      }

    } catch (error) {
      console.error("Error while sending OTP:", error);
      showToast("Failed to send OTP\nTry again later", 'error');
    } finally {
      setLoading(false);
    }
  };


  const [emailVerify1, setEmailVerify1] = useState(false);

  const handleEmail = (value) => {

    if (value.length === 1 && value[0] === ' ') {

      showToast("Leading spaces are not allowed", 'error');
      return;
    }

    const trimmedValue = value.replace(/^\s+/, '');
    setEmail(trimmedValue);

    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedValue);
    setEmailVerify(isValid);
    setEmailError(trimmedValue.length > 0 && !isValid ? 'Please enter a valid email address.' : '');
  };





  const handleCitySelection = (city) => {
    setSelectedCity(city);
    setCityVerify(city !== 'Select City');
    setModalVisible(null); // Close modal after selection
  };

  const handleStateSelection = (state) => {
    setSelectedState(state);
    setStateVerify(state !== 'Select State');
    setModalVisible(null); // Close modal after selection
  };

  const handleWebsiteText = (text) => {

    if (text.length === 1 && text[0] === ' ') {

      showToast("Leading spaces are not allowed", 'error');
      return;
    }

    const websiteVar = text.trimStart(); // removes any leading spaces
    setWebsite(websiteVar);

    if (websiteVar.length > 0 && !/^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(websiteVar)) {
      setWebsiteError('Please enter a valid website URL.');
    } else {
      setWebsiteError('');
    }
  };



  const handleAddress = (text) => {
    if (text.length === 1 && text[0] === ' ') {
      showToast("Leading spaces are not allowed", 'error');

      return;
    }

    const trimmedText = text.trimStart();
    setAddress(trimmedText);

    if (trimmedText.length === 0) {
      setAddressError('Address is required.');
    } else if (trimmedText.length > 0 && trimmedText.length < 5) {
      setAddressError('Address must be at least 4 characters.');
    } else {
      setAddressError('');
    }
  };


  const handleCompanyDescription = (text) => {
    if (text.length === 1 && text[0] === ' ') {
      showToast("Leading spaces are not allowed", 'error');

      return;
    }

    const trimmedText = text.trimStart();
    setCompanyDescription(trimmedText);

    if (trimmedText.length === 0) {
      setDescriptionError('Description is required.');
    } else if (trimmedText.length > 0 && trimmedText.length < 5) {
      setDescriptionError('Description must be at least 4 characters.');
    } else {
      setDescriptionError('');
    }
  };







  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const states = Object.keys(stateCityData);
  const cities = selectedState ? stateCityData[selectedState] : [];


  const validation = () => {
    if (!companyName || companyName.length < 3) {

      showToast("Enter a valid company name", 'info');
      return false;
    }

    if (!registrationNumber || registrationNumber.length < 2) {
      showToast("Enter a valid CIN/Registration number", 'info');

      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.match(emailPattern)) {
      showToast("Enter a valid email ID", 'info');
      return false;
    }

    if (!selectedCity || !selectedState) {
      showToast("Select state and city", 'info');

      return false;
    }

    return true;
  };

  const [selectedPDF, setSelectedPDF] = useState(null);
  const removeMedia = (type, index) => {
    if (type === 'document') setSelectedPDF(null);
  };
  const selectPDF = async () => {
    if (selectedPDF) {
      showToast("You can only upload 1 PDF", 'info');
      return;
    }

    try {
      const [file] = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });

      if (file.size > 5 * 1024 * 1024) {
        return showToast("File size shouldn't exceed 5MB", 'error');

      }

      setSelectedPDF({
        uri: file.uri,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2)
      });

    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {

      }
    }
  };


  const uploadFileToS3 = async (fileUri, fileType) => {
    try {
      const fileStat = await RNFS.stat(fileUri);
      console.log(`Uploading ${fileType} - Size: ${fileStat.size} bytes`);

      const res = await apiClient.post('/uploadFileToS3', {
        command: 'uploadFileToS3',
        headers: {
          'Content-Type': fileType,
          'Content-Length': fileStat.size,
        },
      });

      if (res.data.status === 'success') {
        const uploadUrl = res.data.url;
        const fileKey = res.data.fileKey;

        const fileBlob = await uriToBlob(fileUri);

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': fileType },
          body: fileBlob,
        });

        if (uploadRes.status === 200) {
          console.log(`${fileType} uploaded successfully.`);
          return fileKey;
        } else {
          const errorText = await uploadRes.text(); // log S3 error message if available
          console.error(`Failed to upload ${fileType}. Status: ${uploadRes.status} - ${uploadRes.statusText}`);
          console.error('S3 Response Body:', errorText);
          throw new Error(`Failed to upload ${fileType} to S3`);
        }
      } else {
        console.error('Failed to get signed URL:', res.data.errorMessage);
        throw new Error(res.data.errorMessage || 'Failed to get upload URL');
      }
    } catch (error) {
      console.error('Upload Error:', error.message);
      showToast("Upload failed", 'error');
      return null;
    }
  };



  const uriToBlob = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    return blob;
  };



  const handleImageSelection = () => {
    if (imageUri) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Remove Image', 'Cancel'],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            removeImage();
          }
        }
      );
    } else {
      const options = ['Take Photo', 'Choose from Gallery', 'Cancel'];
      const cancelButtonIndex = 2;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            openCamera();
          } else if (buttonIndex === 1) {
            openGallery();
          }
        }
      );
    }
  };



  const handleDeleteImageFromS3 = async () => {
    try {

      const response = await deleteFileFromS3(fileUri);
      if (response) {

        return true;
      } else {

        showToast("Failed to remove image", 'error');

        return false;
      }
    } catch (error) {

      showToast("An error occurred while remove the image", 'error');
      return false;
    }
  };


  const removeImage = async () => {
    // If an image is selected, delete it from S3
    if (imageUri && fileUri) {
      const fileKey = await handleDeleteImageFromS3();
      // Clear the image states after deleting it
      if (fileKey) {
        setimageUri('');
        setFileUri('');
        setFileType('');
      }
    }
  };

  const openCamera = () => {
    ImagePicker.openCamera({
      mediaType: 'photo',
      cropping: true,
      cropperCircleOverlay: false,
      width: 800,
      height: 800,
      compressImageQuality: 0.7,
    })
      .then((image) => {
        const initialImageSize = image.size / 1024 / 1024;

        const uri = image.path;
        setimageUri(uri);
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

            setimageUri(resizedImage.uri);
            setFileUri(resizedImage.uri);
          })
          .catch((err) => {
            console.error('Image Resizing Error:', err);
          });
      })
      .catch((error) => {
        if (error.code !== 'E_PICKER_CANCELLED') {
          console.error('Camera error:', error);
        }
      });
  };


  const openGallery = () => {
    ImagePicker.openPicker({
      mediaType: 'photo',
      cropping: true,
      cropperCircleOverlay: false,
      width: 800,
      height: 800,
      compressImageQuality: 0.7,

    })
      .then((image) => {
        // Log the image size before resizing
        const initialImageSize = image.size / 1024 / 1024; // Size in MB

        const uri = image.path;
        setimageUri(uri);
        setFileUri(uri);
        setIsMediaSelection(false); // Exit media selection mode
        setFileType(image.mime);

        // Check if the original image size is less than 100KB
        if (image.size < 1024 * 10) { // 100KB in bytes
          console.log("Image size is less than 100KB, no compression needed.");
          return;
        }

        ImageResizer.createResizedImage(uri, 800, 600, 'JPEG', 80)
          .then((resizedImage) => {

            const resizedImageSize = resizedImage.size / 1024 / 1024; // Size in MB
            console.log(`Resized image size: ${resizedImageSize.toFixed(2)} MB`);

            if (resizedImageSize > 5) {

              showToast("Image size shouldn't exceed 5MB", 'error');
              return;
            }

            setimageUri(resizedImage.uri);
            setFileUri(resizedImage.uri);
          })
          .catch((err) => {

          });
      })
      .catch((error) => {
        if (error.code === 'E_PICKER_CANCELLED') {

        } else {

        }
      });
  };


  const FILE_SIZE_LIMIT_MB = 5;  // 5MB
  const FILE_SIZE_LIMIT_KB = FILE_SIZE_LIMIT_MB * 1024;  // Convert MB to KB


  const handleUploadImage = async () => {
    setLoading(true);

    if (!imageUri) {

      setLoading(false);
      return null;
    }

    try {

      const fileStat = await RNFS.stat(fileUri);
      const fileSize = fileStat.size;

      if (fileSize > FILE_SIZE_LIMIT_KB * 1024) {

        showToast("File size shouldn't exceed 5MB", 'error');
        setLoading(false);
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
      setLoading(false);
    }
  };


  const deleteFileFromS3 = async (key) => {
    try {
      const response = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/deleteFileFromS3',
        { command: 'deleteFileFromS3', key },
        { headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' } }
      );

      if (response.status === 200) {

        setFileKey('');
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
        console.log("🔹 FCM Token:", token);
      } catch (error) {
        console.error("❌ Error fetching FCM token:", error);
      }
    };

    getFcmToken();
  }, []);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  const UserSubmit = async () => {
    if (!validation()) return;

    try {
      console.log("Starting UserSubmit...");

      let imageFileKey = null;
      if (imageUri) {
        console.log("Checking image size...");
        const fileStats = await RNFS.stat(imageUri);
        const fileSizeInKB = fileStats.size / 1024;

        if (fileSizeInKB > 5000) {

          showToast("File size shouldn't exceed 5MB", 'error');
          return;
        }

        imageFileKey = await handleUploadImage(imageUri, fileType);

      }

      const uploadedPDFKey = selectedPDF ? await uploadFileToS3(selectedPDF.uri, 'application/pdf') : null;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {

        showToast("Please enter a valid email Id", 'info');
        return;
      }
      setLoading(true);

      const payload = {
        command: "companySignUp",
        company_name: companyName,
        brochureKey: uploadedPDFKey,
        fileKey: imageFileKey,
        business_registration_number: registrationNumber,
        select_your_profile: selectedProfile,
        category: selectedCategory,
        company_located_city: selectedCity,
        company_located_state: selectedState,
        company_address: address,
        company_contact_number: fullPhoneNumber,
        is_email_verified: emailVerify1,
        company_email_id: email,
        Website: website,
        company_description: companyDescription,

      };

      await AsyncStorage.setItem('CompanyUserData', JSON.stringify(payload));

      const response = await apiClient.post('/companySignUp', payload);

      if (response.data.status === 'success') {

        const companyId = response.data.company_details.user_id;
        await AsyncStorage.setItem('company_id', companyId);
        const companyDetailsResponse = await apiClient.post('/getCompanyDetails', {
          command: "getCompanyDetails",
          company_id: companyId,
        });

        if (companyDetailsResponse.data.status === 'success') {

          const companyDetails = companyDetailsResponse.data.status_message;
          if (companyDetails) {
            await AsyncStorage.setItem('CompanyUserData', JSON.stringify(companyDetails));

            const sessionCreated = await createUserSession(companyId);

            if (!sessionCreated) {
              showToast("Failed to create session. Please try again.", "error");
              setLoading(false);
              return;  // ⛔ STOP LOGIN HERE
            }

            navigation.replace('CreateProduct', {
              showSkip: true,
              fromSignup: true,
              companyId: companyId,
            });
          } else {
            showToast("Failed to fetch details", 'error');
          }
        } else {
          showToast("Failed to fetch details", 'error');
        }
      } else {
        showToast(response.data.errorMessage, 'error');
      }
    } catch (err) {
      console.log('err', err)
      showToast("Something went wrong. Check your internet connection", 'error');
    } finally {
      setLoading(false);

    }
  };



  const createUserSession = async (userId) => {
    try {

      const [deviceName, model, userAgent, ipAddress] = await Promise.allSettled([
        DeviceInfo.getDeviceName(),
        DeviceInfo.getModel(),
        DeviceInfo.getUserAgent(),
        DeviceInfo.getIpAddress(),
      ]);
      const deviceInfo = {
        os: Platform.OS,
        deviceName: deviceName.status === 'fulfilled' ? deviceName.value : 'Unknown',
        model: model.status === 'fulfilled' ? model.value : 'Unknown',
        appVersion: DeviceInfo.getVersion(),
        userAgent: userAgent.status === 'fulfilled' ? userAgent.value : 'Unknown',
        ipAddress: ipAddress.status === 'fulfilled' ? ipAddress.value : '0.0.0.0',
      };

      const payload = {
        command: 'createUserSession',
        user_id: userId,
        fcm_token: fcmToken,
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
        return true;
      } else {
        showToast("Something went wrong", 'error');
        return false;
      }
    } catch (error) {

      showToast("Session creation failed", 'error');
      return false;
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
      headerLeft: () => null,
    });
  }, [navigation]);

  return (
    <View style={{ backgroundColor: COLORS.white, flex: 1 }}>

      <TouchableOpacity onPress={() => navigation.replace("ProfileType")} style={styles.backButton}>
        <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: '20%' }} showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={handleImageSelection} style={styles.imageContainer} activeOpacity={0.8}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (<Image source={require('../../images/homepage/buliding.jpg')} style={styles.image} />
          )}
          <TouchableOpacity style={styles.cameraIconContainer} onPress={handleImageSelection}>
            <Camera width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.gray} />

          </TouchableOpacity>
        </TouchableOpacity>

        <Text style={styles.heading} >Company name<Text style={{ color: 'red' }}>*</Text></Text>
        <View style={styles.inputbox}>
          <Company width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.gray} />

          <TextInput
            style={styles.inputText}
            placeholderTextColor="gray"
            value={companyName} // Set the value to the company name state
            onChangeText={handleCompanyName} // Call the updated handleCompanyName
          />

        </View>
        {companyName.length > 0 && companyNameError !== '' && (
          <Text style={{ color: 'red', fontSize: 12, marginBottom: 10 }}>
            {companyNameError}
          </Text>
        )}

        <Text style={styles.heading} >CIN / Business registration number<Text style={{ color: 'red' }}>*</Text></Text>
        <View style={styles.inputbox}>
          <Register width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.gray} />

          <TextInput
            style={styles.inputText}
            placeholderTextColor="gray"
            value={registrationNumber}
            onChangeText={handleRegistrationNumber}
          />
        </View>


        <Text style={styles.heading}>Email ID<Text style={{ color: 'red' }}>*</Text></Text>
        <View style={styles.inputbox}>
          <Email width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.gray} />

          <TextInput
            style={styles.inputText}
            placeholderTextColor="gray"
            value={email}
            onChangeText={handleEmail}
          />

          {emailVerify1 ? (
            <Sucess width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.success} />

          ) : email.length > 0 ? (
            <TouchableOpacity style={styles.button1} onPress={sendEmailOtp} disabled={loading}>
              <Text style={styles.buttonText3}>
                {loading ? 'Sending' : 'Verify'}
              </Text>
            </TouchableOpacity>
          ) : null}

        </View>

        {email.length > 0 && !emailVerify1 && emailError !== '' && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ color: 'red', fontSize: 12 }}>
              {emailError}
            </Text>
          </View>
        )}

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
                onPress={() => setModalVisibleemail(false)}
              >
                <Close width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.secondary} />

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
                <Text style={styles.buttonTextemailresend}>Resend OTP {otpTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                  <Text style={styles.buttonemailResend}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>


        <Text style={styles.heading} >Business phone no.<Text style={{ color: 'red' }}>*</Text></Text>
        <View style={styles.inputbox}>
          <Phone width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.gray} />

          <TextInput
            style={styles.inputText}
            value={fullPhoneNumber}
            editable={false}
          />

        </View>


        <Text style={[styles.heading,]}>State<Text style={{ color: 'red' }}>*</Text></Text>
        <CustomDropdown
          label="State"
          data={states}
          selectedItem={selectedState}
          onSelect={(state) => {
            setSelectedState(state);
            setSelectedCity('');
          }}
          buttonStyle={styles.dropdownButton}
          buttonTextStyle={styles.dropdownButtonText}

        />

        <Text style={[styles.heading,]}>City<Text style={{ color: 'red' }}>*</Text></Text>
        <CustomDropdown
          label="City"
          data={cities}
          selectedItem={selectedCity}
          onSelect={(city) => setSelectedCity(city)}
          disabled={!selectedState}
          buttonStyle={styles.dropdownButton}
          buttonTextStyle={styles.dropdownButtonText}
        />



        <Text style={styles.heading}  >Website</Text>
        <View style={styles.inputbox}>
          <Web width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.gray} />

          <TextInput
            style={styles.inputText}
            placeholderTextColor="gray"
            value={website}
            onChangeText={handleWebsiteText}
            autoCapitalize="none"
          />
        </View>
        {website.length > 0 && websiteError !== '' && (
          <Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>
            {websiteError}
          </Text>
        )}


        <Text style={styles.heading}>Company address</Text>
        <View style={[styles.inputbox]}>
          <Icon name='map-marker' size={20} color="gray" />
          <TextInput
            style={[styles.inputText,]}
            placeholderTextColor="gray"
            multiline
            value={address}
            onChangeText={handleAddress}
          />
        </View>
        {/* {address.length > 0 && addressError !== '' && (
  <Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>
    {addressError}
  </Text>
)} */}

        <Text style={styles.heading}>Company description</Text>
        <View style={[styles.inputbox]}>
          <Icon name='note-text-outline' size={20} color="gray" />
          <TextInput
            style={[
              styles.inputText,
              {
                minHeight: 50,
                maxHeight: 200,
                textAlignVertical: 'top',
                flex: 1
              }
            ]}
            placeholderTextColor="gray"
            multiline
            value={companyDescription}
            onChangeText={handleCompanyDescription}
          />
        </View>

        {/* {companyDescription.length > 0 && descriptionError !== '' && (
          <Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>
            {descriptionError}
          </Text>
        )} */}

        {!selectedPDF && (
          <TouchableOpacity
            style={styles.buttoncontainer4}
            onPress={selectPDF}
          >
            <Text style={[styles.btnCatelogue1]}>
              Upload company catalogue
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.mediaContainer}>
          {selectedPDF && (
            <View style={[styles.mediaWrapper, { padding: 15, }]}>
              <Icon name="file-document-outline" size={50} color="black" />

              <Text numberOfLines={1} style={[styles.documentName, { marginTop: 5, }]}>{selectedPDF.name}</Text>

              <TouchableOpacity style={styles.closeIcon} onPress={() => removeMedia('document')}>
                <Icon name="close" size={20} color="gray" />
              </TouchableOpacity>
            </View>
          )}

          {/* {!selectedPDF && (
            <TouchableOpacity style={styles.placeholder} onPress={selectPDF}>
              <Text style={styles.placeholderText}>Upload PDF</Text>
            </TouchableOpacity>
          )} */}
        </View>

        <TouchableOpacity
          style={[AppStyles.Postbtn, loading && { opacity: 0.6 }]}
          onPress={UserSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={AppStyles.PostbtnText}>Next</Text>
          )}
        </TouchableOpacity>

      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,

  },
  imageContainer: {
    borderRadius: 75,
    height: 140,
    width: 140,
    marginBottom: 20,
    alignSelf: 'center'
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },

  pdfContainer: {
    marginBottom: 20,
  },
  pdfText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  buttonDelete: {
    color: '#FF0000',
    fontWeight: '500',
    fontSize: 16,
  },
  pdfUri: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButtonText: {

    fontWeight: '600',
    fontSize: 12,
    textAlign: "center"
  },
  uploadButtonText1: {

    fontWeight: '500',
    fontSize: 15,
    textAlign: "center",
    color: '#075cab',
  },

  uploadbtn: {
    paddingVertical: 10,
    alignSelf: 'center'

  },
  inputbox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    elevation: 2
  },
  buttoncontainer1: {
    alignSelf: 'center',
    width: 120,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#075cab',
    borderWidth: 1,
    marginVertical: 10,
  },


  buttoncontainer2: {
    alignSelf: 'center', // Centers the button
    width: 120, // Adjusts the button width to be smaller
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#075cab',
    borderWidth: 1,

  },

  buttoncontainerDelete: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignSelf: 'flex-end',
    top: 10,

  },

  buttoncontainer4: {
    alignSelf: 'center', // Centers the button
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',


  },
  buttoncontainer: {
    alignSelf: 'center', // Centers the button
    width: 190, // Adjusts the button width to be smaller
    paddingVertical: 12,

    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#075cab',
    borderWidth: 1,
    marginVertical: 20,
  },
  inputText: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text_primary,
    flex: 1,
    padding: 5,
    textAlignVertical: 'top',
    minHeight: 40,
    maxHeight: 200,
  },
  button: {
    backgroundColor: 'blue',
    borderRadius: 5,
    paddingVertical: 15,
    marginVertical: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalView: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 50,
    padding: 20,
  },
  modalItem: {
    padding: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'green',
  },
  heading: {
    color: colors.text_primary,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 10,

  },

  button1: {
    justifyContent: 'center',
    alignItems: 'center',
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

  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,
  },

  modalItemText: {
    fontSize: 18,
  },


  inputTitle1: {
    fontSize: 15,
    fontWeight: '490',
    color: 'black',
    bottom: 5,
    marginHorizontal: 10,
  },
  btnCatelogue1: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: '500',
    padding: 10,

  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    alignSelf: 'center',
  },
  mediaWrapper: {
    position: 'relative',
    marginRight: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',

  },
  closeIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  mediaPreview: {
    width: 110,
    height: 110,
    borderRadius: 10,
  },
  input: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 15,
    borderColor: 'gray',
    borderWidth: 0.5,
    padding: 14,
    color: 'black',
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
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

  modalTitleemail: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    padding: 2,
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
    color: 'black',
    height: 50
  },
  buttonemail: {

    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
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
    // paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10
  },
  dropdownButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text_primary,
    flex: 1,
    padding: 5
  },

});


export default CompanyUserSignupScreen;

