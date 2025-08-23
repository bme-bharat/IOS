

import { Image } from 'react-native';
import apiClient from '../ApiClient';
import { getSignedUrl } from '../helperComponents/signedUrls';
import maleImage from '../../images/homepage/dummy.png';
import femaleImage from '../../images/homepage/female.jpg';
import companyImage from '../../images/homepage/buliding.jpg';

const withTimeout = (promise, timeout = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeout)
    ),
  ]);
};

export const fetchCommentCount = async (forum_id) => {
  if (!forum_id) return 0;

  try {
    const res = await withTimeout(
      apiClient.post('/getForumCommentsCount', {
        command: 'getForumCommentsCount',
        forum_id, // ✅ singular, not plural
      }),
      10000
    );

    return res?.data?.count ?? 0;
  } catch (error) {
   
    return 0;
  }
};


// export const fetchMediaForPost = async (input) => {
//   const posts = Array.isArray(input) ? input : [input]; 

//   const defaultImageUriCompany = Image.resolveAssetSource(companyImage).uri;
//   const defaultImageUriFemale = Image.resolveAssetSource(femaleImage).uri;
//   const defaultImageUriMale = Image.resolveAssetSource(maleImage).uri;

//   const videoExtensions = [
//     '.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm',
//     '.m4v', '.3gp', '.3g2', '.f4v', '.f4p', '.f4a', '.f4b', '.qt', '.quicktime'
//   ];

//   const getAspectRatio = async (uri) => {
//     return new Promise((resolve) => {
//       Image.getSize(uri, (width, height) => resolve(width / height), () => resolve(1));
//     });
//   };

//   const getAuthorImage = async (post) => {
//     let authorImageUrl = null;

//     if (post.author_fileKey) {
//       try {
//         const res = await getSignedUrl('author', post.author_fileKey);
//         authorImageUrl = res?.author;
//       } catch (err) {
//         console.warn('Author image fetch failed:', err);
//       }
//     }

//     if (!authorImageUrl) {
//       const userType = (post.user_type || '').toLowerCase();
//       const gender = (post.author_gender || '').toLowerCase();

//       if (userType === 'company') return defaultImageUriCompany;
//       if (userType === 'users' && gender === 'female') return defaultImageUriFemale;
//       return defaultImageUriMale;
//     }

//     return authorImageUrl;
//   };

//   const results = await Promise.all(
//     posts.map(async (post) => {
//       const mediaData = { forum_id: post.forum_id };
//       const fileKey = post.fileKey?.toLowerCase();

//       if (fileKey) {
//         try {
//           const res = await getSignedUrl('file', post.fileKey);
//           const url = res?.file;

//           if (url) {
//             const isVideo = videoExtensions.some(ext => fileKey.endsWith(ext));

//             if (isVideo) {
//               mediaData.videoUrl = url;

//               if (post.thumbnail_fileKey) {
//                 try {
//                   const thumbRes = await getSignedUrl('thumb', post.thumbnail_fileKey);
//                   mediaData.thumbnailUrl = thumbRes?.thumb || null;
//                 } catch {
//                   mediaData.thumbnailUrl = null;
//                 }
//               }

//               mediaData.aspectRatio = mediaData.thumbnailUrl
//                 ? await getAspectRatio(mediaData.thumbnailUrl)
//                 : 1;
//             } else {
//               mediaData.imageUrl = url;
//               mediaData.aspectRatio = await getAspectRatio(url);
//             }
//           }
//         } catch {
//           mediaData.imageUrl = null;
//           mediaData.videoUrl = null;
//           mediaData.thumbnailUrl = null;
//           mediaData.aspectRatio = 1;
//         }
//       }

//       mediaData.authorImageUrl = await getAuthorImage(post);
//       return { ...post, ...mediaData };
//     })
//   );

//   return Array.isArray(input) ? results : results[0]; // return single post if input was single
// };








