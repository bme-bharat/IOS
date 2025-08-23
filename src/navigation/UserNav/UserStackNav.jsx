import React, { useCallback, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
////user job nav
import UserJobProfileScreen from '../../screens/Job/UserJobProfileScreen';
import UserJobListScreen from '../../screens/Job/JobListScreen';
import JobDetailScreen from '../../screens/Job/JobDetailScreen';

//company list
import CompanyListScreen from '../../screens/CompanyList/CompanyList';
import CompanyDetailsScreen from '../../screens/CompanyList/CompanyDetialsScreen';

import ForumEditScreen from '../../screens/Forum/ForumEditScreen';
import YourForumListScreen from '../../screens/Forum/myForums';
import CommentScreen from '../../screens/Forum/forumPostDetails';
//user Profile nav
import UserProfilescreen from '../../screens/Profile/UserProfilescreen';
import UserSettingScreen from '../../screens/Profile/UserSettingScreen';
import UserJobAppliedScreen from '../../screens/Job/UserJobAppliedScreen';
import UserAppliedJobDetailsScreen from '../../screens/Job/UserAppliedJobDetailsScreen';
import UserSubscriptionScreen from '../../screens/subscription/UserSubscriptionScreen';

//homescreen
import HomeScreen from '../../screens/UserHomeScreen';
//content
import AboutUs from '../../screens/Bme_content/AboutUs';
import PrivacyPolicy from '../../screens/Bme_content/PrivacyPolicy';

import UserProfileUpdateScreen from '../../screens/Profile/UserProfileUpdateScreen';
import YourSubscriptionListScreen from '../../screens/subscription/YourSubscriptionListScreen';
import UserJobProfileUpdateScreen from '../../screens/Job/UserJobProfileUpdateScreen';
import UserJobProfileCreateScreen from '../../screens/Job/UserJobProfileCreateScreen';
import CancellationPolicy from '../../screens/Bme_content/CancellationPolicy';
import LegalPolicy from '../../screens/Bme_content/LegalPolicy';
import TermsAndConditionsScreen from '../../screens/Bme_content/TermsAndConditions';
import CompanyDetailsPage from '../../screens/Profile/CompanyDetailsPage';
import UserDetailsPage from '../../screens/Profile/UserDetailPage';
import AllNotification from '../../screens/AllNotification';

import { createDrawerNavigator } from '@react-navigation/drawer';
import ResourcesPost from '../../screens/Resources/ResourcesPost';
import ResourcesList from '../../screens/Resources/ResourcesList';
import AllEvents from '../../screens/Resources/Events';
import ResourcesEdit from '../../screens/Resources/ResourcesEdit';
import YourResourcesList from '../../screens/Resources/MyResources';
import ProductDetails from '../../screens/Products/ProductDetails';
import CreateProduct from '../../screens/Products/ProductUploads';
import ProductsList from '../../screens/Products/ProductsList';
import RelatedProductDetails from '../../screens/Products/RelatedProductsDetails';
import MyProducts from '../../screens/Products/MyProducts';
import EditProduct from '../../screens/Products/ProductEdit';

import ResourceDetails from '../../screens/Resources/ResourceDetails';
import ForumPostScreen from '../../screens/Forum/ForumPost';
import BlockedUsers from '../../screens/Profile/BlockedUsers';
import ServicesList from '../../screens/Services/ServicesList';
import ServiceDetails from '../../screens/Services/ServiceDetails';
import EnquiryForm from '../../screens/Services/Enquiry';
import MyEnqueries from '../../screens/Services/MyEnqueries';
import RelatedServicesDetails from '../../screens/Services/RelatedServicesDetails';
import EnquiryDetails from '../../screens/Services/EnquiryDetails';
import InPrivacyPolicy from '../../screens/Bme_content/InPrivacyPolicy';
import UserHomeScreen from '../../screens/UserHomeScreen';
import { createStackNavigator } from '@react-navigation/stack';
import AllPosts from '../../screens/Forum/Feed';
import LatestPosts from '../../screens/Forum/FeedLatest';
import TrendingPosts from '../../screens/Forum/FeedTrending';


const Stack = createStackNavigator();

const screenOptionStyle = {
  statusBarColor: '#075cab',
  headerStyle: {
    backgroundColor: '#075cab',
    height: 50, // Set a lower height for the header

  },
  headerTintColor: '#fff',
  headerTitleAlign: 'center',
  headerTitleStyle: {
    fontSize: 16, // Adjust title size if needed
  },
};


const screenOption = {
  title: null, // Removes the title
  headerBackTitleVisible: false,
  headerShown: false,

};




const UserStackNav = () => {
  const Stack = createNativeStackNavigator();
  const navigation = useNavigation();
  return (
    <Stack.Navigator screenOptions={screenOptionStyle}>

      <Stack.Screen name="Home3" component={HomeScreen} options={screenOption} />
      <Stack.Screen name="AboutUs" component={AboutUs} options={screenOption} />
      <Stack.Screen name="AllNotification" component={AllNotification} options={screenOption} />
      <Stack.Screen name="UserSubscription" component={UserSubscriptionScreen} options={screenOption} />
      <Stack.Screen name="UserProfileUpdate" component={UserProfileUpdateScreen} options={screenOption} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} options={screenOption} />
      <Stack.Screen name="UserProfile" component={UserProfilescreen} options={screenOption} />
      <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} options={screenOption} />
      <Stack.Screen name="UserJobProfileCreate" component={UserJobProfileCreateScreen} options={screenOption} />
      <Stack.Screen name="AllPosts" component={AllPosts} options={screenOption} />
      <Stack.Screen name="Latest" component={LatestPosts} options={screenOption} />
      <Stack.Screen name="Trending" component={TrendingPosts} options={screenOption} />


      <Stack.Screen name="Comment" component={CommentScreen} options={screenOption} />
      <Stack.Screen name="EnquiryForm" component={EnquiryForm} options={screenOption} />
      <Stack.Screen name="EnquiryDetails" component={EnquiryDetails} options={screenOption} />

      <Stack.Screen name="UserDetailsPage" component={UserDetailsPage} options={screenOption} />
      <Stack.Screen name="CompanyDetailsPage" component={CompanyDetailsPage} options={screenOption} />
      <Stack.Screen name="ServiceDetails" component={ServiceDetails} options={screenOption} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={screenOption} />
      <Stack.Screen name="ProductDetails" component={ProductDetails} options={screenOption} />
      <Stack.Screen name="RelatedServicesDetails" component={RelatedServicesDetails} options={screenOption} />
      <Stack.Screen name="RelatedProductDetails" component={RelatedProductDetails} options={screenOption} />
      <Stack.Screen name="ResourceDetails" component={ResourceDetails} options={screenOption} />

    </Stack.Navigator>

  )
}

const UserJobNav = () => (

  <Stack.Navigator screenOptions={screenOptionStyle} initialRouteName='UserJobList' >
    <Stack.Screen name="UserJobProfile" component={UserJobProfileScreen} options={screenOption} />
    <Stack.Screen name="UserJobProfileUpdate" component={UserJobProfileUpdateScreen} options={screenOption} />
    <Stack.Screen name="UserJobProfileCreate" component={UserJobProfileCreateScreen} options={screenOption} />
    <Stack.Screen name="UserJobList" component={UserJobListScreen} options={screenOption} />

    <Stack.Screen name="UserJobApplied" component={UserJobAppliedScreen} options={screenOption} />
    <Stack.Screen name="UserAppliedJobDetails" component={UserAppliedJobDetailsScreen} options={screenOption} />
    <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} options={screenOption} />
    <Stack.Screen name="Comment" component={CommentScreen} options={screenOption} />
    <Stack.Screen name="UserDetailsPage" component={UserDetailsPage} options={screenOption} />
    <Stack.Screen name="CompanyDetailsPage" component={CompanyDetailsPage} options={screenOption} />
    <Stack.Screen name="ServiceDetails" component={ServiceDetails} options={screenOption} />
    <Stack.Screen name="JobDetail" component={JobDetailScreen} options={screenOption} />
    <Stack.Screen name="ProductDetails" component={ProductDetails} options={screenOption} />
    <Stack.Screen name="RelatedServicesDetails" component={RelatedServicesDetails} options={screenOption} />
    <Stack.Screen name="RelatedProductDetails" component={RelatedProductDetails} options={screenOption} />
    <Stack.Screen name="ResourceDetails" component={ResourceDetails} options={screenOption} />

  </Stack.Navigator>
);



const UserCompanyListNav = () => {


  return (
    <Stack.Navigator screenOptions={screenOptionStyle} initialRouteName='CompanyList' >

      <Stack.Screen
        name="CompanyList"
        component={CompanyListScreen}
        options={screenOption}
      />

      <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} options={screenOption} />
      <Stack.Screen name="UserDetailsPage" component={UserDetailsPage} options={screenOption} />
      <Stack.Screen name="CompanyDetailsPage" component={CompanyDetailsPage} options={screenOption} />
      <Stack.Screen name="ServiceDetails" component={ServiceDetails} options={screenOption} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={screenOption} />
      <Stack.Screen name="ProductDetails" component={ProductDetails} options={screenOption} />
      <Stack.Screen name="RelatedServicesDetails" component={RelatedServicesDetails} options={screenOption} />
      <Stack.Screen name="RelatedProductDetails" component={RelatedProductDetails} options={screenOption} />
      <Stack.Screen name="ResourceDetails" component={ResourceDetails} options={screenOption} />

    </Stack.Navigator>
  )
}

const UserForumNav = () => {

  return (

    <Stack.Navigator
      screenOptions={screenOptionStyle}
      initialRouteName="AllPosts"
    >
      <Stack.Screen name="AllPosts" component={AllPosts} options={screenOption} />
      <Stack.Screen name="Latest" component={LatestPosts} options={screenOption} />
      <Stack.Screen name="Trending" component={TrendingPosts} options={screenOption} />

      <Stack.Screen name="Home3" component={HomeScreen} options={screenOption} />
      <Stack.Screen name="ForumPost" component={ForumPostScreen} options={screenOption} />

      <Stack.Screen name="ForumEdit" component={ForumEditScreen} options={screenOption} />
      <Stack.Screen name="AllNotification" component={AllNotification} options={screenOption} />
      <Stack.Screen name="YourForumList" component={YourForumListScreen} options={screenOption} />
      <Stack.Screen name="Comment" component={CommentScreen} options={screenOption} />

      <Stack.Screen name="UserDetailsPage" component={UserDetailsPage} options={screenOption} />
      <Stack.Screen name="CompanyDetailsPage" component={CompanyDetailsPage} options={screenOption} />
      <Stack.Screen name="ServiceDetails" component={ServiceDetails} options={screenOption} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={screenOption} />
      <Stack.Screen name="ProductDetails" component={ProductDetails} options={screenOption} />
      <Stack.Screen name="RelatedServicesDetails" component={RelatedServicesDetails} options={screenOption} />
      <Stack.Screen name="RelatedProductDetails" component={RelatedProductDetails} options={screenOption} />
      <Stack.Screen name="ResourceDetails" component={ResourceDetails} options={screenOption} />

    </Stack.Navigator>


  );
};



const UserProfileNav = () => (


  <Stack.Navigator screenOptions={screenOptionStyle} initialRouteName='UserSetting'>
    <Stack.Screen name="Home3" component={HomeScreen} options={screenOption} />
    <Stack.Screen name="UserSetting" component={UserSettingScreen} options={screenOption} />
    <Stack.Screen name="UserProfile" component={UserProfilescreen} options={screenOption} />
    <Stack.Screen name="UserProfileUpdate" component={UserProfileUpdateScreen} options={screenOption} />
    <Stack.Screen name="UserJobProfile" component={UserJobProfileScreen} options={screenOption} />
    <Stack.Screen name="UserJobProfileCreate" component={UserJobProfileCreateScreen} options={screenOption} />
    <Stack.Screen name="UserJobProfileUpdate" component={UserJobProfileUpdateScreen} options={screenOption} />
    <Stack.Screen name="Comment" component={CommentScreen} options={screenOption} />
    <Stack.Screen name="UserJobList" component={UserJobListScreen} options={screenOption} />

    <Stack.Screen name="UserJobApplied" component={UserJobAppliedScreen} options={screenOption} />
    <Stack.Screen name="UserAppliedJobDetails" component={UserAppliedJobDetailsScreen} options={screenOption} />

    <Stack.Screen name="BlockedUsers" component={BlockedUsers} options={screenOption} />
    <Stack.Screen name="ForumPost" component={ForumPostScreen} options={screenOption} />

    <Stack.Screen name="ForumEdit" component={ForumEditScreen} options={screenOption} />
    <Stack.Screen name="YourForumList" component={YourForumListScreen} options={screenOption} />
    <Stack.Screen name="Resourcesposted" component={YourResourcesList} options={screenOption} />
    <Stack.Screen name="ResourcesEdit" component={ResourcesEdit} options={screenOption} />
    <Stack.Screen name="ResourcesPost" component={ResourcesPost} options={screenOption} />
    <Stack.Screen name="UserSubscription" component={UserSubscriptionScreen} options={screenOption} />
    <Stack.Screen name='YourSubscriptionList' component={YourSubscriptionListScreen} options={screenOption} />
    <Stack.Screen name="AboutUs" component={AboutUs} options={screenOption} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} options={screenOption} />
    <Stack.Screen name="CancellationPolicy" component={CancellationPolicy} options={screenOption} />
    <Stack.Screen name="LegalPolicy" component={LegalPolicy} options={screenOption} />
    <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} options={screenOption} />
    <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} options={screenOption} />
    <Stack.Screen name="ServicesList" component={ServicesList} options={screenOption} />

    <Stack.Screen name="EnquiryForm" component={EnquiryForm} options={screenOption} />
    <Stack.Screen name="MyEnqueries" component={MyEnqueries} options={screenOption} />
    <Stack.Screen name="EnquiryDetails" component={EnquiryDetails} options={screenOption} />

    <Stack.Screen name="InPrivacyPolicy" component={InPrivacyPolicy} options={screenOption} />

    <Stack.Screen name="UserDetailsPage" component={UserDetailsPage} options={screenOption} />
    <Stack.Screen name="CompanyDetailsPage" component={CompanyDetailsPage} options={screenOption} />
    <Stack.Screen name="ServiceDetails" component={ServiceDetails} options={screenOption} />
    <Stack.Screen name="JobDetail" component={JobDetailScreen} options={screenOption} />
    <Stack.Screen name="ProductDetails" component={ProductDetails} options={screenOption} />
    <Stack.Screen name="RelatedServicesDetails" component={RelatedServicesDetails} options={screenOption} />
    <Stack.Screen name="RelatedProductDetails" component={RelatedProductDetails} options={screenOption} />
    <Stack.Screen name="ResourceDetails" component={ResourceDetails} options={screenOption} />

  </Stack.Navigator>



);

const UserResources = () => (

  <Stack.Navigator screenOptions={screenOptionStyle} initialRouteName='ResourcesList'>
    <Stack.Screen name="ResourcesList" component={ResourcesList} options={screenOption} />
    <Stack.Screen name="Resources posted" component={YourResourcesList} options={screenOption} />
    <Stack.Screen name="ResourcesEdit" component={ResourcesEdit} options={screenOption} />
    <Stack.Screen name="ResourcesPost" component={ResourcesPost} options={screenOption} />

    <Stack.Screen name="UserDetailsPage" component={UserDetailsPage} options={screenOption} />
    <Stack.Screen name="CompanyDetailsPage" component={CompanyDetailsPage} options={screenOption} />
    <Stack.Screen name="ServiceDetails" component={ServiceDetails} options={screenOption} />
    <Stack.Screen name="JobDetail" component={JobDetailScreen} options={screenOption} />
    <Stack.Screen name="ProductDetails" component={ProductDetails} options={screenOption} />
    <Stack.Screen name="RelatedServicesDetails" component={RelatedServicesDetails} options={screenOption} />
    <Stack.Screen name="RelatedProductDetails" component={RelatedProductDetails} options={screenOption} />
    <Stack.Screen name="ResourceDetails" component={ResourceDetails} options={screenOption} />

  </Stack.Navigator>

);


const UserResourcesDrawer = () => (

  <Stack.Navigator screenOptions={screenOptionStyle} initialRouteName='Resourcesposted'>
    <Stack.Screen name="ResourcesList" component={ResourcesList} options={screenOption} />
    <Stack.Screen name="Resourcesposted" component={YourResourcesList} options={screenOption} />
    <Stack.Screen name="ResourcesEdit" component={ResourcesEdit} options={screenOption} />
    <Stack.Screen name="ResourcesPost" component={ResourcesPost} options={screenOption} />

    <Stack.Screen name="UserDetailsPage" component={UserDetailsPage} options={screenOption} />
    <Stack.Screen name="CompanyDetailsPage" component={CompanyDetailsPage} options={screenOption} />
    <Stack.Screen name="ServiceDetails" component={ServiceDetails} options={screenOption} />
    <Stack.Screen name="JobDetail" component={JobDetailScreen} options={screenOption} />
    <Stack.Screen name="ProductDetails" component={ProductDetails} options={screenOption} />
    <Stack.Screen name="RelatedServicesDetails" component={RelatedServicesDetails} options={screenOption} />
    <Stack.Screen name="RelatedProductDetails" component={RelatedProductDetails} options={screenOption} />
    <Stack.Screen name="ResourceDetails" component={ResourceDetails} options={screenOption} />

  </Stack.Navigator>

);

const UserProducts = () => {
  return (
    <Stack.Navigator screenOptions={screenOptionStyle}>
      <Stack.Screen name="ProductsList" component={ProductsList} options={screenOption} />
      <Stack.Screen name="EditProduct" component={EditProduct} options={screenOption} />
      <Stack.Screen name="CreateProduct" component={CreateProduct} options={screenOption} />
      <Stack.Screen name="MyProducts" component={MyProducts} options={screenOption} />

      <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} options={screenOption} />
      <Stack.Screen name="UserDetailsPage" component={UserDetailsPage} options={screenOption} />
      <Stack.Screen name="CompanyDetailsPage" component={CompanyDetailsPage} options={screenOption} />
      <Stack.Screen name="ServiceDetails" component={ServiceDetails} options={screenOption} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={screenOption} />
      <Stack.Screen name="ProductDetails" component={ProductDetails} options={screenOption} />
      <Stack.Screen name="RelatedServicesDetails" component={RelatedServicesDetails} options={screenOption} />
      <Stack.Screen name="RelatedProductDetails" component={RelatedProductDetails} options={screenOption} />
      <Stack.Screen name="ResourceDetails" component={ResourceDetails} options={screenOption} />


    </Stack.Navigator>
  )
}

const CompanyServices = () => {
  return (
    <Stack.Navigator screenOptions={screenOptionStyle}>
      <Stack.Screen name="ServicesList" component={ServicesList} options={screenOption} />
      <Stack.Screen name="EnquiryForm" component={EnquiryForm} options={screenOption} />
      <Stack.Screen name="MyEnqueries" component={MyEnqueries} options={screenOption} />
      <Stack.Screen name="EnquiryDetails" component={EnquiryDetails} options={screenOption} />
      <Stack.Screen name="UserDetailsPage" component={UserDetailsPage} options={screenOption} />
      <Stack.Screen name="CompanyDetailsPage" component={CompanyDetailsPage} options={screenOption} />
      <Stack.Screen name="ServiceDetails" component={ServiceDetails} options={screenOption} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={screenOption} />
      <Stack.Screen name="ProductDetails" component={ProductDetails} options={screenOption} />
      <Stack.Screen name="RelatedServicesDetails" component={RelatedServicesDetails} options={screenOption} />
      <Stack.Screen name="RelatedProductDetails" component={RelatedProductDetails} options={screenOption} />
      <Stack.Screen name="ResourceDetails" component={ResourceDetails} options={screenOption} />

    </Stack.Navigator>
  )
}
const EventsDrawer = () => (

  <Stack.Navigator screenOptions={screenOptionStyle} initialRouteName='Event'>

    <Stack.Screen name="Event" component={AllEvents} options={screenOption} />

  </Stack.Navigator>

);

export {
  UserForumNav,
  UserJobNav,
  UserProfileNav,
  UserStackNav,
  UserCompanyListNav,
  UserResources,
  UserResourcesDrawer,
  UserProducts,
  EventsDrawer,
  CompanyServices,
};