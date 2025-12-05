import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { settingStyles as styles } from '../Styles/settingStyles';

import ArrowDown from '../../assets/svgIcons/arrow-down.svg';
import ArrowUp from '../../assets/svgIcons/arrow-up.svg';

import { colors, dimensions } from '../../assets/theme.jsx';


const NavigationItem = ({ icon, label, onPress, showSubItems, children, onToggle }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={1}>
    <View style={styles?.drawerItem}>
      <Text>{icon}</Text>
      <Text style={styles?.drawerLabel}>{label}</Text>

      {children && children.length > 0 && onToggle && (
        <>
          {showSubItems ? (
            <ArrowUp
              width={dimensions.icon.medium}
              height={dimensions.icon.medium}
              color={colors.primary}
              style={styles?.dropdownIcon}
              onPress={onToggle}
            />
          ) : (
            <ArrowDown
              width={dimensions.icon.medium}
              height={dimensions.icon.medium}
              color={colors.primary}
              style={styles?.dropdownIcon}
              onPress={onToggle}
            />
          )}
        </>
      )}
    </View>

    {showSubItems && <View style={styles?.subItemsContainer}>{children}</View>}
  </TouchableOpacity>
);

export default NavigationItem;
