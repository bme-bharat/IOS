
import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';
import { useSelector } from 'react-redux';
import NotificationSettings from '../AppUtils/NotificationSetting';
import { useNetwork } from '../AppUtils/IdProvider';
import { useConnection } from '../AppUtils/ConnectionProvider';
import apiClient from '../ApiClient';
import UserProfileCard from './UserProfileCard';
import DrawerNavigationList from './DrawerNavigationList';
import { settingStyles as styles } from '../Styles/settingStyles';
import BottomNavigationBar from '../AppUtils/BottomNavigationBar';

const ProductsList = React.lazy(() => import('../Products/ProductsList'));
const JobListScreen = React.lazy(() => import('../Job/JobListScreen'));
const CompanyHomeScreen = React.lazy(() => import('../CompanyHomeScreen'));
const AllPosts = React.lazy(() => import('../Forum/Feed'));


const tabNameMap = {
  CompanyJobList: "Jobs",
  Home: 'Home3',
  CompanySetting: 'Settings',
  ProductsList: 'Products'
};

const tabConfig = [
  { name: "Home", component: CompanyHomeScreen, focusedIcon: 'home', unfocusedIcon: 'home-outline', iconComponent: Icon },
  { name: "Jobs", component: JobListScreen, focusedIcon: 'briefcase', unfocusedIcon: 'briefcase-outline', iconComponent: Icon },
  { name: "Feed", component: AllPosts, focusedIcon: 'rss', unfocusedIcon: 'rss-box', iconComponent: Icon },
  { name: "Products", component: ProductsList, focusedIcon: 'shopping', unfocusedIcon: 'shopping-outline', iconComponent: Icon },
  { name: "Settings", component: CompanySettingScreen, focusedIcon: 'cog', unfocusedIcon: 'cog-outline', iconComponent: Icon },
];


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

  const navigateTo = screen => () => navigation.navigate(screen);

  const DrawerList = [
    { icon: 'shopping', label: 'My products', onPress: navigateTo('MyProducts') },
    { icon: 'tools', label: 'My services', onPress: navigateTo('MyServices') },
    { icon: 'briefcase', label: 'My jobs', onPress: navigateTo('PostedJob') },
    { icon: 'account-tie', label: 'Job seekers', onPress: navigateTo('CompanyListJobCandiates') },
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
    { icon: 'card-account-details', label: 'Subscription', onPress: navigateTo('CompanySubscription') },
    hasSubscription && transactions.length > 0 && {
      icon: 'card-account-details',
      label: 'My Subscriptions',
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
    navigation.navigate('CompanyProfileUpdate', {
      profile,
      imageUrl: profile?.imageUrl,
    });
  };



  return (

    <SafeAreaView style={styles.container1} >


      <Animated.ScrollView contentContainerStyle={[styles.container, { paddingBottom: '20%', }]}
        showsVerticalScrollIndicator={false} >

        {isConnected ? (
          <Animated.View >
            <UserProfileCard
              profile={profile}
              onEdit={handleUpdate}
              onNavigate={() => navigation.navigate('CompanyProfile')}
              styles={styles}
            />

          </Animated.View>
        ) : null}
        <DrawerNavigationList
          items={DrawerList}
          expandedItem={expandedItem}
          onToggle={handleToggle}
          isConnected={isConnected}
          styles={styles}
        />
  

        <NotificationSettings />

        <View style={styles.appversion}>
          <Text style={styles.appText}>App Version: {deviceInfo.appVersion}</Text>
        </View>

      </Animated.ScrollView>

      <BottomNavigationBar
        tabs={tabConfig}
        currentRouteName={currentRouteName}
        navigation={navigation}
      />

    </SafeAreaView>

  );
};



export default CompanySettingScreen;