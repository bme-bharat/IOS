

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image, StyleSheet, TouchableOpacity, Text, ScrollView, TextInput, Alert, View, Modal, Platform, Pressable, SafeAreaView, ActivityIndicator, ActionSheetIOS, KeyboardAvoidingView, TouchableWithoutFeedback, Linking } from 'react-native';
import axios from 'axios';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import RNFS from 'react-native-fs';
import { CountryCodes, ProfileSelect, stateCityData } from '../../assets/Constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Keyboard } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomDropdown from '../../components/DropDownMenu';
import Message1 from '../../components/Message1';
import Message3 from '../../components/Message3';
import PhoneDropDown from '../../components/PhoneDropDown';
import ImagePicker from 'react-native-image-crop-picker';
import dummy from '../../images/homepage/dummy.png';
import femaleImage from '../../images/homepage/female.jpg';
import ImageResizer from 'react-native-image-resizer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDispatch } from 'react-redux';
import { updateCompanyProfile } from '../Redux/MyProfile/CompanyProfile_Actions';
import { showToast } from '../AppUtils/CustomToast';
import apiClient from '../ApiClient';
import AppStyles from '../AppUtils/AppStyles';
import { launchCamera } from 'react-native-image-picker';
import FastImage from 'react-native-fast-image';
import { MediaPickerButton } from '../helperComponents/MediaPickerButton';
import { useMediaPicker } from '../helperComponents/MediaPicker';
import { colors, dimensions } from '../../assets/theme';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import Camera from '../../assets/svgIcons/camera.svg';
import Close from '../../assets/svgIcons/close.svg';
import Success from '../../assets/svgIcons/success.svg';

import ArrowDown from '../../assets/svgIcons/arrow-down.svg';


const defaultImage = Image.resolveAssetSource(dummy).uri;

const UserProfileUpdateScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const { profile, imageUrl } = route.params;
  const [localImageUrl, setLocalImageUrl] = useState(imageUrl);
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isStateChanged, setIsStateChanged] = useState(false);
  const [isCityChanged, setIsCityChanged] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalVisible1, setModalVisible1] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const collegeRef = useRef(null);
  const [isImageChanged, setIsImageChanged] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(profile.select_your_profile || "");
  const [selectedCategory, setSelectedCategory] = useState(profile.category || "");
  const [availableCategories, setAvailableCategories] = useState([]);
  const [fileType, setFileType] = useState('');


  useEffect(() => {
    if (selectedProfile) {
      const categories =
        ProfileSelect.normalProfiles[selectedProfile] ||
        ProfileSelect.companyProfiles[selectedProfile] ||
        [];
      setAvailableCategories(categories);

      // Reset category if it's not valid for the new profile
      if (!categories.includes(selectedCategory)) {

        setSelectedCategory("");
      } else {

      }
    }
  }, [selectedProfile]);

  const handleProfileSelect = (item) => {

    setSelectedProfile(item.label); // store only the label string
    setHasChanges(true);
  };

  const handleCategorySelect = (item) => {

    setSelectedCategory(item.label); // store only the label string
    setHasChanges(true);
  };


  const focusFirstNameInput = () => {
    if (firstNameRef.current) {
      firstNameRef.current.focus();
    }
  };
  const focusLastNameInput = () => {
    if (lastNameRef.current) {
      lastNameRef.current.focus();
    }
  };
  const focusCollegeInput = () => {
    if (collegeRef.current) {
      collegeRef.current.focus();
    }
  };



  const closeModal = () => {
    setModalVisible1(false);
  };

  const [showModal1, setShowModal1] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [postData, setPostData] = useState({
    user_phone_number: profile.user_phone_number || "",
    user_email_id: profile.user_email_id || "",
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    city: profile.city || "",
    state: profile.state || "",
    gender: profile.gender || "",
    date_of_birth: profile.date_of_birth || "",
    college: profile.college || "",
    fileKey: profile.fileKey || null,
    select_your_profile: profile.select_your_profile || "",
    category: profile.category || ""

  });
  // Check for changes in postData
  useEffect(() => {
    const initialPostData = {
      user_phone_number: profile.user_phone_number || '',
      fileKey: profile.fileKey || null,
      date_of_birth: profile.date_of_birth || '',
      college: profile.college || '',
      gender: profile.gender || '',
      user_email_id: profile.user_email_id || '',
      city: profile.city || '',
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      state: profile.state || '',
      select_your_profile: profile.select_your_profile || "",
      category: selectedCategory || ""
    };

    const hasAnyChanges = Object.keys(initialPostData).some(
      (key) => postData[key] !== initialPostData[key]
    ) || isImageChanged;
    setHasChanges(hasAnyChanges);
  }, [postData, profile, isImageChanged, selectedCategory]);

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



  const [phoneNumber, setPhoneNumber] = useState(""); // Phone number state
  const [countryCode, setCountryCode] = useState("+91"); // Default country code
  const [isOTPVerified, setIsOTPVerified] = useState(false); // OTP verified flag
  const [otp, setOtp] = useState('');
  const [isTypingOtp, setIsTypingOtp] = useState(false);
  const otpInputs = useRef([]); // OTP input refs

  const [otpSent, setOtpSent] = useState(false); // Track OTP sent status
  const [timer, setTimer] = useState(30);  // Timer state (30 seconds)
  const [isResendEnabled, setIsResendEnabled] = useState(true);  // Flag to control resend button state


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

          showToast("This user is already exists\nUse a new number", 'info');

          return;
        } else {
          // User doesn't exist, proceed with sending OTP
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
      // Decrement the timer if it is greater than 0 and resend is disabled
      timerInterval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      // Enable resend button once timer reaches 0
      clearInterval(timerInterval);
      setIsResendEnabled(true); // Enable resend button after timer expires
    }

    return () => clearInterval(timerInterval); // Cleanup on component unmount
  }, [timer, isResendEnabled]);

  const resendHandle = async () => {
    const fullPhoneNumber = ` ${countryCode}${phoneNumber}`;

    try {
      const response = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/resendOtpMsg91',
        { command: 'resendOtpMsg91', user_phone_number: fullPhoneNumber },
        { headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' } }
      );

      if (response.data.type === 'success') {

        showToast("OTP", 'success');

        setTimer(30);
        setIsResendEnabled(false);
      } else {

        showToast("Unable to resend OTP\nTry again", 'error');

      }
    } catch (error) {
      showToast("Check your connection and try again", 'error');
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
    const enteredOTP = String(otp || '').trim();

    if (enteredOTP.length !== 6 || !/^\d+$/.test(enteredOTP)) {

      showToast("Please enter a valid 6 digit OTP", 'error');
      return;
    }

    const fullPhoneNumber = `${String(countryCode || '').trim()}${String(phoneNumber || '').trim()}`;

    axios.post(
      'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/verifyOtpMsg91',
      {
        command: 'verifyOtpMsg91',
        otp: enteredOTP,
        user_phone_number: fullPhoneNumber,
      },
      {
        headers: {
          'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
        },
      }
    )
      .then((res) => {
        if (res.data.type === "success") {
          setIsOTPVerified(true);

          showToast("OTP verified", 'success');

        } else {

          showToast("OTP doesn't match", 'error');
        }
      })
      .catch((error) => {

        showToast(error.message || "Something went wrong", 'error');
      });
  };



  const validation = () => {

    if (!phoneNumber || phoneNumber.length < 10) {

      showToast("Please enter a valid phone number", 'info');
      return false;
    }
    return true;
  };

  // Handle phone number update
  const handlePhoneNumberUpdate = () => {
    const fullPhoneNumber = ` ${countryCode}${phoneNumber}`;
    setPostData((prevData) => ({
      ...prevData,
      user_phone_number: fullPhoneNumber,
    }));
    setModalVisible(false);
  };

  const genderOptions = [
    { label: 'Male', key: 'male' },
    { label: 'Female', key: 'female' },
    { label: 'Others', key: 'others' },
  ];

  const minimumDate = new Date(1990, 0, 1); // January 1, 1990
  const maximumDate = new Date(2012, 0, 1); // January 1, 2011

  const defaultDateOfBirth = new Date(1990, 0, 1);
  useEffect(() => {
    if (profile?.date_of_birth) {
      const parts = profile.date_of_birth.split(/[-\/]/); // handles both "14-09-2001" and "14/09/2001"
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const parsedDate = new Date(`${year}-${month}-${day}T00:00:00`); // ISO-friendly format
        if (!isNaN(parsedDate.getTime())) {
          setDateOfBirth(parsedDate);
        }
      }
    }
  }, [profile]);

  const formatDateToDDMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear(); // returns full year like 2001
    return `${day}/${month}/${year}`; // → "14/09/2001"
  };


  const handleDateChange = (event, selectedDate) => {
    setHasChanges(true);
    setShowDatePicker(false);
    if (event.type === 'dismissed') return;

    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setDateOfBirth(selectedDate);
    }
  };



  // Open the date picker
  const openDatePicker = () => {
    setShowDatePicker(true);
  };


  const [selectedState, setSelectedState] = useState(profile.state || '');
  const [selectedCity, setSelectedCity] = useState(profile.city || '');


  const states = Object.keys(stateCityData).map((state) => ({
    label: state,
    key: state,
  }));

  const cities = postData.state && stateCityData[postData.state]
    ? stateCityData[postData.state].map((city) => ({
      label: city,
      key: city,
    }))
    : [];


  const handleStateSelect = (item) => {
    setPostData({
      ...postData,
      state: item.label,
      city: "", // reset city when state changes
    });

    showToast('Please select city', 'info'); // toast when state changes
  };


  const handleCitySelect = (item) => {
    setPostData({
      ...postData,
      city: item.label,
    });
  };


  const [imageUri, setImageUri] = useState(null);
  const [fileUri, setFileUri] = useState(null);
  const [fileKey, setFileKey] = useState(null);

  const handleImageSelection = () => {
    const hasImage = postData.fileKey && postData.fileKey.trim() !== '';

    const options = [
      'Take Photo',
      'Choose from Gallery',
      hasImage ? 'Remove Image' : null,
      'Cancel',
    ].filter(Boolean);

    const cancelButtonIndex = options.indexOf('Cancel');
    const destructiveButtonIndex = hasImage ? options.indexOf('Remove Image') : undefined;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      (buttonIndex) => {
        const selectedOption = options[buttonIndex];

        if (selectedOption === 'Take Photo') {
          openCamera();
        } else if (selectedOption === 'Choose from Gallery') {
          openGallery();
        } else if (selectedOption === 'Remove Image') {
          handleRemoveImage();
        }
      }
    );
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
        const uri = image.path;
        setImageUri(uri);
        setFileUri(uri);

        setFileType(image.mime);
        setIsImageChanged(true);

        ImageResizer.createResizedImage(uri, 800, 600, 'JPEG', 80)
          .then((resizedImage) => {
            const resizedImageSize = resizedImage.size / 1024 / 1024;
            if (resizedImage.size > image.size) {
              // Keep original if smaller
              return;
            }

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
        if (error.code === 'E_PICKER_CANCELLED') {
          // User cancelled camera
        } else {
          console.error('Camera error: ', error);
        }
      });
  };



  const handleRemoveImage = async () => {
    if (!fileKey && !localImageUrl) {
      return;
    }

    try {
      if (fileKey) {
        await handleDeleteOldImage(fileKey);
      }

      setImageUri(null);
      setFileKey(null);
      setLocalImageUrl(null);
      setPostData(prevState => ({
        ...prevState,
        fileKey: null,
      }));

      // now <Image /> will automatically fallback to defaultImage
    } catch (error) {
      showToast("Error while deleting image\nPlease try again", 'error');
    }
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
        const initialImageSize = image.size / 1024 / 1024;
        console.log(`Initial image size: ${initialImageSize.toFixed(2)} MB`);

        const uri = image.path;
        setImageUri(uri);
        setFileUri(uri);
        setFileType(image.mime);
        setIsImageChanged(true);

        ImageResizer.createResizedImage(uri, 800, 600, 'JPEG', 80)
          .then((resizedImage) => {
            const resizedImageSize = resizedImage.size / 1024 / 1024;

            if (resizedImage.size > image.size) {
              return; // Don't update if compression made it worse
            }

            if (resizedImageSize > 5) {
              showToast("Image size shouldn't exceed 5MB", 'error');
              return;
            }

            setImageUri(resizedImage.uri);
            setFileUri(resizedImage.uri);
          })
          .catch((err) => {
            console.error('Image Resizing Error: ', err);
            showToast("Failed to resize the image", 'error');
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
      // Get the actual file size using RNFS.stat
      const fileStat = await RNFS.stat(fileUri);
      const fileSize = fileStat.size;


      // Check if file size exceeds the 5MB limit
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
        const fileBlob = await uriToBlob(fileUri);

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': fileType,
          },
          body: fileBlob,
        });

        if (uploadRes.status === 200) {

          showToast("File uploaded", 'success');
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

  const handleDeleteOldImage = async (fileKey) => {
    try {
      const apiEndpoint = "https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/deleteFileFromS3";
      const deleteResponse = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
        },
        body: JSON.stringify({ command: "deleteFileFromS3", key: fileKey }),
      });

      const deleteResult = await deleteResponse.json();

      if (deleteResponse.ok && deleteResult.statusCode === 200) {

        return;
      } else {
        // console.error("Delete failed with status code:", deleteResult.statusCode);
        throw new Error("Failed to delete image");
      }
    } catch (error) {
      // console.error("Error in delete function:", error);
      Alert.alert("Error", "Failed to delete image");
      throw error; // Re-throw to propagate the error
    }
  };

  useEffect(() => {
    // Load initial profile data if necessary
    if (profile.fileKey) {
      setFileKey(profile.fileKey);
    }
  }, [profile]);

  const [intervalId, setIntervalId] = useState(null); // To clear the timer if needed
  const [otpTimer, setOtpTimer] = useState(30); // Time left for resend OTP
  const [isOtpSent, setIsOtpSent] = useState(false); // Track if OTP is sent
  const [modalVisibleemail, setModalVisibleemail] = useState(false); // Modal visibility for OTP verification
  const [otp1, setOtp1] = useState('');
  const [isVerifyClicked, setIsVerifyClicked] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState(() => {
    return profile?.is_email_verified && postData?.user_email_id ? postData.user_email_id : '';
  });

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


  const handleOtpEmail = async () => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(postData.user_email_id.trim())) {

      showToast("Please provide a valid email Id", 'error');
      return;
    }
    if (!postData.user_email_id.trim()) {

      showToast("Please provide a valid email Id", 'error');
      return;
    }

    setIsVerifyClicked(true);
    setOtpLoading(true);

    const otpResponse = await apiClient.post(
      "/sendEmailOtp",
      {
        command: "sendUpdateEmailOtp",
        email: postData.user_email_id,
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
    setOtpLoading(false);
  };

  const handleOtpVerification1 = async () => {
    if (!postData.user_email_id?.trim()) {

      showToast("Please provide a valid email Id", 'error');
      return;
    }

    if (!otp1.trim()) {

      showToast("Please enter valid OTP", 'error');
      return;
    }

    try {
      const response = await apiClient.post(
        '/verifyEmailOtp',
        {
          command: "verifyEmailOtp",
          email: postData.user_email_id,
          otp: otp1, // Use otp1 directly since it's a string
        },
        {
          headers: {
            'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
          },
        }
      );

      if (response.data.status === "success") {
        setVerifiedEmail(true)
        setPostData((prevState) => {
          const updatedState = {
            ...prevState,
            is_email_verified: true,
          };

          return updatedState;
        });

        Keyboard.dismiss();

        showToast("Email verified", 'success');
        setModalVisibleemail(false);
      } else {

        showToast(response.data.errorMessage || "Invalid OTP.", 'error');
      }
    } catch (error) {

      showToast("Error verifying OTP. Please try again", 'error');
    }
  };


  const handleResendOtp = async () => {
    if (!postData.user_email_id.trim()) {
      showToast("Please provide a valid email Id", 'error');
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
          email: postData.user_email_id,
        },
        {
          headers: {
            'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
          },
        }
      );

      if (response.data.status === "success") {

        showToast("OTP sent", 'success');

        startOtpTimer();
      } else {

        showToast(response.data.errorMessage, 'error');
      }
    } catch (error) {

      showToast("Try again later", 'error');
    }
  };


  const handleInputChange = (key, value) => {
    if (value === "") {
      setPostData(prevState => ({
        ...prevState,
        [key]: "",
      }));
      return;
    }

    if (value.startsWith(" ")) {

      showToast("Leading spaces and special characters are not allowed", 'error');
      return;
    }

    let trimmedValue = value.replace(/^\s+/, "");
    if (value.length > 0 && trimmedValue === "") {

      showToast("Leading spaces and special characters are not allowed", 'error');
      return;
    }

    if ((key === "first_name" || key === "last_name") && !/^[A-Za-z ]*$/.test(trimmedValue)) {

      showToast("Leading spaces and special characters are not allowed", 'error');
      return;
    }

    setPostData(prevState => {
      let updatedData = { ...prevState, [key]: trimmedValue };

      // Reset verification state if the email is changed
      if (key === "company_email_id" || key === "user_email_id") {
        updatedData.is_email_verified = trimmedValue === verifiedEmail;
      }

      return updatedData;
    });
  };


  const FILE_SIZE_LIMIT_MB = 5;  // 5MB
  const FILE_SIZE_LIMIT_KB = FILE_SIZE_LIMIT_MB * 1024;  // Convert MB to KB
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);


  const handlePostSubmission = async () => {
    setLoading(true);

    if (!postData.city.trim()) {
      showToast("Select a city", 'info');
      setLoading(false);
      return;
    }

    const trimmedFirstName = postData.first_name.trim();
    if (trimmedFirstName.length < 3) {

      showToast("The first name must be at least 3 characters", 'info');
      setLoading(false);
      return;
    }

    const trimmedLastName = postData.last_name.trim();

    try {
      // Validate file size if image is provided
      if (imageUri) {
        const fileStats = await RNFS.stat(imageUri);
        const fileSizeInKB = fileStats.size / 1024;

        if (fileSizeInKB > FILE_SIZE_LIMIT_KB) {

          showToast("File size shouldn't exceed 5MB", 'error');
          setLoading(false);
          return;
        }
      }

      if (profile.fileKey && imageUri) {
        await handleDeleteOldImage(profile.fileKey);
      }

      const imageFileKey = imageUri ? await handleUploadImage(imageUri, fileType) : postData.fileKey;

      setHasChanges(false);

      const emailToSend = postData.is_email_verified ? postData.user_email_id : verifiedEmail;

      const postPayload = {
        command: 'updateUserDetails',
        user_id: profile.user_id,
        user_phone_number: postData.user_phone_number?.trimStart().trimEnd(),
        user_email_id: emailToSend?.trimStart().trimEnd(),
        is_email_verified: postData.is_email_verified,
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        city: postData.city,
        state: postData.state,
        date_of_birth: dateOfBirth ? formatDateToDDMMYYYY(dateOfBirth) : '',
        gender: postData.gender?.trimStart().trimEnd(),
        college: postData.college?.trimStart().trimEnd(),
        fileKey: imageFileKey || null,
        select_your_profile: selectedProfile,
        category: selectedCategory,

        // dark_mode: { android: false, ios: false, web: false }, 
      };

      const res = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/updateUserDetails',
        postPayload,
        {
          headers: {
            'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
          },
        }
      );
      console.log('res', res.data)
      if (res.data.status === 'success') {
        setIsImageChanged(false);

        showToast("Profile updated successfully", 'success');

        await fetchProfile();

        setTimeout(() => {
          navigation.goBack();
        }, 100);
      } else {

        showToast(res.data.errorMessage || 'Failed to update profile', 'error');
      }
    } catch (error) {

    } finally {
      setHasChanges(false);
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await apiClient.post('/getUserDetails', {
        command: 'getUserDetails',
        user_id: profile.user_id,
      });

      if (response.data.status === 'success') {
        const profileData = response.data.status_message;
        const fileKey = profileData?.fileKey;
        profileData.fileKey = fileKey;
        let imageUrl = null;

        if (fileKey) {
          const res = await apiClient.post('/getObjectSignedUrl', {
            command: 'getObjectSignedUrl',
            key: fileKey,
          });
          imageUrl = res.data;
          profileData.imageUrl = imageUrl;
        }

        const authorImagePayload = {
          authorId: profile.user_id,
          newFileKey: fileKey,
          newImageUrl: imageUrl,
        };

        dispatch({
          type: 'UPDATE_AUTHOR_IMAGE_FOR_POSTS',
          payload: authorImagePayload,
        });

        console.log('Dispatching UPDATE_COMPANY_PROFILE with payload:', profileData);
        dispatch(updateCompanyProfile(profileData));
        return profileData;
      }
    } catch (error) {
      console.log('Dispatching null profile due to error:', error);
      dispatch(updateCompanyProfile(null));
      return null;
    }
  };




  const imageSource = localImageUrl
    ? { uri: localImageUrl }
    : imageUri
      ? { uri: imageUri }
      : require("../../images/homepage/dummy.png");;


  return (

    <View style={styles.container} >
      <View style={styles.headerContainer}>


        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

        </TouchableOpacity>
      </View>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: '20%', paddingHorizontal: 5, }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Edit your profile</Text>

        <TouchableOpacity onPress={handleImageSelection} style={styles.imageContainer}>

          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="contain"
          />


          <TouchableOpacity style={styles.cameraIconContainer} onPress={handleImageSelection}>
            <Icon name="camera-enhance" size={22} color="#333" />
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.inputContainer}>

          <Text style={styles.title}>First name <Text style={{ color: 'red' }}>*</Text></Text>
          <TouchableOpacity style={styles.inputWrapper} onPress={focusFirstNameInput} activeOpacity={0.8}>

            <TextInput
              style={styles.input}
              ref={firstNameRef}
              value={postData.first_name}
              onChangeText={(value) => handleInputChange('first_name', value)}
              placeholder="First Name"
            />
            <Icon name="edit" size={18} color="#888" style={styles.inputIcon} />
          </TouchableOpacity>

        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.title}>Last name</Text>
          <TouchableOpacity style={styles.inputWrapper} onPress={focusLastNameInput} activeOpacity={0.8}>
            <TextInput
              style={styles.input}
              ref={lastNameRef}
              value={postData.last_name}
              onChangeText={(value) => handleInputChange('last_name', value)}
              placeholder="Last Name"
              placeholderTextColor="gray"
            />
            <Icon name="edit" size={18} color="#888" style={styles.inputIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer} >
          <Text style={styles.title}>
            Phone no. <Text style={{ color: 'red' }}>*</Text>
          </Text>

          <TouchableOpacity style={styles.inputWrapper} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
            <TextInput
              style={styles.input}
              value={postData.user_phone_number}
              onChangeText={(value) => handleInputChange('user_phone_number', value)}
              editable={false}
              placeholder="Phone Number"
              placeholderTextColor="gray"
            />
            <Icon name="edit" size={18} color="#888" style={styles.inputIcon} />
          </TouchableOpacity>
        </View>


        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >

          <View style={styles.modalOverlay}
            onPress={() => {
              setModalVisible(false)
              setPhoneNumber('')
              setOtpSent(false)
              setIsOTPVerified(false)
              setTimer(0)
              setCountryCode('+91')
              setOtp(['', '', '', '', '', '']);
            }

            }>


            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setPhoneNumber(''); // Reset the phone number state
                  setModalVisible(false); // Close the modal
                  setOtpSent(false)
                  setIsOTPVerified(false)
                  setTimer(0)
                  setCountryCode('+91')
                  setOtp(['', '', '', '', '', '']);
                }}
              // Close the modal when clicked
              >
                <Icon name="close" size={24} color="black" />
              </TouchableOpacity>
              <View style={styles.inputrow}>
                <View style={[styles.code, { width: "25%" }]}>
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
                  placeholderTextColor="gray"
                  maxLength={10}
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
                        setIsTypingOtp(value.length > 0);
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

                  {/* Verify OTP Button */}
                  <TouchableOpacity onPress={handleVerifyOTP} style={{ alignSelf: 'center', }}>
                    <Text style={styles.buttonText}>Verify</Text>
                  </TouchableOpacity>

                  {/* Conditionally render the timer or the resend OTP button */}
                  {!isResendEnabled ? (
                    <Text style={styles.timerText}>Resend in {timer}s</Text>
                  ) : (
                    <TouchableOpacity onPress={resendHandle} style={{ alignSelf: 'center', }}>
                      <Text style={styles.buttonText}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {!otpSent && (
                <TouchableOpacity onPress={sendOTPHandle} style={{ alignSelf: 'center', }}>
                  <Text style={styles.buttonText}>Get verification code</Text>
                </TouchableOpacity>
              )}

              {isOTPVerified && (
                <TouchableOpacity onPress={handlePhoneNumberUpdate} style={{ alignSelf: 'center', }}>
                  <Text style={styles.buttonText}>Update</Text>
                </TouchableOpacity>
              )}
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
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>

              <Text style={styles.modalTitleemail}></Text>
              <TextInput
                style={styles.inputemail}
                value={otp1} // Bind the string state directly
                onChangeText={(value) => {
                  setOtp1(value); // Update the string directly
                  if (value.length === 6) {
                    Keyboard.dismiss(); // Dismiss keyboard when 6 digits are entered
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
                <Text style={styles.buttonText}>Verify OTP</Text>
              </TouchableOpacity>


              {!isOTPVerified && otpTimer === 0 && (
                <TouchableOpacity
                  style={[styles.buttonemail]}
                  onPress={() => {
                    handleResendOtp();
                    startOtpTimer(); // Restart timer when OTP is resent
                  }}
                >
                  <Text style={styles.buttonText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
              {otpTimer > 0 && !isOTPVerified && (
                <Text style={styles.timerText}>Resend in {otpTimer}s</Text>
              )}
            </View>
          </View>
        </Modal>

        <View style={styles.inputContainer}>
          <Text style={[styles.title]}>Email ID <Text style={{ color: 'red' }}>*</Text></Text>
          <View style={styles.inputWithButton}>
            <TextInput
              style={styles.input}
              value={postData.user_email_id || ''}
              onChangeText={(value) => handleInputChange('user_email_id', value)}
              placeholder="Email"
              editable={!postData.is_email_verified}

            />
            {profile.is_email_verified && postData.user_email_id === profile.user_email_id ? (
              <Success
                width={dimensions.icon.small}
                height={dimensions.icon.small}
                color={colors.success}
              />
            ) : (
              <TouchableOpacity
                style={styles.buttonemailmain}
                onPress={handleOtpEmail}
              >
                <Text style={styles.buttonTextemailtext}>
                  {otpLoading ? 'Sending' : 'Verify'}
                </Text>
              </TouchableOpacity>
            )}

          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.title}>Profile Type</Text>

          <CustomDropdown
            items={Object.keys({ ...ProfileSelect.normalProfiles }).map(p => ({
              label: p,
              key: p,
            }))}
            onSelect={handleProfileSelect}
            placeholder={selectedProfile || "Select Profile Type"}
            buttonStyle={styles.dropdownButton}
            buttonTextStyle={styles.dropdownButtonText}
            placeholderTextColor="gray"
          />
        </View>


        {selectedProfile && (
          <View style={styles.inputContainer}>
            <Text style={styles.title}>Category <Text style={{ color: 'red' }}>*</Text></Text>
            <CustomDropdown
              items={availableCategories.map((cat) => ({
                label: cat,
                key: cat,
              }))}
              onSelect={handleCategorySelect}
              placeholder={selectedCategory || "Select Specialization"}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
              placeholderTextColor="gray"
              disabled={!selectedProfile}
            />
          </View>
        )}


        <View style={styles.inputContainer}>
          <Text style={styles.title}>Gender <Text style={{ color: 'red' }}>*</Text></Text>
          <CustomDropdown
            items={genderOptions}
            onSelect={(item) => handleInputChange('gender', item.label)}
            placeholder={postData.gender || "Select Gender"}
            buttonStyle={styles.dropdownButton}
            buttonTextStyle={styles.dropdownButtonText}
            placeholderTextColor="gray"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.title}>
            Date of birth <Text style={{ color: 'red' }}>*</Text>
          </Text>

          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
            <Text style={styles.datePickerButtonText}>
              {dateOfBirth ? formatDateToDDMMYYYY(dateOfBirth) : 'Select Date of Birth'}
            </Text>
            <ArrowDown width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth || defaultDateOfBirth}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
            />
          )}
        </View>

        <View style={[styles.inputContainer, {}]}>
          <Text style={[styles.title, {}]}>State <Text style={{ color: 'red' }}>*</Text></Text>
          <CustomDropdown
            items={states}
            onSelect={handleStateSelect}
            placeholder={postData.state || "Select State"}
            buttonStyle={styles.dropdownButton}
            buttonTextStyle={styles.dropdownButtonText}
            placeholderTextColor="gray"

          />

        </View>
        <View style={[styles.inputContainer, {}]}>
          <Text style={[styles.title, {}]}>City <Text style={{ color: 'red' }}>*</Text></Text>

          <CustomDropdown
            items={cities}
            onSelect={handleCitySelect}
            placeholder={postData.city || "Select City"}
            buttonStyle={styles.dropdownButton}
            buttonTextStyle={styles.dropdownButtonText}
            placeholderTextColor="gray"
            disabled={!postData.state}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.title}>Institute / Company:</Text>
          <TouchableOpacity style={styles.inputWrapper} onPress={focusCollegeInput} activeOpacity={0.8}>
            <TextInput
              style={styles.input}
              ref={collegeRef}
              value={postData.college}
              onChangeText={(value) => handleInputChange('college', value)}
              placeholderTextColor="gray"
            />
            <Icon name="edit" size={18} color="#888" style={styles.inputIcon} />
          </TouchableOpacity>

        </View>
        <TouchableOpacity
          style={[
            AppStyles.Postbtn,
            (!hasChanges || loading) && styles.submitButtonDisabled
          ]}
          disabled={!hasChanges || loading}
          onPress={handlePostSubmission}
        >
          {loading ? (
            <ActivityIndicator size={20} color="#999" />
          ) : (
            <Text
              style={[
                AppStyles.PostbtnText,
                (!hasChanges || loading) && styles.submitButtonTextDisabled
              ]}
            >
              Update
            </Text>
          )}
        </TouchableOpacity>

        <Message1
          visible={modalVisible1}
          onClose={closeModal}
          onOk={closeModal}
          title={modalTitle}
          message={modalMessage}
          iconType="warning"
        />

        <Message3
          visible={showModal1}
          onClose={() => setShowModal1(false)}
          onCancel={handleStay}
          onOk={handleLeave}
          title="Are you sure ?"
          message="Your updates will be lost if you leave this page. This action cannot be undone."
          iconType="warning"
        />

      </KeyboardAwareScrollView>
      <Toast />
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 1,
    backgroundColor: 'whitesmoke'
  },
  downIcon: {
    position: 'absolute',
    right: 10,
    top: '40%',  // Adjust to align with text properly
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent overlay
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
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    // padding: 15,
    // marginBottom:15,
    // backgroundColor: '#E0E0E0',
    borderRadius: 50,
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
  inputrow: {
    flexDirection: 'row',
    justifyContent: 'start',
    alignItems: 'center',
    // paddingHorizontal:15,

  },
  backButton: {
    margin: 10,
    alignSelf: 'flex-start'
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  buttonText: {
    color: '#075cab',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    // backgroundColor: '#075cab',
    borderRadius: 8,
    padding: 5,
    // width: '100%', // Full-width button
  },

  updateButton: {
    backgroundColor: '#3b5998', // A different color for Update button
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 25,
    textAlign: 'center',
    color: '#075cab',
    top: 10,
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
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,

  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
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
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    lineHeight: 100,
  },

  placeholderContainer: {
    alignItems: 'center', // Center align the image and text
    justifyContent: 'center',
    width: 100, // Same as image width
    height: 100, // Same as image height
  },
  placeholderText: {
    marginTop: 5,
    color: 'gray',
    textAlign: 'center',
  },

  timerText: {
    color: 'firebrick',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },

  submitButtonDisabled: {
    borderColor: '#ccc',
    // backgroundColor: '#f2f2f2',
  },

  submitButtonTextDisabled: {
    color: '#999',
  },

  title: {
    color: colors.text_primary,
    fontSize: 15,
    fontWeight: '500',
    marginVertical: 5,
    paddingHorizontal: 5,
  },

  input: {
    height: 40,
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#ddd',
    color: colors.text_secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
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
    borderColor: '#ddd'
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text_secondary,
    flex: 1,
    paddingVertical: 5,

  },

  inputWithButton: {
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

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
  },
  buttonTextemailresend: {
    color: '#FF0000',
    fontSize: 15,
    fontWeight: '500',
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
    fontSize: 13,
    fontWeight: '500',
    color: colors.text_primary,
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',



  },
  buttonemailmain: {
    backgroundColor: '#fff',
    // paddingVertical: 13,
    // paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonTextemailtext: {
    color: '#075cab',
    fontSize: 14,
    fontWeight: '600',
    padding: 10,
  },
  inputContainer: {
    marginBottom: 10,
    color: "black",

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

  label: {
    color: "black",
    fontWeight: 500,
    fontSize: 15,
    marginVertical: 5
  },

  inputContainer1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerButton: {
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
    paddingHorizontal: 12
  },
  datePickerButtonText: {
    fontSize: 14,
    color: colors.text_secondary,
    fontWeight: '500'
  },
});

export default UserProfileUpdateScreen;