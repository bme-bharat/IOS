import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import { colors, dimensions } from '../../assets/theme.jsx';


const CancellationPolicy = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container1} >
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeftIcon
            width={dimensions.icon.ml}
            height={dimensions.icon.ml}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>Subscription Cancellation and Refund Policy</Text>
        <Text style={styles.subValue}>
          Thank you for choosing to subscribe to our biomedical engineering app B M E Bharat. We value your satisfaction and aim to provide a clear and fair policy regarding subscription cancellations and refunds. Please carefully review the following terms:
        </Text>

        <Text style={styles.sectionHeading}>Subscription Cancellations :</Text>
        <Text style={styles.value}>Cancellation by the Subscriber:</Text>
        <Text style={styles.subValue}>
          Subscribers may cancel their subscription at any time. To cancel your subscription, please follow the cancellation process provided within the App or contact our customer support at:
        </Text>
        <Text style={styles.subValue}>
          • Email: admin@bmebharat.com{'\n'}
          • Phone Number: +91 8310491223
        </Text>

        <Text style={styles.value}>Cancellation by the App Provider :</Text>
        <Text style={styles.subValue}>
          We reserve the right to cancel or suspend a subscription in case of violations of our Terms of Service or if there are reasonable grounds to believe that the subscription is being misused. In such cases, no refund will be provided.
        </Text>

        <Text style={styles.sectionHeading}>Refunds:</Text>
        <Text style={styles.value}>Refund Eligibility : </Text>
        <Text style={styles.subValue}>
          Subscribers may be eligible for a refund if the following conditions are met :
        </Text>
        <Text style={styles.subValue}>
          • You request a refund within 5 days of the subscription purchase.{'\n'}
          • You have not violated our Terms of Service.{'\n'}
          • You have not used the App for an extended period, and there is a valid reason for the refund.
        </Text>

        <Text style={styles.value}>Refund Process:</Text>
        <Text style={styles.subValue}>
          To request a refund, please contact our customer support at :
        </Text>
        <Text style={styles.subValue}>
          • Email: admin@bmebharat.com{'\n'}
          • Phone Number: +91 8310491223
        </Text>
        <Text style={styles.subValue}>
          Provide the necessary details, including your subscription information and the reason for the refund request. Our support team will review your request and respond within a reasonable time.
        </Text>

        <Text style={styles.value}>Refund Methods :</Text>
        <Text style={styles.subValue}>
          Refunds will be issued using the same payment method that you used for the subscription purchase. The time it takes for the refund to appear in your account may vary depending on your financial institution.
        </Text>

        <Text style={styles.sectionHeading}>Subscription Changes and Upgrades :</Text>
        <Text style={styles.subValue}>
          If you wish to change your subscription plan or upgrade to a different subscription level, you can do so at any time through the App. Any change in subscription fees will be prorated based on the remaining duration of your current subscription.
        </Text>

        <Text style={styles.sectionHeading}>Subscription Renewals :</Text>
        <Text style={styles.subValue}>
          Your subscription will automatically renew at the end of the subscription period, unless you cancel it. You will be charged the subscription fee for the next billing cycle, which will be of the same duration as your initial subscription. To avoid automatic renewal, please cancel your subscription as described above.
        </Text>

        <Text style={styles.sectionHeading}>Contact Us :</Text>
        <Text style={styles.subValue}>
          If you have any questions or concerns about our Cancellation/Refunds Policy or need assistance with your subscription, please contact us at:
        </Text>
        <Text style={styles.subValue}>
          • Email: admin@bmebharat.com{'\n'}
          • Phone Number: +91 8310491223
        </Text>

        <Text style={styles.subValue}>
          By subscribing to our App, you agree to abide by the terms and conditions outlined in this policy. We are committed to providing a transparent and equitable subscription experience for our users.
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
    marginBottom:5,

  },
  subValue: {
    flex: 2, // Take the remaining space
    flexShrink: 1,
    color: colors.text_secondary,
    fontWeight: '300',
    fontSize: 13,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
    marginBottom:10,

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





export default CancellationPolicy