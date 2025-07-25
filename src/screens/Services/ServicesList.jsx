import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator,
    TextInput, RefreshControl, StyleSheet,
    Keyboard,
    SafeAreaView,
    TouchableWithoutFeedback,
    ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import apiClient from '../ApiClient';
import { useNetwork } from '../AppUtils/IdProvider';
import Fuse from 'fuse.js';
import { showToast } from '../AppUtils/CustomToast';
import { useConnection } from '../AppUtils/ConnectionProvider';
import AppStyles from '../../assets/AppStyles';
import { highlightMatch } from '../helperComponents.jsx/signedUrls';

const ServicesList = () => {
    const { isConnected } = useConnection();

    const [services, setservices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
    const [imageUrls, setImageUrls] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const searchInputRef = useRef(null);
    const navigation = useNavigation();
    const [fetchLimit, setFetchLimit] = useState(3);
    const [searchResults, setSearchResults] = useState(false);
    const [searchTriggered, setSearchTriggered] = useState(false);




    const withTimeout = (promise, timeout = 10000) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout)),
        ]);
    };



    const fetchservices = async (lastKey = null,) => {
        if (!isConnected) {

            return;
        }
        if (loading || loadingMore) return;
        lastKey ? setLoadingMore(true) : setLoading(true);

        const startTime = Date.now();

        try {
            const requestData = {
                command: "getAllServices",
                limit: lastKey ? fetchLimit : 4,
                ...(lastKey && { lastEvaluatedKey: lastKey }),
            };

            const res = await withTimeout(apiClient.post('/getAllServices', requestData), 10000);

            const newProducts = res?.data?.response || [];

            if (!newProducts.length) {
                setLastEvaluatedKey(null);
                return;
            }

            const responseTime = Date.now() - startTime;

            if (responseTime < 400) {
                setFetchLimit(prev => Math.min(prev + 5, 10));
            } else if (responseTime > 1000) {
                setFetchLimit(prev => Math.max(prev - 2, 1));
            }

            setservices(prev => lastKey ? [...prev, ...newProducts] : newProducts);
            setLastEvaluatedKey(res.data.lastEvaluatedKey || null);
            fetchServiceImageUrls(newProducts);
        } catch (error) {
            showToast('Slow network', 'info');
            setLoading(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const fetchServiceImageUrls = async (services) => {
        const urlsObject = {};
        const startTime = Date.now();

        await Promise.all(
            services.map(async (service) => {
                if (service.images?.length > 0) {
                    try {
                        const res = await apiClient.post('/getObjectSignedUrl', {
                            command: 'getObjectSignedUrl',
                            key: service.images[0], // Use first image for preview
                        });

                        if (res.data) {
                            urlsObject[service.service_id] = res.data;
                        }
                    } catch (error) {

                    }
                }
            })
        );

        const responseTime = Date.now() - startTime;

        if (responseTime < 500) {
            setFetchLimit(prev => Math.min(prev + 5, 50));
        } else if (responseTime > 1200) {
            setFetchLimit(prev => Math.max(prev - 2, 1));
        }

        setImageUrls(prevUrls => ({ ...prevUrls, ...urlsObject }));
    };


    useEffect(() => {

        fetchservices();
    }, []);


    const debounceTimeout = useRef(null);

    const handleDebouncedTextChange = useCallback((text) => {
        setSearchQuery(text);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        const trimmedText = text.trim();

        if (trimmedText === '') {
            setSearchTriggered(false);
            setSearchResults([]);
            return;
        }

        debounceTimeout.current = setTimeout(() => {
            handleSearch(trimmedText);
        }, 300);
    }, [handleSearch]);

    const scrollViewRef = useRef(null);

    const handleSearch = async (text, selectedCategories = {}) => {
        if (!isConnected) {
            return;
        }

        setSearchQuery(text);

        if (text.trim() === '' && Object.keys(selectedCategories).length === 0) {
            setSearchTriggered(false);
            setSearchResults([]);
            return;
        }

        const selectedCategoryKeys = Object.keys(selectedCategories).filter(
            (key) => selectedCategories[key]
        );

        const requestData = {
            command: "searchServices",
            searchQuery: text.trim(),
            categories: selectedCategoryKeys.length > 0 ? selectedCategoryKeys : undefined
        };

        try {
            const res = await withTimeout(apiClient.post('/searchServices', requestData), 10000);
            scrollViewRef.current?.scrollToOffset({ offset: 0, animated: true });

            const searchResults = res.data.response || [];
            setSearchResults(searchResults);
            setLastEvaluatedKey(null);
            fetchServiceImageUrls(searchResults);

        } catch (error) {

        } finally {
            setSearchTriggered(true);

        }
    };


    const isRefreshingRef = useRef(false);
    const handleRefresh = async () => {
        if (!isConnected) {

            return;
        }
        if (isRefreshingRef.current || refreshing) {

            return;
        }

        isRefreshingRef.current = true;
        setRefreshing(true);

        setSearchQuery('');

        setSearchResults([]);
        setSearchTriggered(false);
        setLastEvaluatedKey(null);
        setservices([]);

        await new Promise((resolve) => setTimeout(resolve, 100));

        await fetchservices();

        setRefreshing(false);

        setTimeout(() => {
            isRefreshingRef.current = false;
        }, 5000);
    };




    const handleAddservice = (service) => {
        setTimeout(() => {
            navigation.navigate('ServiceDetails', { service_id: service.service_id, company_id: service.company_id });

        }, 300);
    };

    const renderItem = ({ item, index }) => (
        <TouchableOpacity activeOpacity={1} onPress={() => handleAddservice(item)}>

            <View style={styles.card} activeOpacity={1} >
                <View style={styles.productImageContainer}>

                    {imageUrls[item.service_id] ? (
                        <Image source={{ uri: imageUrls[item.service_id] }} style={styles.productImage} />
                    ) : (
                        <View style={styles.productImagePlaceholder} />
                    )}
                </View>

                <View style={styles.cardContent}>
                    <View>
                        {/* <Text numberOfLines={1} style={styles.title}>{item.title || ' '}</Text> */}
                        <Text numberOfLines={1} style={styles.title}>{highlightMatch(item?.title || '', searchQuery)}</Text>
                        <Text numberOfLines={1} style={styles.description}>{highlightMatch(item?.description || '', searchQuery)}</Text>
                        <Text numberOfLines={1} style={styles.company}>{highlightMatch(item?.company_name || '', searchQuery)}</Text>

                        {/* <Text numberOfLines={1} style={styles.description}>{item.description || ' '}</Text>
                        <Text numberOfLines={1} style={styles.company}>{item.company_name || ' '}</Text> */}
<View style={styles.priceRow}>
  <Text numberOfLines={1} style={styles.price}>
    ₹ {item.price !== undefined && item.price !== null && item.price !== '' ? item.price : "Undefined"}
  </Text>
</View>

                    </View>

                    <TouchableOpacity style={styles.productDetailsContainer} onPress={() => handleAddservice(item)} activeOpacity={1}>
                        <Text numberOfLines={1} style={styles.productDetailsText}>View details</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );



    const renderFooter = () => loadingMore ? <ActivityIndicator size="large" color="#075cab" style={{ marginVertical: 10 }} /> : null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={AppStyles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#075cab" />
                </TouchableOpacity>
                <View style={AppStyles.searchContainer}>
                    <View style={AppStyles.inputContainer}>
                        <TextInput
                            style={AppStyles.searchInput}
                            placeholder="Search"
                            placeholderTextColor="gray"
                            value={searchQuery}
                            onChangeText={handleDebouncedTextChange}

                        />
                        {searchQuery.trim() !== '' ? (
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchQuery('');
                                    setSearchTriggered(false);
                                    setSearchResults([]);


                                }}
                                style={AppStyles.iconButton}
                            >
                                <Icon name="close-circle" size={20} color="gray" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity

                                style={AppStyles.searchIconButton}
                            >
                                <Icon name="magnify" size={20} color="#075cab" />
                            </TouchableOpacity>

                        )}
                    </View>

                </View>
            </View>


            {!loading ? (
                <FlatList
                    data={!searchTriggered || searchQuery.trim() === '' ? services : searchResults}
                    renderItem={renderItem}
                    onScrollBeginDrag={() => {
                        Keyboard.dismiss();
                        searchInputRef.current?.blur?.();

                    }}
                    ref={scrollViewRef}
                    keyboardShouldPersistTaps="handled"
                    keyExtractor={(item, index) => `${item.service_id}-${index}`}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.flatListContainer}
                    onEndReached={() => lastEvaluatedKey && fetchservices(lastEvaluatedKey)}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        (searchTriggered && searchResults.length === 0) ? (
                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <Text style={{ fontSize: 16, color: '#666' }}>No services found</Text>
                            </View>
                        ) : null
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#075cab']} />
                    }
                    ListHeaderComponent={
                        <View>
                            {!loading && searchQuery.trim() !== '' && searchResults.length > 0 && (
                                <Text style={styles.companyCount}>
                                    {searchResults.length} results found
                                </Text>
                            )}
                        </View>
                    }
                />
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={'#075cab'} size="large" />
                </View>
            )}


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
        elevation: 5,
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

    container: {
        flex: 1,
        backgroundColor: 'whitesmoke',
    },

    flatListContainer: {
        paddingBottom: '20%',

    },
company: {
        fontSize: 15,
        fontWeight: '500',
        color: '#000',
        textAlign: 'center',
        marginTop: 2,
        alignSelf: 'flex-start',
    },
    companyCount: {
        fontSize: 13,
        fontWeight: '400',
        color: 'black',
        padding: 5,
    },

    category: {
        fontSize: 15,
        fontWeight:'500',
        color: '#000',
        marginTop: 2,
    },

    discountPrice: {
        textDecorationLine: 'line-through',
        marginLeft: 8,
        color: 'red',
        fontSize: 14,
    },
    loaderContainer: {
        backgroundColor: 'whitesmoke',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        flex: 1,
    },
    noProductsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // padding: 20,
    },
    noProductsText: {
        fontSize: 18,
        color: 'black',
        textAlign: 'center',
    },

    offer: {
        color: 'green',
        marginLeft: 8,
        fontWeight: '700',
        fontSize: 14,
    },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'whitesmoke',

    },
    backButton: {
        alignSelf: 'center',
        padding: 10
    },


    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        marginHorizontal: 10,
    },

    productImageContainer: {
        flex: 1.2, // Shares space equally with cardContent
        maxWidth: 140, // Restricts width to avoid overflow
        alignSelf: 'center',

    },

    productImage: {
        width: 120,
        height: 140, // Ensures it fills the container
        backgroundColor: '#fafafa',
        resizeMode: 'contain',
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        alignSelf: 'center',

    },

    cardContent: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 10,
        marginVertical: 5,
        alignItems: 'flex-start',

    },

    title: {
        fontSize: 15,
        fontWeight: '500',
        color: '#000',

    },

    description: {
        fontSize: 15,
       
        color: '#777',
        marginTop: 4,
    },

    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    price: {
        fontSize: 15,
        fontWeight: '500',
        color: 'black'
    },
    separator: {

        margin: 2,
        width: '98%',
        borderWidth: 0.5,
        borderColor: '#ddd',
    },

    productDetailsContainer: {
        marginTop: 0,

    },

    productDetailsText: {
        fontSize: 15,
        color: '#075cab',
        fontWeight: '500',
    },
    filterContainer: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '80%',
        backgroundColor: '#fff',
        zIndex: 100,
        elevation: 10,
        padding: 16,
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },


    buttonWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        marginTop: -5
    },

    applyButton: {
        width: 80,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#075cab',
        // borderWidth: 1,
        // backgroundColor: '#075cab',
        // elevation: 2,
        // shadowColor: '#000',
        // shadowOpacity: 0.1,
        // shadowRadius: 6,
        // shadowOffset: { width: 0, height: 3 },
    },

    applyButtonText: {
        color: '#075cab',
        fontWeight: '600',
        fontSize: 14,
    },

    clearButton: {
        width: 80,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#FF3B30',
        // borderWidth: 1,
        // backgroundColor: 'white',
        // elevation: 2,
        // shadowColor: '#000',
        // shadowOpacity: 0.1,
        // shadowRadius: 6,
        // shadowOffset: { width: 0, height: 3 },
    },

    clearButtonText: {
        color: '#FF0000',
        fontWeight: '600',
        fontSize: 14,
    },

    divider: {
        borderBottomWidth: 0.5,
        borderBottomColor: "#ccc",
        marginVertical: 10,
    },

    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },

    checkbox: {
        width: 13,
        height: 13,
        // borderRadius: 6,
        borderWidth: 1,
        borderColor: 'gray',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    checkboxChecked: {
        backgroundColor: '#075cab',
    },

    checkboxLabel: {
        fontSize: 12,
        color: '#333',
    },


});





export default ServicesList;