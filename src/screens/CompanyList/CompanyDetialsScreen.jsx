

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableWithoutFeedback, TouchableOpacity, TextInput, Modal, FlatList, Linking, Pressable, RefreshControl, ActivityIndicator, Share, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import default_image from '../../images/homepage/buliding.jpg'
import axios from 'axios';
import RNRestart from 'react-native-restart';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Image as FastImage } from 'react-native';
import apiClient from '../ApiClient';
import ContactSupplierModal from '../helperComponents/ContactsModal';
import { useNetwork } from '../AppUtils/IdProvider';
import { useFileOpener } from '../helperComponents/fileViewer';
import { openMediaViewer } from '../helperComponents/mediaViewer';
import { generateAvatarFromName } from '../helperComponents/useInitialsAvatar';
import { openLink } from '../AppUtils/openLinks';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import ShareIcon from '../../assets/svgIcons/share.svg';
import { colors, dimensions } from '../../assets/theme.jsx';
import { commonStyles } from '../AppUtils/AppStyles.js';

const CompanyDetailsScreen = ({ route }) => {
  const { myId, myData } = useNetwork();

  const navigation = useNavigation();
  const { userId, profile: routeProfile } = route.params || {};
  const [profile, setProfile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [companyPdf, setCompanyPdf] = useState('');
  const [isModalVisibleImage, setModalVisibleImage] = useState(false);
  const [isProductDropdownVisible, setProductDropdownVisible] = useState(false);
  const [isServiceDropdownVisible, setServiceDropdownVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [modalVisible1, setModalVisible1] = useState(false);
  const [loading1, setLoading1] = useState(false);
  const { openFile } = useFileOpener();

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

  const shareCompany = async (company) => {
    if (!company?.company_id) {
      console.error("Company data is incomplete");
      return;
    }

    try {
      const baseUrl = "https://bmebharat.com/company/";
      const companyUrl = `${baseUrl}${company.company_id}`;

      const result = await Share.share({
        message: `Checkout this company: ${companyUrl}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {

        } else {

        }
      } else if (result.action === Share.dismissedAction) {

      }
    } catch (error) {

    }
  };


  const fetchProducts = async () => {
    const payload = {
      command: 'getProductsByCompanyId',
      company_id: userId,
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
  };



  const fetchServices = async () => {
    const payload = {
      command: 'getServicesByCompanyId',
      company_id: userId,
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




  const handleProductSelect = (product) => {
    setProductDropdownVisible(false);
    navigateToDetails(product);
  };

  const handleSevicesSelect = (service) => {
    setServiceDropdownVisible(false);
    navigateToServiceDetails(service);
  };

  const toggleModal = useCallback(() => {
    setModalVisibleImage((prev) => !prev);
  }, []);



  const handleCancel = () => {
    toggleModal();
    navigation.navigate('CompanyDetails', { profile, imageUrl, userId });
  };


  const [loading, setLoading] = useState(true);
  const defaultImage = Image.resolveAssetSource(default_image).uri;

  const fetchProfile = async () => {
    setLoading(true);

    try {
      const response = await apiClient.post('/getCompanyDetails', {
        command: 'getCompanyDetails',
        company_id: userId,
      });

      if (
        response.data.status === 'success' &&
        response.data.status_message &&
        typeof response.data.status_message === 'object'
      ) {
        const profileData = response.data.status_message;

        let companyAvatar = null;
        let finalImageUrl = null;

        if (profileData.fileKey?.trim()) {
          try {
            const res = await apiClient.post('/getObjectSignedUrl', {
              command: 'getObjectSignedUrl',
              key: profileData.fileKey,
            });

            if (res?.data && typeof res.data === 'string' && res.data.trim() !== '') {
              finalImageUrl = res.data;
            } else {
              companyAvatar = generateAvatarFromName(profileData.company_name);
            }
          } catch (err) {
            companyAvatar = generateAvatarFromName(profileData.company_name);
          }
        } else {
          companyAvatar = generateAvatarFromName(profileData.company_name);
        }

        // Attach avatar to profileData
        profileData.companyAvatar = companyAvatar;
        setProfile(profileData);
        setImageUrl(finalImageUrl); // null if avatar should be used

        await fetchCompanypdf(profileData.brochureKey);
      } else {
        setProfile({ removed_by_author: true });
        setImageUrl(null);
      }
    } catch (error) {
      setProfile({ removed_by_author: true });
      setImageUrl(null);
    }

    setLoading(false);
  };





  useEffect(() => {
    if (routeProfile) {
      setProfile(routeProfile);

      if (routeProfile.fileKey?.trim()) {
        (async () => {
          try {
            const res = await apiClient.post('/getObjectSignedUrl', {
              command: 'getObjectSignedUrl',
              key: routeProfile.fileKey,
            });
            setImageUrl(res.data);
          } catch (error) {
            setImageUrl(defaultImage);
          }
        })();
      } else {
        setImageUrl(defaultImage);
      }

      fetchCompanypdf(routeProfile.brochureKey);
    } else {
      console.log('No profile from route, fetching from API');
      fetchProfile();
    }
  }, []);




  const fetchCompanypdf = async (brochureKey) => {
    try {
      const res = await apiClient.post('/getObjectSignedUrl', {
        command: "getObjectSignedUrl",
        key: brochureKey,
      });
      const url = await res.data;
      if (url) {
        setCompanyPdf(url);
      }
    } catch (error) {
      // console.error("Error getting signed URL for company brochure:", error);
    }
  };





  const handleViewCompanyPdf = () => {
    if (companyPdf) {
      Linking.openURL(companyPdf).catch(err => console.error("Error opening company brochure PDF:", err));
    }
  };


  if (!profile) {

    return (
      <View style={styles.container}>

        <View style={styles.headerContainer}>

          <TouchableOpacity style={styles.backButton}
            activeOpacity={1}
            onPress={() => navigation.goBack()}>
            <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

          </TouchableOpacity>

        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size='large' color='#075cab' />
        </View>
      </View>
    );
  }

  if (profile?.removed_by_author) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton}
            activeOpacity={1}
            onPress={() => navigation.goBack()}>
            <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

          </TouchableOpacity>

        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>This post was removed by the author</Text>
        </View>
      </View>
    );
  }

  return (

    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton}
          activeOpacity={1}
          onPress={() => navigation.goBack()}>
          <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

        </TouchableOpacity>
        <TouchableOpacity onPress={() => shareCompany(profile)} style={styles.dropdownItem}>
          <ShareIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

          <Text style={styles.dropdownText}>Share</Text>
        </TouchableOpacity>

      </View>


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:5}}>
 
          <TouchableOpacity
            onPress={() => {
              if (typeof imageUrl === 'string' && imageUrl.trim() !== '') {
                openMediaViewer([{ type: 'image', url: imageUrl }]);
              }
            }}
            activeOpacity={1}
            style={styles.imageContainer}
          >
            {profile.fileKey && typeof imageUrl === 'string' && imageUrl.trim() !== '' ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.detailImage}
                resizeMode={imageUrl.includes('buliding.jpg') ? 'cover' : 'contain'}
                onError={() => setImageUrl(null)}
              />
            ) : (
              <View
                style={[
                  styles.detailImage,
                  {
                    backgroundColor:
                      profile?.companyAvatar?.backgroundColor || '#ccc',
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text
                  style={[
                    commonStyles.avatarText,
                    { color: profile?.companyAvatar?.textColor || '#000' },
                  ]}
                >
                  {profile?.companyAvatar?.initials || ''}
                </Text>
              </View>
            )}
          </TouchableOpacity>



          <View style={[styles.detailsContainer]}>

            <View style={commonStyles.labValContainer}>
              <Text style={commonStyles.label}>Company     </Text>
              <Text style={commonStyles.colon}>:</Text>
              <Text style={commonStyles.value}>{(profile?.company_name || "").trimStart().trimEnd()}</Text>
            </View>

            <View style={commonStyles.labValContainer}>
              <Text style={commonStyles.label}>Category      </Text>
              <Text style={commonStyles.colon}>:</Text>

              <Text style={commonStyles.value}>{profile?.category || ""}</Text>
            </View>
            <View style={commonStyles.labValContainer}>
              <Text style={commonStyles.label}>City              </Text>
              <Text style={commonStyles.colon}>:</Text>

              <Text style={commonStyles.value}>{profile?.company_located_city || ""}</Text>
            </View>
            <View style={commonStyles.labValContainer}>
              <Text style={commonStyles.label}>State            </Text>
              <Text style={commonStyles.colon}>:</Text>

              <Text style={commonStyles.value}>{profile?.company_located_state || ""}</Text>
            </View>
            {profile?.company_address?.trimStart().trimEnd() ? (
              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Address</Text>
                <Text style={commonStyles.colon}>:</Text>
                <Text style={commonStyles.value}>{profile.company_address.trim()}</Text>
              </View>
            ) : null}
            {profile?.Website?.trimStart().trimEnd() ? (
              <View style={commonStyles.labValContainer}>
                <Text style={commonStyles.label}>Website</Text>
                <Text style={commonStyles.colon}>:</Text>
                <Text style={commonStyles.value}>
                  <TouchableOpacity onPress={() => openLink(profile.Website)}>
                    <Text style={[commonStyles.value, { color: "#075cab", textDecorationLine: "underline" }]}>
                      {profile.Website.trim()}
                    </Text>
                  </TouchableOpacity>
                </Text>
              </View>
            ) : null}

            {profile?.company_description?.trimStart().trimEnd() ? (
              <View style={[commonStyles.labValContainer]}>
                <Text style={commonStyles.label}>Description</Text>
                <Text style={commonStyles.colon}>:</Text>
                <Text style={[commonStyles.value]}>{profile.company_description.trim()}</Text>
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
                  {products && products.length > 0 ? (
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
                  ) : (

                    <Text style={styles.noProductsText}>No products available</Text>

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
                  {services && services.length > 0 ? (
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
                  ) : (

                    <Text style={styles.noProductsText}>No services available</Text>

                  )}
                </View>
              </Pressable>
            </Modal>

          </View>

          <Modal visible={isModalVisibleImage} transparent={true}>
            <View style={styles.modalContainerImage}>
              <FastImage
                source={{ uri: imageUrl }}
                style={styles.modalImage}
                resizeMode='contain'
                onError={() => setImageUrl(null)}
              />

              <TouchableOpacity onPress={handleCancel} style={styles.closeButton1}>
                <Ionicons name="close" size={24} color="white" />

              </TouchableOpacity>
            </View>
          </Modal>


          {myId !== userId && (
            <>
              <TouchableOpacity onPress={() => setModalVisible1(true)} style={{ padding: 10 }}>
                <Text style={styles.contact}>Contact details</Text>
              </TouchableOpacity>

              <ContactSupplierModal
                visible={modalVisible1}
                onClose={() => setModalVisible1(false)}
                company_id={userId}
              />
            </>
          )}
  
      </ScrollView>

    </View>

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
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',

  },
  noProductsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },

  dropdownContainer: {
    position: 'absolute',
    top: 45,
    right: 19,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    elevation: 5,
    zIndex: 1,
  },

  dropdownItem: {
    flexDirection: 'row',

    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 15,
    color: '#075cab',
    paddingHorizontal: 10,
    fontWeight: '500'
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,
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

  title1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderRadius: 10,
    padding: 10,
    elevation:3
  },
  detailsContainer: {

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

  colon: {
    width: 20, // Fixed width for the colon
    textAlign: 'center', // Center the colon
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    alignSelf: 'flex-start',

  },


  value: {
    flex: 2,
    flexShrink: 1,
    color: 'black',
    fontWeight: '400',
    fontSize: 15,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  label2: {
    fontWeight: '500',
    color: 'black',
    fontSize: 15,
  },

  selectedText: {
    color: '#000', // Black color when a service is selected
  },
  placeholderText: {
    color: 'black', // Gray color for the 'Select' placeholder
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


  createPostButton: {
    marginRight: 10,
    width: 30, // Set the width of the circle
    height: 30, // Set the height of the circle
    borderRadius: 30, // Make it circular
    backgroundColor: '#075cab', // Background color of the circle
    alignItems: 'center', // Center the icon horizontally
    justifyContent: 'center', // Center the icon vertically
    elevation: 5, // Add shadow for Android
    shadowColor: '#000', // Shadow color for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow offset for iOS
    shadowOpacity: 0.3, // Shadow opacity for iOS
    shadowRadius: 4, // Shadow radius for iOS
  },

  signOutButton: {
    paddingVertical: 10,  // Adjust padding for the desired button height
    paddingHorizontal: 15, // Adjust padding to fit icon and text nicely
    justifyContent: "center",
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 40,
    borderRadius: 5,
    width: 'auto', // Ensure it doesn't take full width
    alignSelf: 'center',
    minWidth: 120, // Optional: ensures a minimum size for the button
    maxWidth: 200,
  },
  signOutButtonText: {
    color: "#075cab",
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 5,
    alignSelf: 'center'
  },
  deleteAccountButton: {
    justifyContent: "center",
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 5,
    marginTop: 20,
    width: 'auto', // Ensure it doesn't take full width
    alignSelf: 'center',
    minWidth: 180, // Optional: ensures a minimum size for the button
    maxWidth: 200,
  },
  deleteAccountButtonText: {
    color: "red",
    fontSize: 16,
    fontWeight: '900',
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
    marginVertical: 20,

  },
  contact: {
    fontSize: 15,
    color: '#075cab',
    textDecorationLine: 'underline',
    padding: 10,
    fontWeight: '500',
    textAlign: 'center',

  },
  detailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center'

  },
  avatarText: {
    fontSize: 40,
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
  activeTabButton: {
    backgroundColor: 'white',
    // color:'white'
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
    width: '80%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    justifyContent: 'space-between',
  },


  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalContent1: {
    width: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },

  modalText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#000',
    marginBottom: 10,
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, // Shadow opacity for iOS
    shadowRadius: 4, // Shadow radius for iOS
  },

  modalContainer1: {
    width: '80%', // You can adjust the width to your needs
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center', // Center content horizontally

  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark background with transparency
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
    fontSize: 16,
    color: 'black',
    textAlign: 'justify',
    lineHeight: 22,
    marginBottom: 25,
  },
  deletionText1: {
    fontSize: 16,
    color: 'black',
    textAlign: 'justify',
    lineHeight: 22,
    marginBottom: 25,
    fontWeight: '500',
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



  phoneNumber: {
    color: '#075cab',
    fontWeight: 'bold',
    top: 10,
  },
  cancelButtonText: {
    color: 'green',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
    marginTop: 20,
    alignItems: 'center',
  },
  resendButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  resendButtonText: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 14,
    color: 'black',
  },



  activeTabButtonText: {
    color: 'white', // White text when active
  },

});


export default CompanyDetailsScreen;