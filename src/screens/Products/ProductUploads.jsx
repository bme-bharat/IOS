import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, ScrollView, StyleSheet, Image, TouchableOpacity, Keyboard, KeyboardAvoidingView, TouchableWithoutFeedback, ActivityIndicator, SafeAreaView, Platform, Linking } from 'react-native';
import Video from 'react-native-video';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import * as Compressor from 'react-native-compressor';
import Toast from 'react-native-toast-message';
import { TextInput } from 'react-native-gesture-handler';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomDropDownMenu from '../../components/DropDownMenu';
import { after_sales_service, applications, availability, certifications, installation_support, operation_mode, power_supply, product_category, products, types } from '../../assets/Constants';
import CustomDropdown from '../../components/CustomDropDown';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

import DocumentPicker from 'react-native-document-picker';
import Message3 from '../../components/Message3';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';
import { EventRegister } from 'react-native-event-listeners';
import AppStyles from '../AppUtils/AppStyles';
import Message1 from '../../components/Message1';
import apiClient from '../ApiClient';
import { useMediaPicker } from '../helperComponents/MediaPicker';
import { colors, dimensions } from '../../assets/theme';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import Pdf from '../../assets/svgIcons/pdf.svg';
import Close from '../../assets/svgIcons/close.svg';



const CreateProduct = () => {
  const navigation = useNavigation();

  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subCategories, setSubCategories] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myId, setMyId] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertIconType, setAlertIconType] = useState('');
  const [hasNavigated, setHasNavigated] = useState(false);



  useEffect(() => {
    const getUserData = async () => {
      try {
        const keys = [
          'CompanyUserData',
          'CompanyUserlogintimeData',
          'normalUserData',
          'NormalUserlogintimeData',
          'AdminUserData',
        ];
        for (const key of keys) {
          const storedData = await AsyncStorage.getItem(key);
          if (storedData) {
            const userData = JSON.parse(storedData);

            let extractedId = userData.company_id || userData.user_id || null;
            if (typeof extractedId === 'string') {
              extractedId = extractedId.trim();
              if (extractedId === '' || extractedId.toLowerCase() === 'null') {
                extractedId = null;
              }
            }

            if (extractedId) {
              setMyId(extractedId);

              break;
            }
          }
        }
      } catch (error) {
        console.log('Error loading user data:', error);
      }
    };


    getUserData();

  }, []);

  const route = useRoute();
  const showSkip = route.params?.showSkip || false;
  const fromSignup = route.params?.fromSignup || false;

  const handleCategorySelect = (category) => {
    setProductData((prevState) => ({
      ...prevState,
      category,
      subcategory: ''
    }));

    setSubCategories(products[category] || []);
  };


  const removeMedia = (type, index) => {
    if (type === 'image') setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    if (type === 'video') setSelectedVideos((prev) => prev.filter((_, i) => i !== index));
    if (type === 'document') setSelectedPDF(null);
  };

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
        setSelectedImages((prev) => {
          if (prev.length >= 4) return prev;
          return [...prev, file];
        });
      } else if (file.type.startsWith('video/')) {
        setSelectedVideos((prev) => {
          if (prev.length >= 1) return prev;
          return [...prev, file];
        });
      } else if (file.type === 'application/pdf') {
        setSelectedPDF(file);
      }

    },
    includeDocuments: true, // Allow PDF upload now
    includeCamera: false,
    mediaType: 'mixed',
    maxImageSizeMB: 5,
    maxVideoSizeMB: 10,
  });






  const selectPDF = async () => {
    if (selectedPDF) {
      Alert.alert("You can only upload 1 PDF.", [{ text: "OK" }]);
      return;
    }

    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });

      if (res[0].size > 5 * 1024 * 1024) { // Limit to 5MB
        return showToast("File size shouldn't exceed 5MB", 'error');
      }

      setSelectedPDF({ uri: res[0].uri, name: res[0].name, size: (res[0].size / (1024 * 1024)).toFixed(2) });

    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        showToast("Selection failed", 'error');
      }
    }
  };


  const uriToBlob = async (uri) => {
    const response = await fetch(uri);
    return await response.blob();
  };

  const uploadFileToS3 = async (fileUri, fileType) => {
    try {
      const fileStat = await RNFS.stat(fileUri);

      const res = await apiClient.post('/uploadFileToS3', {
        command: 'uploadFileToS3',
        headers: {
          'Content-Type': fileType,
          'Content-Length': fileStat.size,
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
          throw new Error(`Failed to upload ${fileType} to S3`);
        }
      } else {
        throw new Error(res.data.errorMessage || 'Failed to get upload URL');
      }
    } catch (error) {
      showToast("Upload failed", 'error');

      return null;
    }
  };


  const [isOtherSelected, setIsOtherSelected] = useState({});
  const [customValues, setCustomValues] = useState({});

  const handleSelect = (field) => (selectedItem) => {
    if (!selectedItem || !selectedItem.value) {

      return;
    }

    setIsOtherSelected(prevState => ({
      ...prevState,
      [field]: selectedItem.label.toLowerCase() === "others"
    }));

    if (selectedItem.label.toLowerCase() !== "others") {
      setProductData(prevState => ({
        ...prevState,
        specifications: {
          ...prevState.specifications,
          [field]: selectedItem.label
        }
      }));
    }
  };

  const handleCustomChange = (field, text) => {
    setCustomValues(prevState => ({
      ...prevState,
      [field]: text
    }));

    setProductData(prevState => ({
      ...prevState,
      specifications: {
        ...prevState.specifications,
        [field]: text
      }
    }));
  };

  const handleInputChange = (key, value, nested = false) => {
    let sanitizedValue = value;
    let showToastFlag = false;
    let toastMessage = "";

    if (sanitizedValue.startsWith(" ")) {
      showToastFlag = true;
      toastMessage = "Leading spaces are not allowed.";
      sanitizedValue = sanitizedValue.trimStart();
    }

    const restrictions = {
      price: /[^0-9]/g,
    };

    if (restrictions[key]) {
      if (restrictions[key].test(value)) {
        showToastFlag = true;
        toastMessage = "Only numbers are allowed.";
        sanitizedValue = sanitizedValue.replace(restrictions[key], "");
      }
    }

    if (showToastFlag && toastMessage) {
      showToast(toastMessage, "error");
    }

    setProductData(prevState => ({
      ...prevState,
      ...(nested
        ? { specifications: { ...prevState.specifications, [key]: sanitizedValue } }
        : { [key]: sanitizedValue })
    }));
  };




  const [productData, setProductData] = useState({
    title: '',
    description: '',
    price: '',
    subcategory: '',
    category: '',
    specifications: {
      brand: '',
      model_name: '',
      application: '',
      operation_mode: '',
      types: '',
      weight: '',
      dimensions: '',
      power_supply: '',
      certifications: '',
      warranty: '',
      country_of_origin: '',
      package_contents: '',
      installation_support: '',
      after_sales_service: '',
      regulatory_and_compliance: '',
    },
    accessories: '',
    tags: ''
  });

  const initialProductData = {
    title: '',
    description: '',
    price: '',
    subcategory: '',
    category: '',
    specifications: {
      brand: '',
      model_name: '',
      application: '',
      operation_mode: '',
      types: '',
      weight: '',
      dimensions: '',
      power_supply: '',
      certifications: '',
      warranty: '',
      country_of_origin: '',
      package_contents: '',
      installation_support: '',
      after_sales_service: '',
      regulatory_and_compliance: '',
    },
    accessories: '',
    tags: ''
  };

  // Compare function
  const hasFieldChanged = (obj1, obj2) => {
    return JSON.stringify(obj1) !== JSON.stringify(obj2);
  };

  // Track changes
  useEffect(() => {
    setHasChanges(hasFieldChanged(productData, initialProductData));
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

  const submitProduct = async () => {
    setSubmitting(true);

    const requiredFields = ['title', 'description', 'subcategory', 'category', 'tags'];
    const missingFields = requiredFields.filter(field => !productData[field]?.trim());

    const requiredSpecs = ['country_of_origin', 'model_name', 'brand'];
    const missingSpecs = requiredSpecs.filter(spec => !productData.specifications?.[spec]?.trim());

    const requiredCustomFields = Object.keys(isOtherSelected).filter(
      field => isOtherSelected[field] && !customValues[field]?.trim()
    );

    if (missingFields.length || missingSpecs.length || requiredCustomFields.length) {
      showToast('Please fill all mandatory fields.', 'info');
      setSubmitting(false);
      return;
    }
    setHasChanges(true);
    try {
      setLoading(true);

      const uploadedImageKeys = await Promise.all(
        selectedImages.slice(0, 4).map((img) => uploadFileToS3(img.uri, 'image/jpeg'))
      );
      const uploadedVideoKeys = await Promise.all(
        selectedVideos.slice(0, 1).map((vid) => uploadFileToS3(vid.uri, 'video/mp4'))
      );
      const uploadedPDFKey = selectedPDF
        ? await uploadFileToS3(selectedPDF.uri, 'application/pdf')
        : null;

      const validImages = uploadedImageKeys.filter(Boolean);
      const validVideos = uploadedVideoKeys.filter(Boolean);

      if (!validImages.length) {
        showToast('At least one image is required to upload a product.', 'error');
        setSubmitting(false);
        setLoading(false);
        return;
      }

      const finalSpecifications = {
        ...productData.specifications,
        ...customValues
      };

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

      const productPayload = {
        command: "createProduct",
        company_id: myId,
        ...trimStrings(productData),
        images: validImages,
        videos: validVideos,
        files: uploadedPDFKey ? [uploadedPDFKey] : [],
        specifications: trimStrings(finalSpecifications),
      };

      const response = await apiClient.post('/createProduct', productPayload);

      if (response.data.status === 'success') {
        EventRegister.emit('onProductCreated', {
          newProduct: {
            product_id: response.data.product_details.product_id,  // <-- fixed here
            ...productPayload,
          },
        });
        setHasChanges(false);
        showToast("Product uploaded successfully", 'success');

        if (fromSignup) {
          showTrialSuccessAlert();
        } else {
          navigation.goBack();
        }
      } else {
        throw new Error(response.data.errorMessage || 'Product creation failed');
      }
    } catch (error) {
      console.error('Error during product submission:', error);

      if (error.response) {
        console.error('Server responded with:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Request setup error:', error.message);
      }

      showToast("Something went wrong", 'error');
    }
    finally {
      setSubmitting(false);
      setLoading(false);
      setHasChanges(false);
    }
  };


  const showTrialSuccessAlert = () => {
    setAlertTitle('Success');
    setAlertMessage(
      <Text style={{ textAlign: 'center' }}>
        You have successfully signed up!
        {'\n\n'}
        Enjoy <Text style={{ color: '#000', fontWeight: 'bold' }}>Your 30-Days Free Trial</Text>!
        {'\n'}
        Experience all the premium features of our app at no cost for 30 days. Dive in and explore everything we have to offer.
      </Text>
    );
    setAlertIconType('congratulations');
    setShowAlert(true);
  };



  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        {fromSignup ? (
          <TouchableOpacity
            onPress={() => {
              setHasChanges(false);
              showTrialSuccessAlert();
            }}
            style={[
              AppStyles.PostbtnSkip,
              (loading || isCompressing || submitting) && { opacity: 0.5 }
            ]}
          >
            <Text style={AppStyles.PostbtnText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
        onScrollBeginDrag={() => Keyboard.dismiss()}
        contentContainerStyle={{ paddingBottom: '20%',  paddingHorizontal: 5, }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add a product</Text>
        <TouchableOpacity activeOpacity={1}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Product name <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              multiline
              placeholderTextColor="gray"
              value={productData.title}
              onChangeText={(text) => handleInputChange("title", text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Product description <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              multiline
              placeholderTextColor="gray"
              value={productData.description}
              onChangeText={(text) => handleInputChange("description", text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Price:</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholderTextColor="gray"
              value={productData.price}
              onChangeText={(text) => handleInputChange("price", text)}
              keyboardType="numeric"
            />
          </View>


          <View style={[styles.inputContainer]}>
            <Text style={styles.label}>Category <Text style={{ color: 'red' }}>*</Text></Text>
            <CustomDropdown
              data={Object.keys(products)}
              onSelect={handleCategorySelect}
              selectedItem={productData.category}
              // placeholder="Select Category"
              placeholderTextColor="gray"
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
            />

          </View>

          <View style={[styles.inputContainer]}>
            <Text style={styles.label}>Sub category <Text style={{ color: 'red' }}>*</Text></Text>
            <CustomDropdown
              data={subCategories}
              onSelect={(subCategory) =>
                setProductData((prevState) => ({
                  ...prevState,
                  subcategory: subCategory,
                }))
              }
              selectedItem={productData.subcategory} // Set selected subcategory
              disabled={!productData.category}
              // placeholder="Select Subcategory"
              placeholderTextColor="gray"
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
            />

          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Brand <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              // placeholder="Modal Name"
              placeholderTextColor='gray'
              multiline
              value={productData.specifications.brand}
              onChangeText={(text) => handleInputChange('brand', text, true)}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Model name <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              // placeholder="Modal Name"
              placeholderTextColor='gray'
              multiline
              value={productData.specifications.model_name}
              onChangeText={(text) => handleInputChange('model_name', text, true)}
            />
          </View>






          <View style={styles.inputContainer}>
            <Text style={styles.label}>Weight:</Text>
            <TextInput
              style={styles.input}
              // placeholder="Weight"
              placeholderTextColor='gray'
              value={productData.specifications.weight}
              onChangeText={(text) => handleInputChange('weight', text, true)}
              multiline

            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Dimensions:</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholderTextColor='gray'
              value={productData.specifications.dimensions}
              onChangeText={(text) => handleInputChange('dimensions', text, true)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Operation mode{isOtherSelected.operation_mode && <Text style={{ color: 'red' }}> *</Text>}
            </Text>

            <CustomDropDownMenu
              items={operation_mode}
              onSelect={handleSelect('operation_mode')}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
              placeholderTextColor="gray"
            />

            {isOtherSelected.operation_mode && (
              <TextInput
                style={styles.input1}
                placeholder="Enter Operation Mode"
                value={customValues.operation_mode || ""}
                onChangeText={(text) => handleCustomChange("operation_mode", text)}
              />
            )}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Warranty:</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor='gray'
              multiline

              value={productData.specifications.warranty}
              onChangeText={(text) => handleInputChange('warranty', text, true)}
            />
          </View>


          <View style={styles.inputContainer}>
            <Text style={styles.label}>Country of origin <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholderTextColor='gray'
              multiline

              value={productData.specifications.country_of_origin}
              onChangeText={(text) => handleInputChange('country_of_origin', text, true)}
            />
          </View>


          <View style={styles.inputContainer}>
            <Text style={styles.label}>Package contents:</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor='gray'
              multiline

              value={productData.specifications.package_contents}
              onChangeText={(text) => handleInputChange('package_contents', text, true)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Accessories:</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholderTextColor='gray'
              value={productData.accessories}
              onChangeText={(text) => handleInputChange('accessories', text)}

            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Regulatory & compliance: </Text>
            <TextInput
              style={styles.input}
              // placeholder="Modal Name"
              placeholderTextColor='gray'
              multiline
              value={productData.specifications.regulatory_and_compliance}
              onChangeText={(text) => handleInputChange('regulatory_and_compliance', text, true)}
            />
          </View>



          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Types{isOtherSelected.types && <Text style={{ color: 'red' }}> *</Text>}
            </Text>

            <CustomDropDownMenu
              items={types}
              onSelect={handleSelect('types')}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
              placeholderTextColor="gray"
            />

            {isOtherSelected.types && (
              <TextInput
                style={styles.input1}
                placeholder="Enter Type"
                value={customValues.types || ""}
                onChangeText={(text) => handleCustomChange("types", text)}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Power supply{isOtherSelected.power_supply && <Text style={{ color: 'red' }}> *</Text>}
            </Text>

            <CustomDropDownMenu
              items={power_supply}
              onSelect={handleSelect('power_supply')}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
              placeholderTextColor="gray"
            />

            {isOtherSelected.power_supply && (
              <TextInput
                style={styles.input1}
                placeholder="Enter Power Supply"
                value={customValues.power_supply || ""}
                onChangeText={(text) => handleCustomChange("power_supply", text)}
              />
            )}
          </View>


          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Certification{isOtherSelected.certifications && <Text style={{ color: 'red' }}> *</Text>}
            </Text>
            <CustomDropDownMenu
              items={certifications}
              onSelect={handleSelect('certifications')}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
              placeholderTextColor="gray"
            />
            {isOtherSelected.certifications && (
              <TextInput
                style={styles.input1}
                placeholder="Enter Certification"
                value={customValues.certifications || ""}
                onChangeText={(text) => handleCustomChange("certifications", text)}
              />
            )}
          </View>



          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              After sale service{isOtherSelected.after_sales_service && <Text style={{ color: 'red' }}> *</Text>}
            </Text>
            <CustomDropDownMenu
              items={after_sales_service}
              onSelect={handleSelect('after_sales_service')}
              buttonStyle={styles.dropdownButton}
              buttonTextStyle={styles.dropdownButtonText}
              placeholderTextColor="gray"
            />
            {isOtherSelected.after_sales_service && (
              <TextInput
                style={styles.input1}
                placeholder="Enter Sales Support"
                value={customValues.after_sales_service || ""}
                onChangeText={(text) => handleCustomChange("after_sales_service", text)}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tags <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              multiline
              value={productData.tags}
              placeholderTextColor='gray'
              onChangeText={(text) => handleInputChange('tags', text)}

            />

          </View>

          <TouchableOpacity onPress={pickImage} style={styles.addMediaButton}>
            <Text style={styles.addMediaText}>Upload product image <Text style={{ color: 'red' }}>*</Text></Text>
          </TouchableOpacity>

          <View style={styles.mediaContainer}>
            {/* Loop through the selected images but limit to a maximum of 4 */}
            {selectedImages.slice(0, 4).map((img, index) => (
              <View key={index} style={styles.mediaWrapper}>
                <Image source={{ uri: img.uri }} style={styles.mediaPreview} />
                <TouchableOpacity style={styles.closeIcon} onPress={() => removeMedia('image', index)}>
                <Close width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.secondary} />

                </TouchableOpacity>
              </View>
            ))}

            {/* Show a single "Upload Image" placeholder with remaining count */}
            {selectedImages.length < 4 && (
              <TouchableOpacity style={styles.placeholder} onPress={pickImage}>
                <Text style={styles.placeholderText} >
                  Upload image ({4 - selectedImages.length} remaining)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity onPress={pickVideo} style={styles.addMediaButton}>
            <Text style={styles.addMediaText}>Upload product video</Text>
          </TouchableOpacity>
          {/* <Button title="Select Video" onPress={selectVideo} /> */}
          <View style={styles.mediaContainer}>
            {selectedVideos.map((vid, index) => (
              <View key={index} style={styles.mediaWrapper}>
                <Video source={{ uri: vid.uri }} muted style={styles.mediaPreview} />
                <TouchableOpacity style={styles.closeIcon} onPress={() => removeMedia('video', index)}>
                <Close width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.secondary} />

                </TouchableOpacity>
                {/* <Text style={styles.sizeText}>{vid.size} MB</Text> */}
              </View>
            ))}
            {/* Show a single "Upload Image" placeholder with remaining count */}
            {selectedVideos.length < 1 && (
              <TouchableOpacity style={styles.placeholder} onPress={pickVideo}>
                <Text style={styles.placeholderText} >
                  Upload video
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={selectPDF} style={styles.addMediaButton}>
            <Text style={styles.addMediaText}>Upload product catalogue</Text>
          </TouchableOpacity>

          <View style={styles.mediaContainer}>
            {selectedPDF && (
              <View style={[styles.mediaWrapper, { padding: 15, }]}>
                 <Pdf width={dimensions.icon.xl} height={dimensions.icon.xl} color={colors.danger} />

                <Text numberOfLines={1} style={[styles.documentName, { marginTop: 5, }]}>{selectedPDF.name}</Text>

                <TouchableOpacity style={styles.closeIcon} onPress={() => removeMedia('document')}>
                <Close width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.secondary} />

                </TouchableOpacity>
              </View>
            )}

            {!selectedPDF && (
              <TouchableOpacity style={styles.placeholder} onPress={selectPDF}>
                <Text style={styles.placeholderText}>Upload PDF</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* {showSkip && (
            <Button
              title="Skip"
              onPress={() => {
                setHasChanges(false);
                if (fromSignup) {
                  showTrialSuccessAlert();
                } else {
                  navigation.navigate('CompanyBottom');
                }
              }}
            />
          )} */}

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              AppStyles.Postbtn,
              (loading || isCompressing || submitting) && { opacity: 0.5 }
            ]}
            onPress={submitProduct}
            disabled={loading || isCompressing || submitting}
          >
            {(isCompressing || submitting) ? (
              <ActivityIndicator size="small" color="#075cab" />
            ) : (
              <Text style={AppStyles.PostbtnText}>
                Upload
              </Text>
            )}
          </TouchableOpacity>

        </TouchableOpacity>
      </KeyboardAwareScrollView>
      <Message1
        visible={showAlert}
        title={alertTitle}
        message={alertMessage}
        iconType={alertIconType}
        onOk={() => {
          if (hasNavigated) return;
          setHasNavigated(true);
          setShowAlert(false);
          setHasChanges(false);
          // showToast('Signup successful', 'success');
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'CompanyBottom' }],
            });
          }, 300);
        }}
      />
      <Message3
        visible={showModal}
        onClose={() => setShowModal(false)}  // Optional if you want to close it from outside
        onCancel={handleStay}  // Stay button action
        onOk={handleLeave}  // Leave button action
        title="Are you sure ?"
        message="Your updates will be lost if you leave this page. This action cannot be undone."
        iconType="warning"  // You can change this to any appropriate icon type
      />

    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'whitesmoke',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    elevation: 1,  // for Android
    shadowColor: '#000',  // shadow color for iOS
    shadowOffset: { width: 0, height: 1 },  // shadow offset for iOS
    shadowOpacity: 0.1,  // shadow opacity for iOS
    shadowRadius: 2,  // shadow radius for iOS
 borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#222',
  },
  inputContainer: {
    marginBottom: 10,

  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 5,
    color: colors.text_primary,
  },

  input: {
    minHeight: 40,
    maxHeight: 150,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text_primary,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ddd'

  },
  input1: {
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
    marginTop: 10,

  },

  addMediaButton: {
    // width: "100%",
    paddingHorizontal: 5,
    // backgroundColor: "#e0e0e0",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    // borderWidth: 1,
    // borderColor: "#ccc",
    alignSelf: 'flex-start'

  },
  pdfContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
  },
  pdfName: {
    flex: 1,
    color: 'black',
  },

  addMediaText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    alignSelf: 'flex-start'
  },
  dropdownButton: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text_primary,
    flex: 1,
    padding: 5

  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  mediaWrapper: {
    position: 'relative',
    marginRight: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  mediaPreview: {
    width: 110,
    height: 110,
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
  sizeText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    fontSize: 17,
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 25,
    textAlign: 'center',
    color: '#075cab',
    top: 10,
  },

});



export default CreateProduct;
