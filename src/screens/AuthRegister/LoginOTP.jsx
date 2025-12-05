

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, SafeAreaView, ScrollView, Keyboard,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// ✅ Custom Components
import Message1 from '../../components/Message1';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, getToken, requestPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import messaging from '@react-native-firebase/messaging';
import { showToast } from '../AppUtils/CustomToast';
import { OtpInput } from "react-native-otp-entry";
import { useFcmToken } from '../AppUtils/fcmToken';
import apiClient from '../ApiClient';
import { colors } from '../../assets/theme';


const LoginVerifyOTPScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { fullPhoneNumber, userid, phone } = route.params;
  const [OTP, setOTP] = useState('');
  const otpRef = useRef('');
  const otpInputs = useRef([]);
  const [timer, setTimer] = useState(30);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { fcmToken, refreshFcmToken } = useFcmToken();


  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(countdown);
    } else {
      setIsResendEnabled(true);
    }
  }, [timer]);

  useEffect(() => {

    if (otpInputs.current[0]) {
      otpInputs.current[0].focus();
    }
  }, []);

  const handleVerifyOTP = async () => {
    if (isProcessing) return;

    const enteredOTP = otpRef.current;

    if (enteredOTP.length !== 6 || !/^\d{6}$/.test(enteredOTP)) {
      showToast("Please enter a valid 6 digit OTP", 'error');
      return;
    }
    setIsProcessing(true);

    try {
      let response = null;

      if (fullPhoneNumber) {
        response = await apiClient.post('/verifyOtpMsg91', {
          command: 'verifyOtpMsg91',
          otp: enteredOTP,
          user_phone_number: fullPhoneNumber,
        });
      } else if (phone) {
        response = await apiClient.post('/verifyEmailOtp', {
          command: 'verifyEmailOtp',
          otp: enteredOTP,
          email: phone,
        });
      } else {
        throw new Error("No valid phone number or email provided.");
      }

      const status = response?.data?.status || response?.data?.type;
      const message = response?.data?.message;

      if (status === "success") {
        const sessionCreated = await createUserSession(userid);

        if (!sessionCreated) {
          showToast("Failed to create session. Please try again.", "error");
          setIsProcessing(false);
          return;  // ⛔ STOP LOGIN HERE
        }
        await handleLoginSuccess(userid);
        showToast("Login Successful", 'success');
      } else {
        showToast(message || "Failed to verify OTP. Please try again", 'error');
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";
      showToast(errorMessage, 'error');
    } finally {
      setIsProcessing(false);

    }
  };



  const createUserSession = async (userId) => {
    if (!userId) {
      // console.error("❌ [User ID Missing]: Cannot create session");
      return;
    }

    const finalFcmToken = fcmToken || "FCM_NOT_AVAILABLE";
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
      command: "createUserSession",
      user_id: userId,
      fcm_token: finalFcmToken,
      deviceInfo: deviceInfo,
    };

    try {
      const response = await apiClient.post('/createUserSession', payload);

      if (response?.data?.status === "success") {
        const sessionId = response.data.data.session_id;
        await AsyncStorage.setItem("userSession", JSON.stringify({ sessionId }));
        return true;
      } else {
        return false; 
      }
    } catch (error) {
      return false; 
    }
  };



  const handleLoginSuccess = async (userid) => {
    try {
      const userResponse = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/getUserDetails',
        { command: "getUserDetails", user_id: userid },
        { headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' } }
      );

      const fetchedUserData = userResponse.data.status_message;
      // console.log("fetchedUserData", fetchedUserData);

      const currentTime = Math.floor(Date.now() / 1000);

      if (fetchedUserData.subscription_expires_on < currentTime) {
        // Get the formatted expiration date
        const formattedExpirationDate = formatTimestamp(fetchedUserData.subscription_expires_on);

        // Show alert before navigation
        Alert.alert(
          "Your subscription has expired!",
          `Your subscription expired on ${formattedExpirationDate}. Please renew your subscription.`,
          [
            {
              text: "OK",
              onPress: () => {
                if (fetchedUserData.user_type === "company") {
                  navigation.navigate('CompanySubscriptionLogin', { userId: userid, userDetails: fetchedUserData });
                } else {
                  navigation.navigate('UserSubscriptionLogin', { userId: userid, userDetails: fetchedUserData });
                }
              }
            }
          ]
        );
        return;
      }

      switch (fetchedUserData.user_type) {
        case 'users':
          await handleNormalUser(fetchedUserData);
          break;
        case 'company':
          await handleCompanyUser(userid);
          break;
        case 'BME_ADMIN':
        case 'BME_EDITOR':
          await AsyncStorage.setItem('AdminUserData', JSON.stringify(fetchedUserData));
          // navigation.navigate('AdminBottom');
          navigation.reset({
            index: 0,
            routes: [{ name: 'AdminBottom' }],
          });

          break;
        default:

      }
    } catch (error) {

    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000); // Convert to milliseconds
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are 0-indexed, so we add 1
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };


  const handleNormalUser = async (userData) => {
    try {
      await AsyncStorage.setItem('normalUserData', JSON.stringify(userData));
      // navigation.navigate('UserBottom');
      navigation.reset({
        index: 0,
        routes: [{ name: 'UserBottom' }],
      });

    } catch (error) {

      showToast("You don't have an internet connection", 'error');
    }
  };

  const handleCompanyUser = async (userid) => {
    try {
      const companyResponse = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/getCompanyDetails',
        { command: "getCompanyDetails", company_id: userid },
        { headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' } }
      );

      const companyData = companyResponse.data.status_message;

      const currentTime = Math.floor(Date.now() / 1000);
      if (companyData.subscription_expires_on < currentTime) {

        Alert.alert(
          "Your subscription has expired!",
          " renew your subscription."
        );
        navigation.navigate('CompanySubscriptionLogin', { userId: userid, companyDetails: companyData });
        return;
      }

      const adminApproval = companyData.admin_approval;
      if (adminApproval === "Pending") {
        Alert.alert("Please wait for admin approval");
      } else if (adminApproval === 'Approved') {
        await handleCompanyApproval(companyData);
      } else if (adminApproval === "Rejected") {
        Alert.alert("Your company has been rejected. Press OK to Delete Account");
      }
    } catch (error) {

    }
  };

  const handleCompanyApproval = async (companyData) => {
    try {

      await AsyncStorage.setItem('CompanyUserData', JSON.stringify(companyData));

      navigation.reset({
        index: 0,
        routes: [{ name: 'CompanyBottom' }],
      });

    } catch (error) {
      showToast("You don't have an internet connection", 'error');

    }
  };



  const resendHandle = async () => {
    if (isProcessing) return;  // Prevent duplicate clicks

    try {
      const response = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/resendOtpMsg91',
        { command: 'resendOtpMsg91', user_phone_number: fullPhoneNumber },
        { headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' } }
      );
      if (response.data.type === 'success') {

        showToast("OTP sent", 'success');

        setTimer(30);
        setIsResendEnabled(false);
      } else {

        showToast("Unable to resend\nTry again later", 'error');

      }
    } catch (error) {

      showToast("Unable to resend\nTry again later", 'error');

    } finally {

    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: false, // disables swipe back on iOS
      headerLeft: () => null, // hides back button
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.headerContainer}>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-left" size={24} color="#075cab" />
        </TouchableOpacity>

      </View>
      <View style={styles.scrollViewContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.infoText}>
          Enter the OTP sent to: {fullPhoneNumber || phone}
        </Text>

        <View style={styles.inputContainer}>
          <OtpInput
            numberOfDigits={6}
            focusColor="#075cab"
            autoFocus={true}
            // hideStick={true}
            placeholder="•"
            // blurOnFilled={true}
            disabled={false}
            type="numeric"
            secureTextEntry={false}
            focusStickBlinkingDuration={500}
            onTextChange={(text) => {
              setOTP(text);
              otpRef.current = text; // ✅ latest OTP
            }}
            onFilled={(text) => {
              setOTP(text);
              otpRef.current = text;
              handleVerifyOTP();
            }}

            textInputProps={{
              accessibilityLabel: "One-Time Password",
            }}
            textProps={{
              accessibilityRole: "text",
              accessibilityLabel: "OTP digit",
              allowFontScaling: false,
            }}
            theme={{
              containerStyle: styles.otpContainer,
              pinCodeContainerStyle: styles.pinCodeContainer,
              pinCodeTextStyle: styles.pinCodeText,
              focusStickStyle: styles.focusStick,
              focusedPinCodeContainerStyle: styles.activePinCodeContainer,
              placeholderTextStyle: styles.placeholderText,
              // filledPinCodeContainerStyle: styles.filledPinCodeContainer,
              // disabledPinCodeContainerStyle: styles.disabledPinCodeContainer,
            }}
          />
        </View>

        <View style={styles.actionsContainer}>
          <View style={styles.resendRow}>
            <Text style={styles.subtitle}>Didn't receive OTP?</Text>

            {isResendEnabled ? (
              <TouchableOpacity onPress={resendHandle} style={styles.resendButton}>
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>Resend in {timer}s</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => handleVerifyOTP(OTP)} // ✅ make sure OTP value is passed
            activeOpacity={0.8}
            disabled={OTP.length !== 6 || isProcessing} // ⛔ disable while verifying
            style={[
              styles.verifyButton,
              (OTP.length !== 6 || isProcessing) && styles.disabledButton, // 🔒 apply dim style when not ready or verifying
            ]} >
            <Text style={styles.verifyText}>
              {isProcessing ? 'Verifying...' : 'Verify OTP'} {/* 🕐 feedback text */}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'whitesmoke',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'whitesmoke',
    elevation: 1,  // for Android
    shadowColor: '#000',  // shadow color for iOS
    shadowOffset: { width: 0, height: 1 },  // shadow offset for iOS
    shadowOpacity: 0.1,  // shadow opacity for iOS
    shadowRadius: 2,  // shadow radius for iOS

  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'flex-start',

  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
    fontWeight: '500'
  },
  inputContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  pinCodeContainer: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    width: 45,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  activePinCodeContainer: {
    borderColor: '#075cab',
  },
  filledPinCodeContainer: {
    backgroundColor: '#eaf4ff',
    borderColor: '#075cab',
  },
  disabledPinCodeContainer: {
    backgroundColor: '#f2f2f2',
  },
  pinCodeText: {
    fontSize: 22,
    color: '#000',
    fontWeight: '400',
  },
  focusStick: {
    width: 2,
    height: 25,
    backgroundColor: '#075cab',
  },
  placeholderText: {
    color: '#aaa',
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
  },

  resendButton: {
    paddingHorizontal: 6,
  },
  resendText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline'

  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6, // (React Native 0.71+)
  },

  subtitle: {
    fontSize: 15,
    color: '#555',

  },
  timerText: {
    color: colors.text_secondary,
    fontSize: 14,
    marginLeft: 6,

  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    width: '90%',
    // borderWidth: 1,
    // borderColor: colors.primary
  },
  disabledButton: {
    opacity: 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifyText: {
    color: colors.text_white,
    fontSize: 16,
    fontWeight: '600',

  },
});

export default LoginVerifyOTPScreen;
