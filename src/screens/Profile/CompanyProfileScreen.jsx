

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Modal, FlatList, Linking, Pressable, SafeAreaView, RefreshControl, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import RNRestart from 'react-native-restart';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';
import Message from '../../components/Message';
import { useDispatch, useSelector } from 'react-redux';
import { showToast } from '../AppUtils/CustomToast';
import { useFileOpener } from '../helperComponents.jsx/fileViewer';
import apiClient from '../ApiClient';
import { useNetwork } from '../AppUtils/IdProvider';
import { openMediaViewer } from '../helperComponents.jsx/mediaViewer';
import { updateLastSeen } from '../AppUtils/LastSeen';
import { OtpInput } from "react-native-otp-entry";

const CompanyProfileScreen = ({ route }) => {
  const navigation = useNavigation();
  const profile = useSelector(state => state.CompanyProfile.profile);
  console.log('profile',profile)
  const { myId } = useNetwork();
  const [isProductDropdownVisible, setProductDropdownVisible] = useState(false);
  const [isServiceDropdownVisible, setServiceDropdownVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [otp, setOTP] = useState('');
  const otpRef = useRef('');
  const [timer, setTimer] = useState(30);
  const [step, setStep] = useState(1);
  const [isResendEnabled, setIsResendEnabled] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(profile?.company_contact_number);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);

  const { openFile } = useFileOpener();
  const [loading, setLoading] = useState(false);
  const [loading1, setLoading1] = useState(false);

  const handleOpenResume = async () => {
    if (!profile?.brochureKey) return;
    setLoading1(true);
    try {
      await openFile(profile?.brochureKey);
    } finally {
      setLoading1(false);
    }
  };

  const navigateToDetails = (product) => {
    navigation.navigate('ProductDetails', { product_id: product.product_id, company_id: product.company_id });

  };

  const navigateToServiceDetails = (service) => {
    navigation.navigate('ServiceDetails', { service_id: service.service_id, company_id: service.company_id });

  };
  const handleAddProduct = () => {
    setProductDropdownVisible(false);
    setTimeout(() => {
      navigation.navigate('CreateProduct')
    }, 300);
  };

  const handleAddService = () => {
    setServiceDropdownVisible(false);
    setTimeout(() => {
      navigation.navigate('CreateService')
    }, 300);
  };


  const fetchProducts = async () => {
    setLoading(true);
    const payload = {
      command: 'getProductsByCompanyId',
      company_id: myId,
    };


    try {
      const response = await apiClient.post('/getProductsByCompanyId', payload);

      const data = response.data;
      if (data.status === 'success' && Array.isArray(data.response)) {
        setProducts(data.response);
      } else {
        setProducts([]);
      }
    } catch (error) {

      setProducts([]);

    }
    setLoading(false);

  };


  const fetchServices = async () => {
    setLoading(true);
    const payload = {
      command: 'getServicesByCompanyId',
      company_id: myId,
    };

    try {
      const response = await apiClient.post('/getServicesByCompanyId', payload);

      const data = response.data;

      if (data.status === 'success' && Array.isArray(data.response)) {
        setServices(data.response);

      } else {
        setServices([]);
      }
    } catch (error) {

      setServices([]);
    }
    setLoading(false);
  };


  useEffect(() => {
    if (isServiceDropdownVisible) {
      fetchServices();
    }
  }, [isServiceDropdownVisible]);

  useEffect(() => {
    if (isProductDropdownVisible) {
      fetchProducts();
    }
  }, [isProductDropdownVisible]);


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

        showToast("Account deleted successfully", 'success');

        await AsyncStorage.removeItem('CompanyUserData');
        await AsyncStorage.removeItem('CompanyUserlogintimeData');
        RNRestart.Restart();
      } else {

        showToast("Account deletion failed or already deleted", 'error');

      }
    } catch (error) {

      showToast("You dont have an internet connection", 'error');

    } finally {
      setIsDeleting(false); // Reset deletion status
    }
  };

  useEffect(() => {
    if (timer > 0) {
      const timeout = setTimeout(() => setTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timeout);
    } else if (timer === 0) {
      setIsResendEnabled(true);
    }
  }, [timer]);


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
  

  const sendOtp = (phoneNumber) => {
    axios
      .post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/sendVerifyOtpMsg91',
        { command: 'sendVerifyOtpMsg91', user_phone_number: phoneNumber },
        { headers: { 'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk' } }
      )
      .then((otpRes) => {
        if (otpRes.status === 200) {
          showToast("OTP Sent", 'success');
        }
      })
      .catch((error) => {
        showToast("try again later", 'error');

      });
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

        showToast("Try again later", 'error');


      }
    } catch (error) {
      showToast("You dont have an internet connection", 'error');

    }
  };

  const handleLogoutConfirm = async () => {
    try {
      console.log("[LogoutConfirm] Fetching session data from AsyncStorage...");
      const sessionData = await AsyncStorage.getItem('userSession');

      if (!sessionData) {
        console.warn("[LogoutConfirm] No session data found.");
        showToast("No session data found", 'error');
        return;
      }

      const parsedSessionData = JSON.parse(sessionData);
      if (parsedSessionData?.sessionId) {
        const payload = {
          command: 'logoutUserSession',
          session_id: parsedSessionData.sessionId,
        };

        console.log("[LogoutConfirm] Sending logout request with payload:", payload);

        const response = await apiClient.post(
          'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/logoutUserSession',
          payload
        );

        console.log("[LogoutConfirm] Logout response received:", response?.data);

        if (response?.data?.statusCode !== 200) {
          console.error("[LogoutConfirm] Logout failed:", response?.data?.message);
          showToast(response.data.statusCode, 'error');
          return;
        }
      } else {
        console.warn("[LogoutConfirm] sessionId not found in parsed session data.");
      }

      if (myId) {
        console.log("[Logout] Updating last seen for user:", myId);
        await updateLastSeen(myId, new Date().toISOString()); // ✅ use directly
      }

      console.log("[LogoutConfirm] Removing session-related data from AsyncStorage...");
      await AsyncStorage.multiRemove([
        'CompanyUserData',
        'CompanyUserlogintimeData',
        'sessionId',
        'userSession'
      ]);

      showToast("Logout successful", 'success');
      console.log("[LogoutConfirm] Restarting app...");
      setTimeout(() => {
        RNRestart.Restart();
      }, 1000);

    } catch (error) {
      console.error("[LogoutConfirm] Logout error:", error?.message || error);
      showToast("Please check your connection", 'error');
    }
  };



  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const handleDeleteClick = () => {
    setIsModalVisible(true); // Show modal
    setStep(1); // Start at the confirmation step
  };

  const handleYesClick = () => {
    setStep(2); // Move to OTP step
    sendOtp(phoneNumber); // Send OTP
    setOTP('');
    setTimer(30); // Start timer
    setIsResendEnabled(false); // Disable resend button initially
  };


  const handleNoClick = () => {
    setIsModalVisible(false);
  };

  const handleProductSelect = (product) => {
    setProductDropdownVisible(false);
    navigateToDetails(product);
  };

  const handleSevicesSelect = (service) => {
    setServiceDropdownVisible(false);
    navigateToServiceDetails(service);
  };


  const handleUpdate = () => {
    navigation.navigate('CompanyProfileUpdate', {
      profile,
      imageUrl: profile?.imageUrl,
    });
  };



  if (!profile) {
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#075cab" />
    </View>

  }




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
          <Text style={styles.shareText}>Edit profile</Text>
        </TouchableOpacity>
      </View>


      <ScrollView showsVerticalScrollIndicator={false} >

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

        <View style={styles.detailsContainer}>
          {/* Profile Details */}
          <View style={styles.title1}>
            <Text style={styles.label}>Company name   </Text>
            <Text style={styles.colon}>:</Text>

            <Text style={styles.value}>{(profile?.company_name || "").trimStart().trimEnd()}</Text>

          </View>
          <View style={styles.title1}>
            <Text style={styles.label}>Business phone no. </Text>
            <Text style={styles.colon}>:</Text>

            <Text style={styles.value}>{(profile?.company_contact_number || "").trimStart().trimEnd()}</Text>
          </View>
          <View style={styles.title1}>
            <Text style={styles.label}>Email ID     </Text>
            <Text style={styles.colon}>:</Text>

            <Text style={styles.value}>{profile?.company_email_id || ""}
              <Text>{profile.is_email_verified && (
                <Ionicons name="checkmark-circle" size={12} color="green" />
              )}</Text>
            </Text>
          </View>
          <View style={styles.title1}>
            <Text style={styles.label}>CIN / Business registration number </Text>
            <Text style={styles.colon}>:</Text>

            <Text style={styles.value}>{(profile?.business_registration_number || "").trimStart().trimEnd()}</Text>
          </View>

          {/* select_your_profile */}
          <View style={styles.title1}>
            <Text style={styles.label}>Profile type      </Text>
            <Text style={styles.colon}>:</Text>

            <Text style={styles.value}>{profile?.select_your_profile || ""}</Text>
          </View>
          <View style={styles.title1}>
            <Text style={styles.label}>Category      </Text>
            <Text style={styles.colon}>:</Text>

            <Text style={styles.value}>{profile?.category || ""}</Text>
          </View>

          <View style={styles.title1}>
            <Text style={styles.label}>State            </Text>
            <Text style={styles.colon}>:</Text>

            <Text style={styles.value}>{profile?.company_located_state || ""}</Text>
          </View>
          <View style={styles.title1}>
            <Text style={styles.label}>City              </Text>
            <Text style={styles.colon}>:</Text>

            <Text style={styles.value}>{profile?.company_located_city || ""}</Text>
          </View>

          {(profile?.Website?.trimStart().trimEnd()) ? (
            <View style={styles.title1}>
              <Text style={styles.label}>Website</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{profile.Website.trimStart().trimEnd()}</Text>
            </View>
          ) : null}

          {(profile?.company_address?.trimStart().trimEnd()) ? (
            <View style={styles.title1}>
              <Text style={styles.label}>Company address</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{profile.company_address.trimStart().trimEnd()}</Text>
            </View>
          ) : null}

          {(profile?.company_description?.trimStart().trimEnd()) ? (
            <View style={[styles.title1, { textAlign: 'justify' }]}>
              <Text style={styles.label}>Company description</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={[styles.value, { textAlign: 'justify' }]}>
                {profile.company_description.trimStart().trimEnd()}
              </Text>
            </View>
          ) : null}

          {
            profile?.brochureKey &&
            (<TouchableOpacity onPress={handleOpenResume} disabled={loading} style={styles.pdfButton}>
              {loading1 ? (
                <ActivityIndicator size="small" color="#075cab" style={styles.pdfButtonText} />
              ) : (
                <Text style={styles.pdfButtonText}>View Catalogue</Text>
              )}
            </TouchableOpacity>)
          }
          <View style={styles.rowContainer}>
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.tabButton]}
              onPress={() => setProductDropdownVisible(true)}
            >
              <Text style={styles.tabButtonText}>Products</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={1}
              style={[styles.tabButton]}
              onPress={() => setServiceDropdownVisible(true)}
            >
              <Text style={styles.tabButtonText}>Services</Text>
            </TouchableOpacity>
          </View>


          <Modal
            transparent={true}
            visible={isProductDropdownVisible}
            onRequestClose={() => setProductDropdownVisible(false)}
          >
            <Pressable style={styles.modalContainer} onPress={() => setProductDropdownVisible(false)}>
              <View style={styles.modalContent}>
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    {products.length === 0 ? (
                      <Text style={styles.noServicesText}>No products available</Text>
                    ) : (
                      <FlatList
                        data={products}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            activeOpacity={1}
                            style={styles.dropdownItem}
                            onPress={() => handleProductSelect(item)}
                          >
                            <Text style={styles.dropdownItemText}>
                              🛒 {item.title || 'Unnamed Product'}
                            </Text>
                          </TouchableOpacity>
                        )}
                        keyExtractor={(item, index) => index.toString()}
                      />
                    )}

                    {/* Add Product Button */}
                    <TouchableOpacity style={styles.addProductButton} onPress={handleAddProduct}>
                      <Ionicons name="add-circle-outline" size={24} color="#075cab" />
                      <Text style={styles.addProductText}>Add Product</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Pressable>
          </Modal>



          <Modal
            transparent={true}
            visible={isServiceDropdownVisible}
            onRequestClose={() => setServiceDropdownVisible(false)}
          >
            <Pressable style={styles.modalContainer} onPress={() => setServiceDropdownVisible(false)}>
              <View style={styles.modalContent}>
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    {services.length === 0 ? (
                      <Text style={styles.noServicesText}>No services available</Text>
                    ) : (
                      <FlatList
                        data={services}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            activeOpacity={1}
                            style={styles.dropdownItem}
                            onPress={() => handleSevicesSelect(item)}
                          >
                            <Text style={styles.dropdownItemText}>
                              🛠️ {item.title || 'Unnamed Services'}
                            </Text>
                          </TouchableOpacity>
                        )}
                        keyExtractor={(item, index) => index.toString()}
                      />
                    )}

                    {/* Add Service Button */}
                    <TouchableOpacity style={styles.addProductButton} onPress={handleAddService}>
                      <Ionicons name="add-circle-outline" size={24} color="#075cab" />
                      <Text style={styles.addProductText}>Add Service</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Pressable>
          </Modal>

        </View>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleLogout} // Opens modal
        >
          <Icon name="exit-to-app" size={20} color="#075cab" />
          <Text style={styles.signOutButtonText}>Logout</Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteClick}>
          <Icon name="account-remove-outline" size={24} color="red" style={styles.icon} />
          <Text style={styles.deleteAccountButtonText} >Delete account</Text>
        </TouchableOpacity>

      </ScrollView>


      <Message
        visible={isLogoutModalVisible} // Modal should appear if true
        onClose={() => setLogoutModalVisible(false)}
        onCancel={() => setLogoutModalVisible(false)}
        onOk={() => {
          setLogoutModalVisible(false);
          setTimeout(handleLogoutConfirm, 200);
        }}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        iconType="info"
      />

      <Modal
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
        transparent={true}
        animationType="fade"
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
                      <TouchableOpacity onPress={resendHandle} >
                        <Text style={styles.resendButtonText}>Resend OTP</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.timerText}>Resend in {timer}s</Text>
                    )}

                    <TouchableOpacity onPress={handleVerifyOTP} >
                      <Text style={styles.resendButtonText}>Verify OTP</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView >

  );
};

 const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',

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
  noServicesText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontSize: 16,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',

  },
  noProductsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'black',
    fontWeight: '500',
    marginBottom: 100
  },

  backButton: {
    alignSelf: 'flex-start',
    padding: 10,

  },

  circle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // paddingVertical: 10,
    padding: 10,
    // marginTop: 10,
    borderRadius: 8,
  },

  shareText: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 4,

  },
  pdfButton: {
    backgroundColor: 'white',
    borderRadius: 5,
    marginTop: 15,
    alignSelf: 'center',
    borderWidth: 0.5,
    borderColor: '#075cab',
    width: "40%",
    paddingVertical: 10,
    alignItems: 'center',
  },
  pdfButtonText: {
    color: '#075cab',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
  },


  scrollViewContent: {
    elevation: 1,
    backgroundColor: 'white'
  },
  title: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',  // Align label and detail in a row
    alignItems: 'center',  // Center the items vertically
    marginVertical: 4,
    paddingHorizontal: 5,
    paddingVertical: 5,

  },


  label: {
    flex: 1, // Take up available space
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
  },
  detailsContainer: {
    marginTop: 20,
  },
  title1: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',  // Align label and detail in a row
    alignItems: 'center',  // Center the items vertically
    backgroundColor: 'white',
    shadowColor: '#0d6efd', // iOS shadow color
    shadowOffset: { width: 0, height: 2 }, // iOS shadow offset
    shadowOpacity: 0.2, // iOS shadow opacity
    shadowRadius: 3, // iOS shadow radius
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10
  },
  colon: {
    width: 20, // Fixed width for the colon
    textAlign: 'center', // Center the colon
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


  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  addProductText: {
    fontSize: 16,
    color: '#075cab',
    marginLeft: 8,
  },

  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginTop: 10,

  },
  serviceImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginTop: 10,

  },

  signOutButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: "center",
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 5,
    width: 'auto',
    alignSelf: 'center',
    minWidth: 120,
    maxWidth: 200,
  },

  signOutButtonText: {
    color: "#075cab",
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 5,
    alignSelf: 'center'
  },
  deleteAccountButton: {
    justifyContent: "center",
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 5,
    marginTop: 10,
    width: 'auto', // Ensure it doesn't take full width
    alignSelf: 'center',
    minWidth: 180, // Optional: ensures a minimum size for the button
    maxWidth: 200,
  },
  deleteAccountButtonText: {
    color: "red",
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 5,
  },

  modalContainerImage: { flex: 1, backgroundColor: 'black' },
  modalContainerImage2: { flex: 1, backgroundColor: 'white' },
  closeButton1: { position: 'absolute', top: 70, right: 20 },
  modalImage: { width: '100%', height: '100%', resizeMode: 'contain' },

  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 80,
    alignSelf: 'center',
    marginTop: 20,
  },
  detailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    overflow: 'hidden',

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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 5,

  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#075cab',
  },

  tabButtonText: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: '500',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },


  dropdownItem: {
    padding: 10,
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#000',
  },
  selectedDetailsContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    elevation: 4, // Shadow for Android
    shadowColor: '#000', // Shadow color for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow offset for iOS
    shadowOpacity: 0.2, // Shadow opacity for iOS
    shadowRadius: 4, // Shadow radius for iOS
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
  warningContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 50,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Add shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
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
    fontWeight:'500'
  },
  deletionText1: {
    fontSize: 16,
    color: 'black',
    textAlign: 'justify',
    lineHeight: 22,
    marginBottom: 25,
    fontWeight: '500',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 15,
  },
  confirmButton: {
    // backgroundColor: '#e53935',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginHorizontal: 10,
    //  ?

  },
  confirmButtonText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    // backgroundColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginHorizontal: 10,
    // borderWidth: 1,
    // borderColor: '#ccc',
  },
  cancelButtonText: {
    color: 'green',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
});

export default CompanyProfileScreen;