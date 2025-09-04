import {
  StyleSheet,
  Text,
  View,
  Linking,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import XLogo from './XLogo';

const HelpCenter = () => {
  const navigation = useNavigation();

  const contactDetails = {
    email: 'bmebharat@gmail.com',
    phone: '+91 8310491223',
    website: 'https://bmebharat.com/',
    social: {
      facebook: 'https://www.facebook.com/bme.bharat/',
      instagram: 'https://www.instagram.com/b_m_e_bharat/',
      youtube: 'https://www.youtube.com/channel/UCxEPxTe3RhRXlBd3Er4653Q',
      linkedin: 'https://in.linkedin.com/in/bme-bharat-6859b6201',
      x: 'https://x.com/bme_india',
    },
    whatsapp: 'https://wa.me/918310491223',
  };

  const handlePress = url => {
    Linking.openURL(url).catch(err =>
      console.error('Error opening URL:', err),
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}>
        <Icon name="arrow-left" size={24} color="#075cab" />
      </TouchableOpacity>
      </View>
      <ScrollView style={styles.container}>
        <TouchableOpacity activeOpacity={1}>
          <Text style={styles.description}>
            You can get in touch with us through the platforms below. Our team
            will reach out to you as soon as possible.
          </Text>

          {/* Customer Support Card */}
          <View style={[styles.card, { marginBottom: 10 }]}>
            <Text style={styles.cardTitle}>Customer support:</Text>

            <TouchableOpacity style={styles.row} onPress={() => handlePress(`mailto:${contactDetails.email}`)}>
              {/* <Icon name="email-outline" size={24} color="#075cab" style={styles.iconLeft} /> */}
              <View style={[styles.iconLeftSocial, { borderColor: 'black' }]}>
                <Icon name="email" size={18} color="black" />
              </View>
              <View style={styles.textColumn}>
                <Text style={styles.label}>Email address</Text>
                <Text style={styles.detail}>{contactDetails.email}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={() => handlePress(`tel:${contactDetails.phone}`)}>

              <View style={[styles.iconLeftSocial, { borderColor: 'black' }]}>
                <Icon name="phone" size={18} color="black" />
              </View>
              <View style={styles.textColumn}>
                <Text style={styles.label}>Contact Number</Text>
                <Text style={styles.detail}>{contactDetails.phone}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={() => handlePress(contactDetails.website)}>
              {/* <Icon name="web" size={24} color="#075cab" style={styles.iconLeft} /> */}
              <View style={[styles.iconLeftSocial, { borderColor: 'black' }]}>
                <Icon name="web" size={18} color="black" />
              </View>
              <View style={styles.textColumn}>
                <Text style={styles.label}>Website</Text>
                <Text style={styles.detail}>{contactDetails.website}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { padding: 20, marginBottom: 10 }]}>
            {/* <Text style={styles.cardTitle}>whatsapp :</Text> */}



            <TouchableOpacity style={[styles.row, { marginBottom: 0 }]} onPress={() => handlePress(contactDetails.whatsapp)}>
              <View style={[styles.iconLeftSocial, {
                borderColor: '#25D366', width: 37,
                height: 37,
                borderRadius: 22,
              }]}>
                <Icon name="whatsapp" size={18} color="#25D366" />
              </View>
              <View>
                <Text style={[styles.label, { fontSize: 20 }]}>WhatsApp</Text>
                {/* <Text style={[styles.detail,{fontSize:16}]}>@BME Bharat</Text> */}
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { marginBottom: 10 }]}>

            <Text style={styles.cardTitle}>Connect with us on:</Text>

            <TouchableOpacity style={styles.row} onPress={() => handlePress(contactDetails.social.facebook)}>
              <View style={[styles.iconLeftSocial, { borderColor: '#3b5998' }]}>
                <Icon name="facebook" size={18} color="#3b5998" />

              </View>
              <View>
                <Text style={styles.label}>Facebook</Text>
                <Text style={styles.detail}>@BME Bharat</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={() => handlePress(contactDetails.social.instagram)}>
              <View style={[styles.iconLeftSocial, { borderColor: '#E1306C' }]}>
                <Icon name="instagram" size={18} color="#E1306C" />
              </View>
              <View>

                <Text style={styles.label}>Instagram</Text>
                <Text style={styles.detail}>@b_m_e_bharat</Text>

              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={() => handlePress(contactDetails.social.youtube)}>
              <View style={[styles.iconLeftSocial, { borderColor: '#FF0000' }]}>
                <Icon name="youtube" size={18} color="#FF0000" />
              </View>
              <View>
                <View>
                  <Text style={styles.label}>YouTube</Text>
                  <Text style={styles.detail}>@BME BHARAT</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={() => handlePress(contactDetails.social.linkedin)}>
              <View style={[styles.iconLeftSocial, { borderColor: '#0077B5',  }]}>
                <Icon name="linkedin" size={18} color="#0077B5" />
              </View>
              <View>
                <View>
                  <Text style={styles.label}>LinkedIn</Text>
                  <Text style={styles.detail}>@BME Bharat</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={() => handlePress(contactDetails.social.x)}>
              <View style={[styles.iconLeftSocial, { borderColor: '#000' }]}>
                <XLogo size={14} color="#000" />

              </View>
              <View>
                <View>
                  <Text style={styles.label}>X</Text>
                  <Text style={styles.detail}>@BME_BHARAT</Text>
                </View>
              </View>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,
    
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  container: {
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    paddingBottom:'20%'
  },
  description: {
    fontSize: 15,
    color: '#333',
    marginVertical: 16,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth:1,
    borderColor:'#ddd'
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  iconLeftSocial: {
    width: 34,
    height: 34,
    borderRadius: 21,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,

  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  detail: {
    fontSize: 15,
    color: '#075cab',
    marginTop: 2,
    fontWeight: '400',
  },
});


export default HelpCenter;
