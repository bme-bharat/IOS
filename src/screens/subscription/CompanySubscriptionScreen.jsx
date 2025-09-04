



import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Animated, ActivityIndicator, Modal, TouchableWithoutFeedback, Easing } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RazorpayCheckout from 'react-native-razorpay';
import RNRestart from 'react-native-restart';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import { useNavigation } from '@react-navigation/native';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';
import apiClient from '../ApiClient';
import LottieView from 'lottie-react-native';


const UserSubscriptionScreen = () => {
  const { myId, myData } = useNetwork();
  const navigation = useNavigation();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success');
  const name = myData?.company_name;
  const phone = myData?.company_contact_number;
  const email = myData?.company_email_id;
  const [showRecommendedModal, setShowRecommendedModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);

  // console.log('name',name)
  // console.log('phone',phone)
  // console.log('email',email)
  // console.log('subscriptionExpiresOn',subscriptionExpiresOn)


  const packages = [
    {
      name: 'Basic',
      day: '30',
      price: '499',
      amount: 499,
      features: [true, true, true, true, true, true, true, true, true, true, true],
    },
    {
      name: 'Premium',
      day: '365',
      price: '5489',
      amount: 5489,
      features: [true, true, true, true, true, true, true, true, true],
    },
    // {
    //   name: 'Pro ',
    //   day: '180',
    //   price: '1704',
    //   amount: 1704.00, // Amount in paise
    //   features: [true, true, true, true, true, true, true, true, true],
    // },
    // {
    //   name: 'Elite',
    //   day: '365',
    //   price: '3229',
    //   amount: 3229.00, // Amount in paise
    //   features: [true, true, true, true, true, true, true, true, true],
    // },
  ];

  const featuresList = [
    'Job updates',
    'Premium knowledge resources',
    'Access to companies and product\'s information',
    'Unlimited access to  forum',
    'Enhanced job portal features ',
    'Priority customer support',
    'Regular updates on biomedical engineering',
    'Exclusive access to talent',
    'Company profile enhancements',
    'Professional networking',
    'Access to latest biomedical events and exhibitions',
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
        user_id: myId,
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
          // console.error('❌ Razorpay Failed:', JSON.stringify(error, null, 2));
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
        'https://5kh43xmxxl.execute-api.ap-south-1.amazonaws.com/dev/deleteDueTransactions',
        {
          command: 'deleteDueTransactions',
          user_id: myId,
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

      showToast("Something went wrong", 'error');

    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      const verifyResponse = await axios.post('https://5kh43xmxxl.execute-api.ap-south-1.amazonaws.com/dev/verifyPayment', {
        command: 'verifyPayment',
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
        },
      });

      if (verifyResponse.data.statusCode === 200) {
        setModalType('success');
        await fetchAndStore();
      } else {
        setModalType('failure');
      }
    } catch (error) {
      setModalType('failure');
    } finally {

    }
  };

  const fetchAndStore = async () => {
    try {

      const response = await axios.post(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/getCompanyDetails',
        {
          command: 'getCompanyDetails',
          company_id: myId,
        },
        {
          headers: {
            'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
          }
        }
      );

      console.log('Full API Response:', JSON.stringify(response.data, null, 2));

      if (response.data?.status === 'success' && response.data?.status_message) {
        const companyData = response.data.status_message;

        console.log('Extracted companyData:', JSON.stringify(companyData, null, 2));

        await AsyncStorage.setItem('CompanyUserData', JSON.stringify(companyData));

        const storedCompanyData = await AsyncStorage.getItem('CompanyUserData');
        console.log('Stored CompanyUserData from AsyncStorage:', storedCompanyData);

        return companyData;
      } else {
        console.warn('Failed to fetch company data. Response:', JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.error('Error fetching and storing company data:', error);
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
    <View style={styles.container}>
      <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name="arrow-left" size={24} color="#075cab" />
      </TouchableOpacity>
      </View>
  

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
                onPress={() => {
                  console.log('📍 Modal button pressed. Type:', modalType);
                  setShowModal(false);

                  switch (modalType) {
                    case 'success':
                      console.log('✅ Payment success — restarting app...');
                      setTimeout(() => {
                        RNRestart.Restart();
                      }, 500);
                      break;

                    case 'failure':
                      // console.log('❌ Payment failed — modal closed (no retry triggered)');
                      // No retry here intentionally — just closes modal
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

                  }}
                >
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
                  {/* <Text style={styles.strikePrice}>
                    ₹59 x 12 = <Text style={styles.strikeOnly}>₹708</Text>
                  </Text>
                  <Text style={styles.realPrice}>
                    ₹649 <Text style={styles.savingsText}>(Save ₹59)</Text>
                  </Text> */}

                  <Text style={styles.strikePrice}>
                    499 x 12 = <Text style={styles.strikeOnly}>₹5,988</Text>
                  </Text>
                  <Text style={styles.realPrice}>
                    ₹5,489 <Text style={styles.savingsText}>(Save ₹499)</Text>
                  </Text>
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


    </View>

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

  headerContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
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


export default UserSubscriptionScreen;










