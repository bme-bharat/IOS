
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Modal, Image,
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  Platform,
  Linking
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons'
import { CountryCodes, ProfileSelect } from '../../assets/Constants';
import { Keyboard } from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import { stateCityData } from '../../assets/Constants';
import Toast from 'react-native-toast-message';

import CustomDropdown1 from '../../components/userSignupdropdown';
import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';

import ImagePicker from 'react-native-image-crop-picker';
import ImageResizer from 'react-native-image-resizer';

import PhoneDropDown from '../../components/PhoneDropDown';
import Message3 from '../../components/Message3';

import { updateCompanyProfile } from '../Redux/MyProfile/CompanyProfile_Actions';
import { useDispatch, useSelector } from 'react-redux';
import default_image from '../../images/homepage/buliding.jpg';
import { showToast } from '../AppUtils/CustomToast';
import AppStyles from '../AppUtils/AppStyles';
import apiClient from '../ApiClient';
import FastImage from 'react-native-fast-image';
import CustomDropdown from '../../components/CustomDropDown';

const resolvedDefaultImage = Image.resolveAssetSource(default_image).uri;

const CompanyUserSignupScreen = () => {
  const { jobPosts: jobs } = useSelector(state => state.jobs);
  useEffect(() => {

  }, [jobs]);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const { profile, imageUrl } = route.params;

  const [localImageUrl, setLocalImageUrl] = useState(imageUrl)
  const [imageUri, setImageUri] = useState(null);
  const [fileUri, setFileUri] = useState(null);
  const [fileType, setFileType] = useState('');
  const [isStateChanged, setIsStateChanged] = useState(false);
  const [isCityChanged, setIsCityChanged] = useState(false);
  const [brochureKey, setBrochureKey] = useState(profile?.brochureKey || null);
  const [selectedState, setSelectedState] = useState(profile.company_located_state || '');
  const [selectedCity, setSelectedCity] = useState(profile.company_located_city || '');
  const [isModalVisiblephone, setModalVisiblePhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(""); // Phone number state
  const [countryCode, setCountryCode] = useState("+91"); // Default country code
  const [isOTPVerified, setIsOTPVerified] = useState(false); // OTP verified flag
  const [otp, setOtp] = useState('');
  const [isTypingOtp, setIsTypingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false); // Track OTP sent status
  const [timer, setTimer] = useState(30);  // Timer state (30 seconds)
  const [isResendEnabled, setIsResendEnabled] = useState(true);
  const states = Object.keys(stateCityData).map((state) => state);
  const cities = selectedState && stateCityData[selectedState]
    ? stateCityData[selectedState]
    : [];

  const [otpTimer, setOtpTimer] = useState(30); // Time left for resend OTP
  const [isOtpSent, setIsOtpSent] = useState(false); // Track if OTP is sent
  const [modalVisibleemail, setModalVisibleemail] = useState(false); // Modal visibility for OTP verification
  const [otp1, setOtp1] = useState('');
  const [isVerifyClicked, setIsVerifyClicked] = useState(false);
  const intervalRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [isImageChanged, setIsImageChanged] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(profile?.select_your_profile || "");
  const [selectedCategory, setSelectedCategory] = useState(profile?.category || "");

useEffect(() => {
  if (!selectedProfile) return;

  const categories = [
    ...(ProfileSelect.normalProfiles[selectedProfile] || []),
    ...(ProfileSelect.companyProfiles[selectedProfile] || []),
  ];

  // Reset category if it's not valid for the current profile
  if (selectedCategory && !categories.includes(selectedCategory)) {
    setSelectedCategory("");
  }
}, [selectedProfile, selectedCategory, ProfileSelect]);



  const inputRefs = useRef([]);
  // Generic focus function for any field
  const focusInput = (index) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index].focus();
    }
  };


  const handleStateSelect = (item) => {

    if (selectedState !== item) {
      setSelectedState(item);
      setIsStateChanged(true);
      setIsCityChanged(false);
      setSelectedCity('');
      handleInputChange('company_located_state', item);
    }
  };

  // Handle city selection
  const handleCitySelect = (item) => {

    setIsCityChanged(true);
    setSelectedCity(item);
    handleInputChange('company_located_city', item);
  };



  const sendOTPHandle = () => {
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    // Check if the phone number is already registered
    axios
      .post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/loginUser',
        {
          command: 'loginUser',
          user_phone_number: fullPhoneNumber,
        }, {
        headers: {
          'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
        },
      }

      )
      .then((response) => {

        if (response.data.status === 'success') {
          showToast('This user is already exists\nUse a new number', 'info');
          return;
        } else {

          if (validation()) {

            axios
              .post(
                'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/sendOtpVerificationMsg91',
                {
                  command: 'sendOtpVerificationMsg91',
                  user_phone_number: fullPhoneNumber,
                },
                {
                  headers: {
                    'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
                  },
                }
              )
              .then((otpRes) => {
                if (otpRes.data.type === 'success') {
                  setOtpSent(true);
                  setIsOTPVerified(false);

                  showToast("OTP Sent", 'success');

                  setTimer(30);
                  setIsResendEnabled(false);
                }
              })
              .catch((error) => {
                showToast("You don't have internet connection", 'error');

              });
          }
        }
      })
      .catch((error) => {
        showToast("You don't have internet connection", 'error');


      });
  };

  useEffect(() => {
    let timerInterval;

    if (timer > 0 && !isResendEnabled) {

      timerInterval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {

      clearInterval(timerInterval);
      setIsResendEnabled(true);
    }

    return () => clearInterval(timerInterval);
  }, [timer, isResendEnabled]);


  const resendHandle = async () => {

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    try {
      const response = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/resendOtpMsg91',
        { command: 'resendOtpMsg91', user_phone_number: fullPhoneNumber },
        { headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' } }
      );

      if (response.data.type === 'success') {

        showToast("OTP Sent", 'success');

        setTimer(30);
        setIsResendEnabled(false);
      } else {

        showToast("Unable to resend OTP\nTry again later", 'error');
      }
    } catch (error) {
      showToast("You don't have internet connection", 'error');
    }
  };

  const handlePhoneNumberChange = (value) => {

    if (/^\d*$/.test(value) && value.length <= 10) {
      setPhoneNumber(value);

      if (value.length === 10) {
        Keyboard.dismiss();
      }
    }
  };


  const handleVerifyOTP = () => {
    const enteredOTP = otp;
    if (enteredOTP.length !== 6 || !/^\d+$/.test(enteredOTP)) {

      showToast("Please enter a valid 6 digit OTP", 'error');

      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    axios.post('https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/verifyOtpMsg91', {
      command: 'verifyOtpMsg91',
      otp: enteredOTP,
      user_phone_number: fullPhoneNumber,
    }, {
      headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' },
    }).then((res) => {
      if (res.data.type === "success") {
        setIsOTPVerified(true);

        showToast("OTP verified", 'success');

      } else {

        showToast("OTP doesn't match", 'error');
      }
    }).catch((error) => {

      showToast("Please try again later", 'error');

    });
  };

  const validation = () => {
    // Check if the phone number is not empty and is a valid number
    if (!phoneNumber || phoneNumber.length < 10) {

      showToast("Please enter a valid phone number", 'error');

      return false;
    }
    return true;
  };

  // Handle phone number update
  const handlePhoneNumberUpdate = () => {
    const fullPhoneNumber = ` ${countryCode}${phoneNumber} `;
    setPostData((prevData) => ({
      ...prevData,
      company_contact_number: fullPhoneNumber,
    }));
    setModalVisiblePhone(false);
  };






  const deleteFileFromS3 = async (key) => {
    try {
      const response = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/deleteFileFromS3',
        { command: 'deleteFileFromS3', key },
        { headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' } }
      );

      if (response.status === 200) {

        return true;
      }

    } catch (error) {

    }
    return false;
  };



  const [hasChanges, setHasChanges] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState(() => {
    return profile?.is_email_verified && postData?.company_email_id ? postData.company_email_id : '';
  });


  const [postData, setPostData] = useState({

    company_name: profile.company_name || "",
    business_registration_number: profile.business_registration_number || "",
    company_contact_number: profile.company_contact_number || "",
    company_email_id: profile.company_email_id || "",
    company_located_city: profile.company_located_city || "",
    company_located_state: profile.company_located_state || "",
    Website: profile.Website || '',
    company_address: profile.company_address || "",
    company_description: profile.company_description || "",
    fileKey: profile.fileKey || null,
    brochureKey: profile.brochureKey || "",
    select_your_profile: profile.select_your_profile,
    category: profile.category,

  });

  useEffect(() => {
    setPostData((prev) => ({
      ...prev,
      select_your_profile: selectedProfile || prev.select_your_profile,
      category: selectedCategory || prev.category,
    }));
  }, [selectedProfile, selectedCategory]);
  

  
  useEffect(() => {
    const initialPostData = {
      company_name: profile.company_name || "",
      business_registration_number: profile.business_registration_number || "",
      company_contact_number: profile.company_contact_number || "",
      company_email_id: profile.company_email_id || "",
      company_located_city: profile.company_located_city || "",
      company_located_state: profile.company_located_state || "",
      Website: profile.Website || "",
      company_address: profile.company_address || "",
      company_description: profile.company_description || "",
      fileKey: profile.fileKey || null,
      brochureKey: profile.brochureKey || "",
      select_your_profile: profile.select_your_profile || "",
      category: profile.category || "",
    };
  

    const hasAnyChanges =
      Object.keys(initialPostData).some((key) => {
        const initialValue = initialPostData[key];
        const currentValue = postData[key];
  
        let isDifferent;
  
        if (Array.isArray(initialValue) && Array.isArray(currentValue)) {
          isDifferent =
            JSON.stringify(initialValue) !== JSON.stringify(currentValue);
        } else {
          isDifferent = initialValue !== currentValue;
        }
  
        if (isDifferent) {
          console.log(
            `⚠️ Difference found in "${key}" → Initial:`,
            initialValue,
            "| Current:",
            currentValue
          );
        }
  
        return isDifferent;
      }) || isImageChanged;
  
    setHasChanges(hasAnyChanges);
  }, [postData, isImageChanged, profile]);
  

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

  const startOtpTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setOtpTimer(30); // Set the timer to 30 seconds
    setIsOtpSent(true); // Disable Resend OTP button initially

    intervalRef.current = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev === 1) {
          clearInterval(intervalRef.current); // Stop the timer
          intervalRef.current = null; // Reset interval reference
          setIsOtpSent(false); // Enable Resend OTP button
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };


  const handleOtpEmail = async () => {

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(postData.company_email_id.trim())) {

      showToast("Please provide a valid email Id", 'error');
      return;

    }
    if (!postData.company_email_id.trim()) {

      showToast("Please provide a valid email Id", 'error');
      return;
    }
    setIsVerifyClicked(true);

    setLoading(true);

    const otpResponse = await apiClient.post(
      "/sendUpdateEmailOtp",
      {
        command: "sendUpdateEmailOtp",
        email: postData.company_email_id,
        mode: "update"
      },
      {
        headers: {
          "x-api-key": "k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk",
        },
      }
    );

    if (otpResponse.data.status === "success") {

      showToast("OTP sent", 'success');
      setIsOtpSent(true);
      startOtpTimer();
      setModalVisibleemail(true);
    } else {

      showToast(otpResponse.data.errorMessage, 'error');
    }
    setLoading(false);
  };


  const handleOtpVerification1 = async () => {
    if (!String(postData.company_email_id || '').trim()) {

      showToast('Please provide a valid email Id', 'error');
      return;
    }

    if (!String(otp1 || '').trim()) {

      showToast('Please enter the OTP sent', 'success');
      return;
    }

    try {
      const response = await apiClient.post(
        '/verifyEmailOtp',
        {
          command: "verifyEmailOtp",
          email: postData.company_email_id,
          otp: otp1,
        },
        {
          headers: {
            'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
          },
        }
      );

      if (response.data.status === "success") {
        setVerifiedEmail(true);
        setPostData((prevState) => ({
          ...prevState,
          is_email_verified: true,
        }));
        Keyboard.dismiss();

        showToast('Email verified', 'success');
        setModalVisibleemail(false);
      } else {

        showToast(response.data.errorMessage, 'error');
      }
    } catch (error) {

      showToast("Error verifying OTP\nPlease try again", 'error');
    }
  };



  const handleResendOtp = async () => {
    if (!postData.company_email_id.trim()) {

      showToast('Please provide a valid email Id ', 'error');
      return;
    }

    if (otpTimer === 0) {
      handleOtpEmail(); // Resend OTP when timer expires
    }
    try {
      const response = await apiClient.post(
        '/resendEmailOtp',
        {
          command: "resendEmailOtp",
          email: postData.company_email_id,
        },
        {
          headers: {
            'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
          },
        }
      );

      if (response.data.status === "success") {

        showToast('OTP sent', 'success');

        startOtpTimer();
      } else {

        showToast(response.data.errorMessage, 'error');
      }
    } catch (error) {

      showToast("Try again later", 'error');
    }
  };


  const handleInputChange = (key, value) => {
    // If the input starts with a space, show a toast and return
    if (/^\s/.test(value)) {

      showToast("Leading spaces and special characters are not allowed", 'error');

      return;
    }

    if (value === "") {
      setPostData(prevState => ({
        ...prevState,
        [key]: "",
        ...(key === "company_email_id" && { is_email_verified: false }), // Reset email verification if email is cleared
      }));
      return;
    }

    if (key === "company_name" && !/^[A-Za-z0-9][A-Za-z0-9 ]*$/.test(value)) {
      showToast("Leading spaces and special characters are not allowed", 'error');
      return;
    }


    setPostData(prevState => {
      let updatedData = { ...prevState, [key]: value };

      if (key === "company_email_id") {
        updatedData.is_email_verified = value === verifiedEmail;
      }

      return updatedData;
    });
  };




  const handleImageSelection = () => {
    const fileKey = postData.fileKey?.trim();
    const imageUrl = route.params?.imageUrl?.trim();
    const hasImage = fileKey && imageUrl?.includes(fileKey);

    const options = ['Take Photo', 'Choose from Gallery'];
    const actions = [openCamera, openGallery];

    if (hasImage) {
      options.push('Remove Image');
      actions.push(handleRemoveImage);
    }

    options.push('Cancel');
    const cancelButtonIndex = options.length - 1;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        userInterfaceStyle: 'light',
      },
      (buttonIndex) => {
        if (buttonIndex !== cancelButtonIndex) {
          actions[buttonIndex]?.();
        }
      }
    );
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

        setFileType(image.mime);
        setIsImageChanged(true);

        ImageResizer.createResizedImage(uri, 800, 600, 'JPEG', 80)
          .then((resizedImage) => {
            const resizedImageSize = resizedImage.size / 1024 / 1024;

            if (resizedImage.size > image.size) {
              setImageUri(uri);
              setFileUri(uri);
            } else {
              if (resizedImageSize > 5) {
                showToast("Image size shouldn't exceed 5MB", 'error');
                return;
              }
              setImageUri(resizedImage.uri);
              setFileUri(resizedImage.uri);
            }
          })
          .catch((err) => {
            setImageUri(uri);
            setFileUri(uri);
          });
      })
      .catch((error) => {
        if (error.code !== 'E_PICKER_CANCELLED') {
          console.warn('Camera error', error);
        }
      });
  };







  const handleRemoveImage = async () => {
    try {
      if (!postData.fileKey) {

        return;
      }
      const deleteResult = await deleteFileFromS3(postData.fileKey || imageUri);

      if (deleteResult) {
        setImageUri(null);
        setLocalImageUrl(null)
        setPostData(prevState => {
          const newState = {
            ...prevState,
            fileKey: null,
          };

          return newState;
        });


      } else {

        showToast("Failed to remove the image", 'error');
      }
    } catch (error) {

      showToast("An error occurred while removing the image", 'error');
    }
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
        const initialImageSize = image.size / 1024 / 1024;

        const uri = image.path;
        setFileType(image.mime);

        setIsImageChanged(true);

        ImageResizer.createResizedImage(uri, 800, 600, 'JPEG', 80)
          .then((resizedImage) => {
            const resizedImageSize = resizedImage.size / 1024 / 1024;

            if (resizedImage.size > image.size) {

              setImageUri(uri);
              setFileUri(uri);
            } else {
              // If resized image is too large, show error
              if (resizedImageSize > 5) {

                showToast("Image size shouldn't exceed 5MB", 'error');
                return;
              }
              setImageUri(resizedImage.uri);
              setFileUri(resizedImage.uri);
            }
          })
          .catch((err) => {

            setImageUri(uri);
            setFileUri(uri);
          });
      })
       .catch((error) => {
            if (error.message?.includes('User did not grant library permission')) {
              if (Platform.OS === 'ios') {
                Alert.alert(
                  'Permission Required',
                  'Photo access is needed to select an image. Please enable it in Settings.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Turn On',
                      onPress: () => {
                        Linking.openSettings();
                      },
                    },
                  ]
                );
              } else {
                showToast("Permission denied. Go to settings and enable photo access.", 'error');
              }
            } else if (error.code === 'E_PICKER_CANCELLED') {
              // User canceled, do nothing
            } else {
              showToast(`Media Picker failed: ${error.message || 'Unknown error'}`, 'error');
            }
          });

  };


  const FILE_SIZE_LIMIT_MB = 5;
  const FILE_SIZE_LIMIT_KB = FILE_SIZE_LIMIT_MB * 1024;

  const handleUploadImage = async () => {

    if (!imageUri) {

      return null;
    }

    try {

      const fileStat = await RNFS.stat(fileUri);
      const fileSize = fileStat.size;

      if (fileSize > FILE_SIZE_LIMIT_KB * 1024) {

        showToast("File size shouldn't exceed 5MB", 'error');

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

        // Convert the file to a Blob
        const fileBlob = await uriToBlob(imageUri);

        // Upload the file to S3 using the PUT method (sending the Blob as body)
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

    }
  };



  const handleDeleteBrochure = async () => {
    try {
      if (!brochureKey) {
        return;
      }

      const deleteResult = await deleteFileFromS3(brochureKey);
      if (deleteResult) {
        setPostData(prevState => ({
          ...prevState,
          brochureKey: "",
        }));

      } else {

        showToast("Failed to delete catalogue", 'error');
      }
    } catch (error) {

      showToast("Something went wrong", 'error');
    }
  };

  const handleUploadCatalogue = async () => {
    try {
      // Launch document picker to select a document (PDF)
      const response = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],  // Ensure only PDF is selected
      });

      if (response) {
        const selectedFile = response[0];


        // Check if the selected file is a PDF
        if (selectedFile.type !== 'application/pdf') {

          showToast("Please select a valid PDF file", 'error');
          return;
        }

        setPostData(prevState => ({
          ...prevState,
          brochureKey: "",
        }));


        const fileSizeInMB = selectedFile.size / (1024 * 1024); // Size in MB
        if (fileSizeInMB > 5) {

          showToast("File size shouldn't exceed 5MB", 'error');
          return;
        }

        const documentFileKey = await uploadFile(selectedFile, 'document');

        setPostData(prevState => ({
          ...prevState,
          brochureKey: documentFileKey,
        }));


        showToast("Catalogue uploaded successfully", 'success');
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {

      } else {

        showToast("Failed to upload catalogue", 'error');
      }
    }
  };


  const uploadFile = async (file, type) => {
    try {


      const fileSizeInKB = file.size / 1024; // Size in KB
      const fileSizeInMB = file.size / (1024 * 1024); // Size in MB


      // File size validation (5MB limit)
      if (fileSizeInMB > 5) {  // 5MB limit
        throw new Error('Document size exceeds 5 MB limit.');
      }

      const fileBlob = await uriToBlob(file.uri); // Convert to Blob


      // Step 1: Request upload URL from backend
      const res = await apiClient.post('/uploadFileToS3', {
        command: 'uploadFileToS3',
        headers: {
          'Content-Type': file.type,
          'Content-Length': fileBlob.size,
        },
      });

      if (res.data.status === 'success') {
        const uploadUrl = res.data.url;
        const fileKey = res.data.fileKey;

        // Step 2: Upload to S3 using PUT request
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: fileBlob,
        });

        if (uploadRes.status === 200) {

          return fileKey;  // Return the file key after successful upload
        } else {
          throw new Error('Failed to upload file to S3');
        }
      } else {
        throw new Error(res.data.errorMessage || 'Failed to get upload URL');
      }
    } catch (error) {

      throw error;  // Re-throw error for further handling
    }
  };


  // Helper function to convert URI to Blob
  const uriToBlob = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    return blob;
  };



  const [isLoading, setIsLoading] = useState(false);

  const handlePostSubmission = async () => {
    setIsLoading(true); // Start loading

    if (!postData.company_name) {
      showToast("Please provide a company name", 'info');
      setIsLoading(false);
      return;
    }

    if(selectedProfile && !selectedCategory) {
      showToast("Please select category too", 'info');
      setIsLoading(false);
      return;
    } 

    if (!postData.business_registration_number) {
      showToast("Please provide a Business registration number", 'info');
      setIsLoading(false);
      return;
    }

    if (isStateChanged && !isCityChanged) {
      showToast("Select a city", 'info');
      setIsLoading(false);
      return;
    }

    if (!postData.company_located_state.trim()) {
      showToast("Select a state", 'info');
      setIsLoading(false);
      return;
    }

    if (!postData.company_located_city.trim() && isStateChanged) {
      postData.company_located_city = '';
    }

    const FILE_SIZE_LIMIT_MB = 5;
    const FILE_SIZE_LIMIT_BYTES = FILE_SIZE_LIMIT_MB * 1024 * 1024;

    if (imageUri) {
      try {
        const fileStat = await RNFS.stat(fileUri);
        const fileSize = fileStat.size;

        if (fileSize > FILE_SIZE_LIMIT_BYTES) {

          showToast("File size shouldn't exceed 5MB", 'error');
          setIsLoading(false);
          return;
        }
      } catch (error) {

        setIsLoading(false);
        return;
      }
    }

    const emailToSend = postData.is_email_verified ? postData.company_email_id : verifiedEmail;

    try {
      const imageFileKey = imageUri ? await handleUploadImage(imageUri, fileType) : postData.fileKey;
      const documentFileKey = postData.brochureKey || "";

      const payload = {
        command: "updateCompanyProfile",
        company_id: profile.company_id,
        company_name: postData.company_name?.trimStart().trimEnd(),
        business_registration_number: postData.business_registration_number?.trimStart().trimEnd(),
        company_contact_number: postData.company_contact_number?.trimStart().trimEnd(),
        company_email_id: emailToSend?.trimStart().trimEnd(),
        company_located_city: postData.company_located_city?.trimStart().trimEnd(),
        company_located_state: postData.company_located_state?.trimStart().trimEnd(),
        is_email_verified: postData.is_email_verified || false,
        Website: postData.Website?.trimStart().trimEnd(),
        company_address: postData.company_address?.trimStart().trimEnd(),
        company_description: postData.company_description?.trimStart().trimEnd(),
        fileKey: imageFileKey || null,
        brochureKey: documentFileKey,
        select_your_profile: selectedProfile,
        category: selectedCategory,

        // dark_mode: { android: false, ios: false, web: false }, 
      };

      const response = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/updateCompanyProfile',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
          },
        }
      );

      if (response.data.status === 'success') {
        setIsImageChanged(false);

        showToast("Profile updated successfully", 'success');

        await fetchProfile();

        setTimeout(() => {
          navigation.goBack();
        }, 100);

      } else {

        showToast(response.data.errorMessage, 'error');

      }
    } catch (error) {

      showToast(error.message, 'error');

    } finally {
      setIsLoading(false);
      setHasChanges(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await apiClient.post('/getCompanyDetails', {
        command: 'getCompanyDetails',
        company_id: profile.company_id,
      });

      if (response.data.status === 'success') {
        const profileData = response.data.status_message;
        const fileKey = profileData.fileKey?.trim() || '';
        profileData.fileKey = fileKey;
        let imageUrl = null;

        if (fileKey) {
          try {
            const res = await apiClient.post('/getObjectSignedUrl', {
              command: 'getObjectSignedUrl',
              key: fileKey,
            });
            imageUrl = res.data;
            profileData.imageUrl = imageUrl;
          } catch {
            profileData.imageUrl = null;
          }
        } else {
          profileData.imageUrl = null;
        }

        const authorImagePayload = {
          authorId: profile.company_id,
          newFileKey: fileKey,
          ...(fileKey && imageUrl && { newImageUrl: imageUrl }),
        };

        dispatch({
          type: 'UPDATE_AUTHOR_IMAGE_FOR_POSTS',
          payload: authorImagePayload,
        });

        const matchingJobs = jobs.filter(job => job.company_id === profile.company_id);

        if (fileKey && imageUrl) {
          const updatedJobImages = {};
          matchingJobs.forEach(job => {
            updatedJobImages[job.post_id] = imageUrl;
          });

          dispatch({
            type: 'SET_JOB_IMAGE_URLS',
            payload: updatedJobImages,
          });
        } else {
          const resolvedDefaultImage = Image.resolveAssetSource(default_image).uri;

          const defaultJobImages = {};
          matchingJobs.forEach(job => {
            defaultJobImages[job.post_id] = resolvedDefaultImage;
          });

          dispatch({
            type: 'SET_JOB_IMAGE_URLS',
            payload: defaultJobImages,
          });
        }

        if (profileData.brochureKey?.trim()) {
          try {
            const brochureRes = await apiClient.post('/getObjectSignedUrl', {
              command: 'getObjectSignedUrl',
              key: profileData.brochureKey,
            });
            profileData.brochureUrl = brochureRes.data;
          } catch {
            profileData.brochureUrl = null;
          }
        }

        dispatch(updateCompanyProfile(profileData));
        return profileData;
      }
    } catch (error) {
      dispatch(updateCompanyProfile(null));
      return null;
    }
  };


  const defaultImage = profile?.imageUrl ? localImageUrl : (imageUri || resolvedDefaultImage);



  return (

    <SafeAreaView style={{ backgroundColor: 'whitesmoke', flex: 1 }}>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color="#075cab" />
      </TouchableOpacity>




      <FlatList
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => Keyboard.dismiss()}
        data={[{ key: 'image' }, { key: 'formInputs' }, { key: 'footer' }]}
        renderItem={({ item }) => {
          switch (item.key) {
            case 'image':
              return (
                // <TouchableOpacity activeOpacity={1} onPress={handleImageSelection} style={styles.imageContainer}>

                //   {imageUri || postData.fileKey ? (
                //     <Image source={{ uri: imageUri || imageUrl }} style={styles.image} />
                //   ) : (
                //     <Image source={require('../../images/homepage/buliding.jpg')} style={styles.image} />
                //   )}
                //   <TouchableOpacity style={styles.cameraIconContainer} onPress={handleImageSelection}>
                //     <Icon name="camera-enhance" size={22} color="#333" />
                //   </TouchableOpacity>
                // </TouchableOpacity>
                <>
                  <Text style={styles.header}>Edit your profile</Text>

                  <TouchableOpacity onPress={handleImageSelection} style={styles.imageContainer}>

                    <FastImage
                      source={{ uri: defaultImage || (imageUri || resolvedDefaultImage), priority: FastImage.priority.normal }}
                      cache="immutable"
                      style={styles.image}
                      resizeMode='cover'
                      onError={() => { }}
                    />

                    <TouchableOpacity style={styles.cameraIconContainer} onPress={handleImageSelection}>
                      <Icon name="camera-enhance" size={22} color="#333" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </>
              );

            case 'formInputs':
              return (
                <TouchableOpacity activeOpacity={1} style={{ paddingHorizontal: 10, paddingBottom: '20%' }}>
                  {[
                    {
                      placeholder: 'Company name',
                      value: postData.company_name || '',
                      onChange: (value) => handleInputChange('company_name', value),
                      required: true,
                    },
                    {
                      placeholder: 'CIN / Business registration number',
                      value: postData.business_registration_number || '',
                      onChange: (value) => handleInputChange('business_registration_number', value),
                      required: true,
                    },
                    {
                      placeholder: 'Website',
                      value: postData.Website || '',
                      onChange: (value) => handleInputChange('Website', value),
                    },
                    {
                      placeholder: 'Company address',
                      value: postData.company_address || '',
                      onChange: (value) => handleInputChange('company_address', value),
                      multiline: true,
                    },
                    {
                      placeholder: 'Company description',
                      value: postData.company_description || '',
                      onChange: (value) => handleInputChange('company_description', value),
                      multiline: true,
                    },
                  ].map((input, index) => (
                    <View key={index}>
                      <Text style={styles.label}>
                        {input.placeholder} {input.required && <Text style={{ color: 'red' }}>*</Text>}
                      </Text>
                      <View style={styles.inputContainer}>
                        <TouchableOpacity style={styles.inputbox} onPress={() => focusInput(index)} >
                          <TextInput
                            ref={(el) => (inputRefs.current[index] = el)}
                            style={[styles.inputText, input.multiline]}
                            value={input.value}
                            onChangeText={input.onChange}
                            keyboardType={input.keyboardType || 'default'}
                            multiline={input.multiline}
                            placeholderTextColor="gray"
                          />
                          <Icon name="edit" size={18} color="#888" style={styles.inputIcon} onPress={() => focusInput(index)} />
                        </TouchableOpacity>
                      </View>

                    </View>
                  ))}

                  <Text style={[styles.label, { color: "black", fontWeight: 500, fontSize: 15, }]}>Email ID <Text style={{ color: 'red' }}>*</Text></Text>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWithButton}>
                      <TextInput
                        style={styles.inputemail1}
                        value={postData.company_email_id || ''}
                        onChangeText={(value) => handleInputChange('company_email_id', value)}
                        placeholder="Email"
                        editable={!postData.is_email_verified}

                      />

                      {!postData.is_email_verified && postData.company_email_id !== verifiedEmail && (
                        < TouchableOpacity style={styles.buttonemailmain} onPress={handleOtpEmail}>
                          <Text style={styles.buttonTextemailtext}>{loading ? 'Sending' : 'Verify'}</Text>
                        </TouchableOpacity>
                      )}

                      {profile.is_email_verified && postData.company_email_id === verifiedEmail && (
                        <MaterialIcon name="check-circle" size={14} color="green" style={styles.verifiedIcon} />
                      )}
                    </View>
                  </View>



                  <Text style={styles.label}>Profile type</Text>

                  <CustomDropdown
  label="Profile Type"
  data={Object.keys(ProfileSelect.companyProfiles)}
  onSelect={(item) => {
    setSelectedProfile(item);
    if (item !== selectedProfile) {
      setSelectedCategory(""); // reset only when profile changes
    }
  }}
  selectedItem={selectedProfile}   // 👈 this comes from profile initially
  setSelectedItem={setSelectedProfile}
  placeholder="Select profile type"   // 👈 keep it generic
  buttonStyle={styles.dropdownButton}
  buttonTextStyle={styles.dropdownButtonText}
  placeholderTextColor="gray"
/>

{selectedProfile && (
  <>
    <Text style={styles.label}>
      Category <Text style={{ color: 'red' }}>*</Text>
    </Text>

    <CustomDropdown
      label="Category"
      data={ProfileSelect.companyProfiles[selectedProfile] || []}
      onSelect={setSelectedCategory}
      selectedItem={selectedCategory}   // 👈 initialized from profile
      setSelectedItem={setSelectedCategory}
      placeholder="Select category"     // 👈 keep generic, won’t override selected
      buttonStyle={styles.dropdownButton}
      buttonTextStyle={styles.dropdownButtonText}
      placeholderTextColor="gray"
      disabled={!selectedProfile}
    />
  </>
)}

                  <Text style={[styles.label, { color: "black", fontWeight: 500, fontSize: 15, }]}>Business phone no. <Text style={{ color: 'red' }}>*</Text></Text>

                  <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.inputWrapper} onPress={() => setModalVisiblePhone(true)}>
                      <TextInput
                        onPress={() => setModalVisiblePhone(true)}
                        style={[styles.inputText]}
                        value={postData.company_contact_number || ''}
                        onChangeText={(value) => handleInputChange('company_contact_number', value)}
                        editable={false}
                        placeholder="Business Phone Number"
                      />
                      <Icon name="edit" size={18} color="#888" style={styles.inputIcon} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.label, { color: "black", fontWeight: 500, fontSize: 15, }]}>State <Text style={{ color: 'red' }}>*</Text></Text>
                  <View style={styles.inputContainer}>
                    <CustomDropdown1
                      label="State"
                      data={states}
                      onSelect={handleStateSelect}
                      selectedItem={selectedState}
                      setSelectedItem={setSelectedState}
                    />
                  </View>

                  <Text style={[styles.label, { color: "black", fontWeight: 500, fontSize: 15, }]}>City <Text style={{ color: 'red' }}>*</Text></Text>
                  <View style={styles.inputContainer}>
                    <CustomDropdown1
                      label="City"
                      data={cities}
                      onSelect={handleCitySelect}
                      selectedItem={selectedCity}
                      setSelectedItem={setSelectedCity}
                      disabled={!selectedState}
                    />
                  </View>

                  <View style={{ marginVertical: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: 'black' }}>
                        {postData?.brochureKey ? postData.brochureKey : 'No file uploaded'}
                      </Text>

                      {postData?.brochureKey && (
                        <TouchableOpacity onPress={handleDeleteBrochure} style={{ marginLeft: 10 }}>
                          <MaterialIcon name="close" size={24} color="black" />

                        </TouchableOpacity>
                      )}
                    </View>

                    {!postData?.brochureKey && (
                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={handleUploadCatalogue}
                      >
                        <Text style={styles.uploadButtonText}>Upload company catalogue</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      AppStyles.Postbtn,
                      (!hasChanges || isLoading) && styles.submitButtonDisabled
                    ]}
                    disabled={!hasChanges || isLoading}
                    onPress={handlePostSubmission}
                  >
                    {isLoading ? (
                      <ActivityIndicator size='small' />
                    ) : (
                      <Text
                        style={[
                          AppStyles.PostbtnText,
                          (!hasChanges || isLoading) && styles.submitButtonTextDisabled
                        ]}
                      >
                        Update
                      </Text>
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>

              );

          }
        }}
        keyExtractor={(item) => item.key}
      />


      <Modal
        visible={isModalVisiblephone}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisiblePhone(false)}
      >

        <View style={styles.modalOverlay}
          onPress={() => {
            setPhoneNumber('');
            setModalVisiblePhone(false);
            setOtpSent(false)
            setIsOTPVerified(false)
            setTimer(0)
            setCountryCode('+91')
            setOtp(['', '', '', '', '', '']);
          }}
        >

          <View style={styles.modalContainer} >

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setPhoneNumber('');
                setModalVisiblePhone(false);
                setOtpSent(false)
                setIsOTPVerified(false)
                setTimer(0)
                setCountryCode('+91')
                setOtp(['', '', '', '', '', '']);
              }}

            >
              <Icon name="close" size={24} color="black" />
            </TouchableOpacity>
            <View style={styles.inputrow}>
              <View style={[styles.code, { width: "25%", }]}>
                <PhoneDropDown
                  options={CountryCodes}
                  selectedValue={countryCode}
                  onSelect={(item) => setCountryCode(item.value)}
                />
              </View>

              <TextInput
                style={[
                  styles.inputPhoneNumber,
                  phoneNumber.length > 0 && { letterSpacing: 1 },
                ]}
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor='gray'
              />
            </View>


            {otpSent && !isOTPVerified && (
              <View>

                <TextInput
                  style={[
                    styles.otpInput,
                    isTypingOtp && { letterSpacing: 5 },
                  ]}
                  value={otp}
                  onChangeText={(value) => {
                    if (/^\d*$/.test(value)) {
                      setOtp(value);
                      setIsTypingOtp(value.length > 0); // update typing state

                      if (value.length === 6) {
                        Keyboard.dismiss();
                      }
                    }
                  }}
                  placeholder="Enter OTP"
                  keyboardType="numeric"
                  maxLength={6}
                  placeholderTextColor="gray"
                />


                <TouchableOpacity onPress={handleVerifyOTP} style={{ alignSelf: 'center', }}>
                  <Text style={styles.buttonText1}>Verify</Text>
                </TouchableOpacity>

                {!isResendEnabled ? (
                  <Text style={styles.timerText}>Resend in {timer}</Text>
                ) : (
                  <TouchableOpacity onPress={resendHandle} style={{ alignSelf: 'center', }}>
                    <Text style={styles.buttonText1}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {!otpSent && (
              <TouchableOpacity onPress={sendOTPHandle} style={{ alignSelf: 'center', }}>
                <Text style={styles.buttonText1}>Get verification code</Text>
              </TouchableOpacity>
            )}

            {isOTPVerified && (
              <TouchableOpacity onPress={handlePhoneNumberUpdate} style={{ alignSelf: 'center', }} >
                <Text style={styles.buttonText1}>Update</Text>
              </TouchableOpacity>
            )}

            {/* <TouchableOpacity
                          style={styles.closeButton}
                          onPress={() => {
                            setModalVisiblePhone(false)
                          }}
                        >
                          <Ionicons name="close" size={24} color="black" />
                        </TouchableOpacity> */}

          </View>
        </View>
      </Modal>

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
              style={styles.closeButton1}
              onPress={() => {
                setModalVisibleemail(false);
                setOtp1(['', '', '', '', '', '']);
              }}
            >
              <MaterialIcon name="close" size={24} color="black" />
            </TouchableOpacity>

            <Text style={styles.modalTitleemail}></Text>
            <TextInput
              style={[
                styles.otpInput,
                isTypingOtp && { letterSpacing: 10 },
              ]}
              value={otp1} // Bind the string state directly
              onChangeText={(value) => {
                if (/^\d*$/.test(value)) {
                  setOtp1(value);
                  setIsTypingOtp(value.length > 0); // update typing state

                  if (value.length === 6) {
                    Keyboard.dismiss();
                  }
                }
              }}
              placeholder="Enter OTP"
              keyboardType="numeric"
              placeholderTextColor="gray"
              maxLength={6}
            />

            <TouchableOpacity
              style={styles.buttonemail}
              onPress={handleOtpVerification1}
            >
              <Text style={styles.buttonTextemail}>Verify OTP</Text>
            </TouchableOpacity>


            {!isOTPVerified && otpTimer === 0 && (
              <TouchableOpacity
                style={[styles.buttonemail]}
                onPress={() => {
                  handleResendOtp();
                  startOtpTimer(); // Restart timer when OTP is resent
                }}
              >
                <Text style={styles.buttonTextemail}>Resend OTP</Text>
              </TouchableOpacity>
            )}
            {otpTimer > 0 && !isOTPVerified && (
              <Text style={styles.timerText}>Resend in {otpTimer}s</Text>
            )}
          </View>
        </View>
      </Modal>


      <Toast />

      <Message3
        visible={showModal}
        onClose={() => setShowModal(false)}  // Optional if you want to close it from outside
        onCancel={handleStay}  // Stay button action
        onOk={handleLeave}  // Leave button action
        title="Are you sure ?"
        message="Your updates will be lost if you leave this page. This action cannot be undone."
        iconType="warning"  // You can change this to any appropriate icon type
      />
    </SafeAreaView>


  );
}


const styles = StyleSheet.create({
  imageContainer: {
    borderRadius: 70,
    alignSelf: 'center',
    justifyContent: 'center',
    height: 140,
    width: 140,
    marginVertical: 10,

  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  avatarText: {
    fontSize: 50,
    fontWeight: 'bold',
  },

  inputTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'black',
    marginBottom: 10,
  },
  otpInput: {
    height: 50,
    width: '80%',
    alignSelf: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    marginVertical: 10,
  },

  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: '#fff',
    height: 50,
    borderRadius: 8,
    fontSize: 16,
    color: '#222',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  inputIcon: {
    position: 'absolute',
    right: 5,
    top: 5,
  },

  inputTitle1: {
    fontSize: 15,
    fontWeight: '490',
    color: 'black',
    padding: 10,

  },
  inputbox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 16,
    color: '#222',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    minHeight: 50,
    maxHeight: 150
  },

  dropdownButton: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  inputText: {
    color: 'black',
    minHeight: 50,
    maxHeight: 200,
    padding: 10,
    fontSize: 15

  },
  closeButton: {
    position: 'absolute',
    top: 10,
    left: 300,
    // padding: 15,
    // marginBottom:15,
    // backgroundColor: '#E0E0E0',
    borderRadius: 50,
  },


  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,

  },
  buttonTextDelete: {
    textAlign: 'center',
    padding: 10,
    color: 'red',
    fontSize: 15,
    fontWeight: '500',
  },
  image: {
    width: 140,
    height: 140,
    borderRadius: 75,
  },
  imageText: {
    color: '#7E7E7E',
  },
  pdfContainer: {
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10

  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 25,
    textAlign: 'center',
    color: '#075cab',
    top: 10,
  },

  pdfText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  pdfUri: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  uploadButton: {
    backgroundColor: 'whitesmoke',
    padding: 10,
    alignItems: 'center',
    width: '60%',
    alignSelf: 'center'
  },
  uploadbtn: {
    paddingVertical: 10,
    alignSelf: 'center'

  },

  uploadButtonText: {
    color: '#075cab',
    fontWeight: '500',
    fontSize: 15,
  },
  Uploadcontainer: {
    textAlign: 'center',
    alignItems: 'center',

  },

  button: {
    borderRadius: 5,
    paddingVertical: 15,
    marginVertical: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#075cab',
    fontSize: 17,
    fontWeight: '500',
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
  modalItemText: {
    fontSize: 18,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#075cab',
  },


  addressfeild: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 15,
    borderColor: 'gray',
    borderWidth: 0.5,
    marginVertical: 20,
  },


  addButtonSmall: {
    backgroundColor: '#007BFF',
    borderRadius: 50,
    padding: 10,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 16,
    color: '#222',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    minHeight: 50,
    maxHeight: 150,
    marginBottom: 10,

  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 16,
    color: '#222',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  modalTitleemail: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
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
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonTextemail: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: '500',
    padding: 5,
  },

  modalContaineremail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Background overlay
  },
  closeButton1: {
    position: 'absolute',
    top: 10,
    right: 10,

    borderRadius: 15,
    padding: 5,
  },
  modalContentemail: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  inputemail1: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    fontSize: 15,

  },
  buttonemailmain: {
    borderRadius: 5,

  },
  buttonTextemailtext: {
    color: '#075cab',
    fontSize: 14,
    fontWeight: '600',
    padding: 10,

  },

  verifiedIcon: {
    marginRight: 10
  },
  input: {
    flexDirection: 'row',
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    borderRadius: 8,
    fontSize: 16,
    color: '#222',

  },
  label: {
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '500',
  },

  dropdownItemText: {
    fontSize: 16,
    color: '#000',
  },

  submitButtonDisabled: {
    borderColor: '#ccc',
    // backgroundColor: '#f2f2f2',
  },

  submitButtonTextDisabled: {
    color: '#999',
  },

  inputrow: {
    flexDirection: 'row',
    justifyContent: 'start',
    alignItems: 'center',

  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 30,
    gap: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#075cab',
    textAlign: 'center',
    marginBottom: 15,
  },
  inputPhoneNumber: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    // paddingHorizontal: 15,
    fontSize: 16,
    color: 'black',
    paddingHorizontal: 15,
    // backgroundColor: '#f8f9fa',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 10,
  },

  buttonText1: {
    color: '#075cab',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    // backgroundColor: '#075cab',
    borderRadius: 8,
    padding: 5,
    // width: '100%', // Full-width button
  },
  timerText: {
    color: 'firebrick',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },


});

export default CompanyUserSignupScreen;