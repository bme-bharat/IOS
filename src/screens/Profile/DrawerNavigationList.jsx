import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import NavigationItem from './NavigationItem';

const DrawerNavigationList = ({ items, expandedItem, onToggle, isConnected, styles }) => {
  return items.filter(Boolean).map((item, index) => (
    <NavigationItem
      key={index}
      icon={item.icon}
      label={item.label}
      onPress={() => {
        if (isConnected) item.onPress?.();
      }}
      showSubItems={expandedItem === item.label}
      onToggle={() => onToggle(item.label)}
      styles={styles}
    >
      {item.subItems?.map((subItem, subIndex) => (
        <TouchableOpacity
          key={subIndex}
          onPress={() => {
            if (isConnected) subItem.onPress?.();
          }}
          style={styles.drawerItem}
        >
          <Text style={styles.subItem}>{subItem.label}</Text>
        </TouchableOpacity>
      ))}
    </NavigationItem>
  ));
};

export default DrawerNavigationList;
