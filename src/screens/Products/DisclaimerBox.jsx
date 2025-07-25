// src/components/DisclaimerBox.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const DisclaimerBox = () => {
  return (
    <TouchableOpacity style={styles.container} activeOpacity={1}>
      <Text style={styles.heading}>Disclaimer</Text>

      {disclaimerPoints.map((point, index) => (
        <View key={index} style={styles.point}>
          <Text style={styles.bullet}>{'\u2022'}</Text>
          <Text style={styles.text}>{point}</Text>
        </View>
      ))}
    </TouchableOpacity>
  );
};

const disclaimerPoints = [
  "All transactions, negotiations, and communications between buyers and sellers are conducted independently without BME Bharat's involvement.",
  "BME Bharat does not guarantee the quality, performance, authenticity, or availability of any products or services listed on the platform.",
  "The platform is not responsible for any disputes related to product guarantee, warranty, delivery, returns, or servicing.",
  "Users are advised to verify all company details, certifications, and product claims before making any purchase or entering into agreements.",
  "BME Bharat does not endorse or certify any of the listed companies or their offerings unless explicitly stated.",
  "By using the platform, users agree that BME Bharat shall be held harmless in case of any disagreements, misunderstandings, or damages arising from user interactions.",
];

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    
  },
  heading: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 16,
    color: '#333',
  },
  point: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 22,
    marginRight: 8,
    color: '#333',
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight:"300",
    lineHeight: 16,
    color: '#555',
  },
});

export default DisclaimerBox;
