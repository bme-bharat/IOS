
import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Modal, TouchableWithoutFeedback, Easing, Animated, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RazorpayCheckout from 'react-native-razorpay';
import RNRestart from 'react-native-restart';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, getToken, requestPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import { showToast } from '../AppUtils/CustomToast';
import LottieView from 'lottie-react-native';


const LoginTimeUserSubscriptionScreen = () => {

  const [userId, setUserId] = useState('');

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const route = useRoute()
  const { userDetails } = route.params || {}
  const [showRecommendedModal, setShowRecommendedModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success');

  useEffect(() => {
    if (userDetails && userDetails.user_id) {
      setUserId(userDetails.user_id);
      setEmail(userDetails.user_email_id)
      setName(userDetails.first_name)
      setPhone(userDetails.user_phone_number)

    }
  }, [userDetails]);



  const packages = [
    {
      name: 'Basic',
      day: '30',
      price: '59',
      amount: 59,
      validity: '30',
      features: [true, true, true, true, true, true, true, true, true],
    },
    {
      name: 'Premium',
      day: '365',
      price: '649',
      amount: 649,
      validity: '365',
      features: [true, true, true, true, true, true, true, true, true],
    },
    // {
    //   name: 'Pro',
    //   day: '180',
    //   price: '336',
    //   amount: 336,
    //   validity: '180',
    //   features: [true, true, true, true, true, true, true, true],
    // },
    // {
    //   name: 'Elite',
    //   day: '365',
    //   price: '637',
    //   amount: 637,
    //   validity: '365',
    //   features: [true, true, true, true, true, true, true, true],
    // },
  ];

  const featuresList = [
    'Job updates',
    'Premium knowledge resources',
    'Access to companies and product\'s information',
    'Unlimited access to forum',
    'Enhanced job portal features ',
    'Priority customer support',
    'Regular updates on biomedical engineering',
    'Professional networking',
    'Access to latest biomedical events and exhibitions'

  ];

  const initiatePayment = async (pkg) => {
    console.log('📦 initiatePayment() called with:', pkg);

    if (isInitiatingPayment) {
      console.warn('⏳ Payment initiation already in progress. Ignoring duplicate request.');
      return;
    }

    setIsInitiatingPayment(true); // 🟢 start blocking

    try {
      const payload = {
        command: 'razorpay',
        user_id: userId,
        amount: pkg.amount,
        currency: 'INR',
        plan_type: pkg.name,
      };

      console.log('📤 Sending payload to Razorpay API:', payload);

      const response = await axios.post(
        'https://5kh43xmxxl.execute-api.ap-south-1.amazonaws.com/dev/razorpay',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
          },
        }
      );

      console.log('✅ Razorpay API response:', response.data);

      if (response.data?.order) {
        const order = response.data.order;

        const options = {
          key: 'rzp_live_l3vOFR4C3UPqLa',
          amount: order.amount,
          currency: order.currency,
          name: 'BME BHARAT',
          description: 'BME BHARAT Transaction',
          image: 'https://bmebharat.com/assets/images/logo.png',
          order_id: order.id,
          prefill: {
            name: name || 'User',
            email: email || 'test@example.com',
            contact: (phone || '').replace(/\D/g, '').slice(-10),
          },
          notes: { address: 'BME BHARAT Office Address' },
          theme: { color: '#3399cc' },
        };

        console.log('🧾 Razorpay Checkout options:', options);

        try {
          const result = await RazorpayCheckout.open(options);
          console.log('✅ Razorpay Payment Success:', result);

          setModalType('loading');
          setShowModal(true);
          verifyPayment(result);

        } catch (error) {
          console.error('❌ Razorpay Failed:', JSON.stringify(error, null, 2));
          setModalType('failure');
          setShowModal(true);
          await deleteDueTransaction();
        }
      } else {
        console.warn('⚠️ No "order" in response:', response.data);
      }
    } catch (error) {
      // console.error('🚫 initiatePayment() error:', error.message);
      if (error.response) {
        console.log('❗ Server response:', JSON.stringify(error.response.data, null, 2));
      }
      // showToast("You don't have an internet connection", 'error');
    } finally {
      setIsInitiatingPayment(false); // ✅ Always reset
      console.log('🔚 initiatePayment() completed');
    }
  };


  const deleteDueTransaction = async () => {
    try {
      const response = await axios.post(
        'https://5kh43xmxxl.execute-api.ap-south-1.amazonaws.com/dev/deleteDueTransactions', // API endpoint for deleting due transaction
        {
          command: 'deleteDueTransactions',
          user_id: userId, // Pass the user ID
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
          }
        }
      );

      if (response.data.statusCode === 400) {

      } else {

      }
    } catch (error) {

    }
  };

  const navigation = useNavigation()

  const verifyPayment = async (paymentData) => {
    try {
      const verifyResponse = await axios.post(
        'https://5kh43xmxxl.execute-api.ap-south-1.amazonaws.com/dev/verifyPayment',
        {
          command: 'verifyPayment',
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
          },
        }
      );

      if (verifyResponse.data.statusCode === 200) {
        // Show success alert and wait for user confirmation before proceeding
        setModalType('success');

      } else {
        showToast("Payment verification failed. Please try again later", 'error');
        setModalType('failure');

      }
    } catch (error) {
      showToast("Payment verification failed. Please try again later", 'error');
      setModalType('failure');

    }
  };


  const requestUserPermission = async () => {
    try {
      const authStatus = await requestPermission(getMessaging(getApp()));
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log("✅ Push Notification permission granted.");
        return true;
      } else {
        console.warn("⚠️ Push Notification permission denied.");
        return false;
      }
    } catch (error) {
      console.error("❌ [Error Requesting Permission]:", error);
      return false;
    }
  };


  const getFCMToken = async () => {
    try {
      const app = getApp();
      const messaging = getMessaging(app);
      const token = await getToken(messaging);

      return token;
    } catch (error) {

      throw error;
    }
  };



  useEffect(() => {
    getFCMToken();
    requestUserPermission();
  }, []);
  const MAX_RETRIES = 3;

  const createUserSession = async (userId, retryCount = 0) => {
    if (!userId) {

      return;
    }

    let fcmToken = null;
    try {
      fcmToken = await getFCMToken();
    } catch (err) {
      console.warn("⚠️ [FCM Token Fetch Failed]:", err);
    }

    const finalFcmToken = fcmToken || "FCM_NOT_AVAILABLE";
    const apnsType = Platform.OS === "ios" ? (__DEV__ ? "SANDBOX" : "PRODUCTION") : "UNKNOWN";
    const deviceModel = DeviceInfo.getModel();

    const payload = {
      command: "createUserSession",
      user_id: userId,
      fcm_token: finalFcmToken,
      apns_type: apnsType,
      deviceInfo: deviceModel,
    };

    try {
      const response = await axios.post(
        "https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/createUserSession",
        payload,
        { headers: { "x-api-key": "k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk" } }
      );

      if (response?.data?.status === "success") {
        const sessionId = response.data.data.session_id;
        await AsyncStorage.setItem("userSession", JSON.stringify({ sessionId }));

        return;
      } else {

      }
    } catch (error) {

    }

    if (retryCount < MAX_RETRIES) {

      return createUserSession(userId, retryCount + 1);
    } else {

      showToast("Unable to create session\nPlease try again", 'error');

      throw new Error("❌ [Max Retries Reached]: Session could not be created");
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
        // console.error('Unknown user type:', fetchedUserData.user_type);
      }
    } catch (error) {
      // console.error('Error processing user details:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000); // Convert to milliseconds
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are 0-indexed, so we add 1
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const handleCompanyApproval = async (companyData) => {
    try {
      // Save company data without any alert logic
      await AsyncStorage.setItem('CompanyUserData', JSON.stringify(companyData));

      // Navigate to the company dashboard
      // navigation.navigate('CompanyBottom');
      navigation.reset({
        index: 0,
        routes: [{ name: 'CompanyBottom' }],
      });


    } catch (error) {

      showToast("You don't have an internet connection", 'error');

    }
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
      // console.error('Error fetching company details:', error);
    }
  };

  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const animatedScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const animatedOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name="arrow-left" size={24} color="#075cab" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity activeOpacity={1}>
          <View style={styles.fullpage}>
            <View style={styles.subscriptionWrapper}>

              <Text style={styles.durationtext}>Subscription</Text>
              <Text style={[styles.durationtext, { fontWeight: '400', fontSize: 17 }]}>
                Validity-30 days
              </Text>

            </View>

            <View style={styles.divider} />

            <View style={styles.table}>
              <View style={styles.row}>
                {packages
                  .filter(pkg => pkg.name === 'Basic')
                  .map((pkg, pkgIndex) => (
                    <Text key={pkgIndex} style={styles.amountText}>
                      ₹ {pkg.amount}
                    </Text>
                  ))}
              </View>


              {featuresList.map((feature, index) => (
                <View
                  key={index}
                  style={[
                    styles.featureRow,
                    { backgroundColor: index % 2 === 0 ? '#F8F9FC' : '#F8F9FC' },
                  ]}
                >
                  <View style={styles.iconRow}>
                    {packages
                      .filter(pkg => pkg.name === 'Basic')
                      .map((pkg, pkgIndex) => (
                        <Icon
                          key={pkgIndex}
                          name={pkg.features[index] ? 'check-bold' : 'close'}
                          size={22}
                          color={pkg.features[index] ? 'green' : 'red'}
                          style={styles.icon}
                        />
                      ))}
                  </View>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}


              {packages
                .filter(pkg => pkg.name === 'Basic')
                .map((pkg, pkgIndex) => (
                  <View key={pkgIndex} style={styles.column}>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => {
                        disabled = { isInitiatingPayment }
                        setSelectedPackage(pkg); // Save Basic package
                        setShowRecommendedModal(true); // Show offer modal

                      }}
                    >
                      <Text style={styles.buttonText}>Buy now</Text>
                    </TouchableOpacity>
                  </View>
                ))}

            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        hardwareAccelerated
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <Text style={[
              styles.modalTitle,
              { color: modalType === 'success' ? 'green' : modalType === 'failure' ? 'red' : 'gray' }
            ]}>
              {modalType === 'failure' ? (
                <LottieView
                  source={require('../../assets/lottie/Cross.json')}
                  autoPlay
                  loop
                  style={{ width: 120, height: 120, }}
                />
              ) : modalType === 'success' ? (
                <LottieView
                  source={require('../../assets/lottie/payment_success.json')}
                  autoPlay
                  loop
                  style={{ width: 120, height: 120 }}

                />
              ) : (
                <LottieView
                  source={require('../../assets/lottie/progress-clock.json')}
                  autoPlay
                  loop
                  style={{ width: 120, height: 120 }}
                />
              )}

            </Text>

            {modalType === 'loading' && (
              <LottieView
                source={require('../../assets/lottie/progress-clock.json')}
                autoPlay
                loop
                style={{ width: 120, height: 120 }}
              />
            )}

            <Text style={[
              styles.modalTitle,
              { color: modalType === 'success' ? 'green' : modalType === 'failure' ? 'red' : 'gray' }
            ]}>
              {modalType === 'success'
                ? 'Payment Successful'
                : modalType === 'failure'
                  ? 'Payment Failed'
                  : 'Verifying Payment...'}
            </Text>

            <Text style={styles.modalMessage}>
              {modalType === 'success'
                ? "We've sent receipt to your registered email."
                : modalType === 'failure'
                  ? 'Your payment could not be completed.'
                  : 'Please wait while we verify your payment...'}
            </Text>

            {modalType !== 'loading' && (
              <TouchableOpacity
                style={styles.modalButton}
                onPress={async () => {
                  console.log('📍 Modal button pressed. Type:', modalType);
                  setShowModal(false);

                  switch (modalType) {
                    case 'success':
                      console.log('✅ Payment success — creating session and restarting app...');
                      try {
                        await createUserSession(userId);
                        await handleLoginSuccess(userId);
                      } catch (error) {
                        console.error('❗ Error during login/session setup:', error);
                      }
                      // setTimeout(() => {
                      //   RNRestart.Restart();
                      // }, 500);
                      break;

                    case 'failure':
                      console.log('❌ Payment failed — modal closed (no retry triggered)');
                      break;

                    default:
                      console.log('ℹ️ Unhandled modal type:', modalType);
                      break;
                  }
                }}
              >
                <Text style={styles.modalButtonText}>
                  {modalType === 'success' ? 'Continue' : 'Close'}
                </Text>
              </TouchableOpacity>

            )}

          </View>
        </View>
      </Modal>

      <Modal
        visible={showRecommendedModal}
        transparent
        animationType="fade"
        hardwareAccelerated
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => setShowRecommendedModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={styles.recommendModalContent}>
                <TouchableOpacity
                  style={styles.closeIcon}
                  // onPress={() => setShowRecommendedModal(false)}

                  onPress={() => {
                    setShowRecommendedModal(false);
                    setTimeout(() => {
                      initiatePayment(selectedPackage);
                    }, 300);

                  }}>
                  <Icon name="close" size={22} color="#444" />
                </TouchableOpacity>

                <Icon name="star-circle" size={56} color="#075cab" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Text style={styles.recommendModalTitle}>
                    Special Offer: Get 1 Month{'   '}
                  </Text>
                  <Animated.Text
                    style={{
                      fontWeight: 'bold',
                      color: '#075cab',
                      fontSize: 18,
                      transform: [{ scale: animatedScale }],
                      opacity: animatedOpacity,
                    }}
                  >
                    FREE!
                  </Animated.Text>
                </View>



                {/* <Text style={styles.recommendModalText}>
               
                </Text> */}
                <Text style={{ fontWeight: '600', fontSize: 16, lineHeight: 25, marginTop: 10 }} >
                  Subscribe to the BME Bharat app
                </Text>
                <Text style={{ fontWeight: '600', fontSize: 16, lineHeight: 25 }} >for 12 months and pay for only 11 !</Text>



                <View style={styles.planBlock}>
                  <Text style={styles.strikePrice}>
                    ₹59 x 12 = <Text style={styles.strikeOnly}>₹708</Text>
                  </Text>
                  <Text style={styles.realPrice}>
                    ₹649 <Text style={styles.savingsText}>(Save ₹59)</Text>
                  </Text>

                  {/* <Text style={styles.strikePrice}>
                    499 x 12 = <Text style={styles.strikeOnly}>₹5,988</Text>
                  </Text>
                  <Text style={styles.realPrice}>
                    ₹5,489 <Text style={styles.savingsText}>(Save ₹499)</Text>
                  </Text> */}
                </View>



                <Text style={styles.recommendModalSubText}>
                  Enjoy uninterrupted access for a full year!
                </Text>
                <Text style={styles.recommendModalSubText}>
                  Limited-time offer – <Text style={{ fontWeight: 'bold' }}>Grab it now!</Text>
                </Text>

                <View style={styles.recommendButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { borderWidth: 1, borderColor: "#075cab" }]}
                    onPress={() => {
                      const premiumPackage = packages.find(p => p.name === 'Premium');
                      console.log('Selected Premium Package:', premiumPackage);
                      setSelectedPackage(premiumPackage);
                      setShowRecommendedModal(false);
                      setTimeout(() => {
                        initiatePayment(premiumPackage);
                      }, 300);

                    }}


                  >
                    <Text style={styles.modalButtonText}>Get Premium Plan</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setShowRecommendedModal(false);
                      setTimeout(() => {
                        initiatePayment(selectedPackage);
                      }, 300);

                    }}

                    style={{ paddingVertical: 8 }}
                  >
                    <Text style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>
                      No thanks, continue with <Text style={{ fontWeight: 'bold' }}>Basic</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>


    </SafeAreaView>

  );
};


const styles = StyleSheet.create({
  priceComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 20,
    gap: 12,
    width: '100%',
  },

  priceCard: {
    flex: 1,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },

  planLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },


  strikePrice: {
    fontSize: 14,
    color: '#999',
  },
  strikeOnly: {
    textDecorationLine: 'line-through',
    color: '#999',
  },

  planBlock: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
    marginVertical: 10,
    alignItems: 'center',

  },


  realPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 2,
  },


  savingsText: {
    fontSize: 14,
    color: '#388e3c',
    fontWeight: '500',
  },
  closeIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 75,
  },

  recommendModalContent: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,

  },

  recommendModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginVertical: 12,
    textAlign: 'center',

  },


  recommendModalText: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
    color: '#333',

  },

  recommendModalSubText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
  },

  recommendButtons: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    color: 'green',
  },
  modalMessage: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
  },
  modalButton: {
    marginTop: 15,
    backgroundColor: '#075cab',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',

  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },


  amountText: {
    textAlign: 'center',
    fontSize: 27,
    color: '#075cab',
    fontWeight: '600',

  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 999,

  },

  star: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  ray: {
    position: 'absolute',
    width: 2,
    height: 10,
    backgroundColor: 'gold',
    borderRadius: 1,
  },



  backButton: {
    padding: 10,
    alignSelf: 'flex-start'
  },

  container: {
    backgroundColor: 'white',
    flex: 1,
  },

  scrollViewContent: {
    paddingBottom: '20%',
    paddingHorizontal: 10,
  },


  divider: {
    height: 0.7,
    backgroundColor: "#075cab",
  },
  subscriptionWrapper: {
    padding: 10
  },
  fullpage: {
    borderWidth: 0.5,
    borderColor: '#075cab',
    borderRadius: 25,
    padding: 2,
  },
  durationtext: {
    fontWeight: '600',
    fontSize: 22,
    color: '#075cab',
    textAlign: 'center',
    padding: 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
    alignSelf: 'center'
  },
  buyNowRow: {
    alignSelf: 'center',
    borderWidth: 0.5,
    borderColor: '#075cab',
    // paddingTop: 10,
    paddingHorizontal: 20
  },
  featureText1: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 16,
  },

  table: {
    borderRadius: 5,
    overflow: 'hidden',

    // padding: 1,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: '#075cab',
    borderWidth: 0.5,
    backgroundColor: '#ffffff',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,

    marginVertical: 15,
    transform: [{ translateY: -1 }],
  },

  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#075cab',
    fontWeight: '700',

  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginVertical: 2,

  },

  featureText: {
    flex: 5,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    paddingLeft: 30,

  },

  iconRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },



});

export default LoginTimeUserSubscriptionScreen;

