import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Keyboard, BackHandler, StatusBar } from 'react-native';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { showToast } from '../AppUtils/CustomToast';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { OtpInput } from "react-native-otp-entry";
import { colors, dimensions } from '../../assets/theme';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';

const VerifyOTPScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedCategory, selectedProfile, userType, fullPhoneNumber } = route.params;

  const [otp, setOTP] = useState('');
const otpRef = useRef('');

  const otpInputs = useRef([]);
  const [resendVisible, setResendVisible] = useState(false);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [isResendEnabled, setIsResendEnabled] = useState(false);


  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(countdown);
    } else {
      setResendVisible(true);
      setIsResendEnabled(true);
    }
  }, [timer]);

  useEffect(() => {

    if (otpInputs.current[0]) {
      otpInputs.current[0].focus();
    }
  }, []);

  const handleOTPChange = (index, value) => {
    setOTP((prevOTP) => {
      const otpCopy = [...prevOTP];

      if (value === '') {
        console.log(`Clearing digit at index: ${index}`);
        otpCopy[index] = ''; // Clear digit

        if (index > 0) {
          console.log(`Moving focus to index: ${index - 1}`);
          requestAnimationFrame(() => otpInputs.current[index - 1]?.focus());
        }
      } else if (/^\d$/.test(value)) {
        otpCopy[index] = value;
        if (index < otpCopy.length - 1 && otpCopy[index + 1] === '') {
          requestAnimationFrame(() => otpInputs.current[index + 1]?.focus());
        } else if (index === otpCopy.length - 1) {

          Keyboard.dismiss();
        }
      }

      return otpCopy;
    });
  };


  const handleKeyPress = ({ nativeEvent }, index) => {

    if (nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      setOTP((prevOTP) => {
        const otpCopy = [...prevOTP];
        otpCopy[index - 1] = '';
        requestAnimationFrame(() => otpInputs.current[index - 1]?.focus());
        return otpCopy;
      });
    }
  };




  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: false, // disables swipe back on iOS
      headerLeft: () => null, // hides back button
    });
  }, [navigation]);



  const handleVerifyOTP = () => {
    const enteredOTP = otpRef.current; 
    console.log('Entered OTP:', enteredOTP); // ✅ LOGGING

    if (enteredOTP.length !== 6 || !/^\d+$/.test(enteredOTP)) {

      showToast("Please enter a valid 6 digit OTP", 'error');

      return;
    }

    axios.post('https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/verifyOtpMsg91', {
      command: 'verifyOtpMsg91',
      otp: enteredOTP,
      user_phone_number: fullPhoneNumber,
    }, {
      headers: {
        'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
      },
    })
      .then((res) => {
        if (res.data.type === "success") {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: userType === 'company' ? "CompanyUserSignup" : "UserSignup",
                  params: { fullPhoneNumber, selectedProfile, selectedCategory, userType },
                },
              ],
            })
          );

        } else {

          showToast("OTP doesn't match", 'error');

        }
      })
      .catch((error) => {

        showToast("Try again later", 'error');
      });
  };

  const resendHandle = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/resendOtpMsg91',
        { command: 'resendOtpMsg91', user_phone_number: fullPhoneNumber },
        { headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' } }
      );
      setLoading(false);

      if (response.data.type === 'success') {

        showToast("OTP sent", 'success');

        setTimer(30);
        setIsResendEnabled(false);
      } else {

        showToast("Failed to resend OTP. Check your connection and try again", 'error');
      }
    } catch (error) {
      setLoading(false);

      showToast("Failed to resend OTP. Check your connection and try again", 'error');
    }
  };

  return (
    <View style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

    {/* ========== Header ========== */}

    <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigation.navigate('ProfileType')}
    >
      <ArrowLeftIcon
        width={dimensions.icon.medium}
        height={dimensions.icon.medium}
        color={colors.primary}
      />
    </TouchableOpacity>


    {/* ========== Main Content ========== */}
    <View style={styles.content}>
      <Text style={styles.title}>OTP Verification</Text>

      <Text style={styles.infoText}>
        Enter OTP sent to <Text style={styles.phoneNumber}>{fullPhoneNumber || phone}</Text>
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
              placeholderTextStyle: styles.placeholderText,

            }}
          />
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
            onPress={handleVerifyOTP}
            activeOpacity={0.8}
            disabled={otp.length !== 6}
            style={[
              styles.verifyButton,
              otp.length !== 6 && styles.disabledButton, // 🔒 apply dim style when not ready
            ]}
          >
            <Text style={styles.verifyText}>Verify OTP</Text>
            {/* <ArrowRight
              width={dimensions.icon.medium}
              height={dimensions.icon.medium}
              color= {colors.primary}
            /> */}
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'whitesmoke',
  },

  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    margin: 10,
    elevation: 3,
  },

  // ===== Main Content =====
  content: {
    flex: 1,
    paddingVertical: 60,

  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.primary,
    // textAlign: 'center',
    paddingHorizontal: 15,

  },

  infoText: {
    fontSize: 16,
    // textAlign: 'center',
    color: '#555',
    marginBottom: 24,
    marginTop: 10,
    paddingHorizontal: 15,

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

  phoneNumber: {
    fontWeight: '600',
    color: colors.text_secondary,
    fontSize: 16,
  },

  // ===== OTP Input =====
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginVertical: 40,
    alignSelf: 'center',
  },
  pinCodeContainer: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activePinCodeContainer: {
    borderColor: colors.primary,
  },
  filledPinCodeContainer: {
    borderColor: colors.primary,
    backgroundColor: '#eaf3ff',
  },
  pinCodeText: {
    fontSize: 24,
    color: '#222',
    fontWeight: '500',
  },
  focusStick: {
    width: 2,
    height: 25,
    backgroundColor: colors.primary,
  },

  // ===== Actions =====
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
    // borderWidth:1,
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

export default VerifyOTPScreen;
