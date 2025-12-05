import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import apiClient from '../ApiClient';
import Message from '../../components/Message';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import Delete from '../../assets/svgIcons/delete.svg';

import { colors, dimensions } from '../../assets/theme.jsx';
import { commonStyles } from '../AppUtils/AppStyles.js';

const MyEnqueries = () => {
    const { myId, myData } = useNetwork();
    const navigation = useNavigation();
    const [enquiredServices, setEnquiredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revokingId, setRevokingId] = useState(null);
    const [imageUrls, setImageUrls] = useState({});


    const revokeEnquiry = async (service_id, enquiry_fileKey) => {
        setRevokingId(service_id);
        try {
            if (enquiry_fileKey && typeof enquiry_fileKey === 'string' && enquiry_fileKey !== '0') {
                try {

                    const res = await apiClient.post('/deleteFileFromS3', {
                        command: 'deleteFileFromS3',
                        key: enquiry_fileKey,
                    });

                } catch (fileErr) {

                    showToast('Failed to delete enquiry file', 'error');
                }
            }

            const response = await apiClient.post('/revokeEnquiry', {
                command: 'revokeEnquiry',
                user_id: myId,
                service_id: service_id,
            });

            if (response.data.status === 'success') {
                showToast('Enquiry revoked successfully', 'success');
                setEnquiredServices(prev =>
                    prev.filter(item => item.service_id !== service_id)
                );
            } else {
                showToast(response.data.errorMessage || 'Could not revoke enquiry.', 'error');
            }
        } catch (error) {
            if (error?.message?.includes('Network')) {
                showToast("You don't have internet connection", 'error');
            } else {
                showToast('Something went wrong', 'error');
            }
        } finally {
            setRevokingId(null);
        }
    };




    const fetchEnquiredServices = async () => {
        if (!myId) return;

        setLoading(true);

        try {
            const response = await apiClient.post("/getEnquiredServices", {
                command: 'getEnquiredServices',
                user_id: myId,
            });

            if (response.data.status === "success") {
                const posts = response.data.response || [];

                if (posts.length === 0) {
                    setEnquiredServices({ removed_by_author: true });
                } else {
                    setEnquiredServices(posts);

                    const urlsObject = {};
                    await Promise.all(
                        posts.map(async (post) => {
                            if (post.enquiry_fileKey) {
                                try {
                                    const res = await fetch(
                                        "https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/getObjectSignedUrl",
                                        {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                                'x-api-key': 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk',
                                            },
                                            body: JSON.stringify({
                                                command: "getObjectSignedUrl",
                                                key: post.enquiry_fileKey,
                                            }),
                                        }
                                    );
                                    const img_url = await res.json();
                                    if (img_url) {
                                        urlsObject[post.service_id] = img_url;
                                    }
                                } catch (error) {
                                    console.warn("Error getting signed URL for post:", error);
                                }
                            }
                        })
                    );

                    setImageUrls(urlsObject);
                }

            } else {
                setEnquiredServices({ removed_by_author: true });
            }

        } catch (error) {
            console.error("Failed to fetch enquired services:", error);
            setEnquiredServices({ removed_by_author: true });

        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchEnquiredServices();
        }, 500);

        return () => clearTimeout(timeout);
    }, []);


    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState({
        serviceId: null,
        enquiry_fileKey: null,
    });

    const handleRevokePress = (serviceId, enquiry_fileKey) => {
        setDeleteTarget({ serviceId, enquiry_fileKey });
        setShowDeleteConfirmation(true);
    };

    const cancelDelete = () => {
        setDeleteTarget({ serviceId: null, enquiry_fileKey: null });
        setShowDeleteConfirmation(false);
    };

    const confirmRevoke = async () => {
        const { serviceId, enquiry_fileKey } = deleteTarget;
        setShowDeleteConfirmation(false);
        await revokeEnquiry(serviceId, enquiry_fileKey);
    };


    const ServiceDetails = (service_id, company_id) => {
        console.log('service_id, company_id', service_id, company_id)
        navigation.navigate("ServiceDetails", { service_id, company_id });
    };

    const EnquiryDetails = (enquiry_id) => {
        navigation.navigate("EnquiryDetails", { enquiryID: enquiry_id });
    };

    const renderItem = ({ item }) => {
        const formattedDate = new Date(item.enquired_on * 1000).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).replace(/\//g, '-');

        return (
            <TouchableOpacity
                activeOpacity={1} onPress={() => {
                    ServiceDetails(item?.service_id, item?.company_id);
                }} >
           
                    <View style={styles.textContainer}>

                        <View style={commonStyles.valContainer}>
                            <Text style={commonStyles.label}>Company name      </Text>
                            <Text style={commonStyles.colon}>:</Text>
                            <Text style={commonStyles.value}>{item?.company_name || ""}</Text>
                        </View>
                        <View style={commonStyles.valContainer}>
                            <Text style={commonStyles.label}>Service name      </Text>
                            <Text style={commonStyles.colon}>:</Text>
                            <Text style={commonStyles.value}>{item?.service_title || ""}</Text>
                        </View>
                        <View style={commonStyles.valContainer}>
                            <Text style={commonStyles.label}>Enquiry description      </Text>
                            <Text style={commonStyles.colon}>:</Text>
                            <Text style={commonStyles.value}>{item?.enquiry_description || ""}</Text>
                        </View>
                        <View style={commonStyles.valContainer}>
                            <Text style={commonStyles.label}>Enquired on      </Text>
                            <Text style={commonStyles.colon}>:</Text>
                            <Text style={commonStyles.value}>{formattedDate || ""}</Text>
                        </View>




                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => {
                                    EnquiryDetails(item?.enquiry_id,);
                                }} activeOpacity={1}>
                                <Text style={[styles.deleteButtonText, { color: '#075cab' }]}>
                                    View Enquiry
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleRevokePress(item.service_id, item.enquiry_fileKey)}
                                disabled={revokingId === item.service_id}
                                activeOpacity={1}
                            >
                                <Text style={styles.deleteButtonText}>
                                    {revokingId === item.service_id ? 'Revoke' : 'Revoke'}
                                </Text>
                            </TouchableOpacity>

                        </View>

                    </View>
          
            </TouchableOpacity>
        );

    };


    if (loading) {
        return (
            <View style={styles.container}>

                <View style={styles.headerContainer}>

                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                    </TouchableOpacity>

                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#075cab" />
                </View>
            </View>
        );
    }
    if (!enquiredServices || enquiredServices.length === 0 || enquiredServices?.removed_by_author) {
        return (
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, color: 'gray' }}>No enquiries available</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                </TouchableOpacity>
            </View>

            <FlatList
                data={enquiredServices}
                keyExtractor={(item) => item.enquiry_id}
                renderItem={renderItem}
            />

            {showDeleteConfirmation && (
                <Message
                    visible={showDeleteConfirmation}
                    onCancel={cancelDelete}
                    onOk={confirmRevoke}
                    title="Confirmation"
                    iconType="warning"
                    message="Are you sure you want to revoke this enquiry?"
                />
            )}
        </View>
    );

};


const styles = StyleSheet.create({
    noProductsText: {
        color: 'black',
        fontSize: 18,
        fontWeight: '400',
        padding: 10,
        textAlign: 'center'
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    textContainer: {
        marginBottom: 5,
        marginHorizontal: 5,
        backgroundColor: 'white',
        justifyContent: 'center',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#ddd',
        elevation:3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
        top: 5
    },
    productDetails: {
        flex: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        margin: 10,

    },

    documentContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        padding: 10,

    },
    backButton: {
        alignSelf: 'flex-start',
        padding: 10
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: '#f0f0f0'
    },

    title1: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    label: {
        flex: 1,
        color: 'black',
        fontWeight: '500',
        fontSize: 15,
        textAlign: 'left',
        alignSelf: 'flex-start',

    },

    colon: {
        width: 20, // Fixed width for the colon
        textAlign: 'center', // Center the colon
        color: 'black',
        fontWeight: '400',
        fontSize: 15,
        alignSelf: 'flex-start',
    },

    value: {
        flex: 2,
        flexShrink: 1,
        color: 'black',
        fontWeight: '400',
        fontSize: 14,
        textAlign: 'left',
        alignSelf: 'flex-start',

    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#ffffff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 2
    },
    deleteButtonText: {
        color: colors.danger,
    },
    imageContainer: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 15,
    },

    postContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        marginHorizontal: 10,
        backgroundColor: 'white',
        justifyContent: 'center',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#ddd',
        shadowColor: '#000',
        top: 5
    },
});

export default MyEnqueries;
