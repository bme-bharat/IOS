// src/utils/videoUtils.js

import { Alert } from 'react-native';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import { createThumbnail } from 'react-native-create-thumbnail';
import Compressor from 'react-native-compressor';
import { launchImageLibrary } from 'react-native-image-picker';
import { showToast } from '../AppUtils/CustomToast';


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
    return (Number(stats.size) / (1024 * 1024)).toFixed(1); // in MB
  } catch (error) {
    console.warn('⚠️ Failed to get file size:', error);
    return '0';
  }
};

export const compressVideo = async (videoUri, attempt = 1) => {
  try {
    const originalSize = parseFloat(await getFileSizeMB(videoUri));

    const meta = await createThumbnail({
      url: videoUri.replace('file://', ''),
      timeStamp: 1000,
    });

    let width = meta?.width || 1280;
    let height = meta?.height || 720;
    const durationSec = 10;
    const fps = meta?.fps && meta.fps > 0 ? Math.min(meta.fps, 60) : 30;

    const estimatedBitrate = ((originalSize * 8 * 1024 * 1024) / durationSec).toFixed(0);
    console.log(`📊 Original Resolution: ${width}x${height}`);
    console.log(`📊 Estimated Bitrate: ${estimatedBitrate} bps`);
    console.log(`📊 FPS: ${fps}`);


    const qualityPresets = [
      { scale: 1.0, bitrateFactor: 0.3 }, 
      { scale: 0.75, bitrateFactor: 0.2 }, 
      { scale: 0.5, bitrateFactor: 0.15 },
    ];

    const { scale, bitrateFactor } = qualityPresets[attempt - 1] || qualityPresets[2];

    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);
    let targetBitrate = Math.floor(estimatedBitrate * bitrateFactor);

    if (targetBitrate < 600_000) targetBitrate = 600_000;

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
    const compressedSize = parseFloat(await getFileSizeMB(compressedUri));

    console.log(`✅ Compression Complete`);
    console.log(`📦 Compressed Size: ${compressedSize} MB`);
    console.log(`🎞️ Compressed URI: ${compressedUri}`);

    const MAX_ALLOWED_SIZE = 10;

    if (compressedSize > MAX_ALLOWED_SIZE && attempt < 3) {
      return await compressVideo(compressedUri, attempt + 1);
    }

    if (compressedSize > MAX_ALLOWED_SIZE) {
      showToast("Video too large even after compression. Please select a file under 10 MB.", "error");
      return null;
    }

    return compressedUri;
  } catch (error) {
    console.error('❌ Video compression failed:', error);
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
