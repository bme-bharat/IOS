

import React, { useCallback, useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator, FlatList, Dimensions, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import default_image1 from '../../images/homepage/image.jpg'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import defaultImage from '../../images/homepage/buliding.jpg';
import { Image as FastImage } from 'react-native';
import apiClient from '../ApiClient';
import { useFileOpener } from '../helperComponents/fileViewer';
import { openMediaViewer } from '../helperComponents/mediaViewer';
import { MyPostBody } from '../Forum/forumBody';
import { generateAvatarFromName } from '../helperComponents/useInitialsAvatar';
import { openLink } from '../AppUtils/openLinks';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';

import { colors, dimensions } from '../../assets/theme.jsx';
import { commonStyles } from '../AppUtils/AppStyles.js';

const defaultImageCompany = Image.resolveAssetSource(defaultImage).uri;
const defautImage = Image.resolveAssetSource(default_image1).uri;
const defautImagecompany = Image.resolveAssetSource(defaultImage).uri;

const CompanyDetailsPage = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const route = useRoute()
  const [isModalVisibleImage, setModalVisibleImage] = useState(false);
  const { userId } = route.params;
  console.log('userId', userId)
  const [loading, setLoading] = useState(false)
  const [forums, setProducts] = useState([]);
  const [products, setProducts1] = useState([]);

  const [services, setServices] = useState([]);
  const [resources, setResorces] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
  const [lastEvaluatedKeyjobs, setLastEvaluatedKeyjobs] = useState(null);
  const [lastEvaluatedKeyResources, setLastEvaluatedKeyResources] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [imageUrlsresources, setImageUrlsResources] = useState({});
  const [imageUrlsjobs, setImageUrlsJobs] = useState({});
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

  const fetchForums = async (refresh = false, lastKey = null) => {
    if (loading || loadingMore) return;

    lastKey ? setLoadingMore(true) : setLoading(true);

    try {
      const requestData = {
        command: "getUsersAllForumPosts",
        user_id: userId,
        limit: 3,
      };

      if (lastKey) {
        requestData.lastEvaluatedKey = lastKey;
      }

      const res = await apiClient.post('/getUsersAllForumPosts', requestData, {

      });

      let newProducts = res.data.response || [];
      newProducts.sort((a, b) => b.posted_on - a.posted_on);

      const urlsObject = {};
      await Promise.all(
        newProducts.map(async (post) => {
          if (post.fileKey && post.fileKey.trim() !== "") {
            try {
              const res = await apiClient.post(
                "/getObjectSignedUrl",
                {

                  command: "getObjectSignedUrl",
                  key: post.thumbnail_fileKey || post.fileKey,

                }
              );
              const img_url = res.data
              if (img_url) {
                urlsObject[post.forum_id] = img_url;
              }
            } catch (error) {

            }
          }
        })
      );

      setProducts((prev) => (refresh ? newProducts : [...prev, ...newProducts]));
      setImageUrls((prev) => {
        const updatedUrls = { ...prev, ...urlsObject };
        newProducts.forEach((post) => {
          if (!post.fileKey || post.fileKey.trim() === "") {
            delete updatedUrls[post.forum_id];
          }
        });
        return updatedUrls;
      });

      if (res.data.lastEvaluatedKey) {
        setLastEvaluatedKey(res.data.lastEvaluatedKey);

      } else {
        setLastEvaluatedKey(null);

      }
    } catch (error) {

    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };




  const fetchResources = async (refresh = false, lastKey = null) => {
    if (loading || loadingMore) return;

    lastKey ? setLoadingMore(true) : setLoading(true);

    try {
      const requestData = {
        command: "getUsersAllResourcePosts",
        user_id: userId,
        limit: 10,
      };

      if (lastKey) {
        requestData.lastEvaluatedKey = lastKey;
      }


      const res = await apiClient.post(`/getUsersAllResourcePosts`, requestData);



      let newProducts = res.data.response || [];

      newProducts.sort((a, b) => b.posted_on - a.posted_on);

      // Fetch signed image URLs
      const urlsObject = {};
      await Promise.all(
        newProducts.map(async (post) => {
          if (post.fileKey) {
            try {
              const res = await apiClient.post(
                "/getObjectSignedUrl",
                {


                  command: "getObjectSignedUrl",
                  key: post.thumbnail_fileKey || post.fileKey,

                }
              );
              const img_url = res.data;
              if (img_url) {
                urlsObject[post.resource_id] = img_url;
              }
            } catch (error) {

            }
          }
        })
      );

      setResorces((prev) => (refresh ? newProducts : [...prev, ...newProducts]));

      setImageUrlsResources((prev) => ({ ...prev, ...urlsObject }));


      if (res.data.lastEvaluatedKey) {
        setLastEvaluatedKeyResources(res.data.lastEvaluatedKey);

      } else {
        setLastEvaluatedKeyResources(null);

      }
    } catch (error) {

    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };




  useEffect(() => {
    fetchForums(true);
  }, [userId])

  useEffect(() => {
    fetchResources(true);
  }, [userId])


  useEffect(() => {
    fetchCompanyJobPosts(true);
  }, [userId])
  const [jobs, setjobs] = useState([]);
  const fetchCompanyJobPosts = async (lastEvaluatedKeyjobs = null) => {
    if (!userId || loading || loadingMore) return;

    lastEvaluatedKeyjobs ? setLoadingMore(true) : setLoading(true);

    try {
      const requestData = {
        command: "getCompanyAllJobPosts",
        company_id: userId,
        limit: 10,
      };

      if (lastEvaluatedKey) {
        requestData.lastEvaluatedKeyjobs = lastEvaluatedKeyjobs;
      }

      const response = await apiClient.post('/getCompanyAllJobPosts', requestData);
      const jobs = response.data.response || [];

      const sortedJobs = jobs.sort(
        (a, b) => b.job_post_created_on - a.job_post_created_on
      );

      setjobs((prevPosts) => [...prevPosts, ...sortedJobs]);

      // Fetch signed image URLs
      sortedJobs.forEach(async (job) => {
        if (job.fileKey) {
          try {
            const res = await apiClient.post('/getObjectSignedUrl', {
              command: 'getObjectSignedUrl',
              key: job.fileKey
            });

            const img_url = res.data;

            if (img_url) {
              setImageUrlsJobs(prev => ({
                ...prev,
                [job.post_id]: img_url
              }));
            }
          } catch (err) {
            console.warn('Error fetching image URL for job:', job.post_id, err);
          }
        }
      });

      if (response.data.lastEvaluatedKey) {
        setLastEvaluatedKeyjobs(response.data.lastEvaluatedKey);
        setHasMoreJobs(true);
      } else {
        setHasMoreJobs(false);
      }

    } catch (error) {
      console.error('Failed to fetch job posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);

    }
  };


  const [hasMoreJobs, setHasMoreJobs] = useState(true);



  const forumDetails = (forum_id) => {
    navigation.navigate("Comment", { forum_id });
  };




  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size="small" color="#075cab" style={{ marginVertical: 10 }} />;
  };



  const ProductDropdown = () => {
    const [showProductModal, setShowProductModal] = useState(false);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleProductSelect = (item) => {

      setShowProductModal(false);
      navigation.push('ProductDetails', {
        product_id: item.product_id,
        company_id: userId,
      });
    };


    const handleServiceSelect = (item) => {
      setShowServiceModal(false);
      navigation.push('ServiceDetails', {
        service_id: item.service_id,
        company_id: userId,
      });
    };

    const Allproduct = async () => {
      try {
        setLoading(true);
        const response = await apiClient.post('/getProductsByCompanyId', {
          command: 'getProductsByCompanyId',
          company_id: userId,
        });
        if (response.data.status === 'success') {
          const productList = response.data.response.map(item => ({
            title: item.title,
            product_id: item.product_id,
          }));
          setProducts(productList);
        }
      } catch (err) {
        ToastAndroid.show("Network error while fetching products.", ToastAndroid.SHORT);
      } finally {
        setLoading(false);
      }
    };

    const allServices = async () => {
      try {
        setLoading(true);
        const response = await apiClient.post('/getServicesByCompanyId', {
          command: 'getServicesByCompanyId',
          company_id: userId,
        });
        if (response.data.status === 'success') {
          const servicesList = response.data.response.map(item => ({
            title: item.title,
            service_id: item.service_id,
          }));
          setServices(servicesList);
        }
      } catch (err) {
        ToastAndroid.show("Network error while fetching services.", ToastAndroid.SHORT);
      } finally {
        setLoading(false);
      }
    };

    const handleOpenProducts = async () => {
      await Allproduct();
      setShowProductModal(true);
    };

    const handleOpenServices = async () => {
      await allServices();
      setShowServiceModal(true);
    };

    const renderProductItem = ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.dropdownItem}
        onPress={() => handleProductSelect(item)}
      >
        <Text style={styles.productText}>🛒 {item.title}</Text>
      </TouchableOpacity>
    );

    const renderServiceItem = ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.dropdownItem}
        onPress={() => handleServiceSelect(item)}
      >
        <Text style={styles.productText}>🛠️ {item.title}</Text>
      </TouchableOpacity>
    );

    return (
      <View style={styles.containerProduct}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={handleOpenProducts}>
            <Text style={styles.buttonText}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleOpenServices}>
            <Text style={styles.buttonText}>Services</Text>
          </TouchableOpacity>
        </View>

        <Modal
          transparent
          visible={showProductModal}
          onRequestClose={() => setShowProductModal(false)}
        >
          <Pressable style={styles.modalContainer} onPress={() => setShowProductModal(false)}>
            <View style={styles.modalContent}>
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : products.length === 0 ? (
                <Text style={styles.noServicesText}>No products available</Text>
              ) : (
                <FlatList
                  data={products}
                  renderItem={renderProductItem}
                  keyExtractor={(item, index) => index.toString()}
                />
              )}
            </View>
          </Pressable>
        </Modal>

        {/* Services Modal */}
        <Modal
          transparent
          visible={showServiceModal}
          onRequestClose={() => setShowServiceModal(false)}
        >
          <Pressable style={styles.modalContainer} onPress={() => setShowServiceModal(false)}>
            <View style={styles.modalContent}>
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : services.length === 0 ? (
                <Text style={styles.noServicesText}>No services available</Text>
              ) : (
                <FlatList
                  data={services}
                  renderItem={renderServiceItem}
                  keyExtractor={(item, index) => index.toString()}
                />
              )}
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  };



  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/getCompanyDetails', {
        command: 'getCompanyDetails',
        company_id: userId,
      });

      if (response.data.status === 'success') {
        const profileData = response.data.status_message;
        setProfile(profileData);

        const displayName = profileData.company_name?.trim() || 'Bme';

        if (profileData.user_type === 'company') {
          if (profileData.fileKey && profileData.fileKey !== 'null') {
            try {
              const res = await apiClient.post('/getObjectSignedUrl', {
                command: 'getObjectSignedUrl',
                key: profileData.fileKey,
              });

              const imgUrlData = res.data;
              if (imgUrlData && typeof imgUrlData === 'string') {
                setImageUrl(imgUrlData);
              } else {
                // fallback to generated avatar
                setImageUrl(generateAvatarFromName(displayName));
              }
            } catch (err) {
              // fallback to generated avatar
              setImageUrl(generateAvatarFromName(displayName));
            }
          } else {
            // fallback to generated avatar
            setImageUrl(generateAvatarFromName(displayName));
          }
        } else {
          // not a company, fallback to user avatar
          setImageUrl(generateAvatarFromName(displayName));
        }
      }
    } catch (error) {
      const fallbackName = profile?.company_name?.trim() || 'Unknown';
      setImageUrl(generateAvatarFromName(fallbackName));
    } finally {
      setLoading(false);
    }
  };





  useEffect(() => {
    if (userId) fetchProfile();

  }, [userId])


  const ProfileHeader = ({ profile, imageUrl, isModalVisibleImage }) => (
    <View style={styles.profileBox}>
      <View style={styles.imageContainerprofile}>
        {typeof imageUrl === 'string' ? (
          <TouchableOpacity onPress={() => openMediaViewer([{ type: 'image', url: imageUrl }])}>
            <FastImage
              source={{ uri: imageUrl }}
              style={styles.imagerprofile}
              resizeMode="contain"
              onError={() => setImageUrl(null)}
            />
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.imagerprofile,
              { backgroundColor: imageUrl?.backgroundColor },
            ]}
          >
            <Text style={{ color: imageUrl?.textColor || '#000', fontSize: 50, fontWeight: 'bold' }}>
              {imageUrl?.initials}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.textContainer}>

        <View style={commonStyles.labValContainer}>

          <Text style={commonStyles.label}>Company </Text>
          <Text style={commonStyles.colon}>:</Text>
          <Text style={commonStyles.value}>{profile?.company_name || ""}</Text>
        </View>


        {/* <View style={commonStyles.labValContainer}>
          <View style={styles.lableIconContainer}>
            <Text style={commonStyles.label}>Registration </Text>
          </View>

          <Text style={commonStyles.colon}>:</Text>
          <Text style={commonStyles.value}>{profile?.business_registration_number || ""}</Text>
        </View> */}


        <View style={commonStyles.labValContainer}>

          <Text style={commonStyles.label}>Category </Text>
          <Text style={commonStyles.colon}>:</Text>
          <Text style={commonStyles.value}>{profile?.category || ""}</Text>
        </View>

        <View style={commonStyles.labValContainer}>

          <Text style={commonStyles.label}>State </Text>
          <Text style={commonStyles.colon}>:</Text>
          <Text style={commonStyles.value}>{profile?.company_located_state || ""}</Text>
        </View>

        <View style={commonStyles.labValContainer}>

          <Text style={commonStyles.label}>City </Text>
          <Text style={commonStyles.colon}>:</Text>
          <Text style={commonStyles.value}>{profile?.company_located_city || ""}</Text>
        </View>

        {!!profile?.Website?.trim() && (
          <View style={commonStyles.labValContainer}>

            <Text style={commonStyles.label}>Website </Text>
            <Text style={commonStyles.colon}>:</Text>
            <Text style={commonStyles.value}>
              <TouchableOpacity activeOpacity={1} onPress={() => openLink(profile.Website)}>
                <Text style={[commonStyles.value, { color: "#075cab", textDecorationLine: "underline" }]}>
                  {profile.Website.trim()}
                </Text>
              </TouchableOpacity>
            </Text>
          </View>
        )}

        {!!profile?.company_description?.trim() && (
          <View style={[commonStyles.labValContainer]}>

            <Text style={commonStyles.label}>Description</Text>
            <Text style={commonStyles.colon}>:</Text>
            <Text style={[commonStyles.value]}>{profile.company_description.trim()}</Text>
          </View>
        )}

        {profile?.company_address ? (
          <View style={commonStyles.labValContainer}>

            <Text style={commonStyles.label}>Address </Text>
            <Text style={commonStyles.colon}>:</Text>
            <Text style={commonStyles.value}>{profile?.company_address || ""}</Text>
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
      </View>

    </View>
  );

  const [activeTab, setActiveTab] = useState('jobs');

  const handleTabPress = (tab) => {
    setActiveTab(tab);
  };



  const renderJob = ({ item }) => {
    const imageUrl = imageUrlsjobs[item.post_id] || defautImagecompany;

    return (

      <TouchableOpacity

        activeOpacity={1}
        style={styles.cardresources}
        onPress={() =>
          navigation.navigate('JobDetail', {
            post_id: item.post_id,
            imageUrl: imageUrlsjobs[item.post_id] || null
          })
        }
      >

        <View style={styles.imageContainer}>
          <FastImage
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>


        <View style={styles.textContainer}>
          <Text style={styles.body} numberOfLines={1} >{(item.job_title || "")}</Text>
          <Text style={styles.body} numberOfLines={1} >{(item.industry_type || "")}</Text>
          <Text style={styles.body} numberOfLines={1} >{(item.Package || "")}</Text>

        </View>


      </TouchableOpacity>
    );
  };

  const getSlicedTitle = (title) => {
    const maxLength = 20;
    if (title.length > maxLength) {
      return title.slice(0, maxLength).trim() + '...';
    }
    return title;
  };

  const renderItemResources = ({ item }) => {

    const fileUrl = item.fileKey && item.fileKey.trim() !== "" ? imageUrlsresources[item.resource_id] : defautImage;
    const thumbnail = item.thumbnail_fileKey && item.thumbnail_fileKey.trim() !== "" ? imageUrlsresources[item.resource_id] : defautImage;
    const fileTypeedit = item.fileKey && item.fileKey.trim() !== "" ? item.fileKey.split('.').pop().toLowerCase() : null;

    const fileIconName = {
      pdf: 'file-pdf-box',
      doc: 'file-word',
      msword: 'file-word',
      document: 'file-word',

      docx: 'file-word',
      xls: 'file-excel',
      xlsx: 'file-excel',
      ppt: 'file-powerpoint',
      presentation: 'file-powerpoint',
      pptx: 'file-powerpoint',
    };

    // Convert timestamp to date
    const formattedDate = new Date(item.posted_on * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/ /g, '-');

    // Define video file extensions
    const videoExtensions = ['mp4', 'mov', 'quicktime', 'avi', 'flv', 'wmv', 'mkv', 'webm', 'mpeg'];
    const isVideo = item.fileKey && videoExtensions.some(ext => item.fileKey.toLowerCase().endsWith(ext));

    return (
      <TouchableOpacity
        style={styles.cardresources}
        activeOpacity={1}
        onPress={() => navigation.navigate('ResourceDetails', { resourceID: item.resource_id })}
      >

        <View style={styles.imageContainer}>
          {isVideo ? (

            <FastImage source={{ uri: thumbnail }} style={styles.image} resizeMode="contain" />

          ) : fileTypeedit && fileIconName[fileTypeedit] ? (
            <View style={styles.iconContainer}>
              <Icon name={fileIconName[fileTypeedit]} size={40} color="#075cab" />
            </View>
          ) : (
            <FastImage source={{ uri: fileUrl }} style={styles.image} resizeMode="contain" />
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.body} numberOfLines={1}>{getSlicedTitle(item.title || "")}</Text>
          {/* <Text style={styles.body} numberOfLines={1}>{item.resource_body || ""}</Text> */}
          <MyPostBody
            html={item.resource_body}
            forumId={item?.resource_id}
            numberOfLines={2}
          />
          <Text style={commonStyles.labelProduct}>{formattedDate || ""}</Text>

        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    const fileUrl = imageUrls[item.forum_id] || defautImage;
    const thumbnail = imageUrls[item.forum_id] || defautImage;

    const formattedDate = new Date(item.posted_on * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/ /g, '-');

    const videoExtensions = ['.mp4', '.mov', '.quicktime', '.avi', '.flv', '.wmv', '.mkv', '.webm', '.mpeg'];

    const isVideo = item?.fileKey && videoExtensions.some(ext => item.fileKey.endsWith(ext));

    return (


      <TouchableOpacity style={styles.card} activeOpacity={1} onPress={() => forumDetails(item.forum_id)}>

        <View style={styles.imageContainer}>
          {isVideo ? (
            <TouchableOpacity style={styles.videoContainer} activeOpacity={1} onPress={() => forumDetails(item.forum_id)}>
              <FastImage
                source={{ uri: thumbnail }} // Use fetched thumbnail
                style={styles.image}
                resizeMode="contain"
              />

            </TouchableOpacity>
          ) : (
            fileUrl ? (
              <FastImage
                source={{ uri: fileUrl }}
                style={styles.image}
                resizeMode="contain"
              />
            ) : null
          )}

        </View>

        <View style={styles.textContainer}>
          {/* <Text style={styles.body} numberOfLines={1} >{(item.forum_body || "")}</Text> */}
          <MyPostBody
            html={item.forum_body}
            forumId={item?.forum_id}
            numberOfLines={2}
          />
          <Text style={commonStyles.labelProduct}>{formattedDate || ""}</Text>
        </View>

      </TouchableOpacity>

    );
  };


  return (

    <>
      {
        loading ? (
          <View style={{ color: 'black', margin: 'auto', textAlign: "center", marginTop: 300, fontSize: 18, fontWeight: '400' }}>
            <ActivityIndicator size="large" color="#075cab" />
          </View>
        ) : (

          <View style={styles.container}>
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

              </TouchableOpacity>
            </View>

            <FlatList
              data={
                activeTab === 'jobs'
                  ? jobs
                  : activeTab === 'forum'
                    ? forums
                    : resources
              }
              keyExtractor={(item) => {
                if (activeTab === 'jobs') return `job-${item.post_id}`;
                if (activeTab === 'forum') return `forum-${item.forum_id}`;
                if (activeTab === 'resources') return `resource-${item.resource_id}`;
                return `unknown-${Math.random().toString()}`;
              }}
              contentContainerStyle={{ paddingBottom: '20%', paddingHorizontal:5 }}
              ListHeaderComponent={
                <>
                  <ProfileHeader
                    profile={profile}
                    imageUrl={imageUrl}
                    isModalVisibleImage={isModalVisibleImage}

                  />
                  <ProductDropdown productList={products} serviceList={services} />

                  <View style={styles.divider} />


                  <View style={styles.tabContainer}>
                    {/* Jobs */}
                    <TouchableOpacity
                      style={[styles.tabButton, activeTab === 'jobs' && styles.activeTabButton]}
                      onPress={() => handleTabPress('jobs')}
                    >
                      <Text style={[styles.tabButtonText, activeTab === 'jobs' && styles.activeTabButtonText]}>
                        Jobs
                      </Text>
                    </TouchableOpacity>

                    {/* Forum */}
                    <TouchableOpacity
                      style={[styles.tabButton, activeTab === 'forum' && styles.activeTabButton]}
                      onPress={() => handleTabPress('forum')}
                    >
                      <Text style={[styles.tabButtonText, activeTab === 'forum' && styles.activeTabButtonText]}>
                        Forum
                      </Text>
                    </TouchableOpacity>

                    {/* Resources */}
                    <TouchableOpacity
                      style={[styles.tabButton, activeTab === 'resources' && styles.activeTabButton]}
                      onPress={() => handleTabPress('resources')}
                    >
                      <Text style={[styles.tabButtonText, activeTab === 'resources' && styles.activeTabButtonText]}>
                        Resources
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Tab Content Rendering */}
                  {activeTab === 'jobs' ? (
                    <FlatList
                      data={jobs}
                      keyExtractor={(item) => `job-${item.post_id}`}
                      renderItem={renderJob}
                      numColumns={2}
                      columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 10 }}
                      contentContainerStyle={{ paddingVertical: 10 }}
                      onEndReached={() => {
                        if (lastEvaluatedKeyjobs) fetchJobs(false, lastEvaluatedKeyjobs);
                      }}
                      onEndReachedThreshold={0.5}
                      ListFooterComponent={renderFooter}
                      ListEmptyComponent={<Text style={styles.emptyText}>No posts found</Text>}
                    />
                  ) : activeTab === 'forum' ? (
                    <FlatList
                      data={forums}

                      keyExtractor={(item) => `forum-${item.forum_id}`}

                      renderItem={renderItem}
                      numColumns={2}
                      columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 10 }}
                      contentContainerStyle={{ paddingVertical: 10 }}
                      onEndReached={() => {
                        if (lastEvaluatedKey) fetchForums(false, lastEvaluatedKey);
                      }}
                      onEndReachedThreshold={0.5}
                      ListFooterComponent={renderFooter}
                      ListEmptyComponent={<Text style={styles.emptyText}>No posts found</Text>}
                    />
                  ) : (
                    <FlatList
                      data={resources}
                      keyExtractor={(item) => `resource-${item.resource_id}`}

                      renderItem={renderItemResources}
                      numColumns={2}
                      columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 10 }}
                      contentContainerStyle={{ paddingVertical: 10 }}
                      onEndReached={() => {
                        if (lastEvaluatedKeyResources) fetchResources(false, lastEvaluatedKeyResources);
                      }}
                      onEndReachedThreshold={0.5}
                      ListFooterComponent={renderFooter}
                      ListEmptyComponent={<Text style={styles.emptyText}>No posts found</Text>}
                    />
                  )}
                </>
              }
              showsVerticalScrollIndicator={false}
            />
          </View>

        )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',

  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'

  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-around',
  },

  tabButton: {
    width: 120,  // Fixed width for compact button
    paddingVertical: 8,
    paddingHorizontal: 10,
    // borderRadius: 6,
    alignItems: 'center',
    // borderColor: '#075cab',
    // borderWidth: 1.2,
    // backgroundColor: '#ffffff', 
    // shadowColor: '#dc3545',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 3,
    // elevation: 2,
  },
  activeTabButton: {
    backgroundColor: '#fff',
    borderColor: '#075cab',
    borderBottomWidth: 0.5,
  },
  tabButtonText: {
    color: 'black', // Text color for visibility
    fontWeight: '600',
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: 'black',
    marginTop: 20,
    fontSize: 16,
  },
  activeTabButtonText: {
    color: '#075cab', // Active tab text color
  },

  body: {
    fontSize: 15,
    color: 'black',
    fontWeight: '400',
  },

  dropdownItem: {
    padding: 10,
    // borderBottomWidth: 1,
    // borderBottomColor: '#ccc',
  },

  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  closeText: {
    color: 'white',
    textAlign: 'center',
  },
  labelProduct: {
    fontSize: 13,
    color: 'black',
    fontWeight: '300',
  },

  container1: {
    flex: 1,
    backgroundColor: 'white',
    marginLeft: 0,
    width: '100%',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderColor: '#075cab',
    borderWidth: 0.5,
    backgroundColor: '#ffffff',
    shadowColor: '#6e6e6e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  buttonText: {
    color: '#075cab',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  containerProduct: {
    padding: 10
  },

  productText: {
    fontSize: 16,
    color: 'black',
    alignSelf: 'flex-start'
  },
  divider: {
    borderBottomWidth: 0.2,
    borderBottomColor: "#ccc",
    marginVertical: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,
  },



  lableIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '35%',
  },

  imageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    marginBottom: 20,
    alignContent: 'center',
    justifyContent: 'center'
  },

  imageContainerprofile: {
    width: 140,
    height: 140,
    borderRadius: 75,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 5
  },
  imagerprofile: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center'
  },

  image: {
    width: '100%',
    height: '100%',

  },
  title1: {
    flexDirection: 'row',
    fontSize: 15,
    fontWeight: '500',
    color: 'black',
    marginBottom: 5,
  },

  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    width: '48%',
    height: 230,
  },

  cardresources: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    width: '48%',

  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },

  cardSmallScreen: {
    width: '100%',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  noServicesText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontSize: 16,
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
    alignSelf: 'center',  // Centers input horizontally
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
    // borderWidth: 1,
    // borderColor: '#ccc',

  },
  confirmButtonText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    // backgroundColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginHorizontal: 10,

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


  title: {
    flexDirection: 'row',
    marginVertical: 5,
    elevation: 3,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginVertical: 5,
    marginHorizontal: 10

  },
  label: {
    flex: 1, // Take up available space
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
  },
  label1: {
    width: '40%', // Occupies 35% of the row
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    // textAlign: 'justify',
    alignSelf: "flex-start"
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
  colon: {
    width: 20, // Fixed width for the colon
    textAlign: 'center', // Center the colon
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    alignSelf: 'flex-start',

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

});



export default CompanyDetailsPage