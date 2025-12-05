

import React, { useRef, useState, useEffect, useCallback, } from 'react';
import { View, FlatList, Image, TouchableOpacity, Text, RefreshControl, Keyboard, BackHandler, } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useIsFocused, useNavigation, useNavigationState } from '@react-navigation/native';
import Video from 'react-native-video';
import Banner01 from './Banners/homeBanner';
import Banner02 from './Banners/homeBanner2';

import { updateCompanyProfile } from './Redux/MyProfile/CompanyProfile_Actions';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from './ApiClient';

import useFetchData from './helperComponents/HomeScreenData';
import { useNetwork } from './AppUtils/IdProvider';
import { useConnection } from './AppUtils/ConnectionProvider';
import { getSignedUrl, getTimeDisplayForum, getTimeDisplayHome } from './helperComponents/signedUrls';
import AppStyles, { styles } from './AppUtils/AppStyles';
import { ForumPostBody } from './Forum/forumBody';
import { Image as FastImage } from 'react-native';
import BottomNavigationBar from './AppUtils/BottomNavigationBar';
import Menu from '../assets/svgIcons/menu.svg';
import Notification from '../assets/svgIcons/notification.svg';
import Job from '../assets/svgIcons/jobs.svg';
import Fire from '../assets/svgIcons/fire.svg';
import Service from '../assets/svgIcons/services.svg';
import Product from '../assets/svgIcons/products.svg';
import Latest from '../assets/svgIcons/latest.svg';
import Description from '../assets/svgIcons/description.svg';
import Company from '../assets/svgIcons/company.svg';
import Money from '../assets/svgIcons/money.svg';
import AnimatedTextSequence from './animations/AnimatedTextSequence';
import Spin from './animations/spin';
import { colors, dimensions } from '../assets/theme';
import LinearGradient from 'react-native-linear-gradient';
const CompanySettingScreen = React.lazy(() => import('./Profile/CompanySettingScreen'));
const ProductsList = React.lazy(() => import('./Products/ProductsList'));
const JobListScreen = React.lazy(() => import('./Job/JobListScreen'));
const AllPosts = React.lazy(() => import('./Forum/Feed'));


const tabNameMap = {
  CompanyJobList: "Jobs",
  Home3: 'Home',
};
const tabConfig = [
  { name: "Home", component: CompanyHomeScreen, focusedIcon: 'home', unfocusedIcon: 'home-outline', iconComponent: Icon },
  { name: "Jobs", component: JobListScreen, focusedIcon: 'briefcase', unfocusedIcon: 'briefcase-outline', iconComponent: Icon },
  { name: "Feed", component: AllPosts, focusedIcon: 'rss', unfocusedIcon: 'rss-box', iconComponent: Icon },
  { name: "Products", component: ProductsList, focusedIcon: 'shopping', unfocusedIcon: 'shopping-outline', iconComponent: Icon },
  { name: "Settings", component: CompanySettingScreen, focusedIcon: 'cog', unfocusedIcon: 'cog-outline', iconComponent: Icon },
];



const CompanyHomeScreen = React.memo(() => {
  const { myId, myData } = useNetwork();
  const { isConnected } = useConnection();
  const currentRouteName = useNavigationState((state) => {
    const route = state.routes[state.index];

    return route.name;
  });
  const profile = useSelector(state => state.CompanyProfile.profile);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const flatListRef = useRef(null);
  const scrollOffsetY = useRef(0);
  const [isProfileFetched, setIsProfileFetched] = useState(false);


  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollOffsetY.current = offsetY;
  };


  useFocusEffect(
    useCallback(() => {

      const fetchUnreadCount = async () => {
        try {
          const response = await apiClient.post('getUnreadNotificationCount', {
            command: 'getUnreadNotificationCount',
            user_id: myId,
          });

          if (response.status === 200) {
            setUnreadCount(response.data.count);
          }
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      };

      fetchUnreadCount();
    }, [myId])
  );



  const handleRefresh = async () => {
    if (isConnected) {
      setIsRefreshing(true);
      await refreshData();
      setIsRefreshing(false);
    }
  };

  const navigateToDetails = (job) => {
    navigation.navigate("JobDetail", { post_id: job.post_id, post: job });
  };

  const {
    jobs,
    latestPosts,
    trendingPosts,
    products,
    services,
    isFetchingProducts,
    isFetchingServices,
    isFetchingJobs,
    isFetchingLatestPosts,
    isFetchingTrendingPosts,
    jobImageUrls,
    latestImageUrls,
    trendingImageUrls,
    productImageUrls,
    servicesImageUrls,
    authorImageUrls,
    refreshData,

  } = useFetchData({ shouldFetch: isProfileFetched });

  const renderJobCard = ({ item }) => {
    if (!item || item.isEmpty) return null;

    const { post_id, job_title, experience_required, Package, job_post_created_on, companyAvatar, working_location } = item;
    const imageUrl = jobImageUrls?.[item.post_id];

    return (
      <TouchableOpacity
        onPress={() => navigateToDetails(item)}
        activeOpacity={0.85}
        style={styles.eduCard}
      >

        <View style={styles.eduCardLeft}>
          {imageUrl ? (
            <FastImage
              source={{ uri: imageUrl, }}

              style={styles.eduImage}
              resizeMode='contain'
              onError={() => { }}
            />
          ) : (
            <View style={[AppStyles.avatarContainer, { backgroundColor: companyAvatar?.backgroundColor }]}>
              <Text style={[AppStyles.avatarText, { color: companyAvatar?.textColor }]}>
                {companyAvatar?.initials}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.eduCardRight}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.eduTitle}>
            {job_title || "Job Title"}
          </Text>

          <Text numberOfLines={1} style={styles.eduSubText}>
            <Text style={styles.label}>Experience: </Text>
            {experience_required?.slice(0, 15) || "N/A"}
          </Text>

          <Text numberOfLines={1} style={styles.eduSubText}>
            <Text style={styles.label}>Package: </Text>
            {Package || 'Not disclosed'}
          </Text>

          <Text numberOfLines={1} style={styles.eduSubText}>
            <Text style={styles.label}>Location: </Text>
            {working_location || 'Not disclosed'}
          </Text>

          <Text numberOfLines={1} style={[styles.eduSubText, { alignSelf: 'flex-end', fontSize: 11, fontWeight: '300', color: colors.text_secondary, }]}>
            {getTimeDisplayHome(job_post_created_on) || 'Not disclosed'}
          </Text>


        </View>
      </TouchableOpacity>
    );
  };

  const renderForumCard = ({ item }) => {
    if (!item || !item.forum_id) return null;

    const isVideo = item.fileKey?.endsWith('.mp4');

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.articleCard}
        onPress={() => navigation.navigate("Comment", { forum_id: item.forum_id })}
      >
        <View style={[styles.articleCardHeader, { backgroundColor: '#fff' }]}>
          {/* Vertical stack for badge, image, name */}
          <View style={{ marginTop: 5 }}>

            <View style={[styles.authorRow]}>
              {item?.authorImage ? (
                <Image
                  source={{ uri: item.authorImage }}
                  style={styles.authorImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.authorImage,
                    {
                      backgroundColor: item.avatar?.backgroundColor || '#ccc',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }
                  ]}
                >
                  <Text style={{ color: item.avatar?.textColor || '#fff', fontWeight: 'bold' }}>
                    {item.avatar?.initials || 'B'}
                  </Text>
                </View>
              )}


              <View style={styles.authorInfo}>
                <Text
                  style={styles.authorName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.author || 'No Name'}
                </Text>
                <Text style={styles.badgeText}>{item.author_category || ''}</Text>

                <Text style={styles.articleTime}>{getTimeDisplayForum(item.posted_on)}</Text>
              </View>
            </View>

          </View>

          {item.mediaUrl && (

            <Image
              source={{ uri: item.mediaUrl }}
              style={styles.articleMedia}
              resizeMode="cover"
            />

          )}

        </View>


        <ForumPostBody
          html={item.forum_body}
          forumId={item?.forum_id}
          numberOfLines={4}
        />
      </TouchableOpacity>

    );
  };

  const renderProductCard = ({ item }) => {
    if (!item || !item.product_id) return null;

    const imageUrl = productImageUrls?.[item.product_id]
    return (
      <TouchableOpacity
        style={styles.card5}
        activeOpacity={1}
        onPress={() => handleAddProduct(item)}
      >

        <View style={styles.companyImageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.companyImage}
            resizeMode='contain'

          />
        </View>

        <View style={styles.cardContent4}>
          <View style={styles.cardTitleRow}>
            <Text numberOfLines={1} style={styles.eduTitle}>{item.title || ' '}
            </Text>
          </View>
          <View style={styles.cardTitleRow}>
            <Description width={dimensions.icon.small} height={dimensions.icon.small} color={colors.gray} />
            <Text style={styles.rowText} numberOfLines={1}>{item.description || 'Not specified'}</Text>
          </View>

          <View style={styles.cardTitleRow}>
            <Company width={dimensions.icon.small} height={dimensions.icon.small} color={colors.gray} />
            <Text style={styles.rowText} numberOfLines={1}>{item.company_name || 'Not specified'}</Text>
          </View>

          <View style={styles.cardTitleRow}>
            <Money width={dimensions.icon.small} height={dimensions.icon.small} color={colors.gray} />
            <Text style={styles.rowText} numberOfLines={1}>
              {(item.price ?? '').toString().trim() !== '' ? item.price : 'Not specified'}
            </Text>
          </View>

        </View>

      </TouchableOpacity>
    );
  };

  const renderServiceCard = ({ item }) => {
    if (!item || !item.service_id) return null;

    const imageUrl = servicesImageUrls?.[item.service_id]

    return (
      <TouchableOpacity
        style={styles.card5}
        activeOpacity={1}
        onPress={() => handleAddservice(item)}
      >

        <View style={styles.companyImageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.companyImage}
            resizeMode='contain'

          />
        </View>

        <View style={styles.cardContent4}>
          <View style={styles.cardTitleRow}>
            <Text numberOfLines={1} style={styles.eduTitle}>{item.title || ' '}
            </Text>
          </View>
          <View style={styles.cardTitleRow}>
            <Description width={dimensions.icon.small} height={dimensions.icon.small} color={colors.gray} />
            <Text style={styles.rowText} numberOfLines={1}>{item.description || 'Not specified'}</Text>
          </View>

          <View style={styles.cardTitleRow}>
            <Company width={dimensions.icon.small} height={dimensions.icon.small} color={colors.gray} />
            <Text style={styles.rowText} numberOfLines={1}>{item.company_name || 'Not specified'}</Text>
          </View>

          <View style={styles.cardTitleRow}>
            <Money width={dimensions.icon.small} height={dimensions.icon.small} color={colors.gray} />
            <Text style={styles.rowText} numberOfLines={1}>
              {(item.price ?? '').toString().trim() !== '' ? item.price : 'Not specified'}
            </Text>
          </View>

        </View>

      </TouchableOpacity>
    );
  };





  useEffect(() => {
    fetchProfile();
  }, [myId]);


  const allJobs = () => {
    navigation.navigate('Jobs');
  };

  const goToTrending = () => {
    navigation.navigate('Trending');
  };

  const goToLatest = () => {
    navigation.navigate('Latest');
  };

  const allProducts = () => {
    navigation.navigate('Products');
  };

  const allServices = () => {
    navigation.navigate('Services');
  };

  const handleAddservice = (service) => {
    navigation.navigate('ServiceDetails', { service_id: service.service_id, company_id: service.company_id });

  };

  const handleAddProduct = (product) => {
    navigation.navigate('ProductDetails', { product_id: product.product_id, company_id: product.company_id });

  };


  const fetchProfile = async () => {
    try {

      const response = await apiClient.post('/getCompanyDetails', {
        command: 'getCompanyDetails',
        company_id: myId,
      });

      if (response.data.status === 'success') {
        const profileData = response.data.status_message;

        if (profileData.fileKey?.trim()) {
          try {
            const res = await getSignedUrl('profileImage', profileData.fileKey);

            const signedUrl = res?.profileImage;
            profileData.imageUrl = signedUrl || null;

          } catch (imageErr) {
            profileData.imageUrl = null;
          }
        } else {
          profileData.imageUrl = null;
        }

        if (profileData.brochureKey?.trim()) {
          try {
            const brochureRes = await getSignedUrl('brochureFile', profileData.brochureKey);
            const signedBrochureUrl = brochureRes?.[profileData.brochureKey];
            profileData.brochureUrl = signedBrochureUrl || null;
          } catch (brochureErr) {
            profileData.brochureUrl = null;
          }
        } else {
          profileData.brochureUrl = null;
        }

        dispatch(updateCompanyProfile(profileData));
      } else {
      }
    } catch (error) {
      dispatch(updateCompanyProfile(null));
    } finally {
      setIsProfileFetched(true);
    }
  };




  const handleProfile = () => {
    if (!isConnected) {

      return;
    }
    navigation.navigate("Settings");
  };



  const handleMenuPress = () => {
    if (!isConnected) {
      return;
    }
    const parentNavigation = navigation.getParent();
    if (parentNavigation?.openDrawer) {
      parentNavigation.openDrawer();
    }
  };


  const [activeBannerId, setActiveBannerId] = useState(null);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    console.log('viewableItems', viewableItems.map(v => v.item.type));

    // Find *any* visible banner in the currently viewable items
    const visibleBanner = viewableItems.find(
      v => v.item?.type?.includes('banner')
    );

    if (visibleBanner) {
      setActiveBannerId(
        visibleBanner.item.type === 'banner1'
          ? 'ban01'
          : visibleBanner.item.type === 'banner2'
            ? 'adban01'
            : visibleBanner.item.type === 'banner3'
              ? 'adban02'
              : null
      );
    } else {
      setActiveBannerId(null);
    }
  }).current;



  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      // ✅ Correct cleanup
      return () => subscription.remove();
    }, [])
  );

  return (
    <View style={{ backgroundColor: '#f0f0f0', flex: 1 }}>

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleMenuPress} style={AppStyles.menuContainer}>
          <Menu width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.text_primary} />

        </TouchableOpacity>
        <View style={styles.rightContainer}>
          <TouchableOpacity
            style={styles.notificationContainer}
            onPress={() => navigation.navigate('AllNotification', { userId: myId })}
          >
            <Notification width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.text_primary} />

            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleProfile} style={styles.profileContainer} activeOpacity={0.8}>

            {profile?.imageUrl ? (
              <FastImage
                source={{ uri: profile?.imageUrl, }}

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

        </View>

      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        ref={flatListRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollBeginDrag={() => Keyboard.dismiss()}
        contentContainerStyle={{ paddingBottom: '20%', }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        data={[
          { type: 'banner1' },
          { type: 'jobs', data: jobs },
          { type: 'banner2' },
          { type: 'trendingPosts', data: trendingPosts },
          { type: 'latestPosts', data: latestPosts },
          { type: 'banner3' },
          { type: 'products', data: products },
          { type: 'services', data: services },
        ]}
        keyExtractor={(item, index) => `${item.type || 'unknown'}-${index}`}

        renderItem={({ item }) => {
          switch (item.type) {
            case 'banner1':
              return <Banner01 bannerId="ban01" activeBannerId={activeBannerId} />;

            case 'jobs':
              //  if (!item.data || item.data.length === 0) return ;
              return (
                <View style={[styles.cards,]}>
                  <View style={styles.headingContainer}>
                    <View style={styles.headingWrapper}>
                      <Text style={styles.headingText}>Jobs</Text>
                      <Job
                        width={dimensions.icon.small}
                        height={dimensions.icon.small}
                        color={colors.primary}
                      />
                    </View>

                    <TouchableOpacity onPress={allJobs}>
                      <Text style={styles.seeAllText}>see more ...</Text>
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={item.data}
                    renderItem={({ item }) => renderJobCard({ item })}
                    keyExtractor={(job) => `job-${job.post_id}`}
                    scrollEnabled={false} // parent handles scrolling
                    nestedScrollEnabled
                    ListFooterComponent={
                      (!item.data || item.data.length === 0) && (
                        <View>
                          {[...Array(4)].map((_, index) => (
                            <View key={index} style={styles.eduCard}>
                              <View style={styles.eduCardLeft} />
                              <View style={styles.eduCardRight}>
                                <Text numberOfLines={1} style={styles.eduTitle}></Text>
                                <Text numberOfLines={1} style={styles.eduSubText}></Text>
                                <Text numberOfLines={1} style={styles.eduSubText}></Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )
                    }

                  />
                </View>
              );

            case 'banner2':
              return <Banner02 bannerId="adban01" activeBannerId={activeBannerId} />


            case 'trendingPosts':
              if (!item.data || item.data.length === 0) return null;
              return (
                <View style={styles.cards}>
                  <View style={styles.headingContainer}>
                    <View style={styles.headingWrapper}>
                      <Text style={styles.headingText}>Trending posts</Text>

                      <Fire
                        width={dimensions.icon.small}
                        height={dimensions.icon.small}
                        color={colors.primary}
                      />

                    </View>
                    <TouchableOpacity onPress={goToTrending}>
                      <Text style={styles.seeAllText}>see more ...</Text>
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={item.data}
                    renderItem={({ item }) => renderForumCard({ item })}
                    keyExtractor={(forum, index) =>
                      forum.forum_id?.toString() || forum.post_id?.toString() || `fallback-${index}`
                    }
                    scrollEnabled={false}
                    nestedScrollEnabled

                  />
                </View>
              );

            case 'latestPosts':
              if (!item.data || item.data.length === 0) return null;

              return (
                <View style={styles.cards}>
                  <View style={styles.headingContainer}>
                    <View style={styles.headingWrapper}>
                      <Text style={styles.headingText}>Latest posts</Text>

                      <Latest
                        width={dimensions.icon.small}
                        height={dimensions.icon.small}
                        color={colors.primary}
                      />

                    </View>
                    <TouchableOpacity onPress={goToLatest}>
                      <Text style={styles.seeAllText}>see more ...</Text>
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={item.data}
                    renderItem={({ item }) => renderForumCard({ item })}
                    keyExtractor={(forum, index) =>
                      forum.forum_id?.toString() || forum.post_id?.toString() || `fallback-${index}`
                    }
                    scrollEnabled={false}
                    nestedScrollEnabled

                  />
                </View>
              );

            case 'banner3':
              return <Banner02 bannerId="adban02" activeBannerId={activeBannerId} />;

            case 'products':
              if (!item.data || item.data.length === 0) return null;

              return (
                <View style={styles.cards}>
                  <View style={styles.headingContainer}>

                    <View style={styles.headingWrapper}>
                      <Text style={styles.headingText}>Products</Text>

                      <Product
                        width={dimensions.icon.small}
                        height={dimensions.icon.small}
                        color={colors.primary}
                      />

                    </View>
                    <TouchableOpacity onPress={allProducts}>
                      <Text style={styles.seeAllText}>see more ...</Text>
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={item.data}
                    renderItem={({ item }) => renderProductCard({ item })}
                    keyExtractor={(d) => `product-${d.product_id}`}
                    numColumns={2}
                    contentContainerStyle={styles.flatListContainer}
                    columnWrapperStyle={styles.columnWrapper}
                    scrollEnabled={false}
                    nestedScrollEnabled

                  />
                </View>
              );

            case 'services':
              if (!item.data || item.data.length === 0) return null;

              return (
                <View style={styles.cards}>
                  <View style={styles.headingContainer}>

                    <View style={styles.headingWrapper}>
                      <Text style={styles.headingText}>Services</Text>
                      <Service
                        width={dimensions.icon.small}
                        height={dimensions.icon.small}
                        color={colors.primary}
                      />

                    </View>
                    <TouchableOpacity onPress={allServices}>
                      <Text style={styles.seeAllText}>see more ...</Text>
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={item.data}
                    renderItem={({ item }) => renderServiceCard({ item })}
                    keyExtractor={(d) => (`service-${d.service_id}`)}
                    numColumns={2}
                    contentContainerStyle={styles.flatListContainer}
                    columnWrapperStyle={styles.columnWrapper}
                    scrollEnabled={false}
                    nestedScrollEnabled

                  />
                </View>
              );

            default:
              return null;
          }
        }}
      />

      <BottomNavigationBar
        tabs={tabConfig}
        currentRouteName={currentRouteName}
        navigation={navigation}
        flatListRef={flatListRef}
        scrollOffsetY={scrollOffsetY}
        handleRefresh={handleRefresh}
        tabNameMap={tabNameMap}

      />

    </View>
  );

});


export default CompanyHomeScreen;