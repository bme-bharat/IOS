
import CompanyJobPostScreen from '../../screens/Job/CompanyJobPostScreen';
import CompanyJobEditScreen from '../../screens/Job/CompanyJobEditScreen';
import CompanyListJobCandiates from '../../screens/Job/JobSeekers';
import YourForumListScreen from '../../screens/Forum/myForums';
import ForumEditScreen from '../../screens/Forum/ForumEditScreen';
import CommentScreen from '../../screens/Forum/forumPostDetails';
import CompanySubscriptionScreen from '../../screens/subscription/CompanySubscriptionScreen';
import YourSubscriptionListScreen from '../../screens/subscription/YourSubscriptionListScreen'

//company List

import CompanyListScreen from '../../screens/CompanyList/CompanyList';
import CompanyDetailsScreen from '../../screens/CompanyList/CompanyDetialsScreen';

//content
import AboutUs from '../../screens/Bme_content/AboutUs';
import PrivacyPolicy from '../../screens/Bme_content/PrivacyPolicy';
import ComapanyPostedJob from '../../screens/Job/myJobs';

import CompanySettingScreen from '../../screens/Profile/CompanySettingScreen';
import CompanyProfileUpdateScreen from '../../screens/Profile/CompanyProfileUpdateScreen';
import CompanyProfileScreen from '../../screens/Profile/CompanyProfileScreen';

import CompanyAppliedJobScreen from '../../screens/Job/CompanyAppliedJobList';
import CompanyGetAppliedJobsScreen from '../../screens/Job/CompanyAppliedJobDetail';
import CompanyGetJobCandidatesScreen from '../../screens/Job/JobSeekerDetails';

import CancellationPolicy from '../../screens/Bme_content/CancellationPolicy';
import LegalPolicy from '../../screens/Bme_content/LegalPolicy';
import TermsAndConditionsScreen from '../../screens/Bme_content/TermsAndConditions';

import CompanyHomeScreen from '../../screens/CompanyHomeScreen';

import UserDetailsPage from '../../screens/Profile/UserDetailPage';
import CompanyDetailsPage from '../../screens/Profile/CompanyDetailsPage';

import AllNotification from '../../screens/AllNotification';
import { useCallback, useState } from 'react';
import ResourcesPost from '../../screens/Resources/ResourcesPost';
import AllEvents from '../../screens/Resources/Events';
import ResourcesEdit from '../../screens/Resources/ResourcesEdit';
import YourResourcesList from '../../screens/Resources/MyResources';
import ResourcesList from '../../screens/Resources/ResourcesList';
import ProductDetails from '../../screens/Products/ProductDetails';
import CreateProduct from '../../screens/Products/ProductUploads';
import MyProducts from '../../screens/Products/MyProducts';
import EditProduct from '../../screens/Products/ProductEdit';
import ProductsList from '../../screens/Products/ProductsList';
import RelatedProductDetails from '../../screens/Products/RelatedProductsDetails';
import ResourceDetails from '../../screens/Resources/ResourceDetails';
import JobDetailScreen from '../../screens/Job/JobDetailScreen';
import ForumPostScreen from '../../screens/Forum/ForumPost';
import JobListScreen from '../../screens/Job/JobListScreen';
import BlockedUsers from '../../screens/Profile/BlockedUsers';

import ServiceDetails from '../../screens/Services/ServiceDetails';
import ServicesList from '../../screens/Services/ServicesList';
import EditService from '../../screens/Services/ServiceEdit';
import CreateService from '../../screens/Services/ServiceUploads';
import MyServices from '../../screens/Services/MyServices';
import CompanyGetallEnquiries from '../../screens/Services/EnqueriesReceived';
import RelatedServicesDetails from '../../screens/Services/RelatedServicesDetails';
import EnquiryForm from '../../screens/Services/Enquiry';
import MyEnqueries from '../../screens/Services/MyEnqueries';
import EnquiryDetails from '../../screens/Services/EnquiryDetails';
import InPrivacyPolicy from '../../screens/Bme_content/InPrivacyPolicy';


import { createStackNavigator } from '@react-navigation/stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

const CompanyStackNav = () => {
  return (
    <Stack.Navigator screenOptions={screenOptionStyle}>
      <Stack.Screen name="Home3" component={CompanyHomeScreen} options={screenOption} />
      <Stack.Screen name="AboutUs" component={AboutUs} options={screenOption} />
      <Stack.Screen name="CompanyProfile" component={CompanyProfileScreen} options={screenOption} />
      <Stack.Screen name="AllNotification" component={AllNotification} options={screenOption} />
      <Stack.Screen name="CompanyProfileUpdate" component={CompanyProfileUpdateScreen} options={screenOption} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} options={screenOption} />
      <Stack.Screen name="AllPosts" component={AllPosts} options={screenOption} />
      <Stack.Screen name="Latest" component={LatestPosts} options={screenOption} />
      <Stack.Screen name="Trending" component={TrendingPosts} options={screenOption} />

      <Stack.Screen name="ResourcesPost" component={ResourcesPost} options={screenOption} />
      <Stack.Screen name="Comment" component={CommentScreen} options={screenOption} />
      <Stack.Screen name="CompanyGetAppliedJobs" component={CompanyGetAppliedJobsScreen} options={screenOption} />
      <Stack.Screen name="CompanySubscription" component={CompanySubscriptionScreen} options={screenOption} />
      <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} options={screenOption} />
      <Stack.Screen name="CompanyJobEdit" component={CompanyJobEditScreen} options={screenOption} />
      <Stack.Screen name="ProductsList" component={ProductsList} options={screenOption} />
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

const CompanyListNav = () => {
  return (
    <Stack.Navigator screenOptions={screenOptionStyle}>
      <Stack.Screen name="CompanyList" component={CompanyListScreen} options={screenOption} />
      <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} options={screenOption} />
      <Stack.Screen name="CompanyProfile" component={CompanyProfileScreen} options={screenOption} />
      <Stack.Screen name="CompanyProfileUpdate" component={CompanyProfileUpdateScreen} options={screenOption} />

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


const CompanyJobNav = () => {

  return (
    <Stack.Navigator screenOptions={screenOptionStyle} initialRouteName='CompanyJobList'>
      <Stack.Screen name="CompanyJobPost" component={CompanyJobPostScreen} options={screenOption} />
      <Stack.Screen name="CompanyJobList" component={JobListScreen} options={screenOption} />
      <Stack.Screen name="CompanyJobEdit" component={CompanyJobEditScreen} options={screenOption} />
      <Stack.Screen name="PostedJob" component={ComapanyPostedJob} options={screenOption} />

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




const CompanyForumNav = () => (

  <Stack.Navigator screenOptions={screenOptionStyle} initialRouteName="AllPosts">
    <Stack.Screen name="AllPosts" component={AllPosts} options={screenOption} />

    <Stack.Screen name="Latest" component={LatestPosts} options={screenOption} />
    <Stack.Screen name="Trending" component={TrendingPosts} options={screenOption} />

    <Stack.Screen name="ForumPost" component={ForumPostScreen} options={screenOption} />
    <Stack.Screen name="Home3" component={CompanyHomeScreen} options={screenOption} />
    <Stack.Screen name="AllNotification" component={AllNotification} options={screenOption} />
    <Stack.Screen name="ForumEdit" component={ForumEditScreen} options={screenOption} />
    <Stack.Screen name="Comment" component={CommentScreen} options={screenOption} />

    <Stack.Screen name="YourForumList" component={YourForumListScreen} options={screenOption} />

    <Stack.Screen name="CompanyList" component={CompanyListScreen} options={screenOption} />

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



const CompanyProfileNav = () => (

  <Stack.Navigator screenOptions={screenOptionStyle}>
    <Stack.Screen name="CompanySetting" component={CompanySettingScreen} options={screenOption} />
    <Stack.Screen name="CompanyProfile" component={CompanyProfileScreen} options={screenOption} />
    <Stack.Screen name="CompanyProfileUpdate" component={CompanyProfileUpdateScreen} options={screenOption} />
    <Stack.Screen name="Home3" component={CompanyHomeScreen} options={screenOption} />

    <Stack.Screen name="CompanyJobPost" component={CompanyJobPostScreen} options={screenOption} />
    <Stack.Screen name="CompanyJobList" component={JobListScreen} options={screenOption} />
    <Stack.Screen name="PostedJob" component={ComapanyPostedJob} options={screenOption} />

    <Stack.Screen name="CompanyGetAppliedJobs" component={CompanyGetAppliedJobsScreen} options={screenOption} />
    <Stack.Screen name="CompanyGetJobCandidates" component={CompanyGetJobCandidatesScreen} options={screenOption} />

    <Stack.Screen name="CompanyAppliedJob" component={CompanyAppliedJobScreen} options={screenOption} />

    <Stack.Screen name="CompanyJobEdit" component={CompanyJobEditScreen} options={screenOption} />
    <Stack.Screen name="CompanyListJobCandiates" component={CompanyListJobCandiates} options={screenOption} />

    <Stack.Screen name="ForumPost" component={ForumPostScreen} options={screenOption} />
    <Stack.Screen name="YourForumList" component={YourForumListScreen} options={screenOption} />
    <Stack.Screen name="ForumEdit" component={ForumEditScreen} options={screenOption} />
    <Stack.Screen name="EditProduct" component={EditProduct} options={screenOption} />
    <Stack.Screen name="CreateProduct" component={CreateProduct} options={screenOption} />
    <Stack.Screen name="Comment" component={CommentScreen} options={screenOption} />
    <Stack.Screen name="CompanySubscription" component={CompanySubscriptionScreen} options={screenOption} />
    <Stack.Screen name='YourSubscriptionList' component={YourSubscriptionListScreen} options={screenOption} />
    <Stack.Screen name="MyProducts" component={MyProducts} options={screenOption} />

    <Stack.Screen name="AboutUs" component={AboutUs} options={screenOption} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} options={screenOption} />
    <Stack.Screen name="BlockedUsers" component={BlockedUsers} options={screenOption} />
    <Stack.Screen name="CancellationPolicy" component={CancellationPolicy} options={screenOption} />
    <Stack.Screen name="LegalPolicy" component={LegalPolicy} options={screenOption} />
    <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} options={screenOption} />
    <Stack.Screen name="Resourcesposted" component={YourResourcesList} options={screenOption} />
    <Stack.Screen name="ResourcesList" component={ResourcesList} options={screenOption} />
    <Stack.Screen name="ResourcesEdit" component={ResourcesEdit} options={screenOption} />
    <Stack.Screen name="ResourcesPost" component={ResourcesPost} options={screenOption} />

    <Stack.Screen name="ServicesList" component={ServicesList} options={screenOption} />
    <Stack.Screen name="MyServices" component={MyServices} options={screenOption} />

    <Stack.Screen name="ServiceEdit" component={EditService} options={screenOption} />
    <Stack.Screen name="CreateService" component={CreateService} options={screenOption} />
    <Stack.Screen name="CompanyGetallEnquiries" component={CompanyGetallEnquiries} options={screenOption} />

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



const CompanyResources = () => (

  <Stack.Navigator screenOptions={screenOptionStyle} initialRouteName='ResourcesList'>
    <Stack.Screen name="ResourcesList" component={ResourcesList} options={screenOption} />
    <Stack.Screen name="Resources posted" component={YourResourcesList} options={screenOption} />
    <Stack.Screen name="ResourcesPost" component={ResourcesPost} options={screenOption} />
    <Stack.Screen name="ResourcesEdit" component={ResourcesEdit} options={screenOption} />
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


const CompanyResourcesDrawer = () => (

  <Stack.Navigator screenOptions={screenOptionStyle} initialRouteName='Resources'>
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

const CompanyProducts = () => {
  return (
    <Stack.Navigator screenOptions={screenOptionStyle}>
      <Stack.Screen name="ProductsList" component={ProductsList} options={screenOption} />
      <Stack.Screen name="EditProduct" component={EditProduct} options={screenOption} />
      <Stack.Screen name="CreateProduct" component={CreateProduct} options={screenOption} />
      <Stack.Screen name="MyProducts" component={MyProducts} options={screenOption} />

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
      <Stack.Screen name="MyServices" component={MyServices} options={screenOption} />

      <Stack.Screen name="ServiceEdit" component={EditService} options={screenOption} />
      <Stack.Screen name="CreateService" component={CreateService} options={screenOption} />
      <Stack.Screen name="CompanyGetallEnquiries" component={CompanyGetallEnquiries} options={screenOption} />

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
  CompanyStackNav,
  CompanyJobNav,
  CompanyForumNav,
  CompanyProfileNav,
  CompanyListNav,
  CompanyResources,
  CompanyResourcesDrawer,
  CompanyProducts,
  EventsDrawer,
  CompanyServices,

}