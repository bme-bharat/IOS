import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const BottomNavigationBar = ({ tabs, currentRouteName, navigation,styles }) => {
  return (
    <View style={styles.bottomNavContainer}>
      {tabs.map((tab, index) => {
        const isFocused = currentRouteName === tab.name;
        return (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.navigate(tab.name)}
            style={styles.navItem}
            activeOpacity={0.8}
          >
            <tab.iconComponent
              name={isFocused ? tab.focusedIcon : tab.unfocusedIcon}
              size={22}
              color={isFocused ? '#075cab' : 'black'}
            />
            <Text style={[styles.navText, { color: isFocused ? '#075cab' : 'black' }]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNavigationBar;
