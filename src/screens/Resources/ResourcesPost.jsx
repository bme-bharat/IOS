

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, ScrollView, TextInput, Alert, SafeAreaView, ActivityIndicator, Modal, Keyboard, ActionSheetIOS, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Message3 from '../../components/Message3';
import FastImage from 'react-native-fast-image';
import ImageResizer from 'react-native-image-resizer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDispatch, useSelector } from 'react-redux';
import PlayOverlayThumbnail from '../Forum/Play';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';
import apiClient from '../ApiClient';
import { EventRegister } from 'react-native-event-listeners';
import AppStyles from '../AppUtils/AppStyles';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import { cleanForumHtml } from '../Forum/forumBody';
import { MediaPickerButton } from '../helperComponents/MediaPickerButton';
import { useMediaPicker } from '../helperComponents/MediaPicker';
import { uploadFromBase64 } from '../Forum/VideoParams';


async function uriToBlob(uri) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
}


const ResourcesPost = () => {
  const navigation = useNavigation();
  const profile = useSelector(state => state.CompanyProfile.profile);

  const { myId, myData } = useNetwork();

  const [postData, setPostData] = useState({
    title: '',
    body: '',
    fileKey: '',
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const scrollViewRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [loading, setLoading] = useState(false);
  const [thumbnailUri, setThumbnailUri] = useState(null);
    const [overlayUri, setOverlayUri] = useState(null);  
  const [mediaMeta, setMediaMeta] = useState(null);


  useEffect(() => {
    const titleChanged = postData.title.trim() !== '';
    const bodyChanged = postData.body.trim() !== '';
    const filekey = postData.fileKey.trim() !== ''; // This line is most likely the issue

    setHasChanges(titleChanged || bodyChanged || filekey);
  }, [postData]);



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


  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const isValid = postData.body.trim().length > 0 && postData.title.trim().length > 0;
    setIsFormValid(isValid);
  }, [postData.body, postData.title]);


  const bodyEditorRef = useRef();
  const [activeEditor, setActiveEditor] = useState('title'); // not 'title'


  const handleBodyFocus = () => {
    setActiveEditor('body');
    bodyEditorRef.current?.focus(); // Focus the body editor
  };



  const stripHtmlTags = (html) =>
    html?.replace(/<\/?[^>]+(>|$)/g, '').trim() || '';


  // Title Input Handler
  const handleTitleChange = (text) => {
    if (text === "") {
      setPostData(prev => ({ ...prev, title: "" }));
      return;
    }

    const trimmed = text.trimStart();
    if (trimmed === "") {
      showToast("Leading spaces are not allowed", "error");
      return;
    }

    const withoutLeadingSpaces = text.replace(/^\s+/, "");

    if (withoutLeadingSpaces.length > 100) {
      showToast("Title cannot exceed 100 characters", "info");
      return;
    }

    setPostData(prev => ({ ...prev, title: withoutLeadingSpaces }));
  };

  // RichEditor Body Input Handler
  const handleBodyChange = (html) => {
    if (html === "") {
      setPostData(prev => ({ ...prev, body: "" }));
      return;
    }

    // Extract plain text from HTML to validate leading spaces
    const plainText = stripHtmlTags(html);

    if (plainText.trimStart() === "") {
      showToast("Leading spaces are not allowed", "error");
      return;
    }

    // Save the cleaned HTML (if needed) or original input
    setPostData(prev => ({ ...prev, body: html.replace(/^\s+/, "") }));
  };


  const {
    showMediaOptions,
    isCompressing,
    overlayRef,
  } = useMediaPicker({
    onMediaSelected: (file, meta, previewThumbnail) => {
      setFile(file);
      setFileType(file.type);
      setMediaMeta(meta);
      setThumbnailUri(previewThumbnail);
    },
    includeDocuments: true, // No document option for forum posts
    includeCamera: false,     // Include camera option
    mediaType: 'mixed',      // Allow both photos and videos
    maxImageSizeMB: 5,
    maxVideoSizeMB: 10,
  });








  const [capturedThumbnailUri, setCapturedThumbnailUri] = useState(null);

  const playIcon = require('../../images/homepage/PlayIcon.png');



  const handleThumbnailUpload = async (thumbnailUri, fileKey) => {
    try {
      const thumbStat = await RNFS.stat(thumbnailUri);
      const thumbBlob = await uriToBlob(thumbnailUri);

      const thumbnailFileKey = `thumbnail-${fileKey}`;

      const res = await apiClient.post('/uploadFileToS3', {
        command: 'uploadFileToS3',
        fileKey: thumbnailFileKey,
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': thumbStat.size,
        },
      });

      if (res.data.status !== 'success') {
        throw new Error('Failed to get upload URL for thumbnail');
      }

      const uploadUrl = res.data.url;

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: thumbBlob,
      });

      if (uploadRes.status !== 200) {
        throw new Error('Failed to upload thumbnail to S3');
      }

      return thumbnailFileKey;
    } catch (error) {

      return null;
    }
  };




  const handleUploadFile = async () => {
    if (!file) {
      console.log('📂 No file selected for upload');
      return { fileKey: null, thumbnailFileKey: null };
    }

    setLoading(true);
    console.log('⏫ Upload starting for file:', file);

    try {
      const fileStat = await RNFS.stat(file.uri);
      const fileSize = fileStat.size;
      console.log('📏 File size:', fileSize);

      const res = await apiClient.post('/uploadFileToS3', {
        command: 'uploadFileToS3',
        headers: {
          'Content-Type': fileType,
          'Content-Length': fileSize,
        },
      });

      if (res.data.status !== 'success') {
        console.error('❌ Failed to get S3 URL:', res.data);
        throw new Error(res.data.errorMessage || 'Failed to get upload URL');
      }

      const { url: uploadUrl, fileKey } = res.data;
      console.log('✅ Got S3 Upload URL and fileKey:', { uploadUrl, fileKey });

      const fileBlob = await uriToBlob(file.uri);
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': fileType },
        body: fileBlob,
      });

      console.log('📤 Upload to S3 response status:', uploadRes.status);

      if (uploadRes.status !== 200) {
        throw new Error('Failed to upload file to S3');
      }

      let thumbnailFileKey = null;

      if (file.type.startsWith("video/")) {
  
        thumbnailFileKey = await uploadFromBase64(overlayUri, fileKey);
 
      }

      return { fileKey, thumbnailFileKey };

    } catch (error) {
      console.error('🚨 Error in handleUploadFile:', error);
      showToast("Something went wrong", 'error');
      return { fileKey: null, thumbnailFileKey: null };

    } finally {
      setLoading(false);
    }
  };



  const sanitizeHtmlBody = (html) => {
    const cleaned = cleanForumHtml(html); // your existing cleaner

    return cleaned
      .replace(/<div><br><\/div>/gi, '') // remove empty line divs
      .replace(/<p>(&nbsp;|\s)*<\/p>/gi, '') // remove empty p tags
      .replace(/<div>(&nbsp;|\s)*<\/div>/gi, '') // remove empty divs
      .trim(); // trim outer whitespace
  };

  const handlePostSubmission = async () => {
    setHasChanges(true);
    setLoading(true);

    try {
      const trimmedTitle = postData.title?.trim();
      const rawBodyHtml = postData.body?.trim();
      console.log('📝 Title:', trimmedTitle);
      console.log('📝 Raw body:', rawBodyHtml);

      if (!trimmedTitle || !rawBodyHtml) {
        showToast("Title and body are required", 'info');
        return;
      }

      const cleanedBody = sanitizeHtmlBody(rawBodyHtml);

      const { fileKey, thumbnailFileKey } = await handleUploadFile();
      console.log('📎 Uploaded keys:', { fileKey, thumbnailFileKey });

      const postPayload = {
        command: "postInResources",
        user_id: myId,
        title: trimmedTitle,
        resource_body: cleanedBody,
        ...(fileKey && { fileKey }),
        ...(thumbnailFileKey && { thumbnail_fileKey: thumbnailFileKey }),
        extraData: mediaMeta || {}
      };

      console.log('📦 Final postPayload:', postPayload);

      const res = await apiClient.post('/postInResources', postPayload);

      if (res.data.status === 'success') {
        const enrichedPost = {
          ...postPayload,
          resource_id: res.data.resource_details?.resource_id,
          posted_on: Date.now(), // or use `res.data.resource_details?.posted_on` if available
        };

        EventRegister.emit('onResourcePostCreated', { newPost: enrichedPost });

    
        await clearCacheDirectory();
        setPostData({ title: '', body: '', fileKey: '' });
        setFile(null);
        setThumbnailUri(null);
        showToast("Resource post submitted successfully", 'success');
        navigation.goBack();
      } else {
        console.error('❌ Submission failed:', res.data);
        showToast("Failed to submit post", 'error');
      }

    } catch (error) {
      console.error('🚨 Error in handlePostSubmission:', error);
      const message =
        error?.response?.data?.status_message ||
        error?.message ||
        'Something went wrong';

      showToast(message, 'error');

    } finally {
      setLoading(false);
      setHasChanges(false);
    }
  };



  const cleanUpFile = async (uri) => {
    try {
      const fileStat = await RNFS.stat(uri);
      const fileSize = fileStat.size;
      const isFileExists = await RNFS.exists(uri);

      if (isFileExists) {

        await RNFS.unlink(uri);

      } else {

      }
    } catch (error) {

    }
  };

  const clearCacheDirectory = async () => {
    try {
      const cacheDir = RNFS.CachesDirectoryPath;
      const files = await RNFS.readDir(cacheDir);


      for (const file of files) {
        await RNFS.unlink(file.path);

      }
    } catch (error) {

    }
  };


  useFocusEffect(
    React.useCallback(() => {
      return () => {

        clearCacheDirectory();
        cleanUpFile();
      };
    }, [])
  );


  useFocusEffect(
    React.useCallback(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    }, [])
  );


  const clearFile = () => {
    setFile(null);
  };


  return (

    <SafeAreaView style={styles.container}>

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="black" />

        </TouchableOpacity>
        <TouchableOpacity
          onPress={handlePostSubmission}
          style={[
            AppStyles.buttonContainer,
            !isFormValid || loading || isCompressing ? styles.disabledButton : null,
          ]}
          disabled={!isFormValid || loading || isCompressing}
        >
          {loading || isCompressing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={[styles.buttonText, (!postData.body.trim()) && styles.buttonDisabledText]} >Post</Text>

          )}
        </TouchableOpacity>

      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 10, paddingBottom: '20%' }}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => Keyboard.dismiss}
      >

        <View style={styles.profileContainer}>
          <View style={styles.imageContainer}>
            {profile?.fileKey ? (
              <Image
                source={{ uri: profile?.imageUrl }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  marginRight: 10,
                }}
              />
            ) : (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  marginRight: 10,
                  backgroundColor: profile?.companyAvatar?.backgroundColor || '#ccc',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: profile?.companyAvatar?.textColor || '#000', fontWeight: 'bold' }}>
                  {profile?.companyAvatar?.initials || '?'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>
              {profile?.company_name
                ? profile.company_name
                : `${profile?.first_name || ''} ${profile?.last_name || ''}`}
            </Text>
            <Text style={styles.profileCategory}>{profile?.category}</Text>
          </View>
        </View>

        <TextInput
          style={[styles.input, { height: 50 }]}
          value={postData.title}
          multiline
          placeholder="Enter title ..."
          placeholderTextColor="gray"
          onChangeText={handleTitleChange}
        />


        <RichEditor
          ref={bodyEditorRef}
          useContainer={false}
          style={{
            minHeight: 250,
            maxHeight: 400,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#ccc',
            overflow: 'hidden',
          }}
          onTouchStart={() => setActiveEditor('body')}
          onFocus={() => handleBodyFocus('body')}
          initialContentHTML={postData.body}
          placeholder="Describe your resource in detail ..."
          editorInitializedCallback={() => { }}
          onChange={handleBodyChange}
          editorStyle={{
            cssText: `
      * {
        font-size: 15px !important;
        line-height: 20px !important;
      }
      p, div, ul, li, ol, h1, h2, h3, h4, h5, h6 {
        margin: 0 !important;
        padding: 10 !important;
      }
      body {
        padding: 10 !important;
        margin: 0 !important;
      }
    `
          }}
        />

        <RichToolbar
          key={`toolbar-${activeEditor}`}
          editor={bodyEditorRef}
          actions={[
            actions.setBold,
            actions.setItalic,
            actions.insertBulletsList,
            actions.insertOrderedList,
            actions.insertLink,
          ]}
          iconTint="#000"
          selectedIconTint="#075cab"
          selectedButtonStyle={{ backgroundColor: "#eee" }}
        />





        {file && (
          <View style={{ width: '100%', alignItems: 'center', position: 'relative' }}>
            {/* Clear File Button */}
            <TouchableOpacity onPress={clearFile} style={styles.closeIcon}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>


            {fileType.startsWith('image') && (
              <View style={{ width: '100%', height: 250, borderRadius: 10, overflow: 'hidden', }}>
                <FastImage
                  source={{ uri: file.uri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
            )}


            {fileType.startsWith('video') && (
              <View style={{ width: '100%', height: 250, borderRadius: 10, overflow: 'hidden', }}>
                <Video
                  source={{ uri: file.uri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                  muted
                  controls
                />
              </View>
            )}


            {(fileType === 'application/pdf' ||
              fileType.includes('msword') ||
              fileType.includes('text') ||
              fileType.includes('officedocument')) && (
                <View style={{ width: '100%', alignItems: 'center', padding: 20, borderRadius: 10, backgroundColor: '#f5f5f5' }}>
                  <Ionicons name="document-text-outline" size={40} color="black" />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 10 }}>Document Uploaded</Text>
                  <Text style={{ fontSize: 14, color: 'gray', marginTop: 5 }} numberOfLines={1} ellipsizeMode="middle">
                    {file.name}
                  </Text>
                </View>
              )}
          </View>
        )}


        {!file && (
          <MediaPickerButton
            onPress={() => showMediaOptions()}
            isLoading={isCompressing}
          />
        )}

        <Message3
          visible={showModal}
          onClose={() => setShowModal(false)}
          onCancel={handleStay}
          onOk={handleLeave}
          title="Are you sure ?"
          message="Your updates will be lost if you leave this page. This action cannot be undone."
          iconType="warning"
        />

      </KeyboardAwareScrollView>

      <PlayOverlayThumbnail
          thumbnailUri={thumbnailUri} // input
          onCaptured={(dataUri) => {
            if (dataUri && dataUri.trim() !== "") {
              setOverlayUri(dataUri);   // ✅ captured overlay thumbnail
            } else {
              setOverlayUri(thumbnailUri); // 🔄 fallback to original
            }
          }}
        />

    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'whitesmoke',
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
    zIndex: 4
  },
  uploadButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: 'gray',
    borderStyle: 'dotted',
    backgroundColor: 'white',
    borderRadius: 15
  },

  fileKeyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,

    paddingHorizontal: 15,
  },

  fileKeyText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    marginRight: 10,
  },

  deleteIcon: {
    padding: 5,
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
    padding: 10
  },
  mediatext: {
    color: 'gray',
    fontWeight: '500',
    fontSize: 16,
    color: 'black',
  },
  mediaContainer1: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  mediaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    alignSelf: 'center'
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,

  },
  detailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    overflow: 'hidden',

  },
  imageContainer: {
    width: 40,
    height: 40,
    borderRadius: 80,
    alignSelf: 'center',
    justifyContent: 'center',
    marginRight: 10

  },
  closeButton1: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  mediaWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPreview: {
    width: '100%',
    height: undefined,
    resizeMode: 'contain',
    aspectRatio: 16 / 9,  // This is just an example; it keeps a typical video aspect ratio. Adjust it if needed.
    marginBottom: 10,   // This ensures the aspect ratio is preserved for images and videos
    marginBottom: 10, // Optional: Adds some space below the media
  },
  spaceAtBottom: {
    height: 20,  // Space at the bottom (adjust as needed)
  },
  deleteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: 10,
  },
  profileTextContainer: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  profileCategory: {
    fontSize: 14,
    color: 'gray',
    fontWeight: '400'
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    textAlignVertical: 'top', // Align text to the top for multiline
    color: 'black',
    textAlign: 'justify',
    backgroundColor: 'white',
    marginBottom: 10,
  },

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },


  disabledButton: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
    borderWidth: 0.5,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  buttonDisabledText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  buttonTextdown: {
    textAlign: 'center',
    fontSize: 16,
    color: '#075cab',
    fontWeight: '500',
  },
  disabledButton1: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  disabledButtonText: {
    color: '#ccc',
  }
});






export default ResourcesPost;
