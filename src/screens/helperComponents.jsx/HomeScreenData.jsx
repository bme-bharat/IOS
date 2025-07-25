// useFetchData.js
import { useEffect, useState } from 'react';
import apiClient from '../ApiClient';
import { useNetwork } from '../AppUtils/IdProvider';
import { useConnection } from '../AppUtils/ConnectionProvider';
import { getSignedUrl } from './signedUrls';
import defaultImage from '../../images/homepage/image.jpg'
import buliding from '../../images/homepage/buliding.jpg';
import { Image } from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import maleImage from '../../images/homepage/dummy.png';
import femaleImage from '../../images/homepage/female.jpg';
import companyImage from '../../images/homepage/buliding.jpg';
import { generateAvatarFromName } from './useInitialsAvatar';


const defaultImageUriCompany = Image.resolveAssetSource(companyImage).uri;
const defaultImageUriFemale = Image.resolveAssetSource(femaleImage).uri;
const defaultImageUriMale = Image.resolveAssetSource(maleImage).uri;
const Company = Image.resolveAssetSource(buliding).uri;
const defaultLogo = Image.resolveAssetSource(defaultImage).uri;

const useFetchData = ({ shouldFetch = false }) => {

  const { myId, myData } = useNetwork();
  const { isConnected } = useConnection();


  const [jobs, setJobs] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);

  const [isFetchingJobs, setIsFetchingJobs] = useState(false);
  const [isFetchingLatestPosts, setIsFetchingLatestPosts] = useState(false);
  const [isFetchingTrendingPosts, setIsFetchingTrendingPosts] = useState(false);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [isFetchingServices, setIsFetchingServices] = useState(false);

  const [jobImageUrls, setJobImageUrls] = useState({});
  const [latestImageUrls, setLatestImageUrls] = useState({});
  const [trendingImageUrls, setTrendingImageUrls] = useState({});
  const [productImageUrls, setProductImageUrls] = useState({});
  const [servicesImageUrls, setServicesImageUrls] = useState({});
  const [authorImageUrls, setAuthorImageUrls] = useState({});

  useEffect(() => {
    const jobDeleteListener = EventRegister.addEventListener('onJobDeleted', (data) => {
      console.log('Job deleted:', data);
      if (data?.postId) {
        setJobs(prev => prev.filter(job => job.post_id !== data.postId));
      }
    });

    const forumDeleteListener = EventRegister.addEventListener('onForumPostDeleted', (data) => {
      console.log('Forum post deleted:', data);
      if (data?.forum_id) {
        setLatestPosts(prev => prev.filter(post => post.forum_id !== data.forum_id));
      }
    });

    const productDeleteListener = EventRegister.addEventListener('onProductDeleted', (data) => {
      console.log('Product deleted:', data);
      if (data?.deletedProductId) {
        setProducts(prev => prev.filter(product => product.product_id !== data.deletedProductId));
      }
    });

    // Cleanup on unmount
    return () => {
      EventRegister.removeEventListener(jobDeleteListener);
      EventRegister.removeEventListener(forumDeleteListener);
      EventRegister.removeEventListener(productDeleteListener);
    };
  }, []);

  const fetchJobs = async () => {
    if (!isConnected) return;
    setIsFetchingJobs(true);

    try {
      const response = await apiClient.post('/getAllJobPosts', {
        command: "getAllJobPosts",
        limit: 10,
      });

      if (response.data.status === "success") {
        const jobsData = response.data.response || [];

        // Process jobs with image URLs and avatars
        const processedJobs = await Promise.all(jobsData.map(async (job) => {
          // If no fileKey exists, just generate avatar
          if (!job.fileKey) {
            return {
              ...job,
              companyAvatar: generateAvatarFromName(job.company_name)
            };
          }

          // Try to get signed URL
          try {
            const signedUrl = await getSignedUrl(job.post_id, job.fileKey);
            if (signedUrl && signedUrl[job.post_id]) {
              return {
                ...job,
                imageUrl: signedUrl[job.post_id]
              };
            }
          } catch (error) {
            console.warn(`Failed to get signed URL for job ${job.post_id}:`, error);
          }

          // If signed URL fetch failed, generate avatar
          return {
            ...job,
            companyAvatar: generateAvatarFromName(job.company_name)
          };
        }));

        // Separate image URLs and jobs with avatars
        const signedUrlMap = {};
        const jobsWithAvatars = processedJobs.map(job => {
          if (job.imageUrl) {
            signedUrlMap[job.post_id] = job.imageUrl;
            const { imageUrl, ...rest } = job;
            return rest;
          }
          return job;
        });

        setJobs(jobsWithAvatars);
        setJobImageUrls(signedUrlMap);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsFetchingJobs(false);
    }
  };

  const fetchTrendingPosts = async () => {
    if (!isConnected) return;
    setIsFetchingTrendingPosts(true);

    try {
      const response = await apiClient.post('/getAllTrendingPosts', {
        command: "getAllTrendingPosts",
        limit: 10
      });

      if (response.data.status === "success") {
        const trendingData = response.data.response || [];

        const fileKeyUrlPromises = trendingData.map(post =>
          getSignedUrl(post.forum_id, post.fileKey)
        );

        // Author image signed URLs (skip if key is missing)
        const authorKeyUrlPromises = trendingData.map(post =>
          getSignedUrl(post.forum_id, post.author_fileKey)
        );
        const [fileKeyUrlsArray, authorKeyUrlsArray] = await Promise.all([
          Promise.all(fileKeyUrlPromises),
          Promise.all(authorKeyUrlPromises),
        ]);
        const fileKeyUrlMap = Object.assign({}, ...fileKeyUrlsArray);
        const authorKeyUrlMap = Object.assign({}, ...authorKeyUrlsArray);

        const signedUrlMap = Object.entries(fileKeyUrlMap).reduce((acc, [id, url]) => {
          acc[id] = url || defaultLogo;
          return acc;
        }, {});

        // ✅ Gender-based fallback logic for author images
        const authorImageUrlMap = trendingData.reduce((acc, post) => {
          const signedUrl = authorKeyUrlMap[post.forum_id];
          if (signedUrl) {
            acc[post.forum_id] = signedUrl;
          } else if (post.author_gender?.toLowerCase() === 'female') {
            acc[post.forum_id] = defaultImageUriFemale;
          } else {
            acc[post.forum_id] = defaultImageUriMale;
          }
          return acc;
        }, {});
        setTrendingPosts(trendingData);
        setTrendingImageUrls(signedUrlMap);
        setAuthorImageUrls(authorImageUrlMap);

      } else {

      }
    } catch (error) {

    } finally {
      setIsFetchingTrendingPosts(false);

    }
  };

  const fetchLatestPosts = async () => {
    if (!isConnected) return;
    setIsFetchingLatestPosts(true);

    try {
      const response = await apiClient.post('/getLatestPosts', {
        command: "getLatestPosts",
        Type: 'Latest',
        limit: 10,
      });
      // getAllAdminForumPosts
      // getLatestPosts
      if (response.data.status === "success") {
        const latestData = response.data.response || [];

        // Media image signed URLs
        const fileKeyUrlPromises = latestData.map(post =>
          getSignedUrl(post.forum_id, post.fileKey)
        );

        // Author image signed URLs (skip if key is missing)
        const authorKeyUrlPromises = latestData.map(post =>
          getSignedUrl(post.forum_id, post.author_fileKey)
        );
        const [fileKeyUrlsArray, authorKeyUrlsArray] = await Promise.all([
          Promise.all(fileKeyUrlPromises),
          Promise.all(authorKeyUrlPromises),
        ]);

        const fileKeyUrlMap = Object.assign({}, ...fileKeyUrlsArray);
        const authorKeyUrlMap = Object.assign({}, ...authorKeyUrlsArray);

        const signedUrlMap = Object.entries(fileKeyUrlMap).reduce((acc, [id, url]) => {
          acc[id] = url || defaultLogo;
          return acc;
        }, {});

        // ✅ Gender-based fallback logic for author images
        const authorImageUrlMap = latestData.reduce((acc, post) => {
          const signedUrl = authorKeyUrlMap[post.forum_id];
          if (signedUrl) {
            acc[post.forum_id] = signedUrl;
          } else if (post.author_gender?.toLowerCase() === 'female') {
            acc[post.forum_id] = defaultImageUriFemale;
          } else {
            acc[post.forum_id] = defaultImageUriMale;
          }
          return acc;
        }, {});

        setLatestPosts(latestData);
        setLatestImageUrls(signedUrlMap);
        setAuthorImageUrls(authorImageUrlMap);

      }
    } catch (error) {
      // handle error if needed
    } finally {
      setIsFetchingLatestPosts(false);
    }
  };


  const fetchProducts = async () => {
    if (!isConnected) return;
    setIsFetchingProducts(true);

    try {
      const response = await apiClient.post('/getAllProducts', {
        command: "getAllProducts",
        limit: 10,
      });

      if (response.data.status === "success") {
        const productsData = response.data.response || [];

        const urlPromises = productsData.map(product =>
          getSignedUrl(product.product_id, product.images[0])
        );

        const signedUrlsArray = await Promise.all(urlPromises);
        const rawSignedUrlMap = Object.assign({}, ...signedUrlsArray);

        const signedUrlMap = Object.entries(rawSignedUrlMap).reduce((acc, [id, url]) => {
          acc[id] = url || Company;
          return acc;
        }, {});

        setProducts(productsData);
        setProductImageUrls(signedUrlMap);


      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsFetchingProducts(false);
    }
  };

  const fetchServices = async () => {
    if (!isConnected) return;
    setIsFetchingServices(true);

    try {
      const response = await apiClient.post('/getAllServices', {
        command: "getAllServices",
        limit: 10,
      });

      if (response.data.status === "success") {
        const servicesData = response.data.response || [];

        const urlPromises = servicesData.map(service =>
          getSignedUrl(service.service_id, service.images[0])
        );

        const signedUrlsArray = await Promise.all(urlPromises);
        const rawSignedUrlMap = Object.assign({}, ...signedUrlsArray);

        const signedUrlMap = Object.entries(rawSignedUrlMap).reduce((acc, [id, url]) => {
          acc[id] = url || Company;
          return acc;
        }, {});

        setServices(servicesData);
        setServicesImageUrls(signedUrlMap);


      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsFetchingServices(false);
    }
  };


  const refreshData = async () => {
    setJobs([]);
    setLatestPosts([]);
    setTrendingPosts([]);
    await Promise.all([
      fetchJobs(),
      fetchTrendingPosts(),
      fetchLatestPosts(),
      fetchProducts(),
      fetchServices(),
    ]);
  };


  useEffect(() => {
    if (!shouldFetch) return;

    const jobTimeout = setTimeout(() => {
      fetchJobs();
    }, 0);

    const trendingTimeout = setTimeout(() => {
      fetchTrendingPosts();
    }, 400);

    const latestTimeout = setTimeout(() => {
      fetchLatestPosts();
    }, 600);

    const productTimeout = setTimeout(() => {
      fetchProducts();
    }, 800);

    const serviceTimeout = setTimeout(() => {
      fetchServices();
    }, 1000);
    return () => {
      clearTimeout(jobTimeout);
      clearTimeout(trendingTimeout);
      clearTimeout(latestTimeout);
      clearTimeout(productTimeout);
      clearTimeout(serviceTimeout);

    };
  }, [shouldFetch]);


  return {
    jobs,
    latestPosts,
    trendingPosts,
    products,
    services,
    isFetchingProducts,
    isFetchingServices,
    isFetchingJobs,
    isFetchingLatestPosts,
    isFetchingTrendingPosts,
    jobImageUrls,
    latestImageUrls,
    trendingImageUrls,
    productImageUrls,
    servicesImageUrls,
    authorImageUrls,
    refreshData
  };


};

export default useFetchData;
