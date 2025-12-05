
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ArrowDown from '../assets/svgIcons/arrow-down.svg';
import ArrowUp from '../assets/svgIcons/arrow-up.svg';
import { colors, dimensions } from '../assets/theme.jsx';

const CustomDropdown = ({ label, data, onSelect, selectedItem, setSelectedItem, style }) => {
    const [visible, setVisible] = useState(false);

    // Sync selectedItem with the parent component's state
    useEffect(() => {
        if (selectedItem === '') {
            setSelectedItem(''); // Reset to empty if parent resets it
        }
    }, [selectedItem, setSelectedItem]);

    const toggleDropdown = () => {
        setVisible(!visible);
    };

    const handleSelect = (item) => {
        setSelectedItem(item); // Update parent component's selectedItem
        onSelect(item); // Propagate the selected item to parent
        setVisible(false); // Close the dropdown
    };

    return (
        <View style={[styles.dropdownContainer, style]}>
            <TouchableOpacity style={styles.dropdown} onPress={toggleDropdown}>
                <Text style={styles.selectedText}>{selectedItem || `Select ${label}`}</Text>
                {visible ? (
                    <ArrowUp
                        width={dimensions.icon.medium}
                        height={dimensions.icon.medium}
                        color={colors.gray}
                    />
                ) : (
                    <ArrowDown
                        width={dimensions.icon.medium}
                        height={dimensions.icon.medium}
                        color={colors.gray}
                    />
                )}
            </TouchableOpacity>
            <Modal
                visible={visible}
                transparent={true}
                animationType="slide"
                onRequestClose={toggleDropdown}
            >
                <TouchableOpacity style={styles.overlay} onPress={toggleDropdown} activeOpacity={1}>
                    <View style={styles.modalContent}>
                        <FlatList
                            data={data}
                            showsVerticalScrollIndicator={false}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                                    <Text style={styles.itemText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};


const styles = StyleSheet.create({
    dropdownContainer: {
        flex: 1,
    },
    dropdown: {
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectedText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        margin: 20,
        padding: 20,
        borderRadius: 10,
        maxHeight: '50%'  // Limit modal content height (optional)
    },
    item: {
        paddingVertical: 10,
        color: "black",
        borderBottomWidth: 0.5,
        borderColor: '#ddd'
    },
    itemText: {
        fontSize: 16,
        color: "black",
    },
});


export default CustomDropdown;

