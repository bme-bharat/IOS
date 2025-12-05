import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import { colors, dimensions } from '../../assets/theme.jsx';

const LegalPolicy = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container1} >
      <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                         <ArrowLeftIcon width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />
      
      </TouchableOpacity>
      </View>
 
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionHeading}>Legal Compliance Policy</Text>
        <Text style={styles.subValue}>
          B M E Bharat ("we," "us," or "our") is committed to ensuring that our biomedical engineering app B M E Bharat complies with applicable Bharat laws and regulations. We have established this Legal Compliance section to provide transparency and assurance to our Bharat users regarding our commitment to legal and regulatory standards specific to India. Please read the following information carefully:
        </Text>

        <Text style={styles.sectionHeading}>Compliance with Data Protection Laws in Bharat (India):</Text>
        <Text style={styles.value}>Personal Data Protection:</Text>
        <Text style={styles.subValue}>
          We respect the privacy of our users and are committed to complying with Bharat data protection laws, including but not limited to the Personal Data Protection Bill. We ensure that your personal data is collected, processed, and stored in accordance with these regulations. For more information about how we handle your data, please review our Privacy Policy.
        </Text>
        <Text style={styles.value}>Data Localization :</Text>
        <Text style={styles.subValue}>
          We comply with any data localization requirements outlined in Bharat law, which may include storing and processing certain types of data within the geographical boundaries of Bharat.
        </Text>

        <Text style={styles.sectionHeading}>Copyright and Intellectual Property in Bharat:</Text>
        <Text style={styles.value}>Respect for Copyright :</Text>
        <Text style={styles.subValue}>
          We respect the intellectual property rights of others and expect our users to do the same. Any content, including text, images, videos, and other materials, provided within the App must comply with Bharat copyright laws. Users are not allowed to upload or share copyrighted material without the necessary permissions.
        </Text>
        <Text style={styles.value}>Notification of Copyright Infringement :</Text>
        <Text style={styles.subValue}>
          If you believe your copyright has been infringed by a user of our App, please notify us as described in our Copyright Policy. We will take appropriate action, which may include the removal of the infringing content and, in some cases, termination of the user's account.
        </Text>

        <Text style={styles.sectionHeading}>Compliance with Health Regulations in Bharat :</Text>
        <Text style={styles.subValue}>
          Our App may provide information related to biomedical engineering and medical technologies. We do not provide medical advice or services, and the content within the App is for informational purposes only. Users should always consult with qualified healthcare professionals for medical advice and treatment. We do not endorse or promote the use of unapproved or non-compliant medical devices or treatments in India.
        </Text>

        <Text style={styles.sectionHeading}>User Content and Community Guidelines :</Text>
        <Text style={styles.value}>Prohibited Content :</Text>
        <Text style={styles.subValue}>
          Users are prohibited from posting or sharing any content that violates Bharat laws, including but not limited to content that is defamatory, harmful, discriminatory, or infringing on the rights of others.
        </Text>
        <Text style={styles.value}>User Conduct :</Text>
        <Text style={styles.subValue}>
          Users are expected to conduct themselves in a respectful and lawful manner when using the App. Harassment, hate speech, or any form of harmful behaviour is strictly prohibited.
        </Text>
        <Text style={styles.value}>Reporting Violations :</Text>
        <Text style={styles.subValue}>
          If you encounter content or behaviour that violates our community guidelines or Bharat laws, please report it to us for review and appropriate action.
        </Text>

        <Text style={styles.sectionHeading}>Updates to Legal Compliance :</Text>
        <Text style={styles.subValue}>
          We may update our Legal Compliance to reflect changes in Bharat laws, regulations, or operational requirements. Any significant updates will be communicated to our users in Bharat. By continuing to use the App, you agree to abide by the latest version of our Legal Compliance.
        </Text>

        <Text style={styles.sectionHeading}>Contact Us :</Text>
        <Text style={styles.subValue}>
          If you have questions or concerns about our legal compliance specific to Bharat or require assistance related to legal matters, please contact us at:
        </Text>
        <Text style={styles.subValue}>
          • Email : admin@bmebharat.com{'\n'}
          • Phone Number: +91 8310491223
        </Text>

        <Text style={styles.subValue}>
          We are dedicated to ensuring that our App operates in accordance with the highest legal and ethical standards in Bharat. Your trust and satisfaction are essential to us, and we will continue to prioritize legal compliance in our operations within the Bharat legal framework.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    padding: 10
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text_primary,
    marginBottom: 5,
  },
  value: {
    flex: 2, // Take the remaining space
    flexShrink: 1,
    color: colors.text_primary,
    fontWeight: '400',
    fontSize: 13,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
    marginBottom:5

  },
  subValue: {
    flex: 2, // Take the remaining space
    flexShrink: 1,
    color: colors.text_secondary,
    fontWeight: '300',
    fontSize: 13,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
    marginBottom: 10,
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
    marginVertical: 5,
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



export default LegalPolicy