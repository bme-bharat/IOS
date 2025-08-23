


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, ScrollView, TextInput, Alert, SafeAreaView, ActivityIndicator, } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import DocumentPicker from 'react-native-document-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Message3 from '../../components/Message3';
import RNFS from 'react-native-fs';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { updateResourcePost } from '../Redux/Resource_Actions';
import { useDispatch, useSelector } from 'react-redux';
import PlayOverlayThumbnail from '../Forum/Play';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';
import { EventRegister } from 'react-native-event-listeners';
import apiClient from '../ApiClient';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import { MediaPreview } from '../helperComponents/MediaPreview';
import { MediaPickerButton } from '../helperComponents/MediaPickerButton';
import { useMediaPicker } from '../helperComponents/MediaPicker';
import { deleteS3KeyIfExists } from '../helperComponents/s3Helpers';
import { uploadFromBase64 } from '../Forum/VideoParams';

const videoExtensions = [
  '.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm',
  '.m4v', '.3gp', '.3g2', '.f4v', '.f4p', '.f4a', '.f4b', '.qt', '.quicktime'
];
const ResourcesEditScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { post, imageUrl } = route.params;
  console.log('post', post)
  const [signedUrl, setSignedUrl] = useState(
    post?.signedUrl?.includes('image.jpg') ? '' : imageUrl
  );
  const profile = useSelector(state => state.CompanyProfile.profile);
  const { myId, myData } = useNetwork();


  const scrollViewRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [thumbnailUri, setThumbnailUri] = useState(null);
  const [overlayUri, setOverlayUri] = useState(null);

  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [mediaMeta, setMediaMeta] = useState(null);
  const handleRemoveMedia = () => {
    setFile(null);
    setFileType('');
    setMediaMeta(null);
    setSignedUrl('');

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
    includeDocuments: true,
    includeCamera: false,
    mediaType: 'mixed',
    maxImageSizeMB: 5,
    maxVideoSizeMB: 10,
  });



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



  async function uriToBlob(uri) {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  }

  const sanitizeHtmlBody = (html) => {
    const cleaned = cleanForumHtml(html); // your existing cleaner

    return cleaned
      .replace(/<div><br><\/div>/gi, '') // remove empty div lines
      .replace(/<p>(&nbsp;|\s)*<\/p>/gi, '') // remove empty <p>
      .replace(/<div>(&nbsp;|\s)*<\/div>/gi, '') // remove empty <div>
      .replace(/(<br\s*\/?>\s*){2,}/gi, '<br>') // collapse multiple <br> into one
      .replace(/^(<br\s*\/?>)+/gi, '') // remove leading <br>
      .replace(/(<br\s*\/?>)+$/gi, '') // remove trailing <br>
      .trim();
  };


  const dispatch = useDispatch();

  const uploadSelectedMedia = async (media, thumbnailUri) => {
    console.log('📥 Starting uploadSelectedMedia');

    try {
      if (!media?.uri || !media?.type) {
        console.warn('⚠️ Invalid media object:', media);
        return null;
      }

      const cleanedUri = media.uri.replace('file://', '');
      const fileStat = await RNFS.stat(cleanedUri);
      const fileSize = fileStat.size;

      console.log(`📁 Media: ${media.type}, Size: ${fileSize} bytes`);

      const isImage = media.type.startsWith('image/');
      const isVideo = media.type.startsWith('video/');

      if (isImage && fileSize > 5 * 1024 * 1024) {
        showToast("Image size shouldn't exceed 5MB", 'error');
        return null;
      }

      if (isVideo && fileSize > 10 * 1024 * 1024) {
        showToast("Video size shouldn't exceed 10MB", 'error');
        return null;
      }

      const { data } = await apiClient.post('/uploadFileToS3', {
        command: 'uploadFileToS3',
        headers: {
          'Content-Type': media.type,
          'Content-Length': fileSize,
        },
      });

      if (data.status !== 'success') throw new Error('Failed to get upload URL');


      await fetch(data.url, {
        method: 'PUT',
        headers: { 'Content-Type': media.type },
        body: await uriToBlob(media.uri),
      });

      let thumbnailFileKey = null;

      if (file.type.startsWith("video/")) {

        thumbnailFileKey = await uploadFromBase64(overlayUri, data.fileKey);

      }

      return {
        fileKey: data.fileKey,
        thumbnailFileKey,
      };
    } catch (err) {
      console.error('❌ Media upload failed', err);
      showToast("Media upload failed", 'error');
      return null;
    }
  };

  const handlePostSubmission = async () => {
    setHasChanges(true);
    setIsLoading(true);

    try {
      const trimmedTitle = stripHtmlTags(postData.title)?.trim();
      const cleanedBody = sanitizeHtmlBody(postData.resource_body?.trim() || '');

      if (!trimmedTitle) {
        showToast("Title field cannot be empty", 'info');
        setIsLoading(false);
        return;
      }

      if (!cleanedBody) {
        showToast("Resource description field cannot be empty", 'info');
        setIsLoading(false);
        return;
      }

      let fileKey = '';
      let thumbnailFileKey = '';

      const mediaWasRemoved = !postData.signedUrl && !file;
      const mediaWasReplaced = !!file;

      if (mediaWasReplaced) {
        // ✅ Media was changed: delete old & upload new
        if (post.fileKey) await deleteS3KeyIfExists(post.fileKey);
        if (post.thumbnail_fileKey) await deleteS3KeyIfExists(post.thumbnail_fileKey);

        const uploaded = await uploadSelectedMedia(file, thumbnailUri);
        if (!uploaded) throw new Error('Upload failed');

        fileKey = uploaded.fileKey;
        thumbnailFileKey = uploaded.thumbnailFileKey || '';
      } else if (mediaWasRemoved) {
        // ✅ Media was removed
        if (post.fileKey) await deleteS3KeyIfExists(post.fileKey);
        if (post.thumbnail_fileKey) await deleteS3KeyIfExists(post.thumbnail_fileKey);

        fileKey = '';
        thumbnailFileKey = '';
      } else {
        // ✅ Media unchanged
        fileKey = post.fileKey || '';
        thumbnailFileKey = post.thumbnail_fileKey || '';
      }

      const extraDataToSend =
        (file || fileKey)
          ? (mediaMeta || post.extraData || {})
          : {};

      const payload = {
        command: "updateResourcePost",
        user_id: myId,
        resource_id: post.resource_id,
        title: trimmedTitle,
        resource_body: cleanedBody,
        fileKey,
        thumbnail_fileKey: thumbnailFileKey,
        extraData: extraDataToSend,
      };

      const response = await apiClient.post('/updateResourcePost', payload);

      const updatedPostData = {
        ...post,
        title: trimmedTitle,
        resource_body: cleanedBody,
        fileKey,
        thumbnail_fileKey: thumbnailFileKey,
        extraData: extraDataToSend,
      };

      if (response.data.status === 'success') {
        EventRegister.emit('onResourcePostUpdated', {
          updatedPost: updatedPostData,
        });

        const postWithMedia = await fetchMediaForPost(updatedPostData);
        dispatch(updateResourcePost(postWithMedia));

        setFile(null);
        setFileType('');
        setThumbnailUri(null);
        setMediaMeta(null);
        setSignedUrl('');
        setHasChanges(false);

        showToast("Resource post updated successfully", 'success');
        navigation.goBack();
      } else {
        throw new Error(response.data.errorMessage || 'Failed to update resource post');
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
        <View style={{ paddingHorizontal: 10, }}>
          <MediaPreview
            uri={file?.uri || signedUrl}
            type={fileType || post?.extraData?.type}
            name={file?.name || post?.extraData?.fileName}
            onRemove={handleRemoveMedia}
          />
        </View>

        {!(file || signedUrl) && (
          <View style={{ paddingHorizontal: 10, }}>
            <MediaPickerButton
              onPress={() => showMediaOptions()}
              isLoading={isCompressing}
            />
          </View>
        )}


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

  container1: {
    flex: 1,
    backgroundColor: 'whitesmoke',
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
    color: 'gray',
    fontWeight: '400'
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
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

