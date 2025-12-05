import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
    View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator,
    TextInput, RefreshControl, StyleSheet,
    Keyboard,

    TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useNavigationState, useScrollToTop } from '@react-navigation/native';
import apiClient from '../ApiClient';
import { useNetwork } from '../AppUtils/IdProvider';
import { showToast } from '../AppUtils/CustomToast';

import { EventRegister } from 'react-native-event-listeners';
import { useConnection } from '../AppUtils/ConnectionProvider';
import AppStyles from '../AppUtils/AppStyles';
import { getSignedUrl, highlightMatch, useLazySignedUrls } from '../helperComponents/signedUrls';
import { Image as FastImage } from 'react-native';
import BottomNavigationBar from '../AppUtils/BottomNavigationBar';
import scrollAnimations from '../helperComponents/scrollAnimations';
import Animated from "react-native-reanimated";
import Search from '../../assets/svgIcons/search.svg';
import Close from '../../assets/svgIcons/close.svg';
import Filter from '../../assets/svgIcons/filter.svg';
import Check from '../../assets/svgIcons/check-fill.svg';
import HomeBanner from '../Banners/homeBanner3.jsx';
import Company from '../../assets/svgIcons/company.svg';

import { colors, dimensions } from '../../assets/theme.jsx';

const JobListScreen = React.lazy(() => import('../Job/JobListScreen'));
const AllPosts = React.lazy(() => import('../Forum/Feed'));
const CompanySettingScreen = React.lazy(() => import('../Profile/CompanySettingScreen'));
const CompanyHomeScreen = React.lazy(() => import('../CompanyHomeScreen'));

const tabNameMap = {
    Home3: "Home",
    ProductsList: "Products",
    Feed: "Feed",
    Jobs: "Jobs",
    Settings: "Settings",
};


const tabConfig = [
    { name: "Home", component: CompanyHomeScreen, focusedIcon: 'home', unfocusedIcon: 'home-outline', iconComponent: Icon },
    { name: "Jobs", component: JobListScreen, focusedIcon: 'briefcase', unfocusedIcon: 'briefcase-outline', iconComponent: Icon },
    { name: "Feed", component: AllPosts, focusedIcon: 'rss', unfocusedIcon: 'rss-box', iconComponent: Icon },
    { name: "Products", component: ProductsList, focusedIcon: 'shopping', unfocusedIcon: 'shopping-outline', iconComponent: Icon },
    { name: "Settings", component: CompanySettingScreen, focusedIcon: 'cog', unfocusedIcon: 'cog-outline', iconComponent: Icon },
];

const ProductsList = () => {
    const searchInputRef = useRef(null);
    const navigation = useNavigation();
    const { isConnected } = useConnection();
    const { onScroll, headerStyle, bottomStyle } = scrollAnimations();

    const currentRouteName = useNavigationState((state) => {
        const route = state.routes[state.index];

        return route.name;
    });

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastEvaluatedKey, setLastEvaluatedKey] = useState(null);
    const [imageUrls, setImageUrls] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [searchResults, setSearchResults] = useState(false);
    const [searchTriggered, setSearchTriggered] = useState(false);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState({});
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [fetchLimit, setFetchLimit] = useState(20);

    const flatListRef = useRef(null);
    const scrollOffsetY = useRef(0);

    useEffect(() => {
        const handleProductCreated = async ({ newProduct }) => {

            let signedUrls = {};
            if (newProduct.images?.[0]) {
                signedUrls = await getSignedUrl(newProduct.product_id, newProduct.images[0]);
                setImageUrls((prev) => ({ ...prev, ...signedUrls }));
            }

            setProducts((prev) => [newProduct, ...(Array.isArray(prev) ? prev : [])]);

        };

        const handleProductUpdated = async ({ updatedProduct }) => {

            let signedUrls = {};
            if (updatedProduct.images?.[0]) {
                signedUrls = await getSignedUrl(updatedProduct.product_id, updatedProduct.images[0]);
                setImageUrls((prev) => ({ ...prev, ...signedUrls }));
            }

            setProducts((prevProducts) =>
                prevProducts.map((product) =>
                    product.product_id === updatedProduct.product_id
                        ? updatedProduct
                        : product
                )
            );

        };

        const handleProductDeleted = ({ deletedProductId }) => {
            setProducts((prevProducts) =>
                prevProducts.filter((product) => product.product_id !== deletedProductId)
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


    const clearFilters = () => {
        const hadFilters = Object.keys(selectedCategories).length > 0;

        setSelectedCategories({});
        setTempSelectedCategories({});

        if (hadFilters) {
            setSearchResults([]);
            setSearchTriggered(false);
            fetchProducts(); // fallback to all
        }
    };



    const applyFilters = () => {
        const selectedCategoryKeys = Object.keys(tempSelectedCategories).filter((key) => tempSelectedCategories[key]);

        setIsFilterOpen(false);

        // Clear search query when applying filters
        setSearchQuery('');

        if (selectedCategoryKeys.length === 0) {
            return;
        }

        setSearchResults([]);
        setSearchTriggered(false);

        setSelectedCategories(tempSelectedCategories);
        handleSearch('', tempSelectedCategories); // Pass empty string for text query
    };



    const handleFilterClick = () => {
        setTempSelectedCategories(selectedCategories); // clone only when panel opens
        setFilteredCategories(categories);
        setIsFilterOpen(prev => !prev);
        searchInputRef.current?.blur();
    };

    const [tempSelectedCategories, setTempSelectedCategories] = useState({});

    const toggleCheckbox = (category) => {
        setTempSelectedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const categories = [
        "3D Printing in Healthcare", "Biomedical Research Equipment", "Biomedical Sensors & Components",
        "Biomedical Testing Equipment", "Biotechnology & Life Sciences", "Healthcare & Hospital Services",
        "Healthcare IT & AI Solutions", "Hospital & Clinical Equipment", "Laboratory & Testing Equipment",
        "Medical Consumables & Disposables", "Medical Devices", "Medical Implants & Prosthetics",
        "Oxygen & Respiratory Care", "Rehabilitation & Assistive Devices"
    ];

    const withTimeout = (promise, timeout = 10000) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout)),
        ]);
    };

    const [companyCount, setCompanyCount] = useState(0);

    const fetchProducts = async (lastKey = null) => {
        if (!isConnected || loading || loadingMore) return;

        lastKey ? setLoadingMore(true) : setLoading(true);
        const startTime = Date.now();

        try {
            const requestData = {
                command: "getAllProducts",
                limit: fetchLimit,
                ...(lastKey && { lastEvaluatedKey: lastKey }),
            };

            const res = await withTimeout(apiClient.post('/getAllProducts', requestData), 10000);
            const newProducts = res?.data?.response || [];
            setCompanyCount(res.data.count);

            if (!newProducts.length) {
                setLastEvaluatedKey(null);
                return;
            }

            // ⏱️ Adjust fetchLimit based on response time
            const responseTime = Date.now() - startTime;
            if (responseTime < 400) {
                setFetchLimit(prev => Math.min(prev + 5, 10));
            } else if (responseTime > 1000) {
                setFetchLimit(prev => Math.max(prev - 2, 1));
            }

            // 🧠 Avoid duplicates
            setProducts(prev => {
                const existingIds = new Set(prev.map(p => p.product_id));
                const uniqueNew = newProducts.filter(p => !existingIds.has(p.product_id));
                return [...prev, ...uniqueNew];
            });

            setLastEvaluatedKey(res.data.lastEvaluatedKey || null);

        } catch (error) {
            // Optional: console.error('❌ fetchProducts error:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };


    const fetchProductImageUrls = async (products) => {
        const productsArray = Array.isArray(products) ? products : [products];
        const urlsObject = {};
        const startTime = Date.now();

        await Promise.all(
            productsArray.map(async (product) => {
                if (product.images?.length > 0) {
                    try {
                        const res = await getSignedUrl(product.product_id, product.images[0]);
                        const signedUrl = res?.[product.product_id];
                        if (signedUrl) {
                            urlsObject[product.product_id] = signedUrl;
                        }

                    } catch (error) {
                    }
                }
            })
        );

        const responseTime = Date.now() - startTime;

        if (responseTime < 500) {
            setFetchLimit((prev) => Math.min(prev + 5, 50));
        } else if (responseTime > 1200) {
            setFetchLimit((prev) => Math.max(prev - 2, 1));
        }

        setImageUrls((prev) => ({ ...prev, ...urlsObject }));
    };


    useEffect(() => {
        fetchProducts();
    }, [])




    const debounceTimeout = useRef(null);

    const handleDebouncedTextChange = useCallback((text) => {
        setSearchQuery(text);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            const trimmedText = text.trim();

            // Clear categories if text search is active
            if (trimmedText !== '') {
                setSelectedCategories({});
                setTempSelectedCategories({});
            }

            const shouldSearch = trimmedText !== '' || Object.values(selectedCategories).some(Boolean);

            if (!shouldSearch) {
                setSearchTriggered(false);
                setSearchResults([]);
                return;
            }

            handleSearch(trimmedText, trimmedText !== '' ? {} : selectedCategories);
        }, 300);
    }, [handleSearch, selectedCategories]);


    const {
        getUrlFor,
        onViewableItemsChanged,
        viewabilityConfig
    } = useLazySignedUrls(products, getSignedUrl, 5, {
        idField: 'product_id',
        fileKeyField: 'images[0]',
    });


    const handleSearch = async (text, selectedCategories = {}) => {
        if (!isConnected) {
            showToast('No internet connection', 'error');
            return;
        }

        setSearchQuery(text);

        const isTextEmpty = text.trim() === '';
        const selectedCategoryKeys = Object.keys(selectedCategories).filter(
            (key) => selectedCategories[key]
        );

        // If both search text and filters are empty, reset search
        if (isTextEmpty && selectedCategoryKeys.length === 0) {
            setSearchTriggered(false);
            setSearchResults([]);
            return;
        }

        // Determine which search mode to use (text or categories, but not both)
        const searchMode = !isTextEmpty ? 'text' :
            selectedCategoryKeys.length > 0 ? 'categories' :
                null;

        const requestData = {
            command: 'searchProducts',
            // Only include searchQuery if we're in text mode
            ...(searchMode === 'text' && { searchQuery: text.trim() }),
            // Only include categories if we're in categories mode
            ...(searchMode === 'categories' && { categories: selectedCategoryKeys }),
        };

        try {
            const res = await withTimeout(apiClient.post('/searchProducts', requestData), 10000);
            const products = res?.data?.response || [];

            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

            setSearchResults(products);
            setLastEvaluatedKey(null);
            fetchProductImageUrls(products);

        } catch (error) {
            console.error('[handleSearch] Error occurred during product search:', error);
            showToast('Something went wrong. Please try again.', 'error');
        } finally {
            setSearchTriggered(true);
        }
    };




    const refreshCooldown = useRef(false);

    const handleRefresh = async () => {

        if (!isConnected) {

            return;
        }
        if (refreshCooldown.current) return;

        refreshCooldown.current = true;
        setRefreshing(true);

        setSearchQuery('');

        setSearchTriggered(false);
        setSearchResults([]);
        setLastEvaluatedKey(null);
        if (products.length > 0) {
            setProducts([]);
        }
        setSelectedCategories({});

        await fetchProducts();

        setRefreshing(false);
        setTimeout(() => {
            refreshCooldown.current = false;
        }, 3000);
    };

    const handleSearchInputFocus = () => {
        if (isFilterOpen) {
            setIsFilterOpen(false); // close filter
        }
    };

    const handleAddProduct = (product) => { navigation.navigate('ProductDetails', { product_id: product.product_id, company_id: product.company_id }) };

    const renderItem = ({ item, index }) => {
        const imageUrl = getUrlFor(item.product_id);

        return (
            <TouchableOpacity activeOpacity={1} onPress={() => handleAddProduct(item)} >
                <View style={styles.card} >
                    <View style={styles.productImageContainer}>

                        <FastImage
                            source={ imageUrl ? { uri: imageUrl } : null }

                            style={styles.productImage}
                            onError={() => { }}
                        />
                    </View>

                    <View style={styles.cardContent}>

                        {/* <Text numberOfLines={1} style={styles.title}>{item.title || ' '}</Text>
                        <Text numberOfLines={1} style={styles.category}>{item.specifications.model_name || ' '}</Text>
                        <Text numberOfLines={1} style={styles.description}>{item.description || ' '}</Text> */}
                        <Text numberOfLines={1} style={styles.title}>{highlightMatch(item.title || '', searchQuery)}</Text>
                        <Text numberOfLines={1} style={styles.category}>{highlightMatch(item.specifications.model_name || '', searchQuery)}</Text>
                        <Text numberOfLines={2} style={styles.description}>{highlightMatch(item.description || '', searchQuery)}</Text>
                        {/* <Text numberOfLines={1} style={styles.companyName}>{highlightMatch(job.company_name || '', searchQuery)}</Text> */}
                        {/* <TouchableOpacity activeOpacity={0.8} style={styles.headerRow} >
                            <Company width={dimensions.icon.small} height={dimensions.icon.small} color={colors.secondary} />
                        </TouchableOpacity> */}
                        <Text style={styles.companyName} >{highlightMatch(item.company_name || '', searchQuery)}</Text>

                        <Text numberOfLines={1} style={styles.price}>
                            ₹ {item.price !== undefined && item.price !== null && item.price !== '' ? item.price : "N/A"}
                        </Text>
                        <Text numberOfLines={1} style={styles.productDetailsText}>View details</Text>

                    </View>
                </View>
            </TouchableOpacity>
        )
    };



    const renderFooter = () => loadingMore ? <ActivityIndicator size="large" color="#075cab" style={{ marginVertical: 10 }} /> : null;


    return (

        <View style={styles.container} >
            <Animated.View style={[AppStyles.headerContainer, headerStyle]}>
                {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#075cab" />
                </TouchableOpacity> */}
                <View style={AppStyles.searchContainer}>
                    <View style={AppStyles.inputContainer}>
                        <TextInput
                            style={AppStyles.searchInput}
                            placeholder="Search"
                            ref={searchInputRef}
                            placeholderTextColor="gray"
                            value={searchQuery}
                            onChangeText={handleDebouncedTextChange}
                            onFocus={handleSearchInputFocus}
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
                                <Close width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity

                                style={AppStyles.searchIconButton}
                            >
                                <Search width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                            </TouchableOpacity>

                        )}
                    </View>

                </View>
                {isConnected && (
                    <TouchableOpacity onPress={handleFilterClick} style={AppStyles.circle}>
                        <Filter width={dimensions.icon.ml} height={dimensions.icon.ml} color={colors.primary} />

                    </TouchableOpacity>
                )}
            </Animated.View>


            {!loading ? (
                <Animated.FlatList
                    data={searchTriggered ? searchResults : products}
                    renderItem={renderItem}
                    onScrollBeginDrag={() => {
                        Keyboard.dismiss();
                        searchInputRef.current?.blur?.();

                    }}
                    keyboardShouldPersistTaps="handled"
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    keyExtractor={(item, index) => `${item.product_id}-${index}`}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={AppStyles.scrollView}
                    onEndReached={() => {
                        if (lastEvaluatedKey && !loadingMore && !loading) {
                            fetchProducts(lastEvaluatedKey);
                        }
                    }}
                    ref={flatListRef}
                    onScroll={onScroll}

                    scrollEventThrottle={16}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    ListEmptyComponent={
                        (searchTriggered && searchResults.length === 0) ? (
                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <Text style={{ fontSize: 16, color: '#666' }}>No products found</Text>
                            </View>
                        ) : null
                    }
                    ListHeaderComponent={
                        <View>
                            <HomeBanner bannerId="productAd01" />
                            {searchTriggered && (
                                <>
                                    <Text style={styles.companyCount}>
                                        {searchTriggered && `${searchResults.length} products found`}
                                    </Text>

                                    {searchQuery && (
                                        <Text style={styles.companyCount}>
                                            Showing results for{" "}
                                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#075cab' }}>
                                                "{searchQuery}"
                                            </Text>
                                        </Text>
                                    )}
                                </>
                            )}
                        </View>
                    }

                    ListFooterComponent={
                        loadingMore ? (
                            <View style={{ paddingVertical: 20 }}>
                                <ActivityIndicator size="small" color="#075cab" />
                            </View>
                        ) : null
                    }

                />
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={'#075cab'} size="large" />
                </View>
            )}


            {isFilterOpen && (
                <View style={StyleSheet.absoluteFill}>
                    {/* Transparent overlay to detect outside touches */}
                    <TouchableWithoutFeedback onPress={() => setIsFilterOpen(false)}>
                        <View style={styles.overlay} />
                    </TouchableWithoutFeedback>

                    <View style={styles.filterContainer}>
                        {/* Filter content */}
                        <View style={styles.buttonWrapper}>
                            <TouchableOpacity onPress={applyFilters} style={styles.applyButton}>
                                <Text style={styles.applyButtonText}>Apply</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
                                <Text style={styles.clearButtonText}>Clear</Text>
                            </TouchableOpacity>
                        </View>


                        <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text_primary, paddingHorizontal: 15, marginVertical: 15 }}>Select Category </Text>
                        <View style={styles.divider} />

                        <FlatList
                            data={filteredCategories}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => toggleCheckbox(item)}
                                    style={styles.checkboxContainer}
                                >
                                    <View
                                        style={[
                                            styles.checkbox,
                                            tempSelectedCategories[item] && styles.checkboxChecked,
                                        ]}
                                    >
                                        {tempSelectedCategories[item] && (
                                            <Check
                                                width={dimensions.icon.small}
                                                height={dimensions.icon.small}
                                                color={colors.success}
                                            />
                                        )}
                                    </View>

                                    <Text
                                        style={[
                                            styles.checkboxLabel,
                                            tempSelectedCategories[item] && { color: colors.text_primary },
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                </TouchableOpacity>

                            )}
                            contentContainerStyle={{ paddingBottom: '20%', paddingHorizontal: 15 }}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            )}

            {!isFilterOpen && (
                <Animated.View style={[AppStyles.bottom, bottomStyle]}>

                    <BottomNavigationBar
                        tabs={tabConfig}
                        currentRouteName={currentRouteName}
                        navigation={navigation}
                        flatListRef={flatListRef}
                        scrollOffsetY={scrollOffsetY}
                        handleRefresh={handleRefresh}
                        tabNameMap={tabNameMap}
                    />
                </Animated.View>

            )}

        </View>

    );
};

const styles = StyleSheet.create({


    bottomNavContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 12,
        paddingBottom: 15,
        backgroundColor: '#fff',
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
        backgroundColor: colors.app_background
    },

    companyCount: {
        fontSize: 14,
        fontWeight: '400',
        color: 'black',
        padding: 5,
        paddingHorizontal: 15,
    },


    category: {
        color: colors.text_primary,
        fontWeight: '500',
        fontSize: 14,
        marginBottom: 5

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
        alignSelf: 'flex-start',
        padding: 10
    },


    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginBottom: 5,
        borderWidth: 1,
        borderColor: '#ddd',
    },

    productImageContainer: {
        flex: 1, // Shares space equally with cardContent
        maxWidth: 140, // Restricts width to avoid overflow
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 0.5,
        borderColor: '#eee',

    },

    productImage: {
        width: 110,
        height: 110, // Ensures it fills the container
        resizeMode: 'contain',

    },

    cardContent: {
        flex: 2,
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingTop: 15,
        alignItems: 'flex-start',

    },

    title: {
        color: colors.text_primary,
        fontWeight: '600',
        fontSize: 15,
        
    },

    description: {
        color: colors.text_secondary,
        fontWeight: '500',
        fontSize: 14,
        marginBottom: 5

    },

    companyName: {
        color: colors.text_primary,
        fontWeight: '500',
        fontSize: 14,
    

    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignItems: 'flex-start',
        

    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    price: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 15,

    },
    separator: {

        margin: 2,
        width: '98%',
        borderWidth: 0.5,
        borderColor: '#ddd',
    },



    productDetailsText: {
        fontSize: 14,
        color: '#075cab',
        fontWeight: '400',
        alignSelf: 'flex-end',
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
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },


    buttonWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: '#f1f6ff',
        zIndex: 10,
        elevation: 3,
    },

    applyButton: {
        flex: 1, // take half the width
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#fff',
        // borderTopLeftRadius: 10,
    },

    applyButtonText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 16,
    },

    clearButton: {
        flex: 1, // take half the width
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        // borderTopRightRadius: 10,
    },

    clearButtonText: {
        color: colors.danger,
        fontWeight: '600',
        fontSize: 16,
    },


    divider: {
        borderBottomWidth: 0.5,
        borderBottomColor: "#ccc",


    },

    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },

    checkbox: {
        width: 13,
        height: 13,
        // borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.text_secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    checkboxChecked: {
        backgroundColor: '#fff',
    },

    checkboxLabel: {
        color: colors.text_secondary,
        fontWeight: '500',
        fontSize: 14,
    },


});





export default ProductsList;
