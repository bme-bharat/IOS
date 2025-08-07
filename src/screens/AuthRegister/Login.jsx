


import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Modal, FlatList, TextInput, StatusBar, StyleSheet, Image, TouchableWithoutFeedback } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { COLORS, CountryCodes } from '../../assets/Constants';
import MerticalIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import logo_png from '../../images/homepage/logo.jpeg';
import { Keyboard } from 'react-native';
import FastImage from 'react-native-fast-image';
import { showToast } from '../AppUtils/CustomToast';
import apiClient from '../ApiClient';

const LoginPhoneScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [modalVisible, setModalVisible] = useState(false);
  const [countryVerify, setCountryVerify] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isPhoneLogin, setIsPhoneLogin] = useState(true);
  const [phone, setPhone] = useState('');


  const handleCountrySelection = (country) => {
    setCountryCode(country.value);
    setSelectedCountry(country.label);
    setCountryVerify(country.value !== '');
    setModalVisible(false);
  };


  const sendOTPHandle = async () => {
    if (!phone) {
      showToast("Please enter a valid phone number or email Id", 'error');
      return;
    }
  
    setLoading(true);
  
    try {
      let loginData, otpData;
  
      if (isPhoneLogin) {
        const fullPhoneNumber = `${countryCode}${phone}`;
  
        loginData = await apiClient.post('/loginUser', {
          command: 'loginUser',
          user_phone_number: fullPhoneNumber,
        });
  
        if (loginData.data.status === 'success') {
          const { user_id: userId } = loginData.data.login_user_details;
  
          otpData = await apiClient.post('/sendVerifyOtpMsg91', {
            command: 'sendVerifyOtpMsg91',
            user_phone_number: fullPhoneNumber,
          });
  
          if (otpData.data.type === 'success') {
            showToast("OTP sent", 'success');
            navigation.navigate('LoginVerifyOTP', { fullPhoneNumber, userid: String(userId) });
          } else {
            throw new Error('Failed to send OTP to phone. Please try again.');
          }
        } else {
          throw new Error('User does not exist with this phone number.');
        }
  
      } else {
        loginData = await apiClient.post('/loginUser', {
          command: 'loginUser',
          email: phone,
        });
  
        if (loginData.data.status === 'success') {
          const { user_id: userId } = loginData.data.login_user_details;
  
          const res = await apiClient.post('/sendEmailOtp', {
            command: 'sendEmailOtp',
            email: phone,
          });
  
          if (res.data.status === 'success') {
            showToast("OTP sent", 'success');
            navigation.navigate('LoginVerifyOTP', { phone, userid: String(userId) });
          } else {
            throw new Error('Failed to send OTP to email. Please try again.');
          }
        } else {
          console.log(loginData.data.errorMessage)
          throw new Error('User does not exist with this email.');
        }
      }
    } catch (error) {
      showToast(error.message, 'info');
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  };
  
  


  const handleLoginMethodSwitch = () => {
    setIsPhoneLogin(!isPhoneLogin); // Toggle the login method
    setPhone(''); // Reset the phone/email input
    setPhoneError(''); // Reset any phone errors
    setEmailError(''); // Reset any email errors
  };


  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: false, // disables swipe back on iOS
      headerLeft: () => null, // hides back button
    });
  }, [navigation]);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#075cab" barStyle="default" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} onScrollBeginDrag={() => { Keyboard.dismiss() }}>
        <View style={styles.logoContainer}>
          <FastImage source={logo_png} style={styles.logo} resizeMode="cover" />
        </View>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Login</Text>

          <View style={styles.phoneInputContainer}>
            {isPhoneLogin && (
              <View style={styles.countryCodeContainer}>
                <TouchableOpacity style={styles.countrySelector} onPress={() => setModalVisible(true)}>
                  <Text style={styles.countryCodeText}>
                    {selectedCountry} <MerticalIcon name="chevron-down" size={20} color="black" />

                  </Text>
                </TouchableOpacity>
                <Modal
                  transparent={true}
                  visible={modalVisible}
                  animationType="slide"
                  onRequestClose={() => setModalVisible(false)}
                >
                  <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalBackground}>
                      <View style={styles.modalContainer}>
                        <FlatList
                          data={CountryCodes}
                          keyExtractor={(item, index) => `${item.label}-${item.value}-${index}`}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={{ padding: 10, borderBottomWidth: 1, borderColor: '#ccc' }}
                              onPress={() => handleCountrySelection(item)}
                            >
                              <Text style={styles.countryItemText}>{item.label} ({item.value})</Text>
                            </TouchableOpacity>
                          )}
                        />
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
              </View>
            )}

            <View style={styles.phoneInputFlex}>
              {isPhoneLogin ? (
                <MerticalIcon name="phone" size={25} color="black" opacity={0.8} />
              ) : (
                <MerticalIcon name="email" size={25} color="black" opacity={0.8} />
              )}
              <TextInput
                style={styles.input}
                placeholder={isPhoneLogin ? "Phone number" : "Enter your email"}
                onChangeText={(text) => {
                  if (isPhoneLogin) {
                    const formattedText = text.replace(/\D/g, '').slice(0, 10);
                    setPhone(formattedText);

                    if (formattedText.length === 10) {
                      Keyboard.dismiss(); // Dismiss keyboard when 10 digits are entered
                    }
                  } else {
                    setPhone(text.trim());
                  }
                }}
                keyboardType={isPhoneLogin ? "numeric" : "email-address"}
                placeholderTextColor="gray"
                value={phone}
                textContentType="oneTimeCode"
                autoFocus

              />


            </View>
          </View>

          {isPhoneLogin ? (
            phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null
          ) : (
            emailError ? <Text style={styles.errorText}>{emailError}</Text> : null
          )}

          <TouchableOpacity
            onPress={handleLoginMethodSwitch}
            style={{ alignSelf: 'center', }}>
            <Text style={styles.buttonText1}>
              Login with{' '}
              <Text style={{ color: '#075cab' }}>
                {isPhoneLogin ? 'Email' : 'phone number'}
              </Text>{' '}
              instead
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={sendOTPHandle} disabled={loading} style={{ alignSelf: 'center' }}>
            <Text style={[styles.buttonText, loading && { opacity: 0.5 }]}>
              {loading ? 'Sending...' : 'Send OTP'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerButton} activeOpacity={1}>
            <Text style={{ color: 'black', fontSize: 15 }}>
              Don't have an account? <Text style={styles.registerText} onPress={() => navigation.navigate('Register')}>Register</Text>
            </Text>
          </TouchableOpacity>



          <View style={styles.policyContainer}>
            <TouchableOpacity style={styles.policyButton} onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={styles.policyText}>Privacy Policy</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.policyButton} onPress={() => navigation.navigate('TermsAndConditions')}>
              <Text style={styles.policyText}>Terms And Conditions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  policyContainer: {
    flexDirection: 'row', // Arrange children in a row
    justifyContent: 'center', // Center the buttons
    alignItems: 'center', // Align vertically
    marginVertical: 20, // Add vertical space
  },
  policyButton: {
    paddingVertical: 10, // Vertical padding for better height
    paddingHorizontal: 15, // Horizontal padding for balance
    borderRadius: 5,
    backgroundColor: 'transparent', // Use transparent for a cleaner look
    alignItems: 'center', // Center text inside button
  },
  policyText: {
    color: '#075cab', // Text color
    fontSize: 16,
    textAlign: 'center',
  },
  divider: {
    width: 1, // Width of the divider line
    height: 30, // Adjusted height for better alignment
    backgroundColor: '#075cab', // Divider color
    marginHorizontal: 10, // Horizontal space around the divider
  },
  verticalContainer: {
    flexDirection: 'column', // Stack children vertically
    alignItems: 'center', // Center children horizontally
    marginVertical: 20, // Add some vertical space around the buttons
  },
  registerButton1: {
    marginVertical: 5, // Space between buttons
    padding: 10,
    backgroundColor: '#075cab', // Your button color
    borderRadius: 10,
    width: '80%', // Button width
    alignItems: 'center', // Center text inside button
  },
  registerText1: {
    color: '#fff', // Text color
    fontSize: 16,
    textAlign: 'center',
  },
  logo: {
    width: 200, // Adjust size of the image
    height: 200, // Adjust size of the image
    resizeMode: 'contain',
  },
  formContainer: {
    paddingHorizontal: 26,
  },
  title: {
    color: '#075cab',
    fontSize: 23,
    fontWeight: '500',
    textAlign: "center",
    marginVertical: 10,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#075cab',
    marginTop: 10,
    height: 50,
  },
  countryCodeContainer: {
    width: '20%', // Adjust width as necessary
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#075cab',
    height: '100%',
  },
  countryCodeText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
  },
  phoneInputFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    height: '100%',
    fontSize: 14,
    fontWeight: '500',
    color: 'black'
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: "500",
    color: '#075cab',
    padding: 14,
    borderRadius: 10,
    textAlign: 'center',
    // marginVertical: 5,
    alignSelf: 'center'
  },
  buttonText1: {
    fontSize: 15,
    fontWeight: "500",
    color: 'black',
    marginTop: 20,
    borderRadius: 10,
    textAlign: 'center',
    // marginVertical: 5,
    alignSelf: 'center'
  },
  registerButton: {
    alignItems: 'center',
    alignSelf: 'center'
  },
  registerText: {
    color: '#075cab',
    fontSize: 16,
  },
  countrySelector: {
    width: '100%', // Full width for country selector
    alignItems: 'center',
    justifyContent: 'center',

  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: 200
  },
  modalContainer: {
    width: '70%',
    backgroundColor: 'white',
    borderRadius: 10,
    height: 300
  },
  countryItem: {
    paddingVertical: 10,
  },
  countryItemText: {
    fontSize: 16,
    color: "black",
    marginLeft: 5,
    fontWeight: "400"

  },
});

export default LoginPhoneScreen;