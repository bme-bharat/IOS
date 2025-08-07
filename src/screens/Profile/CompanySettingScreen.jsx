
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ToastAndroid, Alert, SafeAreaView, Image, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation, useNavigationState } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';
import FastImage from 'react-native-fast-image';
import Icon1 from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import NotificationSettings from '../AppUtils/NotificationSetting';
import { useNetwork } from '../AppUtils/IdProvider';
import { useConnection } from '../AppUtils/ConnectionProvider';
import apiClient from '../ApiClient';

const ProductsList = React.lazy(() => import('../Products/ProductsList'));
const JobListScreen = React.lazy(() => import('../Job/JobListScreen'));
const CompanyHomeScreen = React.lazy(() => import('../CompanyHomeScreen'));
const PageView = React.lazy(() => import('../Forum/PagerViewForum'));


const tabNameMap = {
  CompanyJobList: "Jobs",
  Home: 'Home3',
  CompanySetting: 'Settings',
  ProductsList: 'Products'
};

const tabConfig = [
  { name: "Home", component: CompanyHomeScreen, focusedIcon: 'home', unfocusedIcon: 'home-outline', iconComponent: Icon },
  { name: "Jobs", component: JobListScreen, focusedIcon: 'briefcase', unfocusedIcon: 'briefcase-outline', iconComponent: Icon },
  { name: "Feed", component: PageView, focusedIcon: 'rss', unfocusedIcon: 'rss-box', iconComponent: Icon },
  { name: "Products", component: ProductsList, focusedIcon: 'shopping', unfocusedIcon: 'shopping-outline', iconComponent: Icon },
  { name: "Settings", component: CompanySettingScreen, focusedIcon: 'cog', unfocusedIcon: 'cog-outline', iconComponent: Icon },
];

const NavigationItem = ({ icon, label, onPress, showSubItems, children, onToggle }) => (

  <TouchableOpacity onPress={onPress} activeOpacity={1}>
    <View style={styles.drawerItem}>
      <Icon name={icon} size={20} color="#075cab" />
      <Text style={styles.drawerLabel}>{label}</Text>
      {children && children.length > 0 && onToggle && (
        <Icon
          name={showSubItems ? 'chevron-up' : 'chevron-down'}
          size={20}
          color='black'
          style={styles.dropdownIcon}
        />
      )}
    </View>
    {showSubItems && <View style={styles.subItemsContainer}>{children}</View>}
  </TouchableOpacity>


);

const CompanySettingScreen = () => {
  const navigation = useNavigation();
  const { myId, myData } = useNetwork();
  const { isConnected } = useConnection();

  const profile = useSelector(state => state.CompanyProfile.profile);
  const parentNavigation = navigation.getParent();
  const currentRouteName = parentNavigation?.getState()?.routes[parentNavigation.getState().index]?.name;
  const [expandedItem, setExpandedItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const navigateToBlockedUsers = () => navigation.navigate('BlockedUsers');
  const [deviceInfo, setDeviceInfo] = useState({
    appVersion: '',
  });

  const hasSubscription = myData?.subscription_expires_on
    ? Math.floor(Date.now() / 1000) < myData.subscription_expires_on
    : false;

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      const appVersion = await DeviceInfo.getVersion();
      setDeviceInfo({
        appVersion: appVersion,
      });
    };

    fetchDeviceInfo();
  }, []);


  useEffect(() => {
    const fetchTransactions = async () => {
      if (!myId) return;

      try {
        const response = await apiClient.post('/getUsersTransactions', {
          command: 'getUsersTransactions',
          user_id: myId,
        });

        if (response.data?.errorMessage) {
          setTransactions([]);
          return;
        }
        const allTransactions = response.data?.response || [];
        const completedTransactions = allTransactions.filter(
          transaction => transaction.transaction_status === 'captured'
        );

        setTransactions(completedTransactions);
      } catch (err) {

        setTransactions([]);
      }
    };

    fetchTransactions();
  }, [myId]);





  const handleToggle = (item) => {
    setExpandedItem(expandedItem === item ? null : item);
  };

  const navigateToMyServices = () => navigation.navigate('MyServices')
  const navigateToJPostedJob = () => navigation.navigate('PostedJob');
  const navigateToCompanyListJobCandiates = () => navigation.navigate('CompanyListJobCandiates');
  const navigateToPrivacyPolicy = () => navigation.navigate('InPrivacyPolicy');
  const navigateCancellationPolicy = () => navigation.navigate('CancellationPolicy')
  const navigateToLegalPolicy = () => navigation.navigate('LegalPolicy')
  const navigateToTermsandconditions = () => navigation.navigate('TermsAndConditions')
  const navigateToYourForumList = () => navigation.navigate('YourForumList');
  const navigateToMYResources = () => navigation.navigate('Resourcesposted');
  const navigateToAboutUs = () => navigation.navigate('AboutUs');
  const navigateToCompanySubscription = () => navigation.navigate('CompanySubscription');
  const navigateToSubscriptionList = () => navigation.navigate('YourSubscriptionList');
  const navigateToMyProducts = () => navigation.navigate('MyProducts');
  const navigateToMyQueriesList = () => navigation.navigate('MyEnqueries');


  const DrawerList = [

    { icon: 'shopping', label: 'My products', onPress: navigateToMyProducts },
    { icon: 'tools', label: 'My services', onPress: navigateToMyServices },


    { icon: 'briefcase', label: 'My jobs', onPress: navigateToJPostedJob },
    { icon: 'chat-question', label: 'My enquiries', onPress: navigateToMyQueriesList },


    { icon: 'account-tie', label: 'Job seekers', onPress: navigateToCompanyListJobCandiates },
    {
      icon: 'rss', label: 'My posts', onPress: () => handleToggle('My posts'), subItems: [
        { label: 'Forum', onPress: navigateToYourForumList },
        { label: 'Resources', onPress: navigateToMYResources },

      ]
    },

    { icon: 'account-cancel', label: 'Blocked users', onPress: navigateToBlockedUsers },
    { icon: 'card-account-details', label: 'Subscription', onPress: navigateToCompanySubscription },
    hasSubscription && transactions.length > 0 && {
      icon: 'card-account-details',
      label: 'My Subscriptions',
      onPress: navigateToSubscriptionList,
    },
    { icon: 'information', label: 'About us', onPress: navigateToAboutUs },

    {
      icon: 'shield-lock', label: 'Policies', onPress: () => handleToggle('Policies'), subItems: [
        { label: 'Privacy policy', onPress: navigateToPrivacyPolicy },
        { label: 'Cancellation policy', onPress: navigateCancellationPolicy },
        { label: 'Legal compliance', onPress: navigateToLegalPolicy },
        { label: 'Terms and conditions', onPress: navigateToTermsandconditions },

      ]
    },
  ];

  const handleUpdate = () => {
    navigation.navigate('CompanyProfileUpdate', {
      profile,
      imageUrl: profile?.imageUrl,
    });
  };


  const scrollOffsetY = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        console.log('offsetY:', offsetY); // ✅ This logs the current scroll offset
      },
    }
  );

  const collapsedTranslateY = scrollOffsetY.interpolate({
    inputRange: [168, 252],
    outputRange: [-60, 0], // Moves down into view
    extrapolate: 'clamp',
  });

  const collapsedOpacity = scrollOffsetY.interpolate({
    inputRange: [168, 252],
    outputRange: [0, 1], // Fades in
    extrapolate: 'clamp',
  });

  const fullProfileOpacity = scrollOffsetY.interpolate({
    inputRange: [168, 252],
    outputRange: [1, 0], // Fades out
    extrapolate: 'clamp',
  });


  return (

    <SafeAreaView style={styles.container1} >
      {/* <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} >
          <Icon name="arrow-left" size={24} color="#075cab" />
        </TouchableOpacity>
      </View > */}

      <Animated.View
        style={[
          styles.collapsedProfile,
          {
            transform: [{ translateY: collapsedTranslateY }],
            opacity: collapsedOpacity,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('CompanyProfile')}
          style={styles.miniProfileContent}
          activeOpacity={0.8}
        >
          <View style={styles.miniLeft}>
          
            {profile?.imageUrl ? (
              <FastImage
                source={{ uri: profile?.imageUrl, priority: FastImage.priority.normal }}
                cache="immutable"
                style={styles.miniImage}
                resizeMode='contain'
                onError={() => { }}
              />
            ) : (
              <View style={[styles.avatarContainerMini, { backgroundColor: profile?.companyAvatar?.backgroundColor }]}>
                <Text style={[styles.avatarTextMini, { color: profile?.companyAvatar?.textColor }]}>
                  {profile?.companyAvatar?.initials}
                </Text>
              </View>
            )}
            <Text style={styles.miniName}>
              {profile?.company_name?.trim()}
            </Text>
          </View>
          <Icon
            name="chevron-down"
            size={26}
            color="#1e2a38"
          />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView contentContainerStyle={[styles.container, { paddingBottom: '20%', }]}
        showsVerticalScrollIndicator={false} onScroll={handleScroll} >

        {isConnected ? (
          <Animated.View style={{ opacity: fullProfileOpacity }}>
            <TouchableOpacity activeOpacity={1} onPress={() => { navigation.navigate("CompanyProfile") }}
              style={styles.profileContainer} >


              <TouchableOpacity style={styles.editProfileButton} onPress={handleUpdate}>
                <Icon name="account-edit" size={20} color="#075cab" />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => { navigation.navigate("CompanyProfile") }}
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
              <View style={styles.profileDetails}>

                <View style={styles.title1}>
                  <Icon1 name="person" size={20} color="#075cab" />
                  <Text style={styles.colon}>|</Text>
                  <Text style={styles.value}>{(profile?.company_name?.trim())}</Text>

                </View>
                <View style={styles.title1}>
                  <Icon1 name="phone" size={20} color="#075cab" />
                  <Text style={styles.colon}>|</Text>

                  <Text style={styles.value}>{(profile?.company_contact_number || "").trimStart().trimEnd()}</Text>
                </View>
                <View style={styles.title1}>
                  <Icon1 name="email" size={20} color="#075cab" />
                  <Text style={styles.colon}>|</Text>

                  <Text style={styles.value}>{profile?.company_email_id || ""}</Text>
                </View>
                {profile?.business_registration_number?.trim() && (
                  <View style={styles.title1}>
                    <Icon1 name="school" size={20} color="#075cab" />
                    <Text style={styles.colon}>|</Text>
                    <Text style={styles.value}>{profile?.business_registration_number.trimStart().trimEnd()}</Text>
                  </View>
                )}

              </View>
              <Icon name="gesture-tap" size={18} color="#888" style={{ alignSelf: 'flex-end' }} />


            </TouchableOpacity>
          </Animated.View>
        ) : null}

        {DrawerList.filter(Boolean).map((item, index) => (
          <NavigationItem
            key={index}
            icon={item.icon}
            label={item.label}
            onPress={() => {
              if (isConnected) {
                item.onPress?.();
              } else {

              }
            }}
            showSubItems={expandedItem === item.label}
            onToggle={() => handleToggle(item.label)}
          >
            {item.subItems && item.subItems.map((subItem, subIndex) => (
              <TouchableOpacity
                key={subIndex}
                onPress={() => {
                  if (isConnected) {
                    subItem.onPress?.();
                  } else {

                  }
                }}
              >
                <Text style={styles.subItem}>{subItem.label}</Text>
              </TouchableOpacity>
            ))}
          </NavigationItem>
        ))}

        <NotificationSettings />

        <View style={styles.appversion}>
          <Text style={styles.appText}>App Version: {deviceInfo.appVersion}</Text>
        </View>

      </Animated.ScrollView>
      <View style={styles.bottomNavContainer}>
        {tabConfig.map((tab, index) => {
          const isFocused = currentRouteName === tab.name;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate(tab.name)}
              style={styles.navItem}
              activeOpacity={0.8}
            >
              <tab.iconComponent
                name={isFocused ? tab.focusedIcon : tab.unfocusedIcon}
                size={22}
                color={isFocused ? '#075cab' : 'black'}
              />
              <Text style={[styles.navText, { color: isFocused ? '#075cab' : 'black' }]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>

  );
};

const styles = StyleSheet.create({

  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,

  },

  profileContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    elevation: 4,
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    backgroundColor: '#fff'
  },

  editProfileButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 8,

  },
  editProfileText: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  profileDetails: {
    flex: 1,
    alignItems: 'flex-start',
    // marginLeft: 30,
    marginTop: 10

  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navText: {
    fontSize: 12,
    color: 'black',
    marginTop: 2,
  },

  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 80,
    marginBottom: 10,
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
  avatarTextMini: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    flex: 1,
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },

  title1: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',  // Align label and detail in a row
    alignItems: 'center',  // Center the items vertically
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  colon: {
    width: 40, // Fixed width for the colon
    textAlign: 'center', // Center the colon
    color: '#808080',
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
  drawerItem: {
    marginTop: 5,
    flexDirection: 'row',
    fontSize: 15,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 10,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  container: {
    flexGrow: 1,

  },


  version: {
    fontSize: 16,
    color: '#075cab',
    fontWeight: '500',
  },
  drawerLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: "#075cab",
    fontWeight: "500",
    marginVertical: 8,
  },

  subItemsContainer: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginHorizontal: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    // borderBottomRightRadius: 5,
    // borderBottomLeftRadius: 5,
  },

  appversion: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50

  },
  appText: {
    fontSize: 13,
    color: 'gray',
    // marginBottom: 5,
    fontWeight: '400',
    textAlign: 'justify',
    alignItems: 'center',

  },


  subItem: {
    padding: 5,
    marginHorizontal: 30,
    marginVertical: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "black",

  },

  container1: {
    flex: 1,
  },

  dropdownIcon: {
    marginLeft: 'auto',
    color: '#075cab',
  },
  collapsedProfile: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#ffffff',
    zIndex: 10,
    elevation: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dcdcdc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    justifyContent: 'center',
  },

  miniProfileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  miniLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  miniImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1.2,
    borderColor: '#7baee9',
    backgroundColor: '#e6f0ff',
  },

  miniName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e2a38',
    marginLeft:10

  },
  avatarContainerMini: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  avatarTextMini: {
    fontSize: 18,
    fontWeight: 'bold',
  },

});


export default CompanySettingScreen;