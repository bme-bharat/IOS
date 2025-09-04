import { useEffect } from 'react';
import { AppState, NativeEventEmitter, NativeModules, Platform } from 'react-native';
import QuickActions from 'react-native-quick-actions';
import { navigationRef } from '../../App';

const NAVIGATION_READY_TIMEOUT = 10000; // 10 seconds max wait

const TAB_SCREENS = [
  {
    name: 'UserSubscription',
    type: 'OpenSubscription',
    title: 'Subscription',
    subtitle: '',
    icon: 'creditcard',
  },
  {
    name: 'AllNotification',
    type: 'OpenNotifications',
    title: 'Activity',
    subtitle: '',
    icon: 'bell',
  }
];

let navigationReady = false;
let pendingAction = null;
let retryCount = 0;
const maxRetries = 5;
let navigationCheckInterval = null;
let navigationTimeout = null;

const normalizeActionData = (data) => {
  // Handle different data formats from different event sources
  if (typeof data === 'string') {
    // If data is just the type string (like "OpenNotifications")
    const screenConfig = TAB_SCREENS.find(item => item.type === data);
    return {
      userInfo: {
        screen: screenConfig?.name || '',
        type: data
      },
      type: data
    };
  }
  return data;
};

export const setupQuickActions = () => {
  setupQuickActionItems();
  checkInitialAction();
  startNavigationChecks();
  
  // Add listeners for when app is already running
  const subscriptions = [];
  
  if (Platform.OS === 'ios') {
    // Listen to the correct RNShortcuts event
    const quickActionEmitter = new NativeEventEmitter(NativeModules.RNShortcuts);
    const sub = quickActionEmitter.addListener('onShortcutUsed', (data) => {
      console.log('[QuickActions] Quick action pressed:', data);
      handleQuickAction(normalizeActionData(data));
    });
    subscriptions.push(sub);
  }

  // Listen to app state changes
  const appStateSub = AppState.addEventListener('change', handleAppStateChange);
  subscriptions.push({ remove: () => AppState.removeEventListener('change', handleAppStateChange) });

  // Return cleanup function
  return () => {
    subscriptions.forEach(sub => sub.remove());
    cleanupQuickActions();
  };
};

const handleAppStateChange = (nextAppState) => {
  if (nextAppState === 'active' && pendingAction) {
    handleQuickAction(pendingAction);
  }
};

const setupQuickActionItems = () => {
  try {
    const items = TAB_SCREENS.map(item => ({
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      icon: item.icon,
      userInfo: { 
        screen: item.name,
        type: item.type 
      },
    }));
    QuickActions.setShortcutItems(items);
  } catch (err) {
    console.error('[QuickActions] Failed to set items:', err);
  }
};

const checkInitialAction = () => {
  QuickActions.popInitialAction()
    .then(action => {
      if (action) {
        handleQuickAction(normalizeActionData(action));
      }
    })
    .catch(console.error);
};

const startNavigationChecks = () => {
  if (navigationCheckInterval) clearInterval(navigationCheckInterval);
  if (navigationTimeout) clearTimeout(navigationTimeout);
  
  navigationTimeout = setTimeout(cleanupNavigationChecks, NAVIGATION_READY_TIMEOUT);
  
  navigationCheckInterval = setInterval(() => {
    if (checkNavigationReady()) {
      cleanupNavigationChecks();
    }
  }, 100);
};

const checkNavigationReady = () => {
  const isReady = navigationRef.isReady() && navigationRef.current;
  if (isReady && !navigationReady) {
    navigationReady = true;
    processPendingAction();
    return true;
  }
  return false;
};

export const onNavigationContainerReady = () => {
  if (!navigationReady) {
    navigationReady = true;
    processPendingAction();
  }
  verifyNavigationReadiness();
};

const verifyNavigationReadiness = () => {
  if (!navigationRef.isReady() || !navigationRef.current) {
    navigationReady = false;
    startNavigationChecks();
    return;
  }
  navigationReady = true;
  processPendingAction();
};

const processPendingAction = () => {
  if (pendingAction) {
    handleQuickAction(pendingAction);
  }
};

const handleQuickAction = (action) => {
  if (!action) return;

  const normalizedAction = normalizeActionData(action);
  const screen = normalizedAction?.userInfo?.screen;
  
  if (!screen) {
    console.error('[QuickActions] No screen specified in quick action:', normalizedAction);
    return;
  }
  
  // Check if the screen exists in your navigator
  const validScreens = [
    'UserSubscription', 
    'AllNotification',
    // Add all other screen names that can be accessed via quick actions
  ];
  
  if (!validScreens.includes(screen)) {
    console.error('[QuickActions] Invalid screen specified:', screen);
    return;
  }

  if (!navigationReady || !navigationRef.isReady() || !navigationRef.current) {
    pendingAction = normalizedAction;
    retryCount = 0;
    setTimeout(() => handleQuickAction(normalizedAction), 500);
    return;
  }

  try {
    if (retryCount >= maxRetries) {
      pendingAction = null;
      return;
    }
    
    // Use navigate instead of reset for better behavior
    navigationRef.current.navigate(screen);
    
    pendingAction = null;
    retryCount = 0;
  } catch (err) {
    console.error('[QuickActions] Navigation failed:', err);
    retryCount++;
    pendingAction = normalizedAction;
    setTimeout(() => handleQuickAction(normalizedAction), 500);
  }
};

const cleanupNavigationChecks = () => {
  if (navigationCheckInterval) clearInterval(navigationCheckInterval);
  if (navigationTimeout) clearTimeout(navigationTimeout);
  navigationCheckInterval = null;
  navigationTimeout = null;
};

export const cleanupQuickActions = () => {
  cleanupNavigationChecks();
};