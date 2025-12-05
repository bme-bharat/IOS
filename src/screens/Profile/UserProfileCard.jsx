import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon1 from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Image as FastImage } from 'react-native';
import { settingStyles as styles } from '../Styles/settingStyles';
import User from '../../assets/svgIcons/user.svg';
import Company from '../../assets/svgIcons/company.svg';

import Phone from '../../assets/svgIcons/phone.svg';
import Email from '../../assets/svgIcons/mail.svg';
import Register from '../../assets/svgIcons/register.svg';
import School from '../../assets/svgIcons/school.svg';


import { colors, dimensions } from '../../assets/theme.jsx';
import { commonStyles } from '../AppUtils/AppStyles.js';


const UserProfileCard = ({ profile, onEdit, onNavigate }) => {
  const isCompany = profile?.user_type === 'company';

  return (
    <TouchableOpacity activeOpacity={1} onPress={onNavigate} style={styles.profileContainer}>
      <TouchableOpacity style={styles.editProfileButton} onPress={onEdit}>
        <Text style={styles.editProfileText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={1} onPress={onNavigate} style={styles.imageContainer}>
        {profile?.imageUrl ? (
          <FastImage
            source={{ uri: profile?.imageUrl, }}

            style={styles.detailImage}
            resizeMode="contain"
            onError={() => { }}
          />
        ) : (
          <View style={[commonStyles.avatarContainer, { backgroundColor: profile?.companyAvatar?.backgroundColor }]}>
            <Text style={[commonStyles.avatarText, { color: profile?.companyAvatar?.textColor }]}>
              {profile?.companyAvatar?.initials}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.profileDetails}>
        {isCompany ? (
          <>
            <View style={styles.title1}>
              <Company width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

              <Text style={styles.colon}>|</Text>
              <Text style={styles.value}>{profile?.company_name?.trim()}</Text>
            </View>

            <View style={styles.title1}>
              <Phone width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

              <Text style={styles.colon}>|</Text>
              <Text style={styles.value}>{(profile?.company_contact_number || '').trim()}</Text>
            </View>

            <View style={styles.title1}>
              <Email width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

              <Text style={styles.colon}>|</Text>
              <Text style={styles.value}>{profile?.company_email_id || ''}</Text>
            </View>

            <View style={styles.title1}>
              <Register width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

              <Text style={styles.colon}>|</Text>
              <Text style={styles.value}>
                {(profile?.business_registration_number || '').trim()}
              </Text>
            </View>

          </>
        ) : (
          <>
            <View style={styles.title1}>
              <User width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

              <Text style={styles.colon}>|</Text>
              <Text style={styles.value}>
                {(profile?.first_name || '').trim()} {(profile?.last_name || '').trim()}
              </Text>
            </View>

            <View style={styles.title1}>
              <Phone width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

              <Text style={styles.colon}>|</Text>
              <Text style={styles.value}>{(profile?.user_phone_number || '').trim()}</Text>
            </View>

            <View style={styles.title1}>
              <Email width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

              <Text style={styles.colon}>|</Text>
              <Text style={styles.value}>{profile?.user_email_id || ''}</Text>
            </View>

            {!!profile?.college?.trim() && (
              <View style={styles.title1}>
                <School width={dimensions.icon.medium} height={dimensions.icon.medium} color={colors.primary} />

                <Text style={styles.colon}>|</Text>
                <Text style={styles.value}>{profile.college.trim()}</Text>
              </View>
            )}
          </>
        )}
      </View>


    </TouchableOpacity>
  );
};

export default UserProfileCard;
