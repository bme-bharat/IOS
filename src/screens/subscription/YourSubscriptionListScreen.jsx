


import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../ApiClient';
const YourSubscriptionListScreen = () => {
  const [userid, setUserid] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();


  useEffect(() => {
    const getData = async () => {
      try {
        let SubscriptionList;
        const companyUserData = await AsyncStorage.getItem("CompanyUserData");
        if (companyUserData) {
          SubscriptionList = companyUserData;
        } else {
          const companyLoginTimeData = await AsyncStorage.getItem("CompanyUserlogintimeData");
          if (companyLoginTimeData) {
            SubscriptionList = companyLoginTimeData;
          } else {
            const normalUserData = await AsyncStorage.getItem("normalUserData");
            if (normalUserData) {
              SubscriptionList = normalUserData;
            } else {
              const normalUserLoginTimeData = await AsyncStorage.getItem("NormalUserlogintimeData");
              if (normalUserLoginTimeData) {
                SubscriptionList = normalUserLoginTimeData;
              }
            }
          }
        }

        if (SubscriptionList) {
          const SubscriptionListuser = JSON.parse(SubscriptionList);
          if (SubscriptionListuser && (SubscriptionListuser.user_id || SubscriptionListuser.company_id)) {
            setUserid(SubscriptionListuser.user_id || SubscriptionListuser.company_id);
          }
        }
      } catch (error) {
        setError('Error retrieving user data');
      }
    };

    getData();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (userid) {
        setLoading(true);
        try {
          const response = await apiClient.post(
            '/getUsersTransactions',
            {
              command: "getUsersTransactions",
              user_id: userid,
            }
          );

          const completedTransactions = response.data.response.filter(
            transaction => transaction.transaction_status === "captured"
          );
          setTransactions(completedTransactions);
          // console.log('completedTransactions', completedTransactions)
        } catch (err) {
          setError("No Subscriptions");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTransactions();
  }, [userid]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} activeOpacity={1}>
      <View style={styles.detailContainer}>
        <View style={styles.lableIconContainer}>
          <Text style={styles.itemTitle}>Package name </Text>
        </View>
        <Text style={styles.colon}>:</Text>
        <Text style={styles.itemValue}>{item.subscription_plan}</Text>
      </View>
      <View style={styles.detailContainer}>
        <View style={styles.lableIconContainer}>
          <Text style={styles.itemTitle}>Amount</Text>
        </View>
        <Text style={styles.colon}>:</Text>
        <Text style={styles.itemValue}>{item.amount} {item.currency}</Text>
      </View>
      <View style={styles.detailContainer}>
        <View style={styles.lableIconContainer}>
          <Text style={styles.itemTitle}>Subscribed on </Text>
        </View>
        <Text style={styles.colon}>:</Text>
        <Text style={styles.itemValue}>
          {(() => {
            const date = new Date(item.transaction_on * 1000);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          })()}
        </Text>
      </View>
      <View style={styles.detailContainer}>
        <View style={styles.lableIconContainer}>

          <Text style={styles.itemTitle}>Duration</Text>
        </View>
        <Text style={styles.colon}>:</Text>
        <Text style={styles.itemValue}>{item.transaction_duration}</Text>
      </View>
      <View style={styles.detailContainer}>
        <View style={styles.lableIconContainer}>

          <Text style={styles.itemTitle}>Email</Text>
        </View>
        <Text style={styles.colon}>:</Text>
        <Text style={styles.itemValue}>{item.transaction_by}</Text>
      </View>
      <View style={styles.detailContainer}>
        <View style={styles.lableIconContainer}>

          <Text style={styles.itemTitle}>Phone number</Text>
        </View>
        <Text style={styles.colon}>:</Text>
        <Text style={styles.itemValue}>{item.user_phone_number}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#007bff" />

      </View>
    );
  }


  return (
    <SafeAreaView style={styles.container1}>
      <View style={styles.container} >
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#075cab" />
          </TouchableOpacity>
        </View>

        <Text style={styles.header}>My Subscriptions</Text>
        <FlatList
          data={[...transactions].sort((a, b) => b.transaction_on - a.transaction_on)} // newest first
          renderItem={renderItem}
          keyExtractor={(item) => item.transaction_id}
          showsHorizontalScrollIndicator={false}
        />

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 10,
    backgroundColor: '#fff',
  },
  container1: {
    flex: 1,

    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#075cab',
    textAlign: 'center',
  },
  backButton: {
    alignItems: 'flex-start',
    padding: 10

  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'whitesmoke',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',

  },
  itemContainer: {
    padding: 10,
    marginVertical: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10
  },
  lableIconContainer: {
    flexDirection: 'row',
    flex: 1, // Take up available space
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
  },
  itemTitle: {
    flex: 1, // Take up available space
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
  },
  itemValue: {
    flex: 2, // Take the remaining space
    flexShrink: 1,
    color: 'black',
    fontWeight: '400',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
  },
  colon: {
    width: 20, // Fixed width for the colon
    textAlign: 'center', // Center the colon
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    alignSelf: 'flex-start',

  },
  loadingText: {
    fontSize: 18,
    color: '#00796b',
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 20,
    marginTop: 10,
    textAlign: 'center',
    color: "black"
  },
});

export default YourSubscriptionListScreen;
