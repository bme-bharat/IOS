import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { settingStyles as styles } from '../Styles/settingStyles';

const BottomNavigationBar = ({
  tabs,
  currentRouteName,
  navigation,
  flatListRef,
  scrollOffsetY,
  handleRefresh,
  tabNameMap,
}) => {
  return (
    <View style={styles.bottomNavContainer}>
      {tabs.map((tab, index) => {
        const tabName = tab.name;
        const isFocused = tabNameMap
          ? tabNameMap[currentRouteName] === tabName
          : currentRouteName === tabName;

        return (
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (isFocused) {
                if (scrollOffsetY?.current > 0) {
                  flatListRef?.current?.scrollToOffset({ offset: 0, animated: true });
                  setTimeout(() => {
                    handleRefresh?.();
                  }, 100);
                } else {
                  handleRefresh?.();
                }
              } else {
                navigation.navigate(tabName);
              }
            }}
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
