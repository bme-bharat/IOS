


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, ScrollView, TextInput, Alert, SafeAreaView, ActivityIndicator, Keyboard, Linking, ActionSheetIOS, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import DocumentPicker from 'react-native-document-picker';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Message3 from '../../components/Message3';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';
import FastImage from 'react-native-fast-image';
import * as Compressor from 'react-native-compressor';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { updateResourcePost } from '../Redux/Resource_Actions';
import { useDispatch, useSelector } from 'react-redux';
import { captureFinalThumbnail, generateVideoThumbnail, moveToPersistentStorage, resizeImage } from '../Forum/VideoParams';
import PlayOverlayThumbnail from '../Forum/Play';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';
import { EventRegister } from 'react-native-event-listeners';
import apiClient from '../ApiClient';
import AppStyles from '../AppUtils/AppStyles';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';

const videoExtensions = [
  '.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm',
  '.m4v', '.3gp', '.3g2', '.f4v', '.f4p', '.f4a', '.f4b', '.qt', '.quicktime'
];
const ResourcesEditScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { post, imageUrl } = route.params;
  const profile = useSelector(state => state.CompanyProfile.profile);
  const { myId, myData } = useNetwork();

  const [imageUri, setImageUri] = useState(null);
  const [videoUri, setVideoUri] = useState(null);

  const scrollViewRef = useRef(null)
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [thumbnailUri, setThumbnailUri] = useState(null);


  const handleRemoveMedia = async () => {
    if (postData.fileKey) {
      try {
        const response = await apiClient.post('/deleteFileFromS3', {
          command: 'deleteFileFromS3',
          key: postData.fileKey,
        });

        if (response.data.statusCode === 200) {
          setPostData(prev => ({
            ...prev,
            fileKey: '',
          }));
          setImageUri(null);
          setVideoUri(null);
          setFile(null);
          setFileType(null);
        } else {
          throw new Error('Failed to delete file from backend');
        }
      } catch (error) {

      }
    } else if (file) {
      setFile(null);
      setFileType(null);
      setImageUri(null);
      setVideoUri(null);
    } else {

    }
  };




  const handleDeleteOldFile = async (fileKey) => {
    try {
      const response = await apiClient.post('/deleteFileFromS3', {
        command: 'deleteFileFromS3',
        key: fileKey,
      });

      if (response.status === 200) {

        setPostData(prevState => ({
          ...prevState,
          fileKey: null,
        }));
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {

      showToast("something went wrong", 'error');

    } finally {

    }
  };




  const [postData, setPostData] = useState({
    title: post?.title || '',
    resource_body: post?.resource_body || '',
    conclusion: post?.conclusion || '',
    fileKey: post?.fileKey || '',
    thumbnail_fileKey: post?.thumbnail_fileKey || '',

  });



  const [showModal, setShowModal] = useState(false);


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

  useEffect(() => {
    if (!post) return;

    const initialPostData = {
      title: post.title || '',
      resource_body: post.resource_body || '',
      conclusion: post.conclusion || '',
      fileKey: post.fileKey || '',
    };

    const checkChanges = () => {
      const hasAnyChanges =
        postData.title !== initialPostData.title ||
        postData.resource_body !== initialPostData.resource_body ||
        postData.conclusion !== initialPostData.conclusion ||
        postData.fileKey !== initialPostData.fileKey;

      setHasChanges(hasAnyChanges);
    };

    checkChanges();

  }, [postData, post]);


  useFocusEffect(
    useCallback(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ offset: 0, animated: false });
      }

    }, [])
  );




  const handleFileChange = () => {
    const mediaOptions = [
      { text: "Image", onPress: openGallery },
      { text: "Video", onPress: selectVideo },
      { text: "Document (PDF, DOCX, etc.)", onPress: selectDocument },
      { text: "Cancel", style: "cancel" },
    ];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: mediaOptions.map((option) => option.text),
          cancelButtonIndex: mediaOptions.length - 1,
        },
        (index) => {
          if (index !== mediaOptions.length - 1) {
            mediaOptions[index].onPress();
          }
        }
      );
    } else {
      Alert.alert("Select Media", "Choose an option", mediaOptions);
    }
  };



  const openGallery = async () => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 1,
        selectionLimit: 1,
      };

      launchImageLibrary(options, async (response) => {
        if (response.didCancel) return;

        if (response.errorCode) {

          return;
        }

        const asset = response.assets?.[0];
        if (!asset) return;

        let mimeType = asset.type || '';
        const supportedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif'];

        if (!supportedFormats.includes(mimeType)) {

          showToast("Only JPEG and PNG formats are supported", 'info');

          return;
        }

        // Normalize HEIC/HEIF to JPEG
        if (mimeType === 'image/heic' || mimeType === 'image/heif') {
          mimeType = 'image/jpeg';
        }

        const originalPath = asset.uri.replace('file://', '');
        const fileStats = await RNFS.stat(originalPath);
        const originalSize = fileStats.size;

        const maxSize = 5 * 1024 * 1024;
        const originalWidth = asset.width || 1080;
        const originalHeight = asset.height || 1080;

        const maxWidth = 1080, maxHeight = 1080;
        let width = originalWidth, height = originalHeight;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (aspectRatio > 1) {
            width = maxWidth;
            height = Math.round(maxWidth / aspectRatio);
          } else {
            height = maxHeight;
            width = Math.round(maxHeight * aspectRatio);
          }
        }

        const compressed = await ImageResizer.createResizedImage(
          asset.uri,
          width,
          height,
          'JPEG',
          70
        );

        const compressedPath = compressed.uri.replace('file://', '');
        const compressedStats = await RNFS.stat(compressedPath);
        const compressedSize = compressedStats.size;

        if (compressedSize > maxSize) {

          showToast("Image size shouldn't exceed 5MB", 'error');

          return;
        }
        setFile({
          uri: compressed.uri,
          type: mimeType,
          name: asset.fileName || `image_${Date.now()}.jpg`,
        });
        setFileType(mimeType);

        await uploadNewFile(compressed.uri, 'image/jpeg');
        setImageUri(compressed.uri);
      });
    } catch (error) {
      showToast("Error selecting image", 'error');

    }
  };


  const [isCompressing, setIsCompressing] = useState(false);
  const [capturedThumbnailUri, setCapturedThumbnailUri] = useState(null);
  const overlayRef = useRef();
  const playIcon = require('../../images/homepage/PlayIcon.png');

  const selectVideo = async () => {
    if (isCompressing) {
      Alert.alert('Info', 'Uploading is already in progress. Please wait.');
      return;
    }

    try {
      const options = {
        mediaType: 'video',
        quality: 1,
        videoQuality: 'high',
      };

      launchImageLibrary(options, async (response) => {
        if (response.didCancel) {

          return;
        }

        if (response.errorCode) {

          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.uri) {

          return;
        }

        const rawDuration = asset.duration || 0;
        const totalSeconds = Math.floor(rawDuration);

        if (totalSeconds > 1800) {
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          const formatted = [
            hours > 0 ? hours.toString().padStart(2, '0') : null,
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0'),
          ]
            .filter(Boolean)
            .join(':');
          showToast("Please select a video of 30 minutes or shorter", 'error');

          return;
        }

        const persistentUri = await moveToPersistentStorage(asset.uri);
        const previewThumbnail = await generateVideoThumbnail(persistentUri);

        if (previewThumbnail) {
          setThumbnailUri(previewThumbnail);

          setTimeout(async () => {
            const finalThumb = await captureFinalThumbnail(overlayRef);

            if (finalThumb) {
              const resizedThumbUri = await resizeImage(finalThumb);
              setCapturedThumbnailUri(resizedThumbUri);
            }
          }, 300);
        }

        const fileStat = await RNFS.stat(persistentUri.replace('file://', ''));
        const originalSizeMB = (fileStat.size / (1024 * 1024)).toFixed(2);

        try {
          const thumbnail = await generateVideoThumbnail(persistentUri);
          if (thumbnail) {

            setThumbnailUri(thumbnail);
          }
        } catch (err) {

        }

        const maxFileSize = 10 * 1024 * 1024;
        let finalUri = persistentUri;
        let finalSize = fileStat.size;

        showToast("Uploading Video\nThis may take a moment...", 'info');

        setIsCompressing(true);

        try {
          const compressedUri = await Compressor.Video.compress(persistentUri, {
            compressionMethod: 'auto',
            progressDivider: 5,
          }, (progress) => {

          });

          const compressedFileStat = await RNFS.stat(compressedUri.replace('file://', ''));
          const compressedSizeMB = (compressedFileStat.size / (1024 * 1024)).toFixed(2);

          if (compressedFileStat.size < fileStat.size) {
            finalUri = compressedUri;
            finalSize = compressedFileStat.size;
          } else {

          }

        } catch (err) {

          showToast("An error occurred while uploading the video", 'error');

          setIsCompressing(false);
          return;
        }

        setIsCompressing(false);

        if (finalSize > maxFileSize) {

          showToast("Video size shouldn't exceed 10MB\nTry uploading a smaller video", 'error');

          return;
        }

        setFile({
          uri: finalUri,
          type: asset.type,
          name: asset.fileName || 'video.mp4',
        });
        setFileType(asset.type);


        try {
          await uploadNewFile(finalUri, asset.type || 'video/mp4');

        } catch (uploadError) {
          showToast("Something went wrong during upload", 'error');
        }

      });
    } catch (error) {

      showToast("Error Selecting Video", 'error');

    }
  };


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



  const uploadNewFile = async (fileUri, mimeType) => {
    try {
      setIsLoading(true);

      if (postData.fileKey) {

        await handleDeleteOldFile(postData.fileKey);

      }


      const uploadResult = await handleUploadFile(fileUri, mimeType);

      if (uploadResult) {
        const { fileKey, thumbnailFileKey, fileUrl } = uploadResult;

        setPostData(prevState => ({
          ...prevState,
          fileKey: fileKey || '',
          thumbnail_fileKey: thumbnailFileKey || '',
        }));

        setVideoUri(fileUrl || fileUri);
      }

    } catch (error) {

      showToast('File upload failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const documentExtensions = [
    DocumentPicker.types.pdf,
    DocumentPicker.types.doc,
    DocumentPicker.types.docx,
    DocumentPicker.types.plainText,
    DocumentPicker.types.csv,
    DocumentPicker.types.ppt,
    DocumentPicker.types.pptx,
    DocumentPicker.types.xls,
    DocumentPicker.types.xlsx,
  ];



  const selectDocument = async () => {
    try {
      const res = await DocumentPicker.pickSingle({ type: documentExtensions });
      if (!res || !res.uri) return;

      const fileStat = await RNFS.stat(res.uri);
      if (fileStat.size > 4 * 1024 * 1024) {
        showToast("File size shouldn't exceeds 5MB limit", 'error');

        return;
      }

      await uploadNewFile(res.uri, res.type || 'application/pdf');
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {

        showToast("Error selecting document", 'error');

      }
    }
  };




  const handleUploadFile = async (fileUri, fileType) => {
    try {
      setIsLoading(true);


      const fileStat = await RNFS.stat(fileUri);
      const fileSize = fileStat.size;


      if (fileType.startsWith('image/') && fileSize > 5 * 1024 * 1024) {
        showToast("Image size shouldn't exceed 5MB", 'error');

        return { fileKey: null, thumbnailFileKey: null };
      }
      if (fileType.startsWith('video/') && fileSize > 10 * 1024 * 1024) {
        showToast("Video size shouldn't exceed 10MB", 'error');
        return { fileKey: null, thumbnailFileKey: null };
      }


      const res = await apiClient.post('/uploadFileToS3', {
        command: 'uploadFileToS3',
        headers: {
          'Content-Type': fileType,
          'Content-Length': fileSize,
        },
      });

      if (res.data.status !== 'success') {
        throw new Error(res.data.errorMessage || 'Failed to get upload URL');
      }

      const uploadUrl = res.data.url;
      const fileKey = res.data.fileKey || '';

      const fileBlob = await uriToBlob(fileUri);
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': fileType },
        body: fileBlob,
      });

      if (uploadRes.status !== 200) {
        throw new Error('Failed to upload file to S3');
      }

      let thumbnailFileKey = null;
      if (fileType.startsWith("video/")) {
        let finalThumbnailToUpload = capturedThumbnailUri;

        if (!finalThumbnailToUpload) {

          finalThumbnailToUpload = await generateVideoThumbnail(fileUri);
        }
        if (finalThumbnailToUpload) {

          thumbnailFileKey = await handleThumbnailUpload(finalThumbnailToUpload, fileKey);
        }
      }

      return { fileKey, thumbnailFileKey };
    } catch (error) {
      showToast("Something went wrong during file upload", 'error');

      return { fileKey: null, thumbnailFileKey: null };
    } finally {
      setIsLoading(false);
    }
  };




  async function uriToBlob(uri) {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  }


  const dispatch = useDispatch();

  const handlePostSubmission = async () => {
    setHasChanges(true);
    setIsLoading(true);

    try {
      const trimmedTitle = stripHtmlTags(postData.title)?.trim();
      const cleanedBody = cleanForumHtml(postData.resource_body?.trim() || '');
      const trimmedConclusion = postData.conclusion?.trim() || '';

      if (!trimmedTitle) {
        showToast("Title field cannot be empty", 'info');
        setIsLoading(false);
        return;
      }

      if (!cleanedBody) {
        showToast("Forum description field cannot be empty", 'info');
        setIsLoading(false);
        return;
      }

      let fileKey = postData.fileKey || '';
      let thumbnailFileKey = postData.thumbnail_fileKey || '';

      if (postData.fileUri && postData.fileType) {

        const uploadResult = await handleUploadFile(postData.fileUri, postData.fileType);

        if (uploadResult) {
          fileKey = uploadResult.fileKey || '';
          thumbnailFileKey = uploadResult.thumbnailFileKey || '';
        }

      }

      const payload = {
        command: "updateResourcePost",
        user_id: myId,
        resource_id: post.resource_id,
        title: trimmedTitle,
        resource_body: cleanedBody,
        conclusion: trimmedConclusion,
        fileKey,
        mediaType: postData.mediaType || '',
        thumbnail_fileKey: thumbnailFileKey,

      };

      const response = await apiClient.post('/updateResourcePost', payload);

      const existingPost = post;
      const updatedFields = {
        user_id: myId,
        resource_id: post.resource_id,
        title: trimmedTitle,
        resource_body: cleanedBody,
        conclusion: trimmedConclusion,
        fileKey,
        mediaType: postData.mediaType || '',
        thumbnail_fileKey: thumbnailFileKey,
      };

      const updatedPostData = { ...existingPost, ...updatedFields };

      if (response.data.status === 'success') {
        EventRegister.emit('onResourcePostUpdated', {
          updatedPost: updatedPostData,
        });
        const postWithMedia = await fetchMediaForPost(updatedPostData)

        setHasChanges(false);

        dispatch(updateResourcePost(postWithMedia));
        showToast("Resource post updated succesfully", 'success');

        navigation.goBack();
      } else {
        throw new Error(response.data.errorMessage || 'Failed to update forum post');
      }
    } catch (error) {
      showToast(error.message, 'error');

    } finally {
      setIsLoading(false);
      setHasChanges(false);
    }
  };

  const fetchMediaForPost = async (post) => {
    const mediaData = { resource_id: post.resource_id };

    if (post.fileKey) {
      try {
        const res = await apiClient.post('/getObjectSignedUrl', {
          command: "getObjectSignedUrl",
          key: post.fileKey,
        });
        console.log('Signed URL response for fileKey:', res.data);

        const url = res.data && (typeof res.data === 'string' ? res.data : res.data.url || res.data.signedUrl);
        if (url && url.length > 0) {
          mediaData.imageUrl = url;

          if (videoExtensions.some((ext) => post.fileKey.toLowerCase().endsWith(ext))) {
            mediaData.videoUrl = url;

            if (post.thumbnail_fileKey) {
              try {
                const thumbRes = await apiClient.post('/getObjectSignedUrl', {
                  command: "getObjectSignedUrl",
                  key: post.thumbnail_fileKey,
                });
                mediaData.thumbnailUrl = thumbRes.data;

                await new Promise((resolve) => {
                  Image.getSize(mediaData.thumbnailUrl, (width, height) => {
                    mediaData.aspectRatio = width / height;
                    resolve();
                  }, resolve);
                });
              } catch (error) {
                mediaData.thumbnailUrl = null;
                mediaData.aspectRatio = 1;
              }
            } else {
              mediaData.thumbnailUrl = null;
              mediaData.aspectRatio = 1;
            }
          } else {
            // Image case
            await new Promise((resolve) => {
              Image.getSize(url, (width, height) => {
                mediaData.aspectRatio = width / height;
                resolve();
              }, resolve);
            });
          }
        } else {

          mediaData.imageUrl = null;
          mediaData.videoUrl = null;
        }
      } catch (error) {

        mediaData.imageUrl = null;
        mediaData.videoUrl = null;
      }
    }

    // Handle author image if exists
    if (post.author_fileKey) {
      try {
        const authorImageRes = await apiClient.post('/getObjectSignedUrl', {
          command: "getObjectSignedUrl",
          key: post.author_fileKey,
        });
        mediaData.authorImageUrl = authorImageRes.data;
      } catch (error) {
        mediaData.authorImageUrl = null;
      }
    }

    return { ...post, ...mediaData };
  };



  const bodyEditorRef = useRef();

  const initialBodyRef = useRef(postData.resource_body);
  const initialTitleRef = useRef(postData.title);

  const [activeEditor, setActiveEditor] = useState('title'); // not 'title'



  const handleBodyFocus = () => {
    setActiveEditor('body');
    bodyEditorRef.current?.focus(); // Focus the body editor
  };


  const stripHtmlTags = (html) =>
    html?.replace(/<\/?[^>]+(>|$)/g, '').trim() || '';

  const cleanForumHtml = (html) => {
    if (!html) return '';

    return html
      // Remove background color and text color styles explicitly
      .replace(/(<[^>]+) style="[^"]*(color|background-color):[^";]*;?[^"]*"/gi, '$1')
      // Remove ALL inline styles
      .replace(/(<[^>]+) style="[^"]*"/gi, '$1')
      // Remove unwanted tags but keep content (like font, span, div, p)
      .replace(/<\/?(font|span|div|p)[^>]*>/gi, '')
      // Remove empty tags like <b></b>
      .replace(/<[^\/>][^>]*>\s*<\/[^>]+>/gi, '')
      // Only allow: b, i, ul, ol, li, a, br (whitelist)
      .replace(/<(?!\/?(b|i|ul|ol|li|a|br)(\s|>|\/))/gi, '&lt;')
      // Keep only href attribute in <a> tags
      .replace(/<a [^>]*href="([^"]+)"[^>]*>/gi, '<a href="$1">');
  };

  const handleTitleChange = (html) => {
    const plainText = stripHtmlTags(html);

    if (!plainText) {
      setPostData((prev) => ({ ...prev, title: "" }));
      return;
    }

    if (/^\s/.test(plainText)) {
      showToast("Leading spaces are not allowed", "error");
      return;
    }

    setPostData((prev) => ({ ...prev, title: plainText }));
  };


  const handleForumBodyChange = (html) => {
    const plainText = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trimStart();

    if (plainText === "") {
      setPostData((prev) => ({ ...prev, resource_body: "" }));
      return;
    }

    if (/^\s/.test(plainText)) {
      showToast("Leading spaces are not allowed", "error");
      return;
    }

    setPostData((prev) => ({ ...prev, resource_body: html }));
  };



  const clearCacheDirectory = async () => {
    try {
      const cacheDir = RNFS.CachesDirectoryPath;  // Get the cache directory path
      const files = await RNFS.readDir(cacheDir); // List all files in the cache directory

      // Loop through all the files in the cache and delete them
      for (const file of files) {
        await RNFS.unlink(file.path);

      }
    } catch (error) {

    }
  };


  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Clean up cache when leaving the screen or tab
        clearCacheDirectory();

      };
    }, [])
  );

  const fileName = file?.name || postData.fileKey?.split('/').pop() || '';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // File type checks
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
  const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
  const isDocument = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext);


  return (

    <SafeAreaView style={styles.container1} >

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePostSubmission}
          style={[
            styles.buttonContainer,
            (!postData.resource_body.trim() || isLoading || isCompressing) && styles.disabledButton,
          ]}
          disabled={!postData.resource_body.trim() || isLoading || isCompressing}
        >
          {isLoading || isCompressing ? (
            <ActivityIndicator size="small" color="#fff" style={styles.activityIndicator} />
          ) : (
            <Text
              style={[
                styles.buttonTextdown,
                (!postData.resource_body.trim() || isLoading || isCompressing) && styles.disabledButtonText1,
              ]}
            >Update</Text>
          )}
        </TouchableOpacity>
      </View>


      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: '20%', }}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileContainer}>
          <View style={styles.imageContainer}>

            <FastImage
              source={{ uri: profile?.imageUrl }}
              style={styles.detailImage}
              resizeMode={FastImage.resizeMode.cover}
              onError={() => { }}
            />
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

        {/* <TextInput
          style={[styles.input, { height: 50, marginBottom: 10, }]}
          multiline
          placeholder="Enter title ..."
          value={postData.title}
          placeholderTextColor="gray"
          onChangeText={(text) => {
            if (text === "") {
              setPostData(prev => ({ ...prev, title: "" }));
              return;
            }

            if (text.startsWith(" ")) {
              showToast("Leading spaces are not allowed", 'error');

              return;
            }

            let trimmedText = text.replace(/^\s+/, "");
            if (text.length > 0 && trimmedText === "") {

              showToast("Leading spaces are not allowed", 'error');

              return;
            }

            setPostData(prev => ({ ...prev, title: trimmedText }));
          }}
        /> */}


        {/* <TextInput
          style={[styles.input, { minHeight: 250, maxHeight: 400 }]}
          multiline
          placeholder="Describe your resource in detail ..."
          value={postData.resource_body}
          placeholderTextColor="gray"
          onChangeText={(text) => {
            if (text === "") {
              setPostData(prev => ({ ...prev, resource_body: "" }));
              return;
            }

            if (text.startsWith(" ")) {
              showToast("Leading spaces are not allowed", 'error');

              return;
            }

            let trimmedText = text.replace(/^\s+/, "");
            if (text.length > 0 && trimmedText === "") {

              showToast("Leading spaces are not allowed", 'error');

              return;
            }

            setPostData(prev => ({ ...prev, resource_body: trimmedText }));
          }}
        /> */}

        <TextInput
          style={[styles.input, {
            minHeight: 50,
            maxHeight: 400,
            marginBottom: 10,
          }]}
          multiline
          placeholder="Enter title ..."
          value={postData.title}
          placeholderTextColor="gray"
          onChangeText={handleTitleChange}
        />


        <RichEditor
          ref={bodyEditorRef}
          useContainer={false}
          style={styles.input}
          initialContentHTML={initialBodyRef.current}
          placeholder="Share your thoughts, questions or ideas..."
          editorInitializedCallback={() => { }}
          onChange={handleForumBodyChange}
          onTouchStart={() => setActiveEditor('body')}
          onFocus={() => handleBodyFocus('body')}
          editorStyle={{
            cssText: `
      * {
        font-size: 15px !important;
        line-height: 20px !important;
        color: #000 !important; 
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

    

        {isVideo && file?.uri || imageUrl && (
          <View style={styles.mediaContainer}>
            <Video
              source={{ uri: file?.uri || imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"

            />
            <TouchableOpacity onPress={handleRemoveMedia} style={styles.closeIcon}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
        )}


        {isImage && file?.uri || imageUrl ? (
          <View style={{ width: '100%', height: 250, borderRadius: 10, overflow: 'hidden' }}>
            <FastImage
              source={{ uri: file?.uri || imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
            <TouchableOpacity onPress={handleRemoveMedia} style={styles.closeIcon}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: 10 }}>
            <Text style={styles.fileName}>{fileName || 'Unknown File'}</Text>
            {uri ? (
              <TouchableOpacity onPress={() => Linking.openURL(uri)}>
                <Text style={styles.viewFileText}>View Document</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {!(file?.uri || postData.fileKey || imageUrl) && (
          <TouchableOpacity
            activeOpacity={1}
            style={styles.uploadButton}
            onPress={handleFileChange}
          >
            <Icon name="cloud-upload-outline" size={30} color="#000" />
            <Text style={{ color: 'black', }}>Click to upload a file</Text>

          </TouchableOpacity>
        )}


        <PlayOverlayThumbnail
          ref={overlayRef}
          thumbnailUri={thumbnailUri}
          playIcon={playIcon}

        />
        <View style={AppStyles.UpdateContainer}>
          <TouchableOpacity
            onPress={handlePostSubmission}
            style={[
              AppStyles.buttonContainer1,
              (!postData.resource_body.trim() || isLoading || isCompressing) && styles.disabledButton1,
            ]}
            disabled={isCompressing}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ccc" />
            ) : (
              <Text
                style={[
                  styles.buttonTextdown,
                  (!postData.resource_body.trim() || isLoading || isCompressing) && styles.disabledButtonText,
                ]}
              >Update</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[AppStyles.cancelBtn]}>
            <Text style={[styles.buttonTextdown, { color: '#FF0000' }]}  >Cancel</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAwareScrollView>



      <Message3
        visible={showModal}
        onClose={() => setShowModal(false)}  // Optional if you want to close it from outside
        onCancel={handleStay}  // Stay button action
        onOk={handleLeave}  // Leave button action
        title="Are you sure?"
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
    padding: 10,
    backgroundColor: 'whitesmoke',
  },
  buttonContainer1: {
    width: 80,
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRadius: 20,
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: '#075cab',
    borderWidth: 0.5,
    backgroundColor: '#ffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  container2: {
    padding: 10,
    backgroundColor: 'whitesmoke',
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
  },

  buttonTextdown: {
    textAlign: 'center',
    fontSize: 16,
    color: '#075cab',
    fontWeight: '600',
  },
  disabledButton1: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButtonText: {
    color: '#ccc',
  },
  disabledButtonText1: {
    color: '#fff',
  },
  closeIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
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
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderStyle: 'dotted',
    backgroundColor: 'white',
    borderRadius: 10
  },

  container1: {
    flex: 1,
    backgroundColor: 'whitesmoke',
  },
  title: {
    marginBottom: 5,
    color: 'black',
    fontSize: 15,
    fontWeight: '500',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    textAlignVertical: 'top',
    color: 'black',
    textAlign: 'justify',
    backgroundColor: 'white',
    marginHorizontal: 10,
    minHeight: 300,
    maxHeight: 400,
  },
  inputTitle: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    textAlignVertical: 'top',
    color: 'black',
    textAlign: 'justify',
    backgroundColor: 'white',
    marginHorizontal: 10,
    minHeight: 50,
    maxHeight: 250,
    marginBottom: 10
  },

  cancel: {
    color: "black"
  },

  heading: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 20,
    color: "#075cab",
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'contain',
    alignSelf: 'center'
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',

  },

  imageContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  mediaContainer: {

    width: '100%',
    height: 250,
    borderRadius: 10,
    overflow: 'hidden',
  },
  buttonContainer: {
    width: 80,
    padding: 10,
    borderRadius: 10,
    // backgroundColor: '#075CAB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  imageContainer: {
    width: 40,
    height: 40,
    borderRadius: 80,
    alignSelf: 'center',
    justifyContent: 'center',
    marginRight: 10

  },
  detailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    overflow: 'hidden',

  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
    borderColor: '#ccc'
  },
  disabledButton1: {

    opacity: 0.6,
    borderColor: '#ccc'
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
    color: 'black',
    fontWeight: '400'
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 10,
  },
  button: {
    fontSize: 16,
    color: '#075cab',
    fontWeight: '600',
  },

  butttonDelte: {
    alignSelf: 'center', // Centers the button
    width: 90, // Adjusts the button width to be smaller
    paddingVertical: 5,

    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#FF0000',
    borderWidth: 1,
    marginVertical: 10,

  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10

  },

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});



export default ResourcesEditScreen

