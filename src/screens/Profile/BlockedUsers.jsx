import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Button,
  SafeAreaView, TouchableOpacity, ToastAndroid
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import apiClient from '../ApiClient';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';

const BlockedUsers = () => {
  const { myId, myData } = useNetwork();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);


  const handleNavigate = (item) => {
    if (item.blocked_user_type === "company") {
      navigation.navigate('CompanyDetailsPage', { userId: item.blocked_user_id });
    } else if (item.blocked_user_type === "users") {
      navigation.navigate('UserDetailsPage', { userId: item.blocked_user_id });
    }
  };

  const fetchBlockedUsers = async () => {
    try {

      setLoading(true);

      if (myId) {
        const response = await apiClient.post('/getBlockedUsers', {
          command: 'getBlockedUsers',
          user_id: myId,
        });

        if (response.data.status === 'success') {
          const users = response.data.data || [];

          if (users.length === 0) {
            setBlockedUsers({ removed_by_author: true });
          } else {
            setBlockedUsers(users);
          }
        } else {
          setLoading(false);
          setBlockedUsers({ removed_by_author: true });

        }
      } else {

      }
    } catch (err) {
      setLoading(false);

    } finally {
      setLoading(false);

    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchBlockedUsers();
    }, 500);

  }, []);



  const handleUnblockUser = async (blockedById, blockedUserId) => {
    try {

      const response = await apiClient.post('unblockUser', {
        command: 'unblockUser',
        blocked_by_user_id: blockedById,
        blocked_user_id: blockedUserId,
      });

      if (response.data.status === 'success') {

        showToast(response.data.message, 'success');

        setBlockedUsers((prevUsers) =>
          prevUsers.filter((user) => user.blocked_user_id !== blockedUserId)
        );
      }
    } catch (err) {

      showToast('Failed to unblock user.', 'error');

    } finally {

    }
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>

        <View style={styles.headerContainer}>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#075cab" />
          </TouchableOpacity>

        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#075cab" />
        </View>
      </SafeAreaView>
    );
  }

  if (blockedUsers?.removed_by_author) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#075cab" />
          </TouchableOpacity>

        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>No blocked accounts</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container1}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#075cab" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.container} activeOpacity={1}>

        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.block_id}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <Text style={styles.userName} onPress={() => handleNavigate(item)} >{item.blocked_user_name}</Text>
              <Text style={styles.userDetails}>{item.blocked_user_category}</Text>

              <Text style={styles.userDetails}>
                Blocked On: {new Date(item.blocked_on * 1000).toLocaleDateString('en-GB').replace(/\//g, '-')}

              </Text>
              <TouchableOpacity
                style={styles.unblockButton}
                onPress={() => handleUnblockUser(item.blocked_by_user_id, item.blocked_user_id)}
              >
                <Icon name="account-cancel" size={20} color="#ff3333" style={styles.unblockIcon} />
                <Text style={styles.unblockButtonText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          )}

        />

      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container1: {
    flex: 1,
    backgroundColor: 'whitesmoke',
  },
  container: {
    flex: 1,
    backgroundColor: 'whitesmoke',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
      borderBottomWidth: 1,
    borderColor: '#f0f0f0'

  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'black',
    fontSize: 16,
  },
  noUsersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noUsersText: {
    color: 'black',
    fontSize: 18,
    fontWeight: '400',
    padding: 10
  },
  userCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    padding: 15,
    margin: 10,
  },
  userName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    color: 'black'
  },
  userDetails: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#ff3333',
    borderRadius: 4,
    paddingVertical: 8,
    marginTop: 12,
  },
  unblockIcon: {
    marginRight: 8,
  },
  unblockButtonText: {
    color: '#ff3333',
    fontWeight: 'bold',
  },
});

export default BlockedUsers;

