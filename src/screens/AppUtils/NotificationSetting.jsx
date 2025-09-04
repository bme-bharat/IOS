import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Switch, Alert, Linking, Platform, AppState } from 'react-native';
import apiClient from '../ApiClient';
import { showToast } from './CustomToast';
import { useNetwork } from './IdProvider';
import { useConnection } from './ConnectionProvider';
import { useFcmToken } from './fcmToken';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationSettings = () => {
  const { myId, myData, updateMyData } = useNetwork();
  const { isConnected } = useConnection();
  const { fcmToken, refreshFcmToken } = useFcmToken();
  const [status, setStatus] = useState(myData?.notification_status ?? true);
  const [isProcessing, setIsProcessing] = useState(false);
  const appState = useRef(AppState.currentState);
  const [waitingForPermission, setWaitingForPermission] = useState(false);

  useEffect(() => {
    if (typeof myData?.notification_status === 'boolean') {
      setStatus(myData.notification_status);
    }
  }, [myData?.notification_status]);

  const openAppSettings = () => {
   
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const updateNotificationSetting = async (value, tokenToSend = '') => {
    try {
      const res = await apiClient.post('/updateUserSettings', {
        command: 'updateUserSettings',
        user_id: myId,
        notification_status: value,
        fcm_token: tokenToSend,
      });
  
      if (res.status === 200 && res.data.status === 'success') {
        showToast(`Notifications ${value ? 'enabled' : 'disabled'} successfully.`, 'success');
        
        // Update context
        updateMyData({ notification_status: value });
  
        // ✅ Persist to AsyncStorage
        const keys = ['normalUserData', 'CompanyUserData', 'AdminUserData'];
        for (const key of keys) {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const userData = JSON.parse(stored);
            userData.notification_status = value;
            await AsyncStorage.setItem(key, JSON.stringify(userData));
          }
        }
      } else {
        showToast(res.data?.message || 'Failed to update settings.', 'error');
        setStatus(!value);
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Something went wrong', 'error');
      setStatus(!value);
    } finally {
      setIsProcessing(false);
    }
  };
  

  const handleToggle = async (value) => {

    if (!myId) {
   
      showToast('Something went wrong\nTry again later', 'error');
      Alert.alert('Error', 'User ID not available.');
      return;
    }

    const prev = status;
    setStatus(value);
    setIsProcessing(true);

    try {
      let tokenToSend = '';

      if (value) {
 
        const refreshed = await refreshFcmToken(true);
        if (!fcmToken || fcmToken === 'FCM_NOT_AVAILABLE') {
        
          setWaitingForPermission(true);

          Alert.alert(
            'Notifications Disabled',
            'Please enable notifications in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => openAppSettings() },
            ]
          );

          setStatus(prev);
          setIsProcessing(false);
          return;
        }

        tokenToSend = fcmToken;
      }

      await updateNotificationSetting(value, tokenToSend);
    } catch (err) {
   
      setStatus(prev);
      showToast(err.message || 'Something went wrong', 'error');
      setIsProcessing(false);
    }
  };

  // Listen for app state changes (coming back from Settings)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {

      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        waitingForPermission
      ) {
     
        const newToken = await refreshFcmToken(false);

        if (newToken && newToken !== 'FCM_NOT_AVAILABLE') {
     
          setStatus(true);
          await updateNotificationSetting(true, newToken);
        } else {
        
        }

        setWaitingForPermission(false);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [waitingForPermission, refreshFcmToken]);

  return (
    <View style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 18 }}>Notifications</Text>
        <Switch
          value={status}
          onValueChange={handleToggle}
          disabled={isProcessing}
          trackColor={{ false: '#ccc', true: '#ccc' }}
          thumbColor={status ? '#075cab' : '#f4f3f4'}
          // style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }} 

        />
      </View>
    </View>
  );
};

export default NotificationSettings;
