import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, useWindowDimensions, TouchableOpacity, ScrollView, Modal, StyleSheet, FlatList, TextInput, StatusBar, Image, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import logo_png from '../../images/homepage/logo.jpeg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CountryCodes } from '../../assets/Constants';
import axios from 'axios';
import { showToast } from '../AppUtils/CustomToast';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import Phone from '../../assets/svgIcons/phone.svg';
import Check from '../../assets/svgIcons/check.svg';
import ArrowDown from '../../assets/svgIcons/arrow-down.svg';

import { colors, dimensions } from '../../assets/theme.jsx';
const EnterPhoneScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedCategory, selectedProfile, userType } = route.params;
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneVerify, setPhoneVerify] = useState(false);
  const [countryCode, setCountryCode] = useState('+91'); // Default country code
  const [selectedCountry, setSelectedCountry] = useState('IN'); // Default country
  const [modalVisible, setModalVisible] = useState(null); // null | 'country'
  const [countryVerify, setCountryVerify] = useState(true);
  const [isChecked, setIsChecked] = useState(false); // Checkbox state
  const [phoneNumber, setPhoneNumber] = useState(""); // Phone number state
  const { width: screenWidth } = useWindowDimensions();
  const handleCountrySelection = (country) => {
    setCountryCode(country.value); // Update country code
    setSelectedCountry(country.label);
    setCountryVerify(country.value !== '');
    setModalVisible(null); // Close modal after selection
  };

  const companyProfiles = [
    "Biomedical Engineering Company Manufacturer",
    "Dealer/Distributor",
    "Biomedical Engineering Company - Service Provider",
    "Healthcare Provider - Biomedical",
    "Academic Institution - Biomedical",
    "Regulatory Body",
    "Investor/Venture Capitalist",
    "Patient Advocate",
    "Healthcare IT Developer"
  ];

  const handlePhone = (phoneVar) => {
    setPhone(phoneVar);
    setPhoneVerify(/^[1-9]\d{9}$/.test(phoneVar));

    // Dismiss keyboard when 10 digits are entered
    if (phoneVar.length === 10) {
      Keyboard.dismiss();
    }
  };


  const sendOTPHandle = () => {
    setLoading(true); // Start loader
    const fullPhoneNumber = `${countryCode}${phone}`;

    if (!phoneVerify || !countryVerify) {

      showToast("Please enter a valid phone number\nSelect a country", 'info');

      setLoading(false);
      return;
    }

    // Check if the phone number already exists
    axios
      .post('https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/loginUser', {
        command: 'loginUser',
        user_phone_number: fullPhoneNumber,
      }, {
        headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' },
      })
      .then((res) => {
        if (res.data.status === 'success') {

          showToast("This user already exists. Login", 'info');

          setLoading(false);
        } else {
          // If user does not exist, send OTP
          axios
            .post('https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/sendVerifyOtpMsg91', {
              command: 'sendVerifyOtpMsg91',
              user_phone_number: fullPhoneNumber,
            }, {
              headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' },
            })
            .then((otpRes) => {
              if (otpRes.status === 200) {

                navigation.navigate('VerifyOTP', {
                  fullPhoneNumber,
                  selectedProfile,
                  selectedCategory,
                  userType,
                });
              } else {

                showToast("Failed to send OTP. Please try again", 'error');

                setLoading(false);
              }
            })
            .catch(() => {

              showToast("You don't have an internet connection", 'error');

              setLoading(false);
            });
        }
      })
      .catch(() => {

        showToast("You don't have an internet connection", 'error');
        setLoading(false);
      });
  };

  const renderInstructionText = () => {
    if (selectedProfile && selectedCategory) {
      return companyProfiles.includes(selectedProfile) ? 'Enter your business phone number' : 'Enter your phone number';
    }
    return 'Enter phone number';
  };


  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
      headerLeft: () => null,
    });
  }, [navigation]);


  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Back Button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <ArrowLeftIcon
          width={dimensions.icon.medium}
          height={dimensions.icon.medium}
          color={colors.primary}
        />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Verify Your Phone</Text>
        <Text style={styles.subtitle}>
          Let’s verify your phone number to continue
        </Text>

        {/* Instruction */}
        {/* <Text style={styles.instructionText}>{renderInstructionText()}</Text> */}

        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setModalVisible('country')}
            >
              <Text style={styles.countryText}>{selectedCountry}</Text>
              <ArrowDown
                width={dimensions.icon.small}
                height={dimensions.icon.small}
                color={colors.primary}
              />
            </TouchableOpacity>

            <View style={styles.phoneInputFlex}>
              <Phone
                width={dimensions.icon.medium}
                height={dimensions.icon.medium}
                color={colors.primary}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor="#999"
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  handlePhone(text);
                }}
                value={phone}
              />
            </View>
          </View>
        </View>

        {/* Country Modal */}
        <Modal
          transparent
          visible={modalVisible === 'country'}
          animationType="fade"
          onRequestClose={() => setModalVisible(null)}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <FlatList
                  data={CountryCodes}
                  keyExtractor={(item, index) => item.value + index}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.countryItem}
                      onPress={() => handleCountrySelection(item)}
                    >
                      <Text style={styles.countryItemText}>
                        {item.label} ({item.value})
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Checkbox */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            onPress={() => setIsChecked(!isChecked)}
            style={[
              styles.checkbox,
              isChecked && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            {isChecked && (
              <Check
                width={dimensions.icon.small}
                height={dimensions.icon.small}
                color="#fff"
              />
            )}
          </TouchableOpacity>

          <Text style={styles.checkboxText}>I accept the </Text>
          <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.checkboxText}> and </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('TermsAndConditions')}
          >
            <Text style={styles.linkText}>Terms & Conditions</Text>
          </TouchableOpacity>
        </View>

        {/* Send OTP Button */}
        <TouchableOpacity
          onPress={async () => {
            setLoading(true);
            await sendOTPHandle();
            setTimeout(() => setLoading(false), 1000);
          }}
          disabled={loading || !isChecked}
          style={[
            styles.submitButton,
            (loading || !isChecked) && styles.disabledButton,
          ]}
        >
          <Text style={styles.submitText}>
            {loading ? 'Sending...' : 'Send OTP'}
          </Text>
        </TouchableOpacity>


      </ScrollView>
    </View>
  );


};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFD',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    margin: 10,
    elevation: 3,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 60,
    paddingHorizontal: 15,

  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.primary,
    // textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#444',
    // textAlign: 'center',
    marginTop: 6,
    marginBottom: 25,
  },
  instructionText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '500',
    // textAlign: 'center',
    marginBottom: 15,
    paddingTop: 20,


  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    // paddingVertical: 15,
    // paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    // elevation: 3,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#dcdcdc',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    height: 50,

  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRightColor: '#dcdcdc',
    borderRightWidth: 1,
  },
  countryText: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 4,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.primary,
  },
  phoneInputFlex: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    height: 420,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 30,
  },
  countryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  countryItemText: {
    color: '#000',
    fontSize: 15,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50,
    // marginBottom:20,
    // justifyContent: 'center',
    flexWrap: 'wrap',
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#666',
    // justifyContent: 'center',
    // alignItems: 'center',
    marginRight: 6,
    borderRadius: 4,
  },
  
  checkboxText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});



export default EnterPhoneScreen;