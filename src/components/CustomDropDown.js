

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CustomDropdown = ({
    label,
    data = [],
    selectedItem, 
    onSelect,
    buttonStyle,
    buttonTextStyle,
    itemStyle,
    itemTextStyle,
    placeholder = ""
}) => {
    const [visible, setVisible] = useState(false);

    // useEffect(() => {
    //     // Reset selection if the current selected item is not in the new data
    //     if (data.length > 0 && !data.includes(selectedItem)) {
    //         setSelectedItem("");
    //     }
    // }, [data]);

    const toggleDropdown = () => {
        setVisible(!visible);
    };

    const handleSelect = (item) => {
      
        onSelect(item);
        setVisible(false);
    };

    return (
        <View style={styles.dropdownContainer}>
            <TouchableOpacity style={[styles.dropdown, buttonStyle]} onPress={toggleDropdown}>
                <Text style={[styles.selectedText, buttonTextStyle]}>{selectedItem || placeholder}</Text>
                <Icon name="chevron-down" size={24} color="gray" />
            </TouchableOpacity>
            <Modal
                visible={visible}
                transparent={true}
                animationType="slide"
                onRequestClose={toggleDropdown}
            >
                <TouchableOpacity style={styles.overlay} onPress={toggleDropdown}>
                    <View style={styles.modalContent}>
                        <FlatList
                            data={data}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.item, itemStyle]} onPress={() => handleSelect(item)}>
                                    <Text style={[styles.itemText, itemTextStyle]}>{item}</Text>
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
        borderRadius: 20
    },
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,  // Increased vertical padding to adjust height
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    selectedText: {
        fontSize: 16,
        color: "black"
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
        borderBottomWidth:1,
        borderBottomColor:'#ddd'
    },
    itemText: {
        fontSize: 16,
        color: "black",
    },
});


export default CustomDropdown;
