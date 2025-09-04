import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, ScrollView, StyleSheet, Image, TouchableOpacity, Keyboard, KeyboardAvoidingView, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import Video from 'react-native-video';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import * as Compressor from 'react-native-compressor';
import Toast from 'react-native-toast-message';
import { TextInput } from 'react-native-gesture-handler';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomDropdown from '../../components/CustomDropDown';
import { SafeAreaView } from 'react-native-safe-area-context';
import DocumentPicker from 'react-native-document-picker';
import Message3 from '../../components/Message3';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNetwork } from '../AppUtils/IdProvider';
import apiClient from '../ApiClient';
import { showToast } from '../AppUtils/CustomToast';
import { EventRegister } from 'react-native-event-listeners';
import AppStyles from '../AppUtils/AppStyles';
import {products} from '../../assets/Constants';
import { useMediaPicker } from '../helperComponents/MediaPicker';
const MAX_IMAGE_SIZE_MB = 5;
const MAX_VIDEO_SIZE_MB = 10;


const CreateService = () => {
  const navigation = useNavigation();
  const { myId, myData } = useNetwork();

  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const route = useRoute();
  const showSkip = route.params?.showSkip || false;
  const fromSignup = route.params?.fromSignup || false;

  const handleCategorySelect = (category) => {
    setProductData((prevState) => ({
      ...prevState,
      category,
      subcategory: '' // Reset subcategory when category changes
    }));

    // Update subcategories based on selected category
    setSubCategories(products[category] || []);
  };


  const removeMedia = (type, index) => {
    if (type === 'image') setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    if (type === 'video') setSelectedVideos((prev) => prev.filter((_, i) => i !== index));
    if (type === 'document') setSelectedPDF(null); // No index needed for a single PDF
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

      if (res[0].size > 5 * 1024 * 1024) {
        return showToast("File size shouldn't exceed 5MB", 'error');

      }

      setSelectedPDF({ uri: res[0].uri, name: res[0].name, size: (res[0].size / (1024 * 1024)).toFixed(2) });

    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {

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
      showToast(error.message, 'error');
      return null;
    }
  };


  const [isOtherSelected, setIsOtherSelected] = useState({});
  const [customValues, setCustomValues] = useState({});



  const handleInputChange = (key, value, nested = false) => {
    let sanitizedValue = value;
    let showToastFlag = false; // Flag to control toast display

    // Check for leading spaces
    if (sanitizedValue.startsWith(" ")) {
      showToastFlag = true;
      sanitizedValue = sanitizedValue.trimStart();
    }

    // Define restrictions for specific fields
    const restrictions = {
      price: /[^0-9]/g,

    };

    if (restrictions[key]) {
      if (restrictions[key].test(value)) {
        showToastFlag = true;
        sanitizedValue = sanitizedValue.replace(restrictions[key], ""); // Remove restricted characters
      }
    }

    // Show a toast if restricted characters OR leading spaces were detected
    if (showToastFlag) {

      showToast("leading spaces are not allowed", 'error');

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
      warranty: '',
    },

    tags: ''
  });

  const initialProductData = {
    title: '',
    description: '',
    price: '',
    subcategory: '',
    category: '',
    specifications: {

      warranty: '',

    },

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

    const requiredCustomFields = Object.keys(isOtherSelected).filter(
      field => isOtherSelected[field] && !customValues[field]?.trim()
    );

    if (missingFields.length || requiredCustomFields.length || selectedImages.length === 0) {

      showToast("Please fill mandatory fields", 'error');

      setSubmitting(false);
      return;
    }

    setLoading(true);
    showToast("Uploading media...", 'info');

    try {
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
        Alert.alert('Missing Image', 'At least one image is required to create a service.');
        setLoading(false);
        setSubmitting(false);

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
        command: "createService",
        company_id: myId,
        ...trimStrings(productData),
        images: validImages,
        videos: validVideos,
        files: uploadedPDFKey ? [uploadedPDFKey] : [],
        specifications: trimStrings(finalSpecifications),
      };

      const response = await apiClient.post('/createService', productPayload);
      console.log('response.data', response.data)
      if (response.data.status === 'success') {
        EventRegister.emit('onProductCreated', {
          newProduct: {
            service_id: response.data?.service_details?.service_id,
            ...(productPayload || {}),  
          },
        });
        


        setHasChanges(false);
        showToast("Service Created Successfully", 'success');

        if (fromSignup) {
          Alert.alert(
            'Success',
            'You have successfully signed up! Please wait for admin approval.\n\nEnjoy Your 15-Days Free Trial!',
            [{ text: 'OK', onPress: () => navigation.replace('CompanyBottom') }]
          );
        } else {
          navigation.goBack();
        }
      } else {
        throw new Error(response.data.errorMessage || 'Service creation failed');
      }
    } catch (error) {
      showToast(error.message, 'error');

    } finally {
      setLoading(false);        // ✅ Corrected from true to false
      setSubmitting(false);     // ✅ Reset submitting state

      setHasChanges(false);
    }
  };




  return (
    <SafeAreaView style={styles.container}>
     <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#075cab" />
                </TouchableOpacity>
                </View>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
        onScrollBeginDrag={() => Keyboard.dismiss()}
        contentContainerStyle={{ paddingBottom: '20%', top: 15, paddingHorizontal: 10, }} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Add a service</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Service name <Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            multiline
            placeholderTextColor="gray"
            value={productData.title}
            onChangeText={(text) => handleInputChange("title", text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Service description <Text style={{ color: 'red' }}>*</Text></Text>
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


        <View style={styles.inputContainer}>
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

        <View style={styles.inputContainer}>
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
          <Text style={styles.label}>Tags <Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            multiline
            value={productData.tags}
            placeholderTextColor='gray'
            onChangeText={(text) => setProductData({ ...productData, tags: text })}
          />

        </View>

        <TouchableOpacity style={styles.addMediaButton}>
          <Text style={styles.addMediaText}>Upload service image <Text style={{ color: 'red' }}>*</Text></Text>
        </TouchableOpacity>

        <View style={styles.mediaContainer}>
          {/* Loop through the selected images but limit to a maximum of 4 */}
          {selectedImages.slice(0, 4).map((img, index) => (
            <View key={index} style={styles.mediaWrapper}>
              <Image source={{ uri: img.uri }} style={styles.mediaPreview} />
              <TouchableOpacity style={styles.closeIcon} onPress={() => removeMedia('image', index)}>
                <Icon name="close" size={20} color="gray" />
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

        <TouchableOpacity style={styles.addMediaButton}>
          <Text style={styles.addMediaText}>Upload service video</Text>
        </TouchableOpacity>
        {/* <Button title="Select Video" onPress={selectVideo} /> */}
        <View style={styles.mediaContainer}>
          {selectedVideos.map((vid, index) => (
            <View key={index} style={styles.mediaWrapper}>
              <Video source={{ uri: vid.uri }} muted style={styles.mediaPreview} />
              <TouchableOpacity style={styles.closeIcon} onPress={() => removeMedia('video', index)}>
                <Icon name="close" size={20} color="gray" />
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
          <Text style={styles.addMediaText}>Upload service catalogue</Text>
        </TouchableOpacity>

        <View style={styles.mediaContainer}>
          {selectedPDF && (
            <View style={[styles.mediaWrapper, { padding: 15, }]}>
              <Icon name="file-document-outline" size={50} color="black" />
              <Text numberOfLines={1} style={[styles.documentName, { marginTop: 5, }]}>{selectedPDF.name}</Text>

              <TouchableOpacity style={styles.closeIcon} onPress={() => removeMedia('document')}>
                <Icon name="close" size={20} color="gray" />
              </TouchableOpacity>
            </View>
          )}

          {!selectedPDF && (
            <TouchableOpacity style={styles.placeholder} onPress={selectPDF}>
              <Text style={styles.placeholderText}>Upload PDF</Text>
            </TouchableOpacity>
          )}
        </View>



        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            AppStyles.Postbtn,
            (!hasChanges || loading || isCompressing || submitting) && { opacity: 0.5 }
          ]}
          onPress={submitProduct}
          disabled={!hasChanges || loading || isCompressing || submitting}
        >
          {(isCompressing || submitting) ? (
            <ActivityIndicator size="small" color="#075cab" />
          ) : (
            <Text style={AppStyles.PostbtnText}>Upload</Text>
          )}
        </TouchableOpacity>


      </KeyboardAwareScrollView>

      <Message3
        visible={showModal}
        onClose={() => setShowModal(false)}  // Optional if you want to close it from outside
        onCancel={handleStay}  // Stay button action
        onOk={handleLeave}  // Leave button action
        title="Are you sure ?"
        message="Your updates will be lost if you leave this page. This action cannot be undone."
        iconType="warning"  // You can change this to any appropriate icon type
      />
      <Toast />

    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'whitesmoke',
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
  header: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 25,
    textAlign: 'center',
    color: '#075cab',
    top: 10,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 10,
    color: '#000',
  },

  input: {
    minHeight: 50,
    maxHeight:250,
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

  input2: {
    height: 120,
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
  },
  addMediaButton: {
    // width: "100%",
    padding: 12,
    // backgroundColor: "#e0e0e0",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
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
    color: "#000",
    fontWeight: "500",
    alignSelf: 'flex-start'
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
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
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
});



export default CreateService;