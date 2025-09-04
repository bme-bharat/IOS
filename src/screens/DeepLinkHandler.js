import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../../App';
import { EventRegister } from 'react-native-event-listeners';

const DeepLinkHandler = () => {
  useEffect(() => {
    const handleDeepLink = async (event) => {
      try {
        const url = event?.url;
        console.log('🔗 Deep Link Triggered:', url);
        if (!url) {
          EventRegister.emit('deepLinkDone');
          return;
        }

        const path = url.replace(/^https?:\/\/bmebharat.com\//, '').replace(/^bmebharat:\/\//, '');
        const pathParts = path.split('/');
        const id = pathParts[pathParts.length - 1];

        if (!id) {
          Alert.alert('Error', 'Invalid link format');
          EventRegister.emit('deepLinkDone');
          return;
        }

        let routeName = '';
        let params = { post_id: id };

        if (/latest\/comment\/[a-f0-9-]+$/i.test(path) || /trending\/comment\/[a-f0-9-]+$/i.test(path)) {
          routeName = 'Comment';
          params = { forum_id: id };
        } else if (/jobs\/post\/[a-f0-9-]+$/i.test(path)) {
          routeName = 'JobDetail';
        } else if (/company\/[a-f0-9-]+$/i.test(path)) {
          routeName = 'CompanyDetails';
          params = { userId: id };
        } else if (/product\/[a-f0-9-]+\/[a-f0-9-]+$/i.test(path)) {
          const [company_id, product_id] = pathParts.slice(-2);
          routeName = 'ProductDetails';
          params = { company_id, product_id };
        } else if (/Resource\/[a-f0-9-]+$/i.test(path)) {
          routeName = 'ResourceDetails';
          params = { resourceID: id };
        } else if (/Service\/[a-f0-9-]+\/[a-f0-9-]+$/i.test(path)) {
          const [company_id, service_id] = pathParts.slice(-2);
          routeName = 'ServiceDetails';
          params = { company_id, service_id };
        } else {
          Alert.alert('Error', 'Invalid link format');
          EventRegister.emit('deepLinkDone');
          return;
        }

        const waitForNavigationReady = async () => {
          console.log('⏳ Waiting for navigation to be ready...');
          while (!navigationRef.isReady()) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        
          console.log('✅ Navigation is ready');
        
          try {
            if (navigationRef.current) {
              const currentRoutes = navigationRef.current.getRootState()?.routes || [];
              console.log('🧭 Current routes:', currentRoutes);
        
              if (currentRoutes.length > 1) {
                console.log(`📍 Navigating to existing stack screen: ${routeName}`, params);
                navigationRef.current.navigate(routeName, params);
              } else {
                console.log(`🔄 Resetting navigation to: ${routeName}`, params);
                navigationRef.current.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: routeName, params }],
                  })
                );
              }
            } else {
              console.warn('⚠️ navigationRef.current is null');
            }
          } catch (err) {
            console.error('❌ Error during navigation:', err);
          }
        
          EventRegister.emit('deepLinkDone');
        };
        

        waitForNavigationReady();
      } catch (error) {
        console.error('❌ Deep Link Parsing Error:', error);
        EventRegister.emit('deepLinkDone');
      }
    };

    const unsubscribe = Linking.addEventListener('url', handleDeepLink);

    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log("🛠️ Processing deep link before navigation is ready.");
        handleDeepLink({ url: initialUrl });
      } else {
        EventRegister.emit('deepLinkDone');
      }
    };
    

    handleInitialURL();

    return () => unsubscribe.remove();
  }, []);

  return null;
};

export default DeepLinkHandler;

