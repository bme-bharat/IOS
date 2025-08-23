import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Image, ActivityIndicator, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  Modal, Share,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import { FlatList } from 'react-native-gesture-handler';
import { Dimensions } from 'react-native';
import apiClient from '../ApiClient';
import ContactSupplierModal from '../helperComponents/ContactsModal';
import DisclaimerBox from './DisclaimerBox';
import { useFileOpener } from '../helperComponents/fileViewer';
import { useNetwork } from '../AppUtils/IdProvider';
import { openMediaViewer } from '../helperComponents/mediaViewer';
import AppStyles from '../AppUtils/AppStyles';

const { width } = Dimensions.get('window');

const ProductDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { company_id, product_id } = route.params;

  const scrollViewRef = useRef(null);
  const { myId, myData } = useNetwork();
  const { openFile } = useFileOpener();
  const [loading1, setLoading1] = useState(false);

  const handleOpenResume = async (key) => {
    if (!key) return;
    setLoading1(true);

    try {
      await openFile(key);
    } finally {
      setLoading1(false);
    }
  };


  useEffect(() => {
    if (product_id) {
      fetchProductDetails();
    }

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [product_id, company_id]);


  const [showFullText, setShowFullText] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState([]);
  const [videoUrls, setVideoUrls] = useState([]);

  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [modalVisible1, setModalVisible1] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const autoScrollRef = useRef(null);
  const [pdfUrls, setPdfUrls] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);


  const startAutoScroll = () => {
    if (!combinedData || combinedData.length <= 1) {

      return;
    }

    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);

    }

    autoScrollRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % combinedData.length;

        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 3000);

  };

  const [isFlatListReady, setIsFlatListReady] = useState(false);

  useEffect(() => {
    const dataReady =
      (Array.isArray(imageUrls) && imageUrls.length > 0) ||
      (Array.isArray(videoUrls) && videoUrls.length > 0);

    if (dataReady && isFlatListReady && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: 0, animated: false });
      setCurrentIndex(0);
      startAutoScroll();
    }
  }, [imageUrls, videoUrls, isFlatListReady, flatListRef.current]);


  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < combinedData.length) {
      setCurrentIndex(newIndex);

      clearInterval(autoScrollRef.current);
      setTimeout(() => {
        startAutoScroll();
      }, 1000);
    }
  };





  const shareProduct = async (product) => {
    try {
      if (!product?.product_id) {

        return;
      }

      const productUrl = `https://bmebharat.com/product/${product.company_id}/${product.product_id}`;

      const result = await Share.share({
        message: `Checkout this product: ${productUrl}`,
      });

      if (result.action === Share.sharedAction) {

      } else if (result.action === Share.dismissedAction) {

      }
    } catch (error) {

    }
  };



  const openModal = (mediaUrl, type) => {

    setSelectedMedia(mediaUrl);
    setMediaType(type);
    setModalVisible(true);
  };


  const closeModal = () => {
    setModalVisible(false);
    setSelectedMedia(null);
  };



  const combinedData = useMemo(() => {
    if (!Array.isArray(imageUrls) || !Array.isArray(videoUrls)) return [];
    return [
      ...imageUrls.map((url) => ({ type: 'image', url })),
      ...videoUrls.map((url) => ({ type: 'video', url }))
    ];
  }, [imageUrls, videoUrls]);




  const fetchProductDetails = async () => {
    try {
      const response = await apiClient.post('/getProduct', {
        command: 'getProduct',
        product_id,
      });

      const data = response?.data;

      if (data?.status === 'success' && data.response) {
        const productData = data.response;

        setProduct(productData);

        if (productData.images) fetchImageUrls(productData.images);
        if (productData.videos) fetchVideoUrls(productData.videos);
        if (productData.files) fetchPdfUrls(productData.files);
        if (productData.company_fileKey) fetchCompanyImage(productData.company_fileKey);

        fetchRelatedProducts(productData);

        flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
      } else {

        setProduct({ removed_by_author: true });
      }
    } catch (error) {

      setProduct({ removed_by_author: true });

    } finally {
      setLoading(false);
    }
  };



  const fetchRelatedProducts = async (product, lastKey = null) => {
    try {
      const response = await apiClient.post('/getRelatedProductsByProductId', {
        command: 'getRelatedProductsByProductId',
        product_id: product?.product_id,
        limit: 5,
        ...(lastKey && { lastEvaluatedKey: lastKey }),
      });

      if (
        response.data &&
        response.data.status === 'success' &&
        Array.isArray(response.data.response)
      ) {
        const allProducts = response.data.response;
        const newLastKey = response.data.lastEvaluatedKey || null;

        if (!allProducts.length) {
          setLastEvaluatedKey(null); // Stop further pagination
          return;
        }

        const updatedProducts = await fetchRelatedProductImages(allProducts);

        setRelatedProducts((prev) =>
          lastKey ? [...prev, ...updatedProducts] : updatedProducts
        );
        setLastEvaluatedKey(newLastKey);
      } else {
        setLastEvaluatedKey(null);
      }
    } catch (error) {
      console.error(
        '❌ Error fetching related products:',
        error.response?.data || error.message
      );
    }
  };





  const fetchRelatedProductImages = async (products) => {
    if (!products || products.length === 0) return products;

    const updatedProducts = await Promise.all(
      products.map(async (product) => {
        if (!product.images || product.images.length === 0) {
          return { ...product, imageUrl: null };
        }

        try {
          const imgRes = await apiClient.post('/getObjectSignedUrl', {
            command: 'getObjectSignedUrl',
            key: product.images[0], // First image
          });

          return { ...product, imageUrl: imgRes.data || null };
        } catch (error) {
          console.error('Error fetching image URL for related product:', error);
          return { ...product, imageUrl: null };
        }
      })
    );

    return updatedProducts;
  };





  const fetchImageUrls = async (images) => {
    if (!images || images.length === 0) return;

    const urls = await Promise.all(
      images.map(async (imageKey) => {
        try {
          const imgRes = await apiClient.post('/getObjectSignedUrl', {
            command: 'getObjectSignedUrl',
            key: imageKey,
          });

          return imgRes.data || null;
        } catch (error) {
          console.error('Error fetching image URL:', error);
          return null;
        }
      })
    );

    setImageUrls(urls.filter(url => url !== null));
    // console.log('Fetched image URLs:', urls);
  };


  const fetchVideoUrls = async (videos) => {
    if (!videos || videos.length === 0) return;

    const urls = await Promise.all(
      videos.map(async (videoKey) => {
        try {
          const videoRes = await apiClient.post('/getObjectSignedUrl', {
            command: 'getObjectSignedUrl',
            key: videoKey,
          });

          return videoRes.data || null;
        } catch (error) {
          console.error('Error fetching video URL:', error);
          return null;
        }
      })
    );

    setVideoUrls(urls.filter(url => url !== null));
    // console.log('Fetched video URLs:', urls);
  };


  const fetchPdfUrls = async (files) => {
    if (!files || files.length === 0) return;

    const urls = await Promise.all(
      files.map(async (fileKey) => {
        try {
          const fileRes = await apiClient.post('/getObjectSignedUrl', {
            command: 'getObjectSignedUrl',
            key: fileKey,
          });

          return fileRes.data || null;
        } catch (error) {
          console.error('Error fetching PDF URL:', error);
          return null;
        }
      })
    );

    setPdfUrls(urls.filter(url => url !== null));
  };



  const fetchCompanyImage = async (fileKey) => {
    try {
      const res = await apiClient.post('/getObjectSignedUrl', {
        command: 'getObjectSignedUrl',
        key: fileKey,
      });

      if (res.data) {
        // handle response here
      }
    } catch (error) {
      // handle error here
    }
  };


  const handleGoBack = () => { navigation.goBack() };

  const toggleFullText = () => {
    setShowFullText((prev) => !prev);
  };

  const getText1 = (text) => {
    return showFullText || text?.length <= 200 ? text : text?.slice(0, 200) + " ...";
  };

  const specifications = product?.specifications
    ? [
      { label: 'Model name', value: product.specifications?.model_name },
      { label: 'Types', value: product.specifications?.types },
      { label: 'Brand', value: product.specifications?.brand },
      { label: 'Application', value: product.specifications?.application },
      { label: 'Operation mode', value: product.specifications?.operation_mode },
      { label: 'Country of origin', value: product.specifications?.country_of_origin },
      { label: 'Regulatory & Compliance', value: product.specifications?.regulatory_and_compliance },
      { label: 'Certifications', value: product.specifications?.certifications },
      { label: 'Power supply', value: product.specifications?.power_supply },
      { label: 'Warranty', value: product.specifications?.warranty },
      { label: 'Dimensions', value: product.specifications?.dimensions },
      { label: 'Weight', value: product.specifications?.weight },
      { label: 'Package contents', value: product.specifications?.package_contents },
      { label: 'After sales service', value: product.specifications?.after_sales_service }
    ]
    : [];


  let isNavigating = false;

  const handleAddProduct = (product) => {
    if (isNavigating) return;
    isNavigating = true;
    navigation.navigate('RelatedProductDetails', { product_id: product.product_id, company_id: product.company_id });

  };



  const handleNavigate = (company_id) => {

    navigation.navigate('CompanyDetailsPage', { userId: company_id });
  };

  if (!product) {

    return (
      <SafeAreaView style={styles.container}>

        <View style={styles.headerContainer}>

          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Icon name="arrow-left" size={24} color="#075cab" />
          </TouchableOpacity>

        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#075cab" />
        </View>
      </SafeAreaView>
    );
  }

  if (product?.removed_by_author) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>

          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Icon name="arrow-left" size={24} color="#075cab" />
          </TouchableOpacity>

        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>This post was removed by the author</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (

    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Icon name="arrow-left" size={24} color="#075cab" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => shareProduct(product)} style={styles.circle}>
          <Icon name="share" size={20} color="#075cab" />

          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>

      </View>
      {product?.removed_by_author ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>This post was removed by the author</Text>
        </View>
      ) :
        <>
          <ScrollView contentContainerStyle={{ backgroundColor: 'white', }}
            showsVerticalScrollIndicator={false} ref={scrollViewRef} >
            <TouchableOpacity activeOpacity={1}>
              <Text style={styles.title}>{product?.title}</Text>
              <Text style={styles.category}>{product?.category}</Text>
              <TouchableOpacity onPress={toggleFullText} activeOpacity={1}>
                <Text style={styles.description}>
                  {showFullText ? product?.description.trim() : getText1(product?.description.trimStart().trimEnd().slice(0, 200))}
                  {product?.description.length > 200 && !showFullText && (
                    <Text style={styles.readMore}>...Read More</Text>
                  )}
                </Text>
              </TouchableOpacity>

              <View style={{
                width: width,
                height: width,
                marginBottom: 20,
                overflow: 'hidden',
                alignSelf: 'center'
              }}>

                <FlatList
                  ref={flatListRef}
                  data={combinedData}
                  horizontal
                  pagingEnabled
                  snapToInterval={width}
                  decelerationRate="fast"
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) =>
                    item.type === 'image' ? (
                      <TouchableOpacity
                        onPress={() => openMediaViewer(combinedData, index)}
                        style={{
                          width: width,
                          height: width,
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 10
                        }}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: item.url }}
                          style={[styles.mainProductImage]}
                        />
                      </TouchableOpacity>
                    ) : (
                      <View
                        style={[
                          styles.videoContainer,
                          {
                            width: width,
                            height: width,
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 10
                          },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => openMediaViewer(combinedData, index)}
                          style={{ width: '100%', height: '100%' }}
                        >
                          <Video
                            source={{ uri: item.url }}
                            style={[styles.productVideo, { width: '100%', height: '100%' }]}
                            resizeMode="contain"
                            paused
                          />
                          <TouchableOpacity style={styles.playButton}>
                            <Icon name="play-circle-outline" size={40} color="white" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      </View>
                    )
                  }
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onLayout={() => { setIsFlatListReady(true); }}
                  getItemLayout={(data, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                  })}
                  contentContainerStyle={{
                    alignItems: 'center',
                  }}
                />

                <View style={AppStyles.dotsContainer}>
                  {combinedData.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        AppStyles.dot,
                        currentIndex === index && AppStyles.activeDot,
                      ]}
                    />
                  ))}
                </View>


              </View>

              <TouchableOpacity activeOpacity={0.8} style={styles.headerRow} onPress={() => handleNavigate(product.company_id)}>
                <Text style={styles.company} >{product.company_name}</Text>
              </TouchableOpacity>

              <View style={styles.priceRow}>
                {product?.price?.trim() && (
                  <Text style={styles.price}>₹ {product?.price}</Text>
                )}
              </View>

              <Text style={styles.specTitle}>Specifications </Text>

              {specifications
                .filter(spec => spec?.value)
                .map((spec, index) => (
                  <View key={index} style={index % 2 === 0 ? styles.specItem : styles.specItem1}>
                    <Text style={styles.specLabel}>{spec.label} </Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={styles.value}>{spec.value}</Text>
                  </View>
                ))}

              <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
              >
                <View style={styles.modalBackground}>
                  <View style={styles.modalContent1}>
                    {mediaType === 'image' && selectedMedia ? (
                      <Image
                        source={{ uri: `${selectedMedia}?t=${new Date().getTime()}` }} // Append timestamp to prevent caching issues
                        style={styles.fullscreenImage}
                        resizeMode="contain"
                        onError={(error) => console.log('Image Load Error:', error.nativeEvent)}
                      />
                    ) : mediaType === 'video' && selectedMedia ? (
                      <Video
                        source={{ uri: selectedMedia }}
                        style={styles.fullscreenVideo}
                        controls
                        resizeMode="contain"
                      />
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <Icon name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </Modal>

              {product?.files.length > 0 &&
                product.files.some(file => file.toLowerCase().endsWith('.pdf')) && (
                  <TouchableOpacity
                    onPress={() => handleOpenResume(product.files[0])}
                    style={styles.pdf}
                  >
                    {loading1 ? (
                      <ActivityIndicator size="small" color="#075cab" style={styles.pdfButtonText} />
                    ) : (
                      <Text style={styles.pdfText}>View product catalogue</Text>
                    )}
                  </TouchableOpacity>
                )}

              {myId !== product?.company_id && (
                <>
                  <TouchableOpacity onPress={() => setModalVisible1(true)} style={{ padding: 10 }}>
                    <Text style={styles.contact}>Contact supplier</Text>
                  </TouchableOpacity>

                  <ContactSupplierModal
                    visible={modalVisible1}
                    onClose={() => setModalVisible1(false)}
                    company_id={company_id}
                  />
                </>
              )}


              {relatedProducts?.length > 0 && (
                <View style={styles.relatedProductsContainer}>
                  <View style={styles.divider}></View>

                  <Text style={styles.relatedTitle}>Related Products </Text>
                  <FlatList
                    data={relatedProducts}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => item.product_id ? item.product_id.toString() : `index-${index}`}
                    renderItem={({ item }) => (

                      <TouchableOpacity style={styles.productCard} onPress={() => handleAddProduct(item)} activeOpacity={0.8}>
                        <Image
                          source={item.imageUrl ? { uri: item.imageUrl } : null}
                          style={styles.productImage}
                        />

                        <Text numberOfLines={1} style={styles.productName}>{item?.title || 'No Title'}</Text>
                        <Text numberOfLines={1} style={styles.price1}>
                          {item.price && item.price.trim() !== '' ? `₹ ${item?.price}` : '₹ Contact Seller'}
                        </Text>
                        <Text numberOfLines={1} style={styles.productDescription}>{item?.description}</Text>
                      </TouchableOpacity>
                    )}
                    onEndReached={() => lastEvaluatedKey && fetchRelatedProducts(product, lastEvaluatedKey)}
                    onEndReachedThreshold={0.5}
                  />

                </View>
              )}
              <DisclaimerBox />

            </TouchableOpacity>
          </ScrollView>
        </>
      }

    </View>
  );

};



const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: 'white',

  },

  divider: {
    width: '100%',
    borderWidth: 0.3,
    borderColor: '#ccc',
    marginVertical: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'whitesmoke',
    elevation: 1,  // for Android
    shadowColor: '#000',  // shadow color for iOS
    shadowOffset: { width: 0, height: 1 },  // shadow offset for iOS
    shadowOpacity: 0.1,  // shadow opacity for iOS
    shadowRadius: 2,  // shadow radius for iOS

  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,
  },
  circle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  shareText: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 10,

  },
  imageContainer: {
    marginBottom: 20,
    borderRadius: 12, // Adding a slight rounded corner to the container
    overflow: 'hidden', // Makes sure the rounded corners are applied to all child elements
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5, // Adds shadow for a card-like effect
  },

  mainProductImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    alignSelf: 'center',
  },

  productVideo: {
    width: width - 10,
    height: '100%',
    borderRadius: 12,
    resizeMode: 'contain',
    backgroundColor: 'white',
    alignSelf: 'center'
  },
  closeButtonphone: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,

    borderRadius: 20,
  },
  closeButtonText: {
    color: '#075cab',
    fontSize: 16,
  },

  videoContainer: {
    position: 'relative',
    width: width,
    height: 16 / 9 * width - 450,
    overflow: 'hidden',
  },

  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }], // center the 40px icon
    zIndex: 2,
    borderRadius: 50,
    alignSelf: 'center',
    padding: 8, // optional: adds breathing space around icon
  },


  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 10

  },

  imageContainer1: {
    width: 30,
    height: 30,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  companyImage: {
    width: 30,
    height: 30,
    borderRadius: 22,
    backgroundColor: '#e0e0e0',
    resizeMode: 'contain',
  },

  textContainer: {
    flex: 1,
  },

  content: {
    paddingBottom: 16,
  },

  company: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    // letterSpacing: 1.2,
    // textTransform: 'uppercase',
    // marginBottom: 3,
  },

  category: {
    fontSize: 13,
    fontWeight: '300',
    color: '#777',
    paddingHorizontal: 10

  },

  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginTop: 10,

    paddingHorizontal: 10
  },

  description: {
    color: 'black',
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'justify',
    paddingHorizontal: 10
  },
  productDescription: {
    color: '#000',
    fontSize: 15,
    // lineHeight: 24,
    // marginTop: 5,
    textAlign: 'justify',

  },
  description1: {
    color: '#555',
    fontSize: 14,
    lineHeight: 24,
    marginTop: 5,
    textAlign: 'justify',
    paddingHorizontal: 10

  },
  readMore: {
    color: '#075cab', // Blue color for "Read More"
    fontWeight: '300', // Make it bold if needed
    fontSize: 12,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10

  },

  price: {
    fontSize: 15,
    fontWeight: '500',
    color: '#075cab',
    marginRight: 14,

  },

  price1: {
    fontSize: 15,
    // fontWeight: 'bold',
    color: '#075cab',
    marginRight: 14,

  },

  discountPrice: {
    textDecorationLine: 'line-through',
    fontSize: 18,
    color: '#dc3545',
  },

  offer: {
    fontSize: 18,
    fontWeight: '600',
    color: '#28a745',
    marginLeft: 12,
  },

  specifications: {
    marginTop: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 4,
    paddingHorizontal: 10

  },

  specTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 14,
    // textTransform: 'uppercase',
    paddingHorizontal: 10
  },

  specList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  specItem: {
    fontSize: 14,
    color: '#555',
    width: '100%',
    padding: 10,
    backgroundColor: '#f9f9f9',
    // borderRadius: 8,
    // borderWidth: 1,
    // borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10

  },
  specItem1: {
    fontSize: 14,
    color: '#555',
    width: '100%',
    padding: 10,
    // backgroundColor: '#f9f9f9',
    // borderRadius: 8,
    // borderWidth: 1,
    // borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10

  },

  specLabel: {
    flex: 1, // Take up available space
    color: 'black',
    fontWeight: '500',
    fontSize: 14,
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
    flex: 2, // Take the remaining space
    flexShrink: 1,
    color: 'black',
    fontWeight: '300',
    fontSize: 14,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
  },

  tags: {
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 10,
  },

  status: {
    fontSize: 16,
    color: '#555',
    marginTop: 8,
    paddingHorizontal: 10,

  },

  errorText: {
    fontWeight: '400',
    textAlign: 'center',
    padding: 10,
    fontSize: 16
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',

  },
  modalContent1: {
    width: '100%',
    // height: 300,
    backgroundColor: 'black',
    borderRadius: 10,
    overflow: 'hidden',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 70, // Adjust for your layout
    left: 10, // Adjust for your layout
    zIndex: 1, // Ensure it appears above the video
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 5,
    borderRadius: 30,
  },

  relatedProductsContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  pdf: {
    padding: 10,
    // backgroundColor: '#007bff',
    // color: 'black',
    borderRadius: 5,
    marginBottom: 5,
  },
  pdfText: {
    color: 'black',
    textAlign: 'center',
    fontSize: 16,
    color: '#075cab',
    textAlign: 'center'
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 14,
    // textTransform: 'uppercase',
    // paddingHorizontal: 10
  },
  relatedList: {
    marginBottom: 20,
  },
  contact: {
    fontSize: 15,
    color: '#075cab',
    fontWeight: '500',
    textDecorationLine: 'underline',
    marginTop: 10,
    textAlign: 'center'
  },
  productCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginRight: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    // shadowColor: '#000',
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    elevation: 3,
    gap: 5,

  },
  productImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    resizeMode: 'contain',
    marginBottom: 20,
    alignSelf: 'center'
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 5,
    color: '#000',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#075cab',
    marginTop: 3,
  },
  productCategory: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },


});



export default ProductDetails;
