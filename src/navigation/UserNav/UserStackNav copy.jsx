import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Job related screens
import UserJobProfileScreen from '../../screens/Job/UserJobProfileScreen';
import JobDetailScreen from '../../screens/Job/JobDetailScreen';
import UserJobAppliedScreen from '../../screens/Job/UserJobAppliedScreen';
import UserAppliedJobDetailsScreen from '../../screens/Job/UserAppliedJobDetailsScreen';
import UserJobProfileUpdateScreen from '../../screens/Job/UserJobProfileUpdateScreen';
import UserJobProfileCreateScreen from '../../screens/Job/UserJobProfileCreateScreen';

// Company related screens
import CompanyListScreen from '../../screens/CompanyList/CompanyList';
import CompanyDetailsScreen from '../../screens/CompanyList/CompanyDetialsScreen';

// Forum related screens
import ForumEditScreen from '../../screens/Forum/ForumEditScreen';
import YourForumListScreen from '../../screens/Forum/myForums';
import CommentScreen from '../../screens/Forum/forumPostDetails';
import ForumPostScreen from '../../screens/Forum/ForumPost';

// Profile related screens
import UserProfilescreen from '../../screens/Profile/UserProfilescreen';
import UserProfileUpdateScreen from '../../screens/Profile/UserProfileUpdateScreen';
import BlockedUsers from '../../screens/Profile/BlockedUsers';
import CompanyDetailsPage from '../../screens/Profile/CompanyDetailsPage';
import UserDetailsPage from '../../screens/Profile/UserDetailPage';

// Subscription
import UserSubscriptionScreen from '../../screens/subscription/UserSubscriptionScreen';
import YourSubscriptionListScreen from '../../screens/subscription/YourSubscriptionListScreen';

// Content
import AboutUs from '../../screens/Bme_content/AboutUs';
import PrivacyPolicy from '../../screens/Bme_content/PrivacyPolicy';
import CancellationPolicy from '../../screens/Bme_content/CancellationPolicy';
import LegalPolicy from '../../screens/Bme_content/LegalPolicy';
import TermsAndConditionsScreen from '../../screens/Bme_content/TermsAndConditions';
import InPrivacyPolicy from '../../screens/Bme_content/InPrivacyPolicy';

// Resources
import ResourcesPost from '../../screens/Resources/ResourcesPost';
import ResourcesList from '../../screens/Resources/ResourcesList';
import AllEvents from '../../screens/Resources/Events';
import ResourcesEdit from '../../screens/Resources/ResourcesEdit';
import YourResourcesList from '../../screens/Resources/MyResources';
import ResourceDetails from '../../screens/Resources/ResourceDetails';

// Products
import ProductDetails from '../../screens/Products/ProductDetails';
import CreateProduct from '../../screens/Products/ProductUploads';
import RelatedProductDetails from '../../screens/Products/RelatedProductsDetails';
import MyProducts from '../../screens/Products/MyProducts';
import EditProduct from '../../screens/Products/ProductEdit';

// Services
import ServicesList from '../../screens/Services/ServicesList';
import ServiceDetails from '../../screens/Services/ServiceDetails';
import EnquiryForm from '../../screens/Services/Enquiry';
import MyEnqueries from '../../screens/Services/MyEnqueries';
import RelatedServicesDetails from '../../screens/Services/RelatedServicesDetails';
import EnquiryDetails from '../../screens/Services/EnquiryDetails';

// Others
import AllNotification from '../../screens/AllNotification';
import TrendingNav from '../../screens/Forum/TrendingNav';
import UserBottomTabNav from './UserBottomTabNav';
import { createStackNavigator } from '@react-navigation/stack';

// Create navigators
const Tab = createBottomTabNavigator();
const MainStack = createStackNavigator();



// Main App Navigator
function UserStackNav() {
  return (
    <MainStack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{ headerShown: false }}>
      {/* Main tabs screen - only these 5 will show bottom tabs */}
      <MainStack.Screen name="MainTabs" component={UserBottomTabNav} options={{ animation: 'none' }}/>

      {/* All other screens - these will NOT show bottom tabs at all */}
      <MainStack.Screen name="UserJobProfile" component={UserJobProfileScreen} />
      <MainStack.Screen name="JobDetail" component={JobDetailScreen} />
      <MainStack.Screen name="UserJobApplied" component={UserJobAppliedScreen} />
      <MainStack.Screen name="UserAppliedJobDetails" component={UserAppliedJobDetailsScreen} />
      <MainStack.Screen name="UserJobProfileUpdate" component={UserJobProfileUpdateScreen} />
      <MainStack.Screen name="UserJobProfileCreate" component={UserJobProfileCreateScreen} />
      <MainStack.Screen name="CompanyList" component={CompanyListScreen} />
      <MainStack.Screen name="CompanyDetails" component={CompanyDetailsScreen} />
      <MainStack.Screen name="ForumEdit" component={ForumEditScreen} />
      <MainStack.Screen name="YourForumList" component={YourForumListScreen} />
      <MainStack.Screen name="Comment" component={CommentScreen} />
      <MainStack.Screen name="ForumPost" component={ForumPostScreen} />
      <MainStack.Screen name="UserProfile" component={UserProfilescreen} />
      <MainStack.Screen name="UserProfileUpdate" component={UserProfileUpdateScreen} />
      <MainStack.Screen name="BlockedUsers" component={BlockedUsers} />
      <MainStack.Screen name="CompanyDetailsPage" component={CompanyDetailsPage} />
      <MainStack.Screen name="UserDetailsPage" component={UserDetailsPage} />
      <MainStack.Screen name="UserSubscription" component={UserSubscriptionScreen} />
      <MainStack.Screen name="YourSubscriptionList" component={YourSubscriptionListScreen} />
      <MainStack.Screen name="AboutUs" component={AboutUs} />
      <MainStack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
      <MainStack.Screen name="CancellationPolicy" component={CancellationPolicy} />
      <MainStack.Screen name="LegalPolicy" component={LegalPolicy} />
      <MainStack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
      <MainStack.Screen name="InPrivacyPolicy" component={InPrivacyPolicy} />
      <MainStack.Screen name="ResourcesPost" component={ResourcesPost} />
      <MainStack.Screen name="ResourcesList" component={ResourcesList} />
      <MainStack.Screen name="Event" component={AllEvents} />
      <MainStack.Screen name="ResourcesEdit" component={ResourcesEdit} />
      <MainStack.Screen name="Resourcesposted" component={YourResourcesList} />
      <MainStack.Screen name="ResourceDetails" component={ResourceDetails} />
      <MainStack.Screen name="ProductDetails" component={ProductDetails} />
      <MainStack.Screen name="CreateProduct" component={CreateProduct} />
      <MainStack.Screen name="RelatedProductDetails" component={RelatedProductDetails} />
      <MainStack.Screen name="MyProducts" component={MyProducts} />
      <MainStack.Screen name="EditProduct" component={EditProduct} />
      <MainStack.Screen name="ServicesList" component={ServicesList} />
      <MainStack.Screen name="ServiceDetails" component={ServiceDetails} />
      <MainStack.Screen name="EnquiryForm" component={EnquiryForm} />
      <MainStack.Screen name="MyEnqueries" component={MyEnqueries} />
      <MainStack.Screen name="RelatedServicesDetails" component={RelatedServicesDetails} />
      <MainStack.Screen name="EnquiryDetails" component={EnquiryDetails} />
      <MainStack.Screen name="AllNotification" component={AllNotification} />
      <MainStack.Screen name="TrendingNav" component={TrendingNav} />
    </MainStack.Navigator>
  );
}

export default React.memo(UserStackNav);;