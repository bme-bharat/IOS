import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NetworkContext = createContext({
  myId: null,
  myData: null,
});

export const NetworkProvider = ({ children }) => {
  const [myId, setMyId] = useState(null);
  const [myData, setMyData] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const keys = [
          'CompanyUserData',
          'CompanyUserlogintimeData',
          'normalUserData',
          'NormalUserlogintimeData',
          'AdminUserData',
        ];
        for (const key of keys) {
          const storedData = await AsyncStorage.getItem(key);
          if (storedData) {
            const userData = JSON.parse(storedData);
            let extractedId = userData.company_id || userData.user_id || null;

            if (typeof extractedId === 'string') {
              extractedId = extractedId.trim();
              if (extractedId === '' || extractedId.toLowerCase() === 'null') {
                extractedId = null;
              }
            }

            if (extractedId) {
              setMyId(extractedId);
              setMyData(userData);
              break;
            }
          }
        }
      } catch (error) {
        console.log('Error loading user data:', error);
      }
    };

    getUserData();
  }, []);

  const updateMyData = (updates) => {
    console.log('updates',updates)
    setMyData((prev) => ({ ...prev, ...updates }));
  };


  return (
    <NetworkContext.Provider value={{ myId, myData, updateMyData }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
