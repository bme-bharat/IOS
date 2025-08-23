import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, TextInput, Text, TouchableOpacity, Modal, ScrollView, SafeAreaView, RefreshControl, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import defaultImage from '../../images/homepage/dummy.png';

import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Message from '../../components/Message';

import RNRestart from 'react-native-restart';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { showToast } from '../AppUtils/CustomToast';
import apiClient from '../ApiClient';
import { useNetwork } from '../AppUtils/IdProvider';
import useLastActivityTracker from '../AppUtils/LastSeenProvider';
import { updateLastSeen } from '../AppUtils/LastSeen';
import { OtpInput } from "react-native-otp-entry";
import { openMediaViewer } from '../helperComponents/mediaViewer';
import GamificationSection from './GamificationSection';


const UserProfileScreen = () => {
  const navigation = useNavigation();
  const profile = useSelector(state => state.CompanyProfile.profile);
  const { myId } = useNetwork();


  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageIconType, setMessageIconType] = useState('');
  const [isResendEnabled, setIsResendEnabled] = useState(true);
  const [timer, setTimer] = useState(30);
  const [step, setStep] = useState(1);
  const [otp, setOTP] = useState('');
  const otpRef = useRef('');
  const [phoneNumber, setPhoneNumber] = useState(profile?.user_phone_number);


  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(countdown);
    } else {
      setIsResendEnabled(true);
    }
  }, [timer]);


  const sendOtp = (phoneNumber) => {
    axios
      .post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/sendVerifyOtpMsg91',
        { command: 'sendVerifyOtpMsg91', user_phone_number: phoneNumber },
        { headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' } }
      )
      .then((otpRes) => {
        if (otpRes.status === 200) {

          showToast("OTP sent", 'success');

        }
      })
      .catch((error) => {
        showToast("Try again later", 'error');

      });
  };

  const handleDeleteAccount = async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      const response = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/deleteAccount',
        {
          command: 'deleteAccount',
          user_phone_number: phoneNumber,
        },
        {
          headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' },
        }
      );

      if (response.data.status === 'success') {

        showToast("Account Deleted successfully", 'success');
        RNRestart.Restart();
        await AsyncStorage.clear();
        await AsyncStorage.removeItem('normalUserData');
        await AsyncStorage.removeItem('NormalUserlogintimeData');


      } else {

        showToast("Account deletion failed or already deleted", 'error');

      }
    } catch (error) {
      showToast("You don't have an internet connection", 'error');

    } finally {
      setIsDeleting(false);
    }
  };

  const handleVerifyOTP = async () => {
    const enteredOTP = otpRef.current;
    console.log('Entered OTP:', enteredOTP);

    if (enteredOTP.length !== 6 || !/^\d{6}$/.test(enteredOTP)) {
      showToast("Please enter a valid 6 digit OTP", 'error');
      return;
    }

    try {
      const res = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/verifyOtpMsg91',
        {
          command: 'verifyOtpMsg91',
          otp: enteredOTP, // ✅ use correct OTP value
          user_phone_number: phoneNumber,
        },
        {
          headers: {
            'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
          },
        }
      );

      if (res.data.type === 'success') {
        await handleDeleteAccount(); // ✅ added `await` in async context
      } else {
        showToast("OTP doesn't match", 'error');
      }
    } catch (error) {
      showToast("Try again later", 'error');
    }
  };

  const resendHandle = async () => {
    try {
      const response = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/resendOtpMsg91',
        { command: 'resendOtpMsg91', user_phone_number: phoneNumber },
        { headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' } }
      );

      if (response.data.type === 'success') {

        showToast("OTP sent", 'success');

        setTimer(30);
        setIsResendEnabled(false);

      } else {

        showToast("Please try again later", 'error');

      }
    } catch (error) {
      showToast(error.message, 'error');

    }
  };


  const handleMessageOk = async () => {
    if (!messageTitle) return;

    try {

      // Retrieve session data
      const sessionData = await AsyncStorage.getItem('userSession');
      if (!sessionData) {
        console.warn("[Logout] Session not found in AsyncStorage.");
        showToast("Session not found", 'error');
        return;
      }

      const parsedSessionData = JSON.parse(sessionData);
      if (!parsedSessionData?.sessionId) {
        console.warn("[Logout] sessionId missing in parsed session data.");
        showToast("Session not found", 'error');
        return;
      }

      const payload = {
        command: 'logoutUserSession',
        session_id: parsedSessionData.sessionId,
      };

      const response = await apiClient.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/logoutUserSession',
        payload
      );

      console.log("[Logout] API Response:", response?.data);

      if (response?.data?.statusCode === 200) {
        showToast("Logout successful", 'success');
      } else {
        console.error("[Logout] Logout failed with message:", response?.data?.message);
        showToast('Logout Failed: ' + response.data.message, 'error');
        return;
      }

      if (myId) {
        console.log("[Logout] Updating last seen for user:", myId);
        await updateLastSeen(myId, new Date().toISOString()); // ✅ use directly
      }


      console.log("[Logout] Clearing session-related AsyncStorage items...");
      await AsyncStorage.multiRemove([
        'normalUserData',
        'NormalUserlogintimeData',
        'userSession',
      ]);

      console.log("[Logout] Restarting app...");
      setTimeout(() => {
        RNRestart.Restart();
      }, 500);

    } catch (error) {
      console.error("[Logout] Error occurred during logout:", error?.message || error);
      showToast("Please check your connection", 'error');
    } finally {
      setMessageVisible(false);
    }
  };


  const handleMessageCancel = () => {
    setMessageVisible(false); // Close modal without any action
  };


  const handleLogout = () => {
    setMessageTitle("Confirm Logout");
    setMessageText("Are you sure you want to logout?");
    setMessageIconType("info");
    setMessageVisible(true);
  };

  const handleDeleteClick = () => {
    setIsModalVisible(true);
    setStep(1);
  };
  const handleYesClick = () => {
    setStep(2);
    sendOtp(phoneNumber);
    setOTP('');
    setTimer(30);
    setIsResendEnabled(false);

  };
  const handleNoClick = () => {
    setIsModalVisible(false);
  };


  const handleUpdate = () => {
    navigation.navigate('UserProfileUpdate', { profile, imageUrl: profile?.imageUrl, });
  };

  return (

    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton}
          activeOpacity={1}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#075cab" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.circle}
          onPress={handleUpdate} activeOpacity={0.8}>
          <MaterialCommunityIcons name="account-edit" size={20} color="#075cab" />
          <Text style={styles.shareText}>Update</Text>
        </TouchableOpacity>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} 
      showsVerticalScrollIndicator={false}  contentContainerStyle={{paddingBottom:'20%'}}>


        <TouchableOpacity activeOpacity={1} onPress={() => openMediaViewer([{ type: 'image', url: profile?.imageUrl }])}
          style={styles.imageContainer}
        >

          {profile?.imageUrl ? (
            <FastImage
              source={{ uri: profile?.imageUrl, priority: FastImage.priority.normal }}
              cache="immutable"
              style={styles.detailImage}
              resizeMode='contain'
              onError={() => { }}
            />
          ) : (
            <View style={[styles.avatarContainer, { backgroundColor: profile?.companyAvatar?.backgroundColor }]}>
              <Text style={[styles.avatarText, { color: profile?.companyAvatar?.textColor }]}>
                {profile?.companyAvatar?.initials}
              </Text>
            </View>
          )}
        </TouchableOpacity>


        <View style={styles.profileBox}>

          <Text style={[styles.title1, { textAlign: 'center', marginBottom: 20 }]}>
            {`${(profile?.first_name || '').trim()} ${(profile?.last_name || '').trim()}`}
          </Text>

          <View style={styles.textContainer}>
            <View style={styles.title}>
              <Text style={styles.label}>Email ID   </Text>
              <Text style={styles.colon}>:</Text>

              <Text style={styles.value}>{(profile?.user_email_id || "").trimStart().trimEnd()}
                <Text>{profile.is_email_verified && (
                  <Ionicons name="checkmark-circle" size={12} color="green" />
                )}</Text>
              </Text>

            </View>

            <View style={styles.title}>
              <Text style={styles.label}>Phone no.        </Text>
              <Text style={styles.colon}>:</Text>

              <Text style={styles.value}>{profile?.user_phone_number || ""}</Text>
            </View>

            <View style={styles.title}>
              <Text style={styles.label}>Profile           </Text>
              <Text style={styles.colon}>:</Text>

              <Text style={styles.value}>{profile?.select_your_profile || ""}</Text>
            </View>
            <View style={styles.title}>
              <Text style={styles.label}>Category         </Text>
              <Text style={styles.colon}>:</Text>

              <Text style={styles.value}>{profile?.category || ""}</Text>
            </View>
            <View style={styles.title}>
              <Text style={styles.label}>State               </Text>
              <Text style={styles.colon}>:</Text>

              <Text style={styles.value}>{profile?.state || ""}</Text>
            </View>
            <View style={styles.title}>
              <Text style={styles.label}>City          </Text>
              <Text style={styles.colon}>:</Text>

              <Text style={styles.value}>{profile?.city || ""}</Text>
            </View>
            <View style={styles.title}>
              <Text style={styles.label}>Gender</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{profile?.gender || ""}</Text>
            </View>

            <View style={styles.title}>
              <Text style={styles.label}>Date of birth </Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{profile?.date_of_birth ? (profile?.date_of_birth) : ""}</Text>
            </View>

            {(profile?.college?.trimStart().trimEnd()) ? (
              <View style={styles.title}>
                <Text style={styles.label}>Institute / Company</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{profile?.college.trimStart().trimEnd()}</Text>
              </View>
            ) : null}

          </View>


          <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
            <Icon name="exit-to-app" size={20} color="#075cab" />
            <Text style={styles.signOutButtonText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteClick} >
            <Icon name="account-remove-outline" size={24} color="red" style={styles.icon} />
            <Text style={styles.deleteAccountButtonText} >Delete account</Text>
          </TouchableOpacity>

          {messageVisible && (
            <Message
              visible={messageVisible}
              title={messageTitle}
              message={messageText}
              iconType={messageIconType}
              onCancel={handleMessageCancel}
              onOk={handleMessageOk} // Always pass the function
            />
          )}

          <Modal
            visible={isModalVisible}
            onRequestClose={() => setIsModalVisible(false)}
            transparent={true}
            animationType="slidein"
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer1}>
                <TouchableOpacity onPress={() => {
                  setIsModalVisible(false);
                  setOTP('');
                  setTimer(null);
                }} style={styles.closeIconContainer}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
                {step === 1 ? (

                  <>
                    <View style={styles.warningContainer}>
                      <Ionicons name="warning" size={30} color="orange" />
                    </View>
                    <Text style={styles.modalTitle}>Confirm Deletion</Text>
                    <Text style={styles.deletionText}>
                      Are you sure you want to delete your account?{'\n\n'}By
                      confirming, you will permanently lose all data associated with
                      this account within 5 business days, including your posts in the feed, comments, uploaded files (images,
                      videos, documents), and transaction details. This action is irreversible. {'\n\n'}
                      <Text style={styles.deletionText1}>Do you wish to proceed?</Text>
                    </Text>
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleYesClick}
                      >
                        <Text style={styles.confirmButtonText}>Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleNoClick}
                      >
                        <Text style={styles.cancelButtonText}>No</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (

                  <>
                    <View style={styles.scrollViewContainer} showsVerticalScrollIndicator={false}>

                      <Text style={styles.infoText}>
                        Enter the OTP sent to: {phoneNumber}
                      </Text>
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
                          filledPinCodeContainerStyle: styles.filledPinCodeContainer,
                          disabledPinCodeContainerStyle: styles.disabledPinCodeContainer,
                        }}
                      />


                      <View style={styles.actionsRow}>
                        {isResendEnabled ? (
                          <TouchableOpacity onPress={resendHandle} style={styles.resendButton}>
                            <Text style={styles.resendButtonText}>Resend OTP</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.timerText}>Resend in {timer}s</Text>
                        )}

                        <TouchableOpacity onPress={handleVerifyOTP} style={styles.verifyButton}>
                          <Text style={styles.resendButtonText}>Verify OTP</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                  </>
                )}
              </View>
            </View>
          </Modal>


        </View>

      </ScrollView >


    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',

  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  backButton: {
    alignSelf: 'flex-start',
    padding: 10,

  },
  circle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,

  },

  shareText: {
    color: '#075cab',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,

  },
  profileBox: {
    justifyContent: 'flex-start',
    backgroundColor: 'white',
    paddingHorizontal: 5
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 80,
    resizeMode: 'contain',
    overflow: 'hidden',
    marginVertical: 20,
    alignSelf: 'center',
    overflow: 'hidden',

  },
  detailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 80,

  },
  title1: {
    flexDirection: 'row',
    fontSize: 15,
    fontWeight: '500',
    color: 'black',
    marginBottom: 5,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'space-between',
    // marginLeft:0,

  },

  title: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: '#0d6efd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10
  },
  label: {
    flex: 1,
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left',
    alignSelf: 'flex-start',

  },

  colon: {
    width: 20,
    textAlign: 'center',
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

  createPostButton: {
    position: 'absolute',
    bottom: 60, // Adjust this value to move the button up or down
    right: 30, // Adjust this value to move the button left or right
    width: 50, // Set the width of the button
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#075cab"
  },
  signOutButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: "center",
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20,
    borderRadius: 5,
    alignSelf: 'center',
    minWidth: 120,
    maxWidth: 200,
  },
  signOutButtonText: {
    color: "#075cab",
    fontSize: 16,
    fontWeight: '600',
    padding: 5,
    alignSelf: 'center'

  },
  deleteAccountButton: {
    justifyContent: "center",
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'center',
    minWidth: 120,
    maxWidth: 200,
  },
  deleteAccountButtonText: {
    color: "red",
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  modalContainerImage: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton1: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  modalImage: {
    width: '100%',
    height: '100%',

    borderRadius: 10,
  },


  warningContainer: {
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },

  deletionText: {
    fontSize: 14,
    color: 'black',
    textAlign: 'justify',
    lineHeight: 23,
    marginBottom: 25,
    fontWeight: '500'
  },
  deletionText1: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  confirmButton: {
    // backgroundColor: 'green',
    paddingHorizontal: 29,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    // backgroundColor: 'red',
    paddingHorizontal: 25,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: 'green',
    fontSize: 16,
    fontWeight: 'bold',
  },

  closeIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalContainer1: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',

  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  pinCodeContainer: {
    borderWidth: 0,
    borderColor: '#ccc',
    borderRadius: 10,
    width: 40,
    height: 45,
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
    fontSize: 20,
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 15
  },

  resendButtonText: {
    color: '#075cab',
    fontSize: 16,
    fontWeight: '600',
    padding: 10,

  },
  timerText: {
    color: '#999',
    fontSize: 13,
    padding: 10,
  },
  verifyButton: {
    alignSelf: 'flex-end',
  },
  resendButton: {
    alignSelf: 'flex-end',
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
    fontWeight: '500'
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
    justifyContent: 'flex-start',

  },

  avatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  avatarText: {
    fontSize: 50,
    fontWeight: 'bold',
  },
  
});

export default UserProfileScreen