import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import NavigationItem from './NavigationItem';
import { settingStyles as styles } from '../Styles/settingStyles';
import { colors, dimensions } from '../../assets/theme';

const DrawerNavigationList = ({ items, expandedItem, onToggle, isConnected }) => {

  return items.filter(Boolean).map((item, index) => (
    <NavigationItem
      key={index}
      icon={ <item.icon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary}/> }
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
          }} >
          <Text style={styles.subItem}>{subItem.label}</Text>
        </TouchableOpacity>
      ))}
    </NavigationItem>
  ));
};

export default DrawerNavigationList;
