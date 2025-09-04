import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UsersRegister, LoginStack } from './src/navigation/UsersRegister';
const UserBottomTabNav = lazy(() => import('./src/navigation/UserNav/UserBottomTabNav'));
const CompanyBottomTab = lazy(() => import('./src/navigation/CompanyNav/CompanyBottomTabNav'));
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import RNRestart from 'react-native-restart';
import axios from 'axios';
import RNFS from 'react-native-fs';

import { Alert, Linking, Modal, StyleSheet, TouchableOpacity, View, Text, Platform } from 'react-native';

import DeviceInfo from 'react-native-device-info';
import Message1 from './src/components/Message1';
import SplashScreen from './src/screens/SplashScreen';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import store from './src/screens/Redux/Store';

import apiClient from './src/screens/ApiClient';
import { ToastProvider } from './src/screens/AppUtils/CustomToast';
import NotificationHandler from './src/screens/NotificationHandler';
import DeepLinkHandler from './src/screens/DeepLinkHandler';
import { ConnectionProvider } from './src/screens/AppUtils/ConnectionProvider';
import { BottomSheetProvider } from './src/screens/AppUtils/SheetProvider';
import { NetworkProvider } from './src/screens/AppUtils/IdProvider';
import MediaViewer from './src/screens/helperComponents/mediaViewer';
import InAppReview from 'react-native-in-app-review';
import useReviewPrompt from './src/screens/AppUtils/appReview';
import { cleanupQuickActions, handleNavigationReady, onNavigationContainerReady, setupQuickActions, setupQuickActionsInternal } from './src/screens/quickActions';
import useLastActivityTracker from './src/screens/AppUtils/LastSeenProvider';



export const navigationRef = createNavigationContainerRef();


const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [splashVisible, setSplashVisible] = useState(false)
  const [currentVersion, setCurrentVersion] = useState(null);
  const [updateVersion, setUpdateVersion] = useState(null);
  const [subscriptionExpiresOn, setSubscriptionExpiresOn] = useState(null);
  const [actionType, setActionType] = useState('');
  const [userId, setUserId] = useState('')
  const errorCheckIntervalRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertIconType, setAlertIconType] = useState('');
  const sessionCheckIntervalRef = useRef(null);
  const [updateDismissedCount, setUpdateDismissedCount] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [fcmToken, setFcmToken] = useState('');
  const userCheckIntervalRef = useRef(null);
 
  // useReviewPrompt();

  useLastActivityTracker();

  useEffect(() => {
    const getData = async () => {
      try {
        const companyUserData = await AsyncStorage.getItem("CompanyUserData");
        const normalUserData = await AsyncStorage.getItem("normalUserData");

        if (!companyUserData && !normalUserData) {

          return;
        }
        const forumPostUser = JSON.parse(normalUserData || companyUserData);
        if (forumPostUser && (forumPostUser.user_id || forumPostUser.company_id)) {
          setUserId(forumPostUser.user_id || forumPostUser.company_id);
          setSubscriptionExpiresOn(forumPostUser.subscription_expires_on)
          // console.log('forumPostUser.subscription_expires_on',forumPostUser.subscription_expires_on)
        } else {

        }
      } catch (error) {

      }
    };

    getData();

    userCheckIntervalRef.current = setInterval(() => {

      if (userId) {

        clearInterval(userCheckIntervalRef.current);
      } else {
        getData();
      }
    }, 1000);

    return () => {
      if (userCheckIntervalRef.current) {
        clearInterval(userCheckIntervalRef.current);
      }
    };
  }, [userId, isLoggedIn]);


  useEffect(() => {
    if (userId) {

    }
  }, [userId]);
  const getCurrentVersion = async () => {
    const version = await DeviceInfo.getVersion();

    setCurrentVersion(version);
  };


  const compareVersions = (currentVersion, updateVersion) => {
    const currentParts = currentVersion.split('.').map(num => parseInt(num, 10));
    const updateParts = updateVersion.split('.').map(num => parseInt(num, 10));

    for (let i = 0; i < currentParts.length; i++) {
      if (updateParts[i] > currentParts[i]) {
        return true; // New version is available
      } else if (updateParts[i] < currentParts[i]) {
        return false; // Current version is newer or the same
      }
    }
    return false; // Versions are the same
  };



  const checkForUpdate = async () => {
    if (forceUpdate) return; // Stop checking if the update is forced

    try {
      const response = await apiClient.post('/getAppUpdateVersionNumber', {
        command: 'getAppUpdateVersionNumber',
        user_id: userId,
      });

      if (response.status === 200 && response.data.status === 'success') {
        const newVersion = response.data.ios_version_number;

        const isUpdateAvailable = compareVersions(currentVersion, newVersion);

        if (isUpdateAvailable) {
          if (updateDismissedCount >= 2) {
            setForceUpdate(true);
          }
          setModalVisible(true);
        }
      }
    } catch (error) {

    }
  };

  useEffect(() => {
    getCurrentVersion();
  }, []);



  const handleUpdate = () => {
    Linking.openURL('https://apps.apple.com/in/app/bme-bharat/id6739932413');
    setModalVisible(false);
  };

  const handleUpdateDismiss = () => {
    if (updateDismissedCount >= 2) {
      setForceUpdate(true);
    } else {
      setUpdateDismissedCount(prevCount => prevCount + 1);
      setModalVisible(false);
    }
  };


  useEffect(() => {
    if (userId && !forceUpdate) {
      const intervalId = setInterval(() => {
        checkForUpdate();
      }, updateDismissedCount === 0 ? 10000 : 300000);

      return () => clearInterval(intervalId);
    }
  }, [userId, updateDismissedCount, forceUpdate]);

  useEffect(() => {
    sessionCheckIntervalRef.current = setInterval(() => {
      checkUserSession();
    }, 5000);

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
    };
  }, []);



  const checkUserSession = async () => {

    try {
      const sessionData = await AsyncStorage.getItem('userSession');
      if (!sessionData) return;

      const { sessionId } = JSON.parse(sessionData);
      if (!sessionId) return;

      const response = await apiClient.post('/checkUserSession', {
        command: 'checkUserSession',
        session_id: sessionId,
      });

      if (response.data?.statusCode === 200 && !response.data.data?.isActive) {
        setAlertTitle('Session Expired');
        setAlertMessage('Your session is inactive. logging out');
        setAlertIconType('warning');
        setVisible(true);
        setActionType('logout');

        setTimeout(() => {
          handleLogout();
        }, 5000);
      }
    } catch (error) {

    }
  };


  const handleLogout = async () => {
    try {
      // Retrieve session data from AsyncStorage
      const sessionData = await AsyncStorage.getItem('userSession');

      if (!sessionData) {

        return;
      }

      // Parse session data to get sessionId
      const { sessionId } = JSON.parse(sessionData);
      if (!sessionId) {

        return;
      }

      // Make an API call to logout the session
      const response = await apiClient.post(
        "/logoutUserSession",
        { command: "logoutUserSession", session_id: sessionId }
      );

      if (response.data.statusCode === 200) {

        await AsyncStorage.multiRemove([
          'userSession',
          'normalUserData',
          'CompanyUserData',
          'AdminUserData',
        ]);

        setTimeout(() => {
          RNRestart.restart();
        }, 100);
      } else {

      }
    } catch (error) {

    }
  };


  const handleOnOk = () => {
    if (actionType === 'logout') {
      handleLogout();
    } else if (actionType === 'delete') {
      handleAccountDeletion();
    }

    setTimeout(() => {
      setVisible(false);
    }, 500);
  };


  const handleAccountDeletion = async () => {
    try {
      await AsyncStorage.multiRemove([
        'userSession',
        'normalUserData',
        'CompanyUserData',
        'AdminUserData',
        'CompanyUserlogintimeData',
        'NormalUserlogintimeData',
      ]);

      setIsLoggedIn(false);
      setUserType(null);
      setUserId(null);

      setTimeout(() => restartApp(), 1000);
    } catch (error) {

    }
  };


  const fetchProfile1 = async () => {
    if (!userId) return false;

    try {
      const response = await apiClient.post('/getUserDetails', {
        command: 'getUserDetails',
        user_id: userId,
        timestamp: new Date().getTime(),
      });


      if (response.data.errorType === 'Error') {

        if (response.data.errorMessage === "Oops! User not found! please sign up!") {
          setAlertTitle('Account Deleted');
          setAlertMessage('Please sign up again.');
          setAlertIconType('warning');
          setActionType('delete');
          setVisible(true);

          setTimeout(() => {
            handleAccountDeletion();
          }, 5000);

          return false;
        }
      }

      return true;
    } catch (error) {

      return false;
    }
  };



  useEffect(() => {
    if (errorCheckIntervalRef.current) {
      clearInterval(errorCheckIntervalRef.current);
    }

    if (!userId) {

      return;
    }

    errorCheckIntervalRef.current = setInterval(async () => {
      const success = await fetchProfile1();

      if (!success) {

        clearInterval(errorCheckIntervalRef.current);
      }
    }, 1000);

    return () => {
      clearInterval(errorCheckIntervalRef.current);
    };
  }, [userId]);


  const restartApp = () => {

    if (errorCheckIntervalRef.current) {
      clearInterval(errorCheckIntervalRef.current);
    }

    setTimeout(() => {
      RNRestart.restart();
    }, 1000);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };


  useEffect(() => {
    if (!subscriptionExpiresOn) return;

    const intervalId = setInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);

      if (currentTime > subscriptionExpiresOn) {
        const formattedExpirationDate = formatTimestamp(subscriptionExpiresOn);
        Alert.alert('Subscription Expired',
          `Your subscription expired on ${formattedExpirationDate}. You have been logged out due to subscription expiration.`, [
          {
            text: 'OK',
            onPress: async () => {
              await AsyncStorage.clear();
              RNRestart.Restart();
            },
          },
        ]);
        clearInterval(intervalId);
      }
    }, 1000);


    return () => clearInterval(intervalId);
  }, [subscriptionExpiresOn]);


  // useEffect(() => {
  //   const getFcmToken = async () => {
  //     try {
  //       const app = getApp();
  //       const messagingInstance = getMessaging(app);
  //       const token = await getToken(messagingInstance);
  //       setFcmToken(token);
  //       console.log("🔹 FCM Token:", token);

  //       if (Platform.OS === "ios") {
  //         const apnsToken = await messaging().getAPNSToken();
  //         console.log("🍎 APNS Token:", apnsToken);
  //       }
  //     } catch (error) {
  //       console.error("❌ Error fetching FCM token:", error);
  //     }
  //   };

  //   getFcmToken();
  // }, []);

  const getDirectorySize = async (dirPath) => {
    let totalSize = 0;

    const files = await RNFS.readDir(dirPath);
    for (const file of files) {
      if (file.isDirectory()) {
        totalSize += await getDirectorySize(file.path);
      } else {
        const stats = await RNFS.stat(file.path);
        totalSize += stats.size;
      }
    }

    return totalSize;
  };

  const checkAndClearCache = async () => {
    try {
      const cacheDir = RNFS.CachesDirectoryPath;


      const cacheSizeInBytes = await getDirectorySize(cacheDir);
      const cacheSizeInMB = cacheSizeInBytes / (5 * 1024 * 1024 * 1024);

      const lastClearedTimestamp = await AsyncStorage.getItem('lastCacheCleared');
      const currentTime = new Date().getTime();
      const timeDifference = currentTime - (lastClearedTimestamp ? parseInt(lastClearedTimestamp) : 0);

      if (cacheSizeInMB > 500 || timeDifference > 12 * 60 * 60 * 1000) {

        await clearCache();

        await AsyncStorage.setItem('lastCacheCleared', currentTime.toString());
      }


      else if (cacheSizeInMB > 500 && timeDifference <= 12 * 60 * 60 * 1000) {

        await clearCache();

        await AsyncStorage.setItem('lastCacheCleared', currentTime.toString());
      }
    } catch (error) {

    }
  };

  const clearCache = async () => {
    try {
      const cacheDir = RNFS.CachesDirectoryPath;
      const files = await RNFS.readDir(cacheDir);


      for (const file of files) {
        await RNFS.unlink(file.path);

      }
    } catch (error) {

    }
  };

  useEffect(() => {

    checkAndClearCache();
  }, []);

  // useEffect(() => {
  //   setupQuickActions();
  // }, []);


  const checkAuthStatus = async () => {

    try {
      const normalUserData = await AsyncStorage.getItem('normalUserData');
      const companyUserData = await AsyncStorage.getItem('CompanyUserData');
      const adminUserData = await AsyncStorage.getItem('AdminUserData');

      if (normalUserData || companyUserData || adminUserData) {
        setIsLoggedIn(true);
        setUserType(
          normalUserData ? 'users' : companyUserData ? 'company' : 'BME_ADMIN'
        );

      } else {
        setIsLoggedIn(false);
        setUserType(null);
      }
    } catch (error) {

    } finally {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setIsLoading(false);
    }
  };

  // useEffect(() => {
  //   setupQuickActions();

  //   return () => {
  //     cleanupQuickActions();
  //   };
  // }, []);

  useEffect(() => {
    checkAuthStatus();
  }, []);



  if (isLoading) {
    return <SplashScreen />;
  }



  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <Suspense fallback={<SplashScreen />}>
          <GestureHandlerRootView style={styles.container}>
            <ToastProvider>

              <NavigationContainer ref={navigationRef}
                onReady={() => {
                  onNavigationContainerReady();
                }}
              >
                <ConnectionProvider>
                  <BottomSheetProvider>
                    <NetworkProvider>
                      <MediaViewer />

                      <NotificationHandler />
                      <DeepLinkHandler />
                      {isLoggedIn ? (
                        userType === 'users' ? (
                          <UserBottomTabNav />
                        ) : (
                          <CompanyBottomTab />
                        )
                      ) : (
                        <LoginStack />
                      )}

                    </NetworkProvider>
                  </BottomSheetProvider>
                </ConnectionProvider>

              </NavigationContainer>

            </ToastProvider>

            <UpdateModal
              modalVisible={modalVisible}
              onClose={() => setModalVisible(false)}
              onUpdate={handleUpdate}
              handleUpdateDismiss={handleUpdateDismiss}
              forceUpdate={forceUpdate}
            />

            <Message1
              visible={visible}
              onClose={() => setVisible(false)}
              onOk={handleOnOk}
              title={alertTitle}
              message={alertMessage}
              iconType={alertIconType}
            />
          </GestureHandlerRootView>
        </Suspense>
      </Provider>
    </SafeAreaProvider>
  );


};

const UpdateModal = ({ modalVisible, onClose, onUpdate, handleUpdateDismiss, forceUpdate }) => {
  return (
    <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Update Available</Text>
          <Text style={styles.modalMessage}>
            A new version is available. Please update to the latest version for the best experience.
          </Text>

          <View style={forceUpdate ? styles.buttonContainerSingle : styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onUpdate}>
              <Text style={styles.buttonText}>Update</Text>
            </TouchableOpacity>

            {!forceUpdate && handleUpdateDismiss && (
              <TouchableOpacity
                style={[styles.button, styles.leaveButton]}
                onPress={() => {
                  onClose();
                  handleUpdateDismiss();
                }}
              >
                <Text style={styles.buttonText1}>Leave</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};


export default App;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker background for better contrast
  },
  modalContainer: {
    width: 320,
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5, // Add shadow for modern look
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  modalMessage: {
    fontSize: 15,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
  },
  buttonContainerSingle: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    margin: 5,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#007BFF',
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 8,
  },
  buttonText1: {
    color: '#FF0000',
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 8,
  },
});
