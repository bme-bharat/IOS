import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { settingStyles as styles } from '../Styles/settingStyles';

const NavigationItem = ({ icon, label, onPress, showSubItems, children, onToggle }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={1}>
    <View style={styles?.drawerItem}>
      <Icon name={icon} size={20} color="#075cab" />
      <Text style={styles?.drawerLabel}>{label}</Text>
      {children && children.length > 0 && onToggle && (
        <Icon
          name={showSubItems ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="black"
          style={styles?.dropdownIcon}
          onPress={onToggle}
        />
      )}
    </View>
    {showSubItems && <View style={styles?.subItemsContainer}>{children}</View>}
  </TouchableOpacity>
);

export default NavigationItem;
