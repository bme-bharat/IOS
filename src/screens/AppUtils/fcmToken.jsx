import { useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  requestPermission,
  hasPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';

export const useFcmToken = () => {
  const [fcmToken, setFcmToken] = useState(null);

  const fetchFcmToken = useCallback(async (askPermission = false) => {
    try {
      const app = getApp();
      const messaging = getMessaging(app);

      let authStatus = await hasPermission(messaging);

      if (authStatus === AuthorizationStatus.NOT_DETERMINED && askPermission) {
        // Not granted yet → explicitly ask
        authStatus = await requestPermission(messaging);
      }

      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
      
        setFcmToken('FCM_NOT_AVAILABLE');
        return 'FCM_NOT_AVAILABLE'; // ✅ return consistent value
      }

      // ✅ Safe to fetch token
      const token = await getToken(messaging);

      setFcmToken(token);
      return token; // ✅ return actual token
    } catch (err) {

      setFcmToken('FCM_NOT_AVAILABLE');
      return 'FCM_NOT_AVAILABLE';
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchFcmToken();
  }, [fetchFcmToken]);

  // Refresh when app foregrounds
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchFcmToken();
    });
    return () => subscription.remove();
  }, [fetchFcmToken]);

  return { fcmToken, refreshFcmToken: fetchFcmToken };
};
