import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView,
  Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import DeviceInfo from 'react-native-device-info';
import { useSelector } from 'react-redux';
import NotificationSettings from '../AppUtils/NotificationSetting';
import { useNetwork } from '../AppUtils/IdProvider';
import apiClient from '../ApiClient';
import { useConnection } from '../AppUtils/ConnectionProvider';
import UserProfileCard from './UserProfileCard';
import DrawerNavigationList from './DrawerNavigationList';
import LottieView from 'lottie-react-native';
import { settingStyles as styles } from '../Styles/settingStyles';

const ProductsList = React.lazy(() => import('../Products/ProductsList'));
const JobListScreen = React.lazy(() => import('../Job/JobListScreen'));
const UserHomeScreen = React.lazy(() => import('../UserHomeScreen'));
const AllPosts = React.lazy(() => import('../Forum/Feed'));


const tabNameMap = {
  CompanyJobList: "Jobs",
  Home3: 'Home',
};
const tabConfig = [
  { name: "Home", component: UserHomeScreen, focusedIcon: 'home', unfocusedIcon: 'home-outline', iconComponent: Icon },
  { name: "Jobs", component: JobListScreen, focusedIcon: 'briefcase', unfocusedIcon: 'briefcase-outline', iconComponent: Icon },
  { name: "Feed", component: AllPosts, focusedIcon: 'rss', unfocusedIcon: 'rss-box', iconComponent: Icon },
  { name: "Products", component: ProductsList, focusedIcon: 'shopping', unfocusedIcon: 'shopping-outline', iconComponent: Icon },
  { name: "Settings", component: UserSettingScreen, focusedIcon: 'cog', unfocusedIcon: 'cog-outline', iconComponent: Icon },
];

const UserSettingScreen = () => {
  const navigation = useNavigation();
  const { myId, myData } = useNetwork();
  const { isConnected } = useConnection();

  const profile = useSelector(state => state.CompanyProfile.profile);

  const parentNavigation = navigation.getParent();
  const currentRouteName = parentNavigation?.getState()?.routes[parentNavigation.getState().index]?.name;
  const [expandedItem, setExpandedItem] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [deviceInfo, setDeviceInfo] = useState({
    appVersion: '',
  });
  const hasSubscription =
    myData?.subscription_expires_on &&
    Math.floor(Date.now() / 1000) < Number(myData.subscription_expires_on);


  useEffect(() => {
    // Fetch device information
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
      if (myId) {

        try {
          const response = await apiClient.post(
            '/getUsersTransactions',
            {
              command: "getUsersTransactions",
              user_id: myId,
            }
          );

          const completedTransactions = response.data.response.filter(
            transaction => transaction.transaction_status === "captured"
          );

          setTransactions(completedTransactions);
        } catch (err) {

        } finally {

        }
      }
    };

    fetchTransactions();
  }, [myId]);



  const handleToggle = (item) => {
    setExpandedItem(expandedItem === item ? null : item);
  };

  const navigateTo = screen => () => navigation.navigate(screen);

  const DrawerList = [
    { icon: 'id-card', label: 'Job profile', onPress: navigateTo('UserJobProfile') },
    { icon: 'id-card', label: 'Applied jobs', onPress: navigateTo('UserJobApplied') },
    {
      icon: 'rss',
      label: 'My posts',
      onPress: () => handleToggle('My posts'),
      subItems: [
        { label: 'Forum', onPress: navigateTo('YourForumList') },
        { label: 'Resources', onPress: navigateTo('Resourcesposted') },
      ],
    },
    { icon: 'chat-question', label: 'My enquiries', onPress: navigateTo('MyEnqueries') },
  
    { icon: 'account-cancel', label: 'Blocked users', onPress: navigateTo('BlockedUsers') },
    { icon: 'card-account-details', label: 'Subscription', onPress: navigateTo('UserSubscription') },
    hasSubscription && transactions.length > 0 && {
      icon: 'card-account-details',
      label: 'My subscriptions',
      onPress: navigateTo('YourSubscriptionList'),
    },
    { icon: 'information', label: 'About us', onPress: navigateTo('AboutUs') },
    {
      icon: 'shield-lock',
      label: 'Policies',
      onPress: () => handleToggle('Policies'),
      subItems: [
        { label: 'Privacy policy', onPress: navigateTo('InPrivacyPolicy') },
        { label: 'Cancellation policy', onPress: navigateTo('CancellationPolicy') },
        { label: 'Legal compliance', onPress: navigateTo('LegalPolicy') },
        { label: 'Terms and conditions', onPress: navigateTo('TermsAndConditions') },
      ],
    },
  ];


  const handleUpdate = () => {
    navigation.navigate('UserProfileUpdate', {
      profile,
      imageUrl: profile?.imageUrl,
    });
  };


  return (

    <SafeAreaView style={styles.container1} >

      <Animated.ScrollView contentContainerStyle={[styles.container, { paddingBottom: '20%', }]}
        showsVerticalScrollIndicator={false}  >

        {isConnected ? (
          <Animated.View >
            <UserProfileCard
              profile={profile}
              onEdit={handleUpdate}
              onNavigate={() => navigation.navigate('UserProfile')}
         
            />

          </Animated.View>

        ) : null}

        <DrawerNavigationList
          items={DrawerList}
          expandedItem={expandedItem}
          onToggle={handleToggle}
          isConnected={isConnected}
          
        />

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



export default UserSettingScreen;