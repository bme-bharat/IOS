import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


const CancellationPolicy = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container1} >
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#075cab" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Subscription Cancellation and Refund Policy</Text>
        <Text style={styles.paragraph}>
          Thank you for choosing to subscribe to our biomedical engineering app B M E Bharat. We value your satisfaction and aim to provide a clear and fair policy regarding subscription cancellations and refunds. Please carefully review the following terms:
        </Text>

        <Text style={styles.heading}>Subscription Cancellations :</Text>
        <Text style={styles.subHeading}>Cancellation by the Subscriber:</Text>
        <Text style={styles.paragraph}>
          Subscribers may cancel their subscription at any time. To cancel your subscription, please follow the cancellation process provided within the App or contact our customer support at:
        </Text>
        <Text style={styles.list}>
          • Email: admin@bmebharat.com{'\n'}
          • Phone Number: +91 8310491223
        </Text>

        <Text style={styles.subHeading}>Cancellation by the App Provider :</Text>
        <Text style={styles.paragraph}>
          We reserve the right to cancel or suspend a subscription in case of violations of our Terms of Service or if there are reasonable grounds to believe that the subscription is being misused. In such cases, no refund will be provided.
        </Text>

        <Text style={styles.heading}>Refunds:</Text>
        <Text style={styles.subHeading}>Refund Eligibility : </Text>
        <Text style={styles.paragraph}>
          Subscribers may be eligible for a refund if the following conditions are met :
        </Text>
        <Text style={styles.list}>
          • You request a refund within 5 days of the subscription purchase.{'\n'}
          • You have not violated our Terms of Service.{'\n'}
          • You have not used the App for an extended period, and there is a valid reason for the refund.
        </Text>

        <Text style={styles.subHeading}>Refund Process:</Text>
        <Text style={styles.paragraph}>
          To request a refund, please contact our customer support at :
        </Text>
        <Text style={styles.list}>
          • Email: admin@bmebharat.com{'\n'}
          • Phone Number: +91 8310491223
        </Text>
        <Text style={styles.paragraph}>
          Provide the necessary details, including your subscription information and the reason for the refund request. Our support team will review your request and respond within a reasonable time.
        </Text>

        <Text style={styles.subHeading}>Refund Methods :</Text>
        <Text style={styles.paragraph}>
          Refunds will be issued using the same payment method that you used for the subscription purchase. The time it takes for the refund to appear in your account may vary depending on your financial institution.
        </Text>

        <Text style={styles.heading}>Subscription Changes and Upgrades :</Text>
        <Text style={styles.paragraph}>
          If you wish to change your subscription plan or upgrade to a different subscription level, you can do so at any time through the App. Any change in subscription fees will be prorated based on the remaining duration of your current subscription.
        </Text>

        <Text style={styles.heading}>Subscription Renewals :</Text>
        <Text style={styles.paragraph}>
          Your subscription will automatically renew at the end of the subscription period, unless you cancel it. You will be charged the subscription fee for the next billing cycle, which will be of the same duration as your initial subscription. To avoid automatic renewal, please cancel your subscription as described above.
        </Text>

        <Text style={styles.heading}>Contact Us :</Text>
        <Text style={styles.paragraph}>
          If you have any questions or concerns about our Cancellation/Refunds Policy or need assistance with your subscription, please contact us at:
        </Text>
        <Text style={styles.list}>
          • Email: admin@bmebharat.com{'\n'}
          • Phone Number: +91 8310491223
        </Text>

        <Text style={styles.paragraph}>
          By subscribing to our App, you agree to abide by the terms and conditions outlined in this policy. We are committed to providing a transparent and equitable subscription experience for our users.
        </Text>
      </ScrollView>
    </SafeAreaView>

  );
};


const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    padding: 10
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