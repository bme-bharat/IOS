// src/utils/videoUtils.js

import { Alert } from 'react-native';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import { createThumbnail } from 'react-native-create-thumbnail';
import Compressor from 'react-native-compressor';
import { launchImageLibrary } from 'react-native-image-picker';
import { showToast } from '../AppUtils/CustomToast';
import apiClient from '../ApiClient';

async function uriToBlob(uri) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
}

export const moveToPersistentStorage = async (videoUri) => {
  try {
    const fileName = videoUri.split('/').pop();
    const fileExtension = fileName.split('.').pop();
    const baseName = fileName.replace(`.${fileExtension}`, '');
    let newPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

    let counter = 1;
    while (await RNFS.exists(newPath)) {
      newPath = `${RNFS.DocumentDirectoryPath}/${baseName}_${counter}.${fileExtension}`;
      counter++;
    }

    await RNFS.moveFile(videoUri.replace("file://", ""), newPath);

    return `file://${newPath}`;
  } catch (error) {

    return videoUri;
  }
};

export const generateVideoThumbnail = async (videoUri) => {
  try {
    const formattedUri = videoUri.startsWith("file://") ? videoUri : `file://${videoUri}`;

    const result = await createThumbnail({
      url: formattedUri.replace('file://', ''),
      timeStamp: 1000,
    });

    if (!result?.path) {
      throw new Error('Thumbnail generation failed');
    }

    return `file://${result.path}`;
  } catch (error) {

    return null;
  }
};

export const captureFinalThumbnail = async (overlayRef) => {
  try {
    const uri = await overlayRef.current.capture();

    return uri;
  } catch (error) {

    return null;
  }
};

const getFileSizeMB = async (uri) => {
  try {
    const stats = await RNFS.stat(uri.replace('file://', ''));
    return parseFloat((Number(stats.size) / (1024 * 1024)).toFixed(2));
  } catch {
    return 0;
  }
};


export const compressVideo = async (videoUri, attempt = 1) => {
  try {
    const MAX_ALLOWED_SIZE_MB = 10;

    const originalSizeMB = await getFileSizeMB(videoUri);

    const meta = await createThumbnail({
      url: videoUri.replace('file://', ''),
      timeStamp: 1000,
    });

    const width = meta?.width || 1280;
    const height = meta?.height || 720;
    const durationSec = meta?.duration ? meta.duration / 1000 : 10; // fallback to 10s
    const fps = meta?.fps && meta.fps > 0 ? Math.min(meta.fps, 60) : 30;

    const estimatedBitrate = ((originalSizeMB * 8 * 1024 * 1024) / durationSec); // bits per second

    console.log(`📊 Video Meta:
      - Resolution: ${width}x${height}
      - Duration: ${durationSec}s
      - FPS: ${fps}
      - Original Size: ${originalSizeMB} MB
      - Estimated Bitrate: ${Math.round(estimatedBitrate)} bps
    `);

    // Aggressive compression presets
    const presets = [
      { scale: 0.6, bitrateFactor: 0.18 },
      { scale: 0.45, bitrateFactor: 0.14 },
      { scale: 0.35, bitrateFactor: 0.1 },
    ];

    const { scale, bitrateFactor } = presets[attempt - 1] || presets[2];

    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);
    let targetBitrate = Math.floor(estimatedBitrate * bitrateFactor);

    // Clamp bitrate between 500Kbps and 1.2Mbps
    if (targetBitrate < 500_000) targetBitrate = 500_000;
    if (targetBitrate > 1_200_000) targetBitrate = 1_200_000;

    const compressionSettings = {
      compressionMethod: 'manual',
      bitrate: targetBitrate,
      maxWidth: targetWidth,
      maxHeight: targetHeight,
      fps,
      progressDivider: 5,
    };

    console.log('🛠️ Compression Settings:', compressionSettings);

    const compressedUri = await Compressor.Video.compress(videoUri, compressionSettings);
    const compressedSizeMB = await getFileSizeMB(compressedUri);

    console.log(`✅ Compressed URI: ${compressedUri}`);
    console.log(`📦 Compressed Size: ${compressedSizeMB} MB`);

    if (compressedSizeMB > MAX_ALLOWED_SIZE_MB && attempt < 3) {
      console.log(`📉 Retry #${attempt + 1} — Still too large`);
      return await compressVideo(compressedUri, attempt + 1);
    }

    if (compressedSizeMB > MAX_ALLOWED_SIZE_MB) {
      showToast("Video is too large even after compression. Try trimming it shorter.", "error");
      return null;
    }

    return compressedUri;
  } catch (error) {
    console.error('❌ Compression failed:', error);
    return videoUri;
  }
};




export const resizeImage = async (uri) => {
  try {
    const resized = await ImageResizer.createResizedImage(
      uri,
      1080,
      1080,
      'JPEG',
      80
    );
    return resized.uri;
  } catch {
    return uri;
  }
};

export const selectVideo = async ({
  isCompressing,
  setIsCompressing,
  setThumbnailUri,
  setCapturedThumbnailUri,
  setFile,
  setFileType,
  overlayRef,
  setMediaMeta,
}) => {
  if (isCompressing) {
    console.log('[selectVideo] Upload already in progress');
    showToast("Uploading is already in progress", "Info");
    return;
  }

  try {
    const options = {
      mediaType: 'video',
      quality: 1,
      videoQuality: 'high',
    };

    console.log('[selectVideo] Launching video picker');
    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('[selectVideo] User cancelled video picker');
        return;
      }

      if (response.errorCode) {
        console.error('[selectVideo] Error picking video:', response.errorMessage);
        showToast("Something went wrong", "error");
        return;
      }

      const asset = response.assets[0];
      const totalSeconds = Math.floor(asset.duration || 0);
      console.log(`[selectVideo] Selected video duration: ${totalSeconds} seconds`);

      if (totalSeconds > 1800) {
        console.warn('[selectVideo] Video too long:', totalSeconds);
        showToast("Please select a video of 30 minutes or shorter", "error");
        return;
      }

      try {
        const originalUri = asset.uri.replace('file://', '');
        const originalStats = await RNFS.stat(originalUri);
        const originalSize = originalStats.size;
        const originalWidth = asset.width;
        const originalHeight = asset.height;

        console.log('[selectVideo] Original video size:', originalSize);
        console.log('[selectVideo] Dimensions:', originalWidth, originalHeight);

        const persistentUri = await moveToPersistentStorage(asset.uri);
        console.log('[selectVideo] Persistent URI:', persistentUri);

        const previewThumbnail = await generateVideoThumbnail(persistentUri);
        console.log('[selectVideo] Generated preview thumbnail:', previewThumbnail);

        if (previewThumbnail) {
          setThumbnailUri(previewThumbnail);

          setTimeout(async () => {
            try {
              const finalThumb = await captureFinalThumbnail(overlayRef);
              if (finalThumb) {
                const resizedThumbUri = await resizeImage(finalThumb);
                console.log('[selectVideo] Captured and resized thumbnail:', resizedThumbUri);
                setCapturedThumbnailUri(resizedThumbUri);
              } else {
                console.warn('[selectVideo] Final thumbnail capture failed');
              }
            } catch (err) {
              console.error('[selectVideo] Error capturing final thumbnail:', err);
            }
          }, 300);
        }

        setIsCompressing(true);
        showToast("Uploading Video\nThis may take a moment..", "info");
        console.log('[selectVideo] Starting compression...');

        const compressedUri = await compressVideo(persistentUri);
        setIsCompressing(false);

        if (!compressedUri) {
          console.error('[selectVideo] Compression failed');
          return;
        }

        const compressedStats = await RNFS.stat(compressedUri.replace('file://', ''));
        const compressedSize = compressedStats.size;
        console.log('[selectVideo] Compressed video size:', compressedSize);

        setFile({
          uri: compressedUri,
          type: asset.type,
          name: asset.fileName || 'video.mp4',
        });
        setFileType(asset.type);

        const meta = {
          originalSize: originalSize,
          compressedSize: compressedSize,
          width: originalWidth,
          height: originalHeight,
          fileName: asset.fileName,
          type: asset.type,
          duration: asset.duration,
        };

        console.log('[selectVideo] Media metadata:', meta);
        setMediaMeta(meta);
      } catch (innerError) {
        setIsCompressing(false);
        console.error('[selectVideo] Inner error:', innerError);
        showToast("Something went wrong", "error");
      }
    });
  } catch (error) {
    setIsCompressing(false);
    console.error('[selectVideo] Outer error:', error);
    showToast("Something went wrong", "error");
  }
};


  export const saveBase64ToFile = async (dataUri) => {
    const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, "");
    const filePath = `${RNFS.CachesDirectoryPath}/overlay-thumb-${Date.now()}.jpg`;

    try {
      await RNFS.writeFile(filePath, base64Data, "base64");
      console.log("✅ [saveBase64ToFile] Saved to:", filePath);
      return `file://${filePath}`;
    } catch (err) {
      console.error("❌ [saveBase64ToFile] Failed:", err);
      throw err;
    }
  };

  export const uploadFromBase64 = async (dataUri, fileKey) => {
    try {
      const fileUri = await saveBase64ToFile(dataUri);
      console.log("📤 Uploading file from base64 ->", fileUri);
      return await handleThumbnailUpload(fileUri, fileKey);
    } catch (err) {
      console.error("❌ [uploadFromBase64] Failed:", err);
      return null;
    }
  };

export const handleThumbnailUpload = async (thumbnailUri, fileKey) => {
  try {
    // ✅ Step 1: Get thumbnail file size
    const thumbStat = await RNFS.stat(thumbnailUri);
    const thumbBlob = await uriToBlob(thumbnailUri);

    // Create thumbnail file key
    const thumbnailFileKey = `thumbnail-${fileKey}`;

    // ✅ Step 2: Request upload URL for thumbnail
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

    // ✅ Step 3: Upload Thumbnail
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: thumbBlob,
    });

    if (uploadRes.status !== 200) {
      throw new Error('Failed to upload thumbnail to S3');
    }


    return thumbnailFileKey; // Return the thumbnail file key
  } catch (error) {

    return null;
  }
};