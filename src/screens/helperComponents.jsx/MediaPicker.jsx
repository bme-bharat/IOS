import React, { useState, useRef } from 'react';
import { Alert, Platform, ActionSheetIOS, Linking } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import DocumentPicker from 'react-native-document-picker';
import { compressVideo, generateVideoThumbnail } from '../Forum/VideoParams';
import { showToast } from '../AppUtils/CustomToast';

export const useMediaPicker = ({
  onMediaSelected,
  onError,
  allowMultiple = false,
  maxImageSizeMB = 5,
  maxVideoSizeMB = 10,
  maxVideoDuration = 1800,
  includeDocuments = false,
  includeVideos = true,
  includeCamera = true,
  mediaType = 'mixed', // 'photo', 'video', or 'mixed'
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const overlayRef = useRef();

  const calculateAspectRatio = (width, height) => {
    if (!width || !height || height <= 0) return 1;
    return width / height;
  };

  const handleMediaSelection = async (type, fromCamera = false) => {
    try {
      if (type === 'document' || (type === 'mixed' && includeDocuments)) {
        await handleDocumentSelection();
        return;
      }
  
      if ((type === 'video' || type === 'mixed') && !includeVideos) {
        return;
      }
  
      const options = {
        mediaType: type,
        quality: 1,
        selectionLimit: allowMultiple ? 0 : 1,
        includeExtra: true,
      };
  
      const launcher = fromCamera ? launchCamera : launchImageLibrary;
  
      launcher(options, async (response) => {
        if (response.didCancel) return;
  
        if (response.errorCode) {

          if (response.errorCode === 'permission') {
            if (Platform.OS === 'ios') {
              Alert.alert(
                'Permission Needed',
                'Please allow access to camera/photos in Settings to continue.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Turn On',
                    onPress: () => {
                      Linking.openSettings();
                    },
                  },
                ],
              );
            } else {
          
                showToast('Permission denied. Please enable it in settings.', 'error');
              
            }
  
            return;
          }
  
          if (response.errorCode === 'camera_unavailable') {
            showToast('Camera is not available on this device.', 'error');
            return;
          }
  
          showToast(`Media Picker failed: ${response.errorMessage || 'Unknown error'}`, 'error');
          return;
        }
  
        const asset = response.assets?.[0];
        if (!asset) {
          showToast('No media file found.', 'error');
          return;
        }
  
        try {
          if (type === 'photo' || asset.type?.startsWith('image')) {
            await handleImageSelection(asset);
          } else if (type === 'video' || asset.type?.startsWith('video')) {
            await handleVideoSelection(asset);
          } else if (includeDocuments) {
            await handleDocumentSelection(asset);
          }
        } catch (innerError) {
          console.error('Error during media processing:', innerError);
          showToast(innerError.message || 'Failed to process selected media.', 'error');
        }
      });
    } catch (error) {
      console.error('Unexpected Media Selection Error:', error);
      showToast(error.message || 'Something went wrong while selecting media', 'error');
    }
  };
  
  

  const handleImageSelection = async (asset) => {
    try {
      let fileType = asset.type || 'image/jpeg';
      if (fileType === 'image/heic' || fileType === 'image/heif') {
        fileType = 'image/jpeg';
      }
  
      const originalFilePath = asset.uri.replace('file://', '');
      const originalStats = await RNFS.stat(originalFilePath);
      const originalFileSize = originalStats.size;
      console.log('originalFileSize', originalFileSize);
  
      const aspectRatio = calculateAspectRatio(asset.width, asset.height);
  
      const MAX_DIMENSION = 1280;
      const scale = Math.min(MAX_DIMENSION / asset.width, MAX_DIMENSION / asset.height, 1);
      const targetWidth = Math.round(asset.width * scale);
      const targetHeight = Math.round(asset.height * scale);
  
      const JPEG_QUALITY = originalFileSize > 2 * 1024 * 1024 ? 60 : 70;
  
      const compressedImage = await ImageResizer.createResizedImage(
        asset.uri,
        targetWidth,
        targetHeight,
        'JPEG',
        JPEG_QUALITY
      );
  
      const compressedFilePath = compressedImage.uri.replace('file://', '');
      const compressedStats = await RNFS.stat(compressedFilePath);
      const compressedFileSize = compressedStats.size;
      console.log('compressedFileSize', compressedFileSize);
  
      if (compressedFileSize > maxImageSizeMB * 1024 * 1024) {
        showToast(`Image size shouldn't exceed ${maxImageSizeMB}MB`, 'error');
        return;
      }
  
      const processedFile = {
        uri: compressedImage.uri,
        type: fileType,
        name: asset.fileName ? asset.fileName.replace(/\.[^/.]+$/, '.jpeg') : 'image.jpeg',
      };
  
      const meta = {
        width: asset.width,
        height: asset.height,
        fileName: asset.fileName,
        type: asset.type,
        mimeType: asset.type,
        aspectRatio,
      };
  
      onMediaSelected(processedFile, meta);
    } catch (error) {
      handleError(error.message);
    }
  };
  

  const handleVideoSelection = async (asset) => {
    try {
      const totalSeconds = Math.floor(asset.duration || 0);
      if (totalSeconds > maxVideoDuration) {
        showToast(`Please select a video of ${Math.floor(maxVideoDuration / 60)} minutes or shorter`, "error");
        return;
      }

      const aspectRatio = calculateAspectRatio(asset.width, asset.height);
      setIsCompressing(true);
      showToast("Processing video...", "info");

      const compressedUri = await compressVideo(asset.uri);
      setIsCompressing(false);
      if (!compressedUri) return;

      const compressedStats = await RNFS.stat(compressedUri.replace('file://', ''));
      const compressedSize = compressedStats.size;

      if (compressedSize > maxVideoSizeMB * 1024 * 1024) {
        showToast(`Video size shouldn't exceed ${maxVideoSizeMB}MB`, 'error');
        return;
      }

      const previewThumbnail = await generateVideoThumbnail(compressedUri);

      let finalThumbnailUri = previewThumbnail;
      // if (overlayRef?.current?.capture) {
      //   try {
      //     const overlayThumbnailUri = await overlayRef.current.capture();
      //     if (overlayThumbnailUri) {
      //       finalThumbnailUri = overlayThumbnailUri;
      //     } else {
      //       console.warn("⚠️ Overlay capture returned null, using default thumbnail");
      //     }
      //   } catch (err) {
      //     console.warn("⚠️ Failed to generate overlay thumbnail:", err.message);
      //   }
      // }

      const processedFile = {
        uri: compressedUri,
        type: asset.type,
        name: asset.fileName || 'video.mp4',
      };

      const meta = {

        width: asset.width,
        height: asset.height,
        fileName: asset.fileName,
        type: asset.type,
        mimeType: asset.type,
        aspectRatio,
      };

      onMediaSelected(processedFile, meta, finalThumbnailUri);
    } catch (error) {
      setIsCompressing(false);
      handleError(error.message);
    }
  };


  const handleDocumentSelection = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: DocumentPicker.types.allFiles,
        copyTo: 'cachesDirectory',
      });

      if (!res || !res.uri) return;

      const mimeType = res.type || '';

      // ❌ Reject images and videos
      if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
        showToast('Please select only document files (no images/videos)', 'error');
        return;
      }

      const filePath = res.fileCopyUri?.replace('file://', '') || res.uri.replace('file://', '');
      const stats = await RNFS.stat(filePath);

      const processedFile = {
        uri: res.fileCopyUri || res.uri,
        type: mimeType,
        name: res.name,
      };

      const meta = {
        fileName: res.name,
        type: mimeType,
        mimeType: mimeType,
      };

      onMediaSelected(processedFile, meta);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        handleError(err.message);
      }
    }
  };



  const showMediaOptions = (includeRemove = false, onRemove = null) => {
    const options = [];

    if (includeCamera && (mediaType === 'photo' || mediaType === 'mixed')) {
      options.push({
        text: "Take Photo",
        onPress: () => handleMediaSelection('photo', true)
      });
    }

    if (mediaType === 'photo' || mediaType === 'mixed') {
      options.push({
        text: "Choose Photo",
        onPress: () => handleMediaSelection('photo')
      });
    }

    if (includeVideos && (mediaType === 'video' || mediaType === 'mixed')) {
      options.push({
        text: "Choose Video",
        onPress: () => handleMediaSelection('video')
      });
    }

    if (includeDocuments) {
      options.push({
        text: "Choose File",
        onPress: () => handleMediaSelection('document')
      });
    }

    if (includeRemove && onRemove) {
      options.push({
        text: "Remove",
        onPress: onRemove,
        style: "destructive"
      });
    }

    options.push({ text: "Cancel", style: "cancel" });

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options.map(option => option.text),
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: options.findIndex(opt => opt.style === "destructive"),
        },
        (buttonIndex) => {
          const selectedOption = options[buttonIndex];
          if (selectedOption?.onPress) selectedOption.onPress();
        }
      );
    } else {
      Alert.alert(
        "Select Media",
        "Choose an option",
        options,
      );
    }
  };

  const handleError = (message) => {
    console.error("Media Picker Error:", message);
    if (onError) onError(message);
    showToast(message || "Something went wrong", "error");
  };

  return {
    handleMediaSelection,
    showMediaOptions,
    isCompressing,
    overlayRef,
  };
};