import {
  StyleSheet,
  Text,
  View,
  Linking,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';

import ArrowLeftIcon from '../../assets/svgIcons/back.svg';
import Email from '../../assets/svgIcons/mail.svg';
import Phone from '../../assets/svgIcons/phone.svg';
import WhatsApp from '../../assets/svgIcons/whatsapp.svg';
import Instagram from '../../assets/svgIcons/instagram.svg';
import Facebook from '../../assets/svgIcons/facebook.svg';
import Youtube from '../../assets/svgIcons/youtube.svg';
import Linkedin from '../../assets/svgIcons/linkedin.svg';
import Web from '../../assets/svgIcons/web.svg';
import X from '../../assets/svgIcons/x.svg';

import { colors, dimensions } from '../../assets/theme';

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
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <ArrowLeftIcon
            width={dimensions.icon.medium}
            height={dimensions.icon.medium}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <ScrollView style={styles.container}>
        <Text style={styles.description}>
          You can get in touch with us through the platforms below. Our team
          will reach out to you as soon as possible.
        </Text>

        {/* Customer Support */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Support</Text>

          <TouchableOpacity style={styles.row} onPress={() => handlePress(`mailto:${contactDetails.email}`)}>
            <View style={[styles.iconWrapper]}>
              <Email width={dimensions.medium} height={dimensions.medium} color={colors.primary} />
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.detail}>{contactDetails.email}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => handlePress(`tel:${contactDetails.phone}`)}>
            <View style={[styles.iconWrapper]}>
              <Phone width={dimensions.medium} height={dimensions.medium} color={'#28a745'} />
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.detail}>{contactDetails.phone}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => handlePress(contactDetails.website)}>
            <View style={[styles.iconWrapper]}>
              <Web width={dimensions.medium} height={dimensions.medium} color={'#555'} />
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.label}>Website</Text>
              <Text style={styles.detail}>{contactDetails.website}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* WhatsApp */}
        <View style={styles.card}>
          <View style={styles.row1}>
            <View style={[styles.iconWrapper]}>
              <WhatsApp width={dimensions.medium} height={dimensions.medium} color={'#25D366'} />
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.label}>WhatsApp</Text>
              <Text
                style={styles.detail} // 👈 special style for clickable usernames
                onPress={() => handlePress(contactDetails.whatsapp)}
              >
                @BME Bharat
              </Text>
            </View>
          </View>
        </View>

        {/* Social Media */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connect with us</Text>

          <View style={styles.row}>
            <View style={[styles.iconWrapper]}>
              <Facebook width={dimensions.medium} height={dimensions.medium} color={'#1877F2'} />
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.label}>Facebook</Text>
              <Text
                style={styles.detail}
                onPress={() => handlePress(contactDetails.social.facebook)}
              >
                @BME Bharat
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.iconWrapper]}>
              <Instagram width={dimensions.medium} height={dimensions.medium} color={'#E4405F'} />
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.label}>Instagram</Text>
              <Text
                style={styles.detail}
                onPress={() => handlePress(contactDetails.social.instagram)}
              >
                @b_m_e_bharat
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.iconWrapper]}>
              <Youtube width={dimensions.medium} height={dimensions.medium} color={'#FF0000'} />
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.label}>YouTube</Text>
              <Text
                style={styles.detail}
                onPress={() => handlePress(contactDetails.social.youtube)}
              >
                @BME BHARAT
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.iconWrapper]}>
              <Linkedin width={dimensions.medium} height={dimensions.medium} color={'#0077B5'} />
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.label}>LinkedIn</Text>
              <Text
                style={styles.detail}
                onPress={() => handlePress(contactDetails.social.linkedin)}
              >
                @BME Bharat
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.iconWrapper]}>
              <X width={dimensions.medium} height={dimensions.medium} color={'#000'} />
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.label}>X</Text>
              <Text
                style={styles.detail}
                onPress={() => handlePress(contactDetails.social.x)}
              >
                @BME_BHARAT
              </Text>
            </View>
          </View>
        </View>


      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10
  },
  container: {
    
    paddingHorizontal: 12,
  },
  description: {
    fontSize: 13,
    fontWeight:'500',
    color: colors.text_secondary,
    marginVertical: 10,
    lineHeight: 20,
    letterSpacing:0.2
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    // borderWidth: 1,
    // borderColor: '#eee',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight:'600',
    color: colors.text_primary,
    marginBottom: 14,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textColumn: {
  
  },
  label: {
    fontSize: 15,
    fontWeight:'500',
    color: colors.text_secondary,
    marginBottom:5
  },
  detail: {
    fontSize: 15,
    fontWeight:'500',
    color: colors.primary,
  },
  detailLink: {
    fontSize: 13,
    fontWeight:'500',
    color: colors.primary,
  }

});

export default HelpCenter;
