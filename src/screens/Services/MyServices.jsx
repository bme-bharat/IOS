import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    SafeAreaView,

} from "react-native";

import axios from "axios";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from "@react-navigation/native";

import Toast from 'react-native-toast-message';
import Message from "../../components/Message";
import apiClient from "../ApiClient";
import { showToast } from "../AppUtils/CustomToast";
import { useNetwork } from "../AppUtils/IdProvider";
import { EventRegister } from "react-native-event-listeners";
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import Add from '../../assets/svgIcons/add.svg';

import { colors, dimensions } from '../../assets/theme.jsx';

const BASE_API_URL = 'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev';
const API_KEY = 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk';

const MyServices = () => {
    const { myId, myData } = useNetwork();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [signedUrls, setSignedUrls] = useState({});
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    useEffect(() => {
        const handleProductCreated = async ({ newProduct }) => {
            const firstImage = Array.isArray(newProduct.images) && newProduct.images.length > 0
                ? newProduct.images[0]
                : null;

            const signedUrl = await fetchSignedUrl(firstImage);

            const enrichedProduct = {
                ...newProduct,
                signedImageUrl: signedUrl,
            };

            setProducts((prev) => [enrichedProduct, ...(Array.isArray(prev) ? prev : [])]);
        };

        const handleProductUpdated = async ({ updatedProduct }) => {
            console.log('✏️ Product updated:', updatedProduct);

            const firstImage = Array.isArray(updatedProduct.images) && updatedProduct.images.length > 0
                ? updatedProduct.images[0]
                : null;

            const signedUrl = await fetchSignedUrl(firstImage);

            const enrichedUpdatedProduct = {
                ...updatedProduct,
                signedImageUrl: signedUrl,
            };

            setProducts((prevProducts) =>
                (Array.isArray(prevProducts) ? prevProducts : []).map((product) =>
                    product.service_id === updatedProduct.service_id
                        ? enrichedUpdatedProduct
                        : product
                )
            );

        };
        const handleProductDeleted = ({ deletedProductId }) => {
            console.log('🗑️ Product deleted:', deletedProductId);
            setProducts((prevProducts) =>
                prevProducts.filter((product) => product.service_id !== deletedProductId)
            );
        };

        const createListener = EventRegister.addEventListener('onProductCreated', handleProductCreated);
        const updateListener = EventRegister.addEventListener('onProductUpdated', handleProductUpdated);
        const deleteListener = EventRegister.addEventListener('onProductDeleted', handleProductDeleted);

        return () => {
            EventRegister.removeEventListener(createListener);
            EventRegister.removeEventListener(updateListener);
            EventRegister.removeEventListener(deleteListener);
        };
    }, []);




    const fetchSignedUrl = async (fileKey) => {
        if (!fileKey) return null;

        try {
            const response = await axios.post(
                `${BASE_API_URL}/getObjectSignedUrl`,
                { command: 'getObjectSignedUrl', key: fileKey },
                { headers: { 'x-api-key': API_KEY } }
            );

            return response.data;
        } catch (error) {
            console.error('❌ Failed to fetch signed URL for:', fileKey, error);
            return null;
        }
    };

    const handleAddProduct = () => {
        setTimeout(() => {
            navigation.navigate('CreateService')
        }, 300); // Small delay for smooth UI transition
    };

    const handleEditProduct = (product) => {
        navigation.navigate('ServiceEdit', { product });
    };

    const handleEnquiry = (product) => {
        navigation.navigate('CompanyGetallEnquiries', { service_id: product.service_id, company_id: product.company_id });
    };

    const [deleteTarget, setDeleteTarget] = useState({
        productId: null,
        images: [],
        videos: [],
        files: [],
    });

    const handleDeletePress = (productId, images = [], videos = [], files = []) => {
        setDeleteTarget({ productId, images, videos, files });
        setShowDeleteConfirmation(true);
    };

    // Cancel delete
    const cancelDelete = () => {
        setDeleteTarget({ productId: null, images: [], videos: [], files: [] });
        setShowDeleteConfirmation(false);
    };


    const confirmDelete = async () => {
        const { productId, images, videos, files } = deleteTarget;
        setShowDeleteConfirmation(false);

        try {
            const fileKeys = [...images, ...videos, ...files].filter(
                (key) => key && typeof key === "string" && key !== "0"
            );

            if (fileKeys.length > 0) {
                await Promise.all(
                    fileKeys.map(async (fileKey) => {
                        try {
                            const s3Payload = {
                                command: "deleteFileFromS3",
                                key: fileKey,
                            };
                            const response = await axios.post(
                                `${BASE_API_URL}/deleteFileFromS3`,
                                s3Payload,
                                { headers: { "x-api-key": API_KEY } }
                            );

                            console.log(`✅ S3 file deleted: ${fileKey}`, response.data);
                        } catch (err) {

                        }
                    })
                );
            } else {

            }

            const deletePayload = {
                command: "deleteService",
                service_id: productId,
            };

            const response = await axios.post(
                `${BASE_API_URL}/deleteService`,
                deletePayload,
                { headers: { "x-api-key": API_KEY } }
            );

            if (response.data.status === "success") {

                EventRegister.emit('onProductDeleted', { deletedProductId: productId });

                showToast("Service deleted", 'success');
            } else {

                throw new Error("Failed to delete");
            }
        } catch (error) {

            showToast("Something went wrong", 'error');
        }
    };





    const fetchProducts = async () => {
        if (!myId) return;

        try {
            setLoading(true);

            const response = await apiClient.post('/getServicesByCompanyId', {
                command: 'getServicesByCompanyId',
                company_id: myId,
            });

            if (response.data.status === "success") {
                const productsData = response.data.response || [];

                if (productsData.length === 0) {
                    setProducts({ removed_by_author: true });
                } else {
                    setProducts(productsData);
                    fetchImageUrls(productsData);
                }

            } else {
                // API responded with error status
                setProducts({ removed_by_author: true });
            }

        } catch (error) {
            console.error("Error fetching products:", error);
            setProducts({ removed_by_author: true });

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };


    useEffect(() => {
        fetchProducts();

    }, [])

    const fetchImageUrls = async (productsData) => {
        const imageKeys = productsData
            .map((item) => item.images?.[0])
            .filter(Boolean);

        if (imageKeys.length === 0) return;

        try {
            const urlPromises = imageKeys.map((key) =>
                axios.post(
                    `${BASE_API_URL}/getObjectSignedUrl`,
                    { command: 'getObjectSignedUrl', key },
                    { headers: { 'x-api-key': API_KEY } }
                )
            );

            const responses = await Promise.all(urlPromises);

            const urlMap = responses.reduce((acc, res, index) => {
                const key = imageKeys[index];
                acc[key] = res.data;
                return acc;
            }, {});

            setSignedUrls(urlMap);
        } catch (error) {
        }
    };




    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProducts();
        setRefreshing(false);

    };


    const navigateToDetails = (product) => {
        navigation.navigate('ServiceDetails', { service_id: product.service_id, company_id: product.company_id });

    };

    const renderProduct = ({ item }) => {
        const firstImageKey = item.images?.[0];
        const signedImageUrl = item.signedImageUrl || signedUrls[firstImageKey]; // <- key fix

        return (
            <TouchableOpacity onPress={() => navigateToDetails(item)} style={styles.productCard1}>
                <View style={styles.productCard}>
                    <View style={styles.imageContainer}>
                        {signedImageUrl ? (
                            <Image source={{ uri: signedImageUrl }} style={styles.image} />
                        ) : (
                            null
                        )}
                    </View>

                    <View style={styles.textContainer}>
                        <Text numberOfLines={1} style={[styles.value1,]}>{item.title || "N/A"}</Text>
                        <Text numberOfLines={1} style={styles.value}>{item.category || "N/A"}</Text>
                        <Text numberOfLines={1} style={styles.value}>{item.description || "N/A"}</Text>
                        {(item.price ?? '').toString().trim() !== '' ? (
                            <View style={styles.priceRow}>
                                <Text numberOfLines={1} style={styles.value1}>₹ {item.price}</Text>
                            </View>
                        ) : (
                            <Text style={styles.value1}>₹ N/A</Text>
                        )}
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={() => handleEditProduct(item)} style={[styles.actionButton]} activeOpacity={1}>
                      
                            <Text style={styles.buttonText}>Edit</Text>
                      
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleDeletePress(item.service_id, item.images, item.files)}
                        style={[styles.actionButton,{ marginLeft: 10 }]}
                        activeOpacity={1}
                    >
                       
                            <Text style={styles.deleteButtonText}>Delete</Text>
                       
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleEnquiry(item)} style={[styles.actionButton, { marginLeft: 10 }]} activeOpacity={1}>
                       
                            <Text style={styles.buttonText}>View Enquiries</Text>
                       
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };


    if (loading) {
        return (
            <SafeAreaView style={styles.container}>

                <View style={styles.headerContainer}>

                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                    </TouchableOpacity>

                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#075cab" />
                </View>
            </SafeAreaView>
        );
    }

    if (!products || products.length === 0 || products?.removed_by_author) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.headerContainer}>

                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addProductButton} onPress={handleAddProduct}>
                        <Add width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                        <Text style={styles.addProductText}>Add Service</Text>
                    </TouchableOpacity>

                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, color: 'gray' }}>No services available</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                </TouchableOpacity>
                <TouchableOpacity style={styles.addProductButton} onPress={handleAddProduct}>
                    <Add width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                    <Text style={styles.addProductText}>Add Service</Text>
                </TouchableOpacity>

            </View>
            {!loading ? (
                <FlatList
                    data={products}
                    keyExtractor={(item, index) => item.service_id?.toString() || `product-${index}`}
                    renderItem={renderProduct}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: '20%' }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            ) : (
                <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color="#075cab" />
                </View>
            )}


            {showDeleteConfirmation && (
                <Message
                    visible={showDeleteConfirmation}
                    onCancel={cancelDelete}
                    onOk={confirmDelete}
                    title="Delete Confirmation"
                    iconType="warning"  // You can change this to any appropriate icon type
                    message="Are you sure? want to delete this post?"
                />
            )}

            <Toast />
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "whitesmoke",

    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: '#f0f0f0'
    },
    addProductButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // paddingVertical: 10,
        padding: 10,
        // marginTop: 10,
        borderRadius: 8,

    },
    addProductText: {
        color: '#075cab',
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 4,

    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },

    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        backgroundColor: '#ffffff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
        justifyContent: 'center'

    },
    iconTextContainer: {
        flexDirection: 'row',
        // alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 5,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 1 },
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '500',
        color: "#075cab",
    },
    deleteButtonText: {
        color: "#FF0000",
        fontSize: 15,
        fontWeight: '500'
    },

    backButton: {
        alignSelf: 'flex-start',
        padding: 10
    },
    searchContainer: {
        flex: 1,
        padding: 10,
        alignSelf: 'center',
        backgroundColor: 'whitesmoke',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        borderRadius: 10,
        paddingHorizontal: 10,
        backgroundColor: 'whitesmoke',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        height: 30,
        marginHorizontal: 10,
        paddingHorizontal: 10,
        color: "black",
        fontSize: 14,
        paddingTop: 0,
        paddingBottom: 0,
        lineHeight: 20,
    },

    centeredContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    centeredContainer1: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noProductsText: {
        color: 'black',
        fontSize: 18,
        fontWeight: '500',
    },
    noProductsText1: {
        color: 'black',
        fontSize: 18,
        fontWeight: '400',
        padding: 10
    },

    productCard: {
        flexDirection: 'row',
        marginHorizontal: 5,
        backgroundColor: 'white',
        padding: 5,

    },
    productCard1: {
        marginBottom: 10,
        marginHorizontal: 5,
        top: 5,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#ddd',
        borderWidth: 0.5,
        shadowColor: '#000',
        padding: 10

    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: 100,

    },

    image: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'contain',

    },

    textContainer: {
        flex: 2,
        paddingLeft: 10,
        // gap: 8,
        // backgroundColor: 'green',

    },
    detailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,

    },

    label: {
        flex: 1,
        minWidth: 10,
        color: 'black',
        fontWeight: '500',
        fontSize: 14,
        textAlign: 'left', // Align text to the left
        alignSelf: 'flex-start',
    },

    colon: {
        width: 10, // Fixed width for the colon
        textAlign: 'center', // Center the colon
        color: 'black',
        fontWeight: '400',
        fontSize: 15,
        alignSelf: 'flex-start',

    },
    value: {
        flex: 2, // Take the remaining space
        flexShrink: 1,
        fontSize: 14,
        fontWeight: '400',
        color: colors.text_secondary,
        textAlign: 'left', // Align text to the left
        alignSelf: 'flex-start',
        padding: 5,
    },
    value1: {
        flex: 2, // Take the remaining space
        flexShrink: 1,
        fontSize: 16,
        fontWeight: '600',
        color: colors.text_primary,
        textAlign: 'left', // Align text to the left
        alignSelf: 'flex-start',
        padding: 5,
    },

});


export default MyServices;
