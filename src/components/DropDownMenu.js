import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ArrowDown from '../assets/svgIcons/arrow-down.svg';
import ArrowUp from '../assets/svgIcons/arrow-up.svg';
import { colors, dimensions } from '../assets/theme';

const CustomDropdownList = ({ items, onSelect, itemTextStyle }) => {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.key || item.label}
      renderItem={({ item }) => (
        <Pressable style={styles.item} onPress={() => onSelect(item)}>
          <Text style={[styles.itemText, itemTextStyle]}>{item.label}</Text>
          <View style={styles.divider} />
        </Pressable>
      )}
      nestedScrollEnabled
    />
  );
};

const CustomDropDownMenu = ({
  items,
  onSelect,
  buttonStyle,
  buttonTextStyle,
  itemTextStyle,
  placeholder,
  multiSelect = false,
  
}) => {
  const [visible, setVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const toggleDropdown = () => setVisible(!visible);

  const handleSelect = (item) => {
    console.log('Selected item:', item.label);

    if (!multiSelect) {
      setSelectedItem(item);
    }

    setVisible(false);
    onSelect?.(item);

    if (multiSelect) {
      setSelectedItem(null); // Reset for multi-select mode
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.dropdownButton, buttonStyle]}
        onPress={toggleDropdown}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, buttonTextStyle]}>
          {!multiSelect && selectedItem
            ? selectedItem.label
            : placeholder || 'Select'}
        </Text>
        {visible ? (
          <ArrowUp
            width={dimensions.icon.small}
            height={dimensions.icon.small}
            color={colors.primary}
          />
        ) : (
          <ArrowDown
            width={dimensions.icon.small}
            height={dimensions.icon.small}
            color={colors.primary}
          />
        )}

      </TouchableOpacity>

      <Modal transparent animationType="slide" visible={visible} onRequestClose={toggleDropdown}>
        <Pressable style={styles.modalOverlay} onPress={toggleDropdown}>
          <Pressable style={styles.dropdownSheet}>
            <CustomDropdownList items={items} onSelect={handleSelect} itemTextStyle={itemTextStyle} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',

  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal:10
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dropdownSheet: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    maxHeight: '50%',
    elevation: 5,
  },
  item: {

  },
  itemText: {
    fontSize: 14,
    color: '#333',
    paddingVertical: 10,
    fontWeight: '500'
  },
});

export default CustomDropDownMenu;
