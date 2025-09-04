import React, { useState, useEffect, useRef, useCallback } from "react";
import { StackActions, useNavigation, useRoute } from "@react-navigation/native";
import { View, Text, TextInput, Image, ScrollView, SafeAreaView, StyleSheet, TouchableOpacity, Alert, Keyboard, ActivityIndicator, } from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Video from "react-native-video";
import { launchImageLibrary } from "react-native-image-picker";
import ImageResizer from 'react-native-image-resizer';
import * as Compressor from 'react-native-compressor';
import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CustomDropdown from '../../components/CustomDropDown';
import { after_sales_service, applications, availability, certifications, installation_support, operation_mode, power_supply, product_category, products, types } from '../../assets/Constants';
import DocumentPicker from 'react-native-document-picker';
import Message3 from "../../components/Message3";
import { showToast } from "../AppUtils/CustomToast";
import { EventRegister } from "react-native-event-listeners";
import apiClient from "../ApiClient";
import AppStyles from "../AppUtils/AppStyles";
import { useMediaPicker } from "../helperComponents/MediaPicker";

const BASE_API_URL = 'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev';
const API_KEY = 'k1xuty5IpZ2oHOEOjgMz57wHfdFT8UQ16DxCFkzk';


const EditService = () => {
    const route = useRoute();
    const { product } = route.params;
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const [newProducts, setNewProducts] = useState([]);
    const [selectedState, setSelectedState] = useState(product?.category || "");
    const [selectedCity, setSelectedCity] = useState(product?.subcategory || "");
    const [removedFiles, setRemovedFiles] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [initialProductData] = useState(productData);
    const [submitting, setSubmitting] = useState(false);

    const state = Object.keys(products);
    const cities = selectedState && products[selectedState] ? products[selectedState] : [];

    useEffect(() => {
        setSelectedState(product.category || "");
        setSelectedCity(product.subcategory || "");
    }, [product]);


    const handleStateSelect = (item) => {

        if (selectedState !== item) {
            setSelectedState(item);
            setSelectedCity("");
            handleInputChange("category", item);
        }
    };

    const handleCitySelect = (item) => {

        setSelectedCity(item);
        handleInputChange("subcategory", item);
    };


    const initialProductDataRef = useRef(productData);

    const [productData, setProductData] = useState({
        title: product?.title?.trim() || '',
        description: product?.description?.trim() || '',
        price: product?.price?.toString().trim() || '',

        subcategory: product?.subcategory?.trim() || '',
        category: product?.category?.trim() || '',
        specifications: {
            warranty: product?.specifications?.warranty?.trim() || '',
        },
        accessories: product?.accessories?.trim() || '',
        status: 'Available',
        tags: product?.tags?.trim() || ''
    });

    useEffect(() => {
        initialProductDataRef.current = {
            title: product?.title?.trim() || '',
            description: product?.description?.trim() || '',
            price: product?.price?.toString().trim() || '',

            subcategory: product?.subcategory?.trim() || '',
            category: product?.category?.trim() || '',
            specifications: {
                warranty: product?.specifications?.warranty?.trim() || '',
            },
            accessories: product?.accessories?.trim() || '',
            status: 'Available',
            tags: product?.tags?.trim() || ''
        };

        setProductData(initialProductDataRef.current);
    }, [product]);

    const hasFieldChanged = (obj1, obj2) => JSON.stringify(obj1) !== JSON.stringify(obj2);

    useEffect(() => {
        setHasChanges(hasFieldChanged(productData, initialProductDataRef.current));
    }, [productData]);

    const hasUnsavedChanges = Boolean(hasChanges);
    const [pendingAction, setPendingAction] = React.useState(null);


    React.useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (!hasUnsavedChanges) return;

            e.preventDefault();

            setPendingAction(e.data.action);
            setShowModal(true);
        });

        return unsubscribe;
    }, [hasUnsavedChanges, navigation]);

    const handleLeave = () => {
        setHasChanges(false);
        setShowModal(false);

        if (pendingAction) {
            navigation.dispatch(pendingAction);
            setPendingAction(null);
        }
    };

    const handleStay = () => {
        setShowModal(false);
    };


    const handleInputChange = (field, value, isNested = false) => {
        if (typeof value === "string" && value.startsWith(" ")) {

            showToast("Leading spaces are not allowed", 'error');

            return;
        }

        let updatedValue = typeof value === "string" ? value.replace(/^\s+/, "") : value;
        if (field === "price") {
            const numericValue = value.replace(/\D/g, "");

            if (value !== numericValue) {
                showToast("Only numbers are allowed", 'error');

            }

            updatedValue = numericValue;
        }

        setProductData(prevData => {
            const updatedData = isNested
                ? {
                    ...prevData,
                    specifications: {
                        ...prevData.specifications,
                        [field]: updatedValue
                    }
                }
                : {
                    ...prevData,
                    [field]: updatedValue
                };

            return updatedData;
        });
    };









    const [images, setImages] = useState(product.images || []);
    const [videos, setVideos] = useState(product.videos || []);
    const [files, setFiles] = useState(product.files || []);
    const [newFiles, setNewFiles] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [newVideos, setNewVideos] = useState([]);
    const [removedMedia, setRemovedMedia] = useState([]);
    const [signedUrls, setSignedUrls] = useState({});


    const {
        showMediaOptions,
        pickImage,
        pickVideo,
        isCompressing,
        overlayRef,
    } = useMediaPicker({
        onMediaSelected: (file, meta, previewThumbnail) => {
            if (!file || !file.type) return;

            // Route based on file type
            if (file.type.startsWith('image/')) {
                setNewImages((prev) => {
                    if (prev.length >= 4) return prev;
                    return [...prev, file];
                });
            } else if (file.type.startsWith('video/')) {
                setNewVideos((prev) => {
                    if (prev.length >= 1) return prev;
                    return [...prev, file];
                });
            } else if (file.type === 'application/pdf') {
                setNewFiles(file);
            }

        },
        includeDocuments: true, // Allow PDF upload now
        includeCamera: false,
        mediaType: 'mixed',
        maxImageSizeMB: 5,
        maxVideoSizeMB: 10,
    });

    useEffect(() => {
        const fetchSignedUrls = async () => {
            const imageUrls = await fetchMediaUrls(images);
            const videoUrls = await fetchMediaUrls(videos);

            const urlsMap = {};
            images.forEach((key, index) => (urlsMap[key] = imageUrls[index]));
            videos.forEach((key, index) => (urlsMap[key] = videoUrls[index]));

            setSignedUrls(urlsMap);
        };

        fetchSignedUrls();
    }, []);

    const fetchMediaUrls = async (mediaKeys) => {
        if (!mediaKeys || mediaKeys.length === 0) return [];

        try {
            const mediaUrls = await Promise.all(
                mediaKeys.map(async (key) => {
                    try {
                        const response = await axios.post(
                            `${BASE_API_URL}/getObjectSignedUrl`,
                            { command: 'getObjectSignedUrl', key },
                            { headers: { 'x-api-key': API_KEY } }
                        );
                        return response.data || null;
                    } catch (error) {

                        return null;
                    }
                })
            );
            return mediaUrls.filter(Boolean);
        } catch (error) {

            return [];
        }
    };

    const handleRemoveMedia = (type, index) => {
        if (type === "image") {
            if (index < images.length) {
                // Removing existing image
                const removed = images[index];
                setRemovedMedia((prev) => [...prev, removed]);
                setImages(images.filter((_, i) => i !== index));
            } else {
                // Removing newly selected image
                const newIndex = index - images.length;
                setNewImages((prev) => prev.filter((_, i) => i !== newIndex));
            }
        } else if (type === "video") {
            if (index < videos.length) {
                // Removing existing video
                const removed = videos[index];
                setRemovedMedia((prev) => [...prev, removed]);
                setVideos(videos.filter((_, i) => i !== index));
            } else {
                // Removing newly selected video
                const newIndex = index - videos.length;
                setNewVideos((prev) => prev.filter((_, i) => i !== newIndex));
            }
        }

    };


    useEffect(() => {

    }, [removedMedia]);



    const selectPDF = async () => {
        try {
            // Prevent selecting more than one PDF
            if ([...files, ...newFiles].length >= 1) {
                showToast("You can only upload 1 PDF", 'info');

                return;
            }

            const res = await DocumentPicker.pick({
                type: [DocumentPicker.types.pdf],
            });

            if (res[0].size > 5 * 1024 * 1024) {
                return showToast("Image size shouldn't exceed 5MB", 'error');

            }


            setNewFiles([{ uri: res[0].uri, name: res[0].name, size: res[0].size }]);


        } catch (error) {
            if (!DocumentPicker.isCancel(error)) {

            }
        }
    };






    const uploadFileToS3 = async (fileUri, fileType) => {
        if (!fileUri || typeof fileUri !== "string") {

            return null;
        }

        try {
            const filePath = fileUri.startsWith("file://") ? fileUri.replace("file://", "") : fileUri;
            const fileStat = await RNFS.stat(filePath);
            const fileSize = fileStat.size;

            const res = await apiClient.post('/uploadFileToS3', {
                command: 'uploadFileToS3',
                headers: {
                    'Content-Type': fileType,
                    'Content-Length': fileSize,
                },
            });

            if (res.data.status === 'success') {
                const uploadUrl = res.data.url;
                const fileKey = res.data.fileKey;

                const fileBlob = await uriToBlob(fileUri);


                const uploadRes = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': fileType },
                    body: fileBlob,
                });

                if (uploadRes.status === 200) {

                    return fileKey;
                } else {
                    const errorText = await uploadRes.text();

                    throw new Error(`S3 Upload failed with status ${uploadRes.status}`);
                }
            } else {
                throw new Error(res.data.errorMessage || 'Failed to get upload URL');
            }
        } catch (error) {

            showToast("Upload failed", 'error');
            return null;
        }
    };




    const handleDeleteOldImage = async (productId, fileKey) => {

        if (!fileKey || typeof fileKey !== "string" || fileKey === "0") {

            return;
        }
        try {

            const response = await apiClient.post('/deleteFileFromS3', {
                command: 'deleteFileFromS3',
                key: fileKey,
            });


            if (response.data.statusCode === 200) {
                setNewProducts((prevProducts) =>
                    prevProducts.map((product) =>
                        product.service_id === productId
                            ? { ...product, images: product.images?.filter((img) => img !== fileKey) || [] }
                            : product
                    )
                );
            } else {
                throw new Error(`Failed to delete image: ${response.data.message || "Unknown error"}`);
            }
        } catch (error) {

            showToast("Failed to upload image", 'error');

        }
    };

    const handleRemoveFile = (index) => {
        if (index < files.length) {

            setRemovedFiles((prev) => [...prev, files[index]]);
            setFiles(files.filter((_, i) => i !== index));
        } else {
            // Removing a newly selected file
            setNewFiles([]);
        }
    };


    const handleSubmit = async () => {
        setSubmitting(true); // Immediately reflect UI changes
        try {
            const requiredFields = [
                { key: "title", label: "Title" },
                { key: "description", label: "Description" },
                { key: "category", label: "Category" },
                { key: "subcategory", label: "Subcategory" },
            ];

            for (let field of requiredFields) {
                const keys = field.key.split(".");
                let value = productData;

                for (let key of keys) {
                    value = value[key] ?? "";
                }

                value = typeof value === "string" ? value.trim() : value;

                if (!value) {
                    showToast(`${field.label} is mandatory.`, "info");
                    setSubmitting(false);
                    return;
                }
            }

            const existingImages = (product.images || []).filter(
                (img) => !removedMedia.includes(img)
            );

            if (existingImages.length + newImages.length === 0) {
                showToast("Please upload at least one image for the service", "info");
                setSubmitting(false);
                return;
            }

            if (removedMedia.length > 0) {
                await Promise.all(
                    removedMedia.map((fileKey) =>
                        handleDeleteOldImage(product.service_id, fileKey)
                    )
                );
                setRemovedMedia([]);
            }

            showToast("Uploading media...", "info");

            // Directly upload without compression
            const uploadedImages = await Promise.all(
                newImages.map((img) => uploadFileToS3(img.uri, "image/jpeg"))
            );
            const uploadedVideos = await Promise.all(
                newVideos
                    .filter(Boolean)
                    .map((vid) => uploadFileToS3(vid.uri, "video/mp4"))
            );
            const uploadedFiles = await Promise.all(
                newFiles.map((file) => uploadFileToS3(file.uri, "application/pdf"))
            );

            const finalFiles = [
                ...(product.files || []).filter((file) => !removedFiles.includes(file)),
                ...uploadedFiles.filter(Boolean),
            ];

            const finalImages = [
                ...(product.images || []).filter((img) => !removedMedia.includes(img)),
                ...uploadedImages.filter(Boolean),
            ];

            const finalVideos = [
                ...(product.videos || []).filter((vid) => !removedMedia.includes(vid)),
                ...uploadedVideos.filter(Boolean),
            ];

            const trimStrings = (obj) => {
                if (typeof obj === "string") return obj.trim();
                if (Array.isArray(obj)) return obj.map(trimStrings);
                if (typeof obj === "object" && obj !== null) {
                    return Object.fromEntries(
                        Object.entries(obj).map(([key, value]) => [key, trimStrings(value)])
                    );
                }
                return obj;
            };

            setLoading(true);

            const requestBody = {
                command: "updateService",
                service_id: product.service_id,
                company_id: product.company_id,
                ...trimStrings(productData),
                images: finalImages,
                videos: finalVideos,
                files: finalFiles,
            };

            const response = await apiClient.post("/updateService", requestBody);

            if (response.data.status === "success") {
                setHasChanges(false);
                setNewImages([]);
                setNewVideos([]);
                EventRegister.emit("onProductUpdated", {
                    updatedProduct: {
                        service_id: product.service_id,
                        ...requestBody,
                    },
                });

                showToast("Service updated successfully", "success");
                navigation.goBack();
            } else {
                throw new Error(response.data.errorMessage || "Failed to update product");
            }
        } catch (error) {
            showToast("Update failed", "error");
            console.log("error", error);
        } finally {
            setLoading(false);
            setSubmitting(false);
            setHasChanges(false);
        }
    };




    const uriToBlob = async (uri) => {
        const response = await fetch(uri);
        return await response.blob();
    };

    const filteredImages = [...images, ...newImages].filter(item => {
        const imageUri = item?.uri || signedUrls[item] || null;
        return imageUri && !(imageUri.endsWith(".mp4") || imageUri.includes("video"));
    });

    const finalFiles = [
        ...(product.files || []).filter(file => !removedFiles.includes(file)), // Keep old files
        ...newFiles.filter(Boolean) // Add new files
    ];


    const filteredVideos = [...videos, ...newVideos].filter(item => {
        const videoUri = typeof item === "string" ? signedUrls[item] : item?.uri;

        if (!videoUri || typeof videoUri !== "string") {
            return false;
        }

        return videoUri.endsWith(".mp4") || videoUri.includes("video");
    });



    return (

        <SafeAreaView style={styles.container} >
            <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={24} color="#075cab" />
            </TouchableOpacity>
            </View>
            
            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1, backgroundColor: "#f8f9fa", paddingHorizontal: 10, }}
                keyboardShouldPersistTaps="handled"
                extraScrollHeight={20}
                onScrollBeginDrag={() => Keyboard.dismiss()}
                showsVerticalScrollIndicator={false}>



                <Text style={styles.title}>Edit a service</Text>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Service name <Text style={{ color: 'red' }}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        placeholderTextColor="gray"
                        multiline={true}
                        textBreakStrategy="simple"
                        value={productData.title}
                        onChangeText={(text) => handleInputChange("title", text)}
                    />
                </View>

                <View style={[styles.inputContainer]}>
                    <Text style={styles.label}>Service description <Text style={{ color: 'red' }}>*</Text></Text>
                    <TextInput
                        style={[styles.input]}
                        value={productData.description}
                        multiline={true}
                        textBreakStrategy="simple"
                        placeholderTextColor="gray"
                        onChangeText={(text) => handleInputChange("description", text)}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Price:</Text>
                    <TextInput
                        style={styles.input}
                        placeholderTextColor="gray"
                        keyboardType="numeric"
                        value={productData.price}
                        multiline={true}
                        textBreakStrategy="simple"
                        onChangeText={(text) => handleInputChange("price", text)}
                    />
                </View>

                <View style={[styles.inputContainer, { marginBottom: 0 }]}>
                    <Text style={styles.label}>Category <Text style={{ color: 'red' }}>*</Text></Text>
                    <CustomDropdown

                        data={state}
                        selectedItem={selectedState}
                        setSelectedItem={setSelectedState}
                        onSelect={handleStateSelect}
                        buttonStyle={styles.dropdownButton}
                        buttonTextStyle={styles.dropdownButtonText}
                    />
                </View>

                <View style={[styles.inputContainer, { marginBottom: 0 }]}>
                    <Text style={styles.label}>Sub category <Text style={{ color: 'red' }}>*</Text></Text>
                    <CustomDropdown
                        data={cities}
                        onSelect={handleCitySelect}
                        selectedItem={selectedCity}
                        setSelectedItem={setSelectedCity}
                        disabled={!selectedState}
                        buttonStyle={styles.dropdownButton}
                        buttonTextStyle={styles.dropdownButtonText}
                    />
                </View>


                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Warranty:</Text>
                    <TextInput
                        style={[styles.input]}
                        placeholderTextColor='gray'

                        multiline={true}  // Allows text to wrap to the next line
                        textBreakStrategy="simple"
                        value={productData.specifications.warranty}
                        onChangeText={(text) => handleInputChange('warranty', text, true)}
                    />
                </View>



                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Tags <Text style={{ color: 'red' }}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={productData.tags}
                        placeholderTextColor='gray'
                        onChangeText={(text) => handleInputChange('tags', text)}
                    />

                </View>

                <View>

                    <TouchableOpacity style={styles.addMediaButton}>
                        <Text style={styles.addMediaText}>
                            Upload service image <Text style={{ color: 'red' }}>*</Text>
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.mediaContainer}>
                        {/* Loop through selected images, limited to a maximum of 4 */}
                        {filteredImages.slice(0, 4).map((item, index) => {
                            const imageUri = item?.uri || signedUrls[item] || null;
                            if (!imageUri) return null;

                            return (
                                <View key={imageUri} style={styles.mediaWrapper}>
                                    <Image source={{ uri: imageUri }} style={styles.mediaPreview} />
                                    <TouchableOpacity
                                        style={styles.closeIcon}
                                        onPress={() => handleRemoveMedia("image", index)}
                                    >
                                        <Icon name="close" size={20} color="gray" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}

                        {/* Show a single "Upload Image" placeholder if there's space left */}
                        {filteredImages.length < 4 && (
                            <TouchableOpacity style={styles.placeholder} onPress={pickImage}>
                                <Text style={styles.placeholderText}>
                                    Upload Image ({4 - filteredImages.length} remaining)
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>


                    <View>

                        <TouchableOpacity style={styles.addMediaButton}>
                            <Text style={styles.addMediaText}>Upload service video</Text>
                        </TouchableOpacity>


                        <View style={styles.mediaContainer}>
                            {filteredVideos.length > 0 ? (
                                filteredVideos.map((item, index) => {
                                    const videoUri = item?.uri || signedUrls[item] || null;
                                    if (!videoUri) return null;

                                    return (
                                        <View key={`video-${index}`} style={styles.mediaWrapper}>
                                            <Video
                                                source={{ uri: videoUri }}
                                                style={styles.mediaPreview}
                                                controls={false}
                                                muted
                                                resizeMode="cover"
                                            />
                                            <TouchableOpacity
                                                style={styles.closeIcon}
                                                onPress={() => handleRemoveMedia("video", index)}
                                            >
                                                <Icon name="close" size={20} color="gray" />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })
                            ) : (
                                <TouchableOpacity style={styles.placeholder} onPress={pickVideo}>
                                    <Text style={styles.placeholderText}>Upload Video</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                    </View>

                    <View>
                        {/* Button to select PDF */}
                        <TouchableOpacity onPress={selectPDF} style={styles.addMediaButton}>
                            <Text style={styles.addMediaText}>Upload service catalogue</Text>
                        </TouchableOpacity>

                        {/* Display Existing & Selected PDFs */}
                        <View style={[styles.mediaContainer, {}]}>
                            {[...files, ...newFiles].length > 0 ? (
                                [...files, ...newFiles].map((file, index) => (
                                    <View key={index} style={[styles.mediaWrapper, { padding: 20 }]}>
                                        <Icon name="file-document-outline" size={50} color="black" />

                                        {/* Display file name if available */}
                                        <Text style={[styles.fileName, { marginTop: 5 }]}>{file?.name || "Selected File"}</Text>

                                        {/* Remove button */}
                                        <TouchableOpacity onPress={() => handleRemoveFile(index)} style={styles.closeIcon}>
                                            <Icon name="close" size={24} color="gray" />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            ) : (
                                <TouchableOpacity style={styles.placeholder} onPress={selectPDF}>
                                    {/* <Ionicons name="add" size={30} color="gray" /> */}
                                    <Text style={styles.placeholderText}>Upload PDF</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                </View>



                <TouchableOpacity
                    style={[AppStyles.Postbtn, (isCompressing || submitting) && { opacity: 0.5 }]}
                    onPress={handleSubmit}
                    disabled={isCompressing || submitting}
                >
                    {(isCompressing || submitting) ? (
                        <ActivityIndicator size="small" />
                    ) : (
                        <Text style={AppStyles.PostbtnText}>Update</Text>
                    )}
                </TouchableOpacity>


            </KeyboardAwareScrollView>

            <Message3
                visible={showModal}
                onClose={() => setShowModal(false)}
                onCancel={handleStay}
                onOk={handleLeave}
                title="Are you sure ?"
                message="Your updates will be lost if you leave this page. This action cannot be undone."
                iconType="warning"
            />
            <Toast />
        </SafeAreaView>

    );
};


const formatKey = (key) => key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",

    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'whitesmoke',
    },
    addMediaButton: {
        // width: "100%",
        padding: 12,
        // backgroundColor: "#e0e0e0",
        borderRadius: 10,
        alignItems: "flex-start",
        justifyContent: "flex-start",
        marginVertical: 8,
        // borderWidth: 1,
        // borderColor: "#ccc",
        alignSelf: 'flex-start'

    },
    addMediaText: {
        fontSize: 15,
        color: "#000",
        fontWeight: "500",
        alignSelf: 'flex-start'
    },
    inputContainer: {
        marginBottom: 15,
    },
    backButton: {
        alignSelf: 'flex-start',
        padding: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: '#f0f0f0'
      },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 10,
    },
    inputContainer1: {
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
    },
    inputWrapper: {
        marginBottom: 10,
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 5,
        color: '#000',
    },
    input: {
        minHeight: 50,
        maxHeight: 150,
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        borderRadius: 8,
        fontSize: 16,
        color: '#222',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginVertical: 10,
        color: "#075cab",
    },
    mediaContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    mediaWrapper: {
        position: "relative",
        marginRight: 10,
        marginBottom: 10,
    },
    mediaPreview: {
        width: 100,
        height: 100,
        borderRadius: 10,
        backgroundColor: "#ddd",
    },
    videoPlaceholder: {
        width: 100,
        height: 100,
        backgroundColor: "#ccc",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
    },
    placeholder: {
        width: 100,
        height: 100,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        margin: 5,
    },
    placeholderText: {
        color: '#888',
        fontSize: 14,
    },
    videoText: {
        fontSize: 12,
        color: "#555",
    },
    closeIcon: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fff',
        borderRadius: 12,
        width: 26,
        height: 26,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 3,
    },
    noMediaText: {
        fontSize: 14,
        color: "#888",
        textAlign: "center",
        width: "100%",
        marginVertical: 10,
    },
    fileWrapper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ccc",
    },
    removeButton: {
        padding: 5,
    },
    placeholderContainer: {
        alignItems: "center",
        padding: 20,
    },

    dropdownButton: {
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    textInput: {
        height: 40,
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        borderRadius: 8,
        fontSize: 15,
        color: '#222',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
        marginTop: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 25,
        textAlign: 'center',
        color: '#075cab',
        top: 10,
    },

    dropdownButtonText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#333',
    },

});

export default EditService;
