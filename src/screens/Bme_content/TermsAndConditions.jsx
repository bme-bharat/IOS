import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const TermsAndConditionsScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container1} >
      <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
      <Icon name="arrow-left" size={24} color="#075cab" />
    </TouchableOpacity>
      </View>

    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Welcome to BME Bharat App</Text>
      <Text style={styles.paragraph}>
        By accessing or using the App, you agree to be bound by these Terms and Conditions. If you do not agree to these Terms, please do not use the App.
      </Text>

      <Text style={styles.heading}>Use of the App</Text>
      <Text style={styles.subHeading}>Eligibility:</Text>
      <Text style={styles.paragraph}>
        You must be at least 13 years old to use the App. By using the App, you represent and warrant that you meet this age requirement.
      </Text>
      <Text style={styles.subHeading}>License:</Text>
      <Text style={styles.paragraph}>
        We grant you a limited, non-exclusive, non-transferable, revocable license to use the App for your personal, non-commercial use, subject to these Terms.
      </Text>

      <Text style={styles.heading}>Prohibited Conduct</Text>
      <Text style={styles.paragraph}>
        You agree not to:
      </Text>
      <Text style={styles.list}>
        • Use the App for any illegal purpose or in violation of any local, state, national, or international law.{'\n'}
        • Attempt to gain unauthorized access to the App, other user accounts, or any computer systems or networks connected to the App.{'\n'}
        • Transmit any viruses, worms, defects, Trojan horses, or any items of a destructive nature.{'\n'}
        • Use the App to transmit unsolicited commercial emails ("spam").
      </Text>

      <Text style={styles.heading}>User Accounts</Text>
      <Text style={styles.subHeading}>Account Creation:</Text>
      <Text style={styles.paragraph}>
        To use certain features of the App, you may need to create an account. You agree to provide accurate and complete information when creating your account.
      </Text>
      <Text style={styles.subHeading}>Account Security:</Text>
      <Text style={styles.paragraph}>
        You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
      </Text>
      <Text style={styles.subHeading}>Privacy:</Text>
      <Text style={styles.paragraph}>
        Our Privacy Policy describes how we collect, use, and disclose information about you. By using the App, you agree to our Privacy Policy.
      </Text>

      <Text style={styles.heading}>Intellectual Property</Text>
      <Text style={styles.subHeading}>Ownership:</Text>
      <Text style={styles.paragraph}>
        All content and materials available on the App, including but not limited to text, graphics, logos, and software, are the property of BME Bharat or its licensors and are protected by intellectual property laws.
      </Text>
      <Text style={styles.subHeading}>Trademarks:</Text>
      <Text style={styles.paragraph}>
        BME Bharat and all related names, logos, product and service names, designs, and slogans are trademarks of BME Bharat or its affiliates or licensors. You may not use such marks without the prior written permission of BME Bharat.
      </Text>

      <Text style={styles.heading}>Disclaimers and Limitation of Liability</Text>
      <Text style={styles.subHeading}>No Medical Advice:</Text>
      <Text style={styles.paragraph}>
        The App is provided for informational purposes only and is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
      </Text>
      <Text style={styles.subHeading}>Disclaimer of Warranties:</Text>
      <Text style={styles.paragraph}>
        The App is provided on an "as is" and "as available" basis, without any warranties of any kind, either express or implied. We do not warrant that the App will be uninterrupted or error-free, that defects will be corrected, or that the App is free of viruses or other harmful components.
      </Text>
      <Text style={styles.subHeading}>Limitation of Liability:</Text>
      <Text style={styles.paragraph}>
        To the fullest extent permitted by law, we disclaim all liability, whether based in contract, tort (including negligence), strict liability, or otherwise, and will not be liable for any indirect, incidental, consequential, or punitive damages arising out of or related to your use of the App.
      </Text>

      <Text style={styles.heading}>Changes to the Terms</Text>
      <Text style={styles.paragraph}>
        We reserve the right to modify these Terms at any time. Any changes will be effective immediately upon posting the updated Terms on the App. Your continued use of the App after the posting of the changes constitutes your acceptance of the changes.
      </Text>

      <Text style={styles.heading}>Contact Us</Text>
      <Text style={styles.paragraph}>
        If you have questions or concerns about our legal compliance specific to Bharat or require assistance related to legal matters, please contact us at:
      </Text>
      <Text style={styles.list}>
        • Email: admin@bmebharat.com{'\n'}
        • Phone Number: +91 8310491223
      </Text>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    padding:10
    
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  container1: {
    flex: 1,
 
    backgroundColor: '#fff',
  },
  container: {
    padding: 10,
    backgroundColor: "white"

  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
    color: "black",
    textAlign: 'justify',
  },
  heading: {
    fontSize: 14,
    fontWeight: '500',
    marginVertical:5,
    color: "black",
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 5,
    marginBottom: 3,
    color: "black",
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    // textAlign: 'justify',
    color: "black",
    fontWeight: '300',
  },
  list: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    paddingLeft: 10,
    color: "black",
    fontWeight: '300',

  },
});

export default TermsAndConditionsScreen;