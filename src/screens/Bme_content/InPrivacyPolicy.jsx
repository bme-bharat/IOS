import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Linking } from 'react-native';
import apiClient from '../ApiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import RNRestart from 'react-native-restart';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import Warning from '../../assets/svgIcons/warning.svg';
import Close from '../../assets/svgIcons/close-large.svg';

import { colors, dimensions } from '../../assets/theme.jsx';


const InPrivacyPolicy = () => {
  const navigation = useNavigation();

  const profile = useSelector(state => state.CompanyProfile.profile);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResendEnabled, setIsResendEnabled] = useState(true);
  const [timer, setTimer] = useState(30);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(
    profile?.company_contact_number || profile?.user_phone_number || ''
  );

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(countdown);
    } else {
      setIsResendEnabled(true);
    }
  }, [timer]);

  const sendOtp = (phoneNumber) => {
    apiClient
      .post('/sendVerifyOtpMsg91', {
        command: 'sendVerifyOtpMsg91',
        user_phone_number: phoneNumber,
      })
      .then((otpRes) => {
        if (otpRes.status === 200) {

          showToast("OTP Sent", 'success');
        }
      })
      .catch((error) => {

        showToast("Error sending OTP", 'error');
      });
  };


  const handleDeleteAccount = async () => {
    console.log('handleDeleteAccount triggered');
    if (isDeleting) {
      console.log('Deletion already in progress. Skipping...');
      return;
    }

    setIsDeleting(true);
    console.log('Starting account deletion process...');

    try {
      const payload = {
        command: 'deleteAccount',
        user_phone_number: phoneNumber,
      };
      console.log('Sending payload to /deleteAccount:', payload);

      const response = await apiClient.post('/deleteAccount', payload);
      console.log('API Response from /deleteAccount:', response.data);

      if (response.data.status === 'success') {

        showToast("Account Deleted successfully", 'success');

        await AsyncStorage.clear();

        await AsyncStorage.removeItem('normalUserData');
        await AsyncStorage.removeItem('NormalUserlogintimeData');

        RNRestart.Restart();
      } else {

        showToast("Account deletion failed or already deleted", 'error');

      }
    } catch (error) {

      showToast("You don't have an internet connection", 'error');

    } finally {
      setIsDeleting(false);

    }
  };


  const handleVerifyOTP = () => {

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {

      showToast("Please enter a valid 6 digit OTP", 'error');

      return;
    }

    const payload = {
      command: 'verifyOtpMsg91',
      otp,
      user_phone_number: phoneNumber
    };

    console.log('Sending payload to API:', payload);

    apiClient.post('/verifyOtpMsg91', payload)
      .then((res) => {

        if (res.data.type === 'success') {

          handleDeleteAccount();
        } else {

          showToast("OTP doesn't match", 'error');
        }
      })
      .catch((error) => {

        showToast("Try again later", 'error');
      });
  };


  const resendHandle = async () => {
    try {
      const response = await apiClient.post('/resendOtpMsg91', {
        command: 'resendOtpMsg91',
        user_phone_number: phoneNumber
      });

      if (response.data.type === 'success') {

        showToast("OTP sent", 'success');

        setTimer(30);
        setIsResendEnabled(false);

      } else {

        showToast("Failed to resend OTP", 'error');
      }
    } catch (error) {

      showToast("Try again later", 'error');
    }
  };

  const handleDeleteClick = () => {
    setIsModalVisible(true);
    setStep(1);
  };
  const handleYesClick = () => {
    setStep(2);
    sendOtp(phoneNumber);
    setOtp('');
    setTimer(30);
    setIsResendEnabled(false);

  };
  const handleNoClick = () => {
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container1} >
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionHeading}>Privacy Policy</Text>
        <Text style={styles.subValue}>
          This Privacy Policy outlines how B M E Bharat ("we," "us," or "our") collects, uses, discloses, and protects the personal information of users of our biomedical engineering app, B M E Bharat. We are committed to safeguarding your privacy and ensuring the security of your personal data.
          By using the App, you agree to the terms and practices described in this Privacy Policy.
        </Text>
        <Text style={styles.sectionHeading}>Information We Collect:</Text>
        <Text style={styles.subValue}>User-Provided Information:</Text>
        <Text style={styles.subValue}>
          We may collect information that you voluntarily provide when using our App, including but not limited to:
        </Text>
        <Text style={styles.subValue}>
          • Your name{'\n'}
          • Email address{'\n'}
          • Contact information{'\n'}
          • Profile information{'\n'}
          • Content you submit, post, or share on the App
        </Text>

        <Text style={styles.sectionHeading}>Automatically Collected Information:</Text>
        <Text style={styles.subValue}>
          We may automatically collect information about your usage of the App, such as:
        </Text>
        <Text style={styles.subValue}>
          • Device information (e.g., device type, operating system){'\n'}
          • Log data (e.g., IP address, browser type, date and time of access){'\n'}
          • Location data (if you enable location services)
        </Text>

        <Text style={styles.sectionHeading}>How We Use Your Information:</Text>
        <Text style={styles.subValue}>
          We use the collected information for the following purposes:
        </Text>
        <Text style={styles.subValue}>
          • To provide and maintain the App.{'\n'}
          • To personalize and improve your experience with the App.{'\n'}
          • To communicate with you, including sending notifications, updates, and important communications about your account and our services. This includes push notifications, which may be used to share updates, reminders, or critical alerts. You can manage your
          notification preferences through your device settings.{'\n'}
          • To respond to your requests, comments, or questions.{'\n'}
          • To analyze user trends and preferences to enhance the App's features and content.{'\n'}
          • To fulfill legal and regulatory obligations.
        </Text>

        <Text style={styles.sectionHeading}>Sharing of Your Information:</Text>
        <Text style={styles.subValue}>
          We do not sell, trade, or rent your personal information to third parties. However, we may share your information with:
        </Text>
        <Text style={styles.subValue}>
          • Service providers and third-party vendors who assist us in operating and maintaining the App.{'\n'}
          • Legal authorities or other entities when required to comply with the law or protect our rights and interests.
        </Text>

        <Text style={styles.sectionHeading}>Your Choices and Controls:</Text>
        <Text style={styles.subValue}>
          You have certain rights and choices regarding your personal information:
        </Text>
        <Text style={styles.subValue}>
          • You can review and update your account information at any time.{'\n'}
          • You may opt out of receiving marketing communications from us.{'\n'}
          • You can disable location services through your device settings.{'\n'}
        </Text>
        <Text style={styles.sectionHeading}>Opt-Out Procedure:</Text>
        <Text style={styles.subValue}>
          • If you wish to withdraw your consent for the use and disclosure of your personal information as outlined in this policy, or if you want your data to be deleted, please write to us at admin@bmebharat.com or bmebharat@gmail.com. We will process your request promptly.{'\n'}
          <Text style={styles.subValue}> Please note:</Text>{'\n'}
          • Your request shall take effect no later than Five (5) business days from the receipt of your request.{'\n'}
          • After processing, we will no longer use your personal data for any processing activities unless it is required to comply with our legal obligations.{'\n'}
          • Upon withdrawing your consent, some or all of our services may no longer be available to you.{'\n'}
          • We value your privacy and will ensure your request is handled with care.{'\n'}
          •Also, you can request the deletion of your account and associated data by clicking on the  <Text style={styles.link} onPress={handleDeleteClick}> Delete Account </Text>
          {' '}link.

        </Text>

        <Text style={styles.sectionHeading}>Security:</Text>
        <Text style={styles.subValue}>
          We take reasonable measures to protect your information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the internet or electronic storage is entirely secure. We cannot guarantee the absolute security of your data.
        </Text>

        <Text style={styles.sectionHeading}>Children's Privacy:</Text>
        <Text style={styles.subValue}>
          Our App is not intended for children under the age of 13. We do not knowingly collect personal information from individuals under the age of 13. If you believe we have inadvertently collected such information, please contact us to have it removed.
        </Text>

        <Text style={styles.sectionHeading}>Changes to this Privacy Policy:</Text>
        <Text style={styles.subValue}>
          We may update this Privacy Policy to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will provide notice of any material changes and obtain your consent if required by applicable laws.
        </Text>

        <Text style={styles.sectionHeading}>Contact Us:</Text>
        <Text style={styles.subValue}>
          If you have any questions, concerns, or requests related to this Privacy Policy or require assistance related to legal matters, please contact us at:
        </Text>

        <Text style={styles.subValue}>• Email: admin@bmebharat.com  {'\n'}   bmebharat@gmail.com</Text>
        {/* <Text style={styles.subValue}>  bmebharat@gmail.com</Text> */}
        <Text style={styles.subValue}>• Phone Number: +91 8310491223</Text>

        <Text style={styles.subValue}>
          By using our App, you consent to the practices described in this Privacy Policy. Please review this policy regularly to stay informed about how we handle your personal information.
        </Text>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        onRequestClose={() => {
          setIsModalVisible(false);
          setOtp(''); // Reset OTP when modal is closed
        }}

        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <TouchableOpacity onPress={() => {
              setIsModalVisible(false)
              setOtp('');
              setTimer(null);
            }}
              style={styles.closeIconContainer}>
              <Close width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.secondary} />

            </TouchableOpacity>
            {step === 1 ? (

              <>
                <View style={styles.warningContainer}>
                <Warning width={dimensions.icon.large} height={dimensions.icon.large} color={colors.warning} />

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
                <Text style={styles.modalTitle1}>Enter the OTP sent to:</Text>
                <Text style={{ marginVertical: 10 }}>{phoneNumber}</Text>

                <TextInput
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter OTP"
                  keyboardType="numeric"
                  maxLength={6}
                  placeholderTextColor='gray'
                />

                <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOTP}>
                  <Text style={styles.verifyButtonText}>Verify OTP</Text>
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                  {isResendEnabled ? (
                    <TouchableOpacity onPress={resendHandle} style={styles.resendButton}>
                      <Text style={styles.verifyButtonText}>Resend OTP</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.timerText}>Resend in {timer}s</Text>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

    </View >
  );
};


const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    padding: 10

  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  container1: {
    flex: 1,

    backgroundColor: '#fff',
  },
  container: {
    padding: 10,
    backgroundColor: "white"

  },
  list1: {
    color: 'gray'
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
    color: "black",
    textAlign: 'justify',
  },
  link: {
    color: '#075cab',
    textDecorationLine: 'underline'
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text_primary,
    marginBottom: 5,
  },
  value: {
    flex: 2, // Take the remaining space
    flexShrink: 1,
    color: colors.text_secondary,
    fontWeight: '400',
    fontSize: 13,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
    marginBottom: 20,

  },
  subValue: {
    flex: 2, // Take the remaining space
    flexShrink: 1,
    color: colors.text_secondary,
    fontWeight: '300',
    fontSize: 13,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 5,
    marginBottom: 3,
    color: "black",
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 5,
    marginBottom: 3,
    color: "black",
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    // textAlign: 'justify',
    color: "black",
    fontWeight: '300',
  },
  list: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    paddingLeft: 10,
    color: "black",
    fontWeight: '300',

  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
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
  modalTitle1: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text_primary,
    textAlign: 'center',
  },
  deletionText: {
    fontSize: 13,
    fontWeight:'500',
    color: colors.text_secondary,
    textAlign: 'justify',
    lineHeight: 22,
    marginBottom: 25,
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
  otpInput: {
    height: 50,
    width: '80%',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: 'black',
  },
  verifyButton: {
    // backgroundColor: '#4caf50',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  verifyButtonText: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resendContainer: {
    marginTop: 10,
  },
  resendButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
  },

  timerText: {
    fontSize: 14,
    color: 'firebrick',
  },

});


export default InPrivacyPolicy;