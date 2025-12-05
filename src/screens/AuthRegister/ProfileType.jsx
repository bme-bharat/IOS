
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import CustomDropdown from '../../components/CustomDropDown';
import { useNavigation } from '@react-navigation/native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import image from '../../images/homepage/logo.jpeg'
import { Image as FastImage } from 'react-native';
import AppStyles from '../AppUtils/AppStyles';
import ArrowLeftIcon from '../../assets/svgIcons/back.svg';

import { colors, dimensions } from '../../assets/theme.jsx';
const ProfileSelect = {
  "Biomedical Engineering Company Manufacturer": [
    "Diagnostic Equipment",
    "Wearable Health Tech",
    "Prosthetics and Implants",
    "Medical Devices",
    "Biotechnology Products",
    "Pharmaceuticals",
    "Laboratory Equipment",
    "Imaging Technology"
  ],
  "Dealer/Distributor": [
    "Medical Devices",
    "Laboratory Supplies",
    "Pharmaceuticals",
    "Healthcare IT Solutions",
    "Surgical Instruments",
    "Medical Imaging Devices",
    "Diagnostic Equipment",
    "Implantable Devices",
    "Wearable Health Monitors"
  ],
  "Biomedical Engineering Company - Service Provider": [
    "Equipment Maintenance",
    "Calibration Services",
    "Medical Imaging Services",
    "Biomedical Waste Management",
    "Installation Services",
    "Clinical Engineering Support",
    "Training and Education Services",
    "Telemedicine Services"
  ],
  "Healthcare Provider - Biomedical": [
    "Hospital Biomedical Department",
    "Clinical Lab",
    "Diagnostic Center",
    "Rehabilitation Center",
    "Home Healthcare"
  ],
  "Academic Institution - Biomedical": [
    "Biomedical Engineering Programs",
    "Research Institutions",
    "Training Centers",
    "Internship and Training Provider",
    "Healthcare Education",
    "Continuing Medical Education"
  ],
  "Regulatory Body": [
    "Medical Device Regulations",
    "Biomedical Ethics and Compliance",
    "Biotechnology Regulations",
    "Pharmaceutical Regulations",
    "Clinical Trial Oversight",
    "Quality Assurance"
  ],
  "Investor/Venture Capitalist": [
    "Medical Devices",
    "Biotechnology",
    "Pharmaceuticals",
    "Healthcare Startups",
    "Research and Development Funding"
  ],
  "Patient Advocate": [
    "Patient Education",
    "Patient Rights",
    "Healthcare Access",
    "Chronic Disease Advocacy",
    "Disability Support"
  ],
  "Healthcare IT Developer": [
    "Electronic Health Records (EHR)",
    "Telemedicine Solutions",
    "Healthcare Apps",
    "AI in Healthcare",
    "Data Analytics in Healthcare"
  ],
  "Biomedical Engineering Student": [
    "Undergraduate Student",
    "Graduate Student",
    "PhD Candidate",
    "Research Intern",
    "Project Collaborator"
  ],
  "Biomedical Engineering Professor/Academic": [
    "Lecturer",
    "Thesis Advisor",
    "Department Head",
    "Laboratory Director"
  ],
  "Biomedical Engineer": [
    "Research & Development Engineer",
    "Clinical Engineer",
    "Product Design Engineer",
    "Quality Assurance Engineer",
    "Regulatory Affairs Specialist",
    "Biomedical Engineer Sales/Service"
  ],
  "Biomedical Researcher/Scientist": [
    "Academic Researcher",
    "Industry Researcher",
    "Clinical Trials",
    "Innovation and Prototyping",
    "Medical Device Innovation",
    "Biomedical Research",
    "Clinical Research",
    "Biotechnology Research",
    "Pharmaceutical Research"
  ],
  "Consultant": [
    "Business Development Consulting",
    "Healthcare IT Consulting",
    "Regulatory Consulting",
    "Product Development Consulting",
    "Market Research Consulting",
    "Clinical Engineering Consulting",
    "Quality Assurance Consulting",
    "Medical Device Consulting"
  ],
  "Medical Professional": [
    "Decision Maker",
    "Doctor - Anaesthetist",
    "Doctor - Cardiologist"
  ],
  "Others": [
    "Others"
  ]
};


const ProfileTypeScreen = () => {
  const navigation = useNavigation();
  const [userType, setUserType] = useState(''); // 'normal' or 'company'
  const [selectedProfile, setSelectedProfile] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Profiles for company users
  const companyProfiles = Object.keys(ProfileSelect).filter(profile =>
    profile.includes("Company") ||
    profile.includes("Dealer") ||
    profile.includes("Provider") ||
    profile.includes("Regulatory") ||
    profile.includes("Investor") ||
    profile.includes("Advocate") ||
    profile.includes("Academic Institution") ||
    profile.includes("Healthcare IT Developer")
  );

  // Profiles for individual users
  const normalProfiles = Object.keys(ProfileSelect).filter(profile =>
    !companyProfiles.includes(profile)
  );


  const handleUserTypeSelect = (selectedLabel) => {
    if (!selectedLabel) {
      console.warn('Invalid selection:', selectedLabel);
      return;
    }

    const type = selectedLabel === 'Business' ? 'company' : 'normal';
    setUserType(type);
    setSelectedProfile('');
    setSelectedCategory('');
  };


  const profiles = userType === 'company' ? companyProfiles.concat("Others") : normalProfiles

  const categories = selectedProfile ? ProfileSelect[selectedProfile] : [];

  const handleSubmit = () => {

    navigation.navigate('EnterPhone', { userType, selectedProfile, selectedCategory });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: false, // disables swipe back on iOS
      headerLeft: () => null,
    });
  }, [navigation]);


  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('LoginPhone')}
      >
        <ArrowLeftIcon
          width={dimensions.icon.medium}
          height={dimensions.icon.medium}
          color={colors.primary}
        />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Text style={styles.title}>Let’s Get Started</Text>
        <Text style={styles.subtitle}>
          Complete your profile setup to personalize your experience
        </Text>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Profile Details</Text>

          <CustomDropdown
            label="User Type"
            data={['Individual', 'Business']}
            selectedItem={
              userType === 'company' ? 'Business' : userType ? 'Individual' : ''
            }
            onSelect={handleUserTypeSelect}
            placeholder="Select User Type"
            style={styles.dropdown}
            buttonStyle={styles.dropdownButton}
            buttonTextStyle={styles.dropdownButtonText}
          />

          <CustomDropdown
            label="Profile"
            data={profiles}
            onSelect={(profile) => {
              setSelectedProfile(profile);
              setSelectedCategory('');
            }}
            disabled={!userType}
            selectedItem={selectedProfile}
            placeholder="Select Profile"
            style={styles.dropdown}
            buttonStyle={styles.dropdownButton}
            buttonTextStyle={styles.dropdownButtonText}
          />

          <CustomDropdown
            label="Category"
            data={categories}
            selectedItem={selectedCategory}
            onSelect={(category) => setSelectedCategory(category)}
            disabled={!selectedProfile}
            placeholder="Select Category"
            style={styles.dropdown}
            buttonStyle={styles.dropdownButton}
            buttonTextStyle={styles.dropdownButtonText}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !userType || !selectedProfile || !selectedCategory
              ? styles.disabledButton
              : null,
          ]}
          onPress={handleSubmit}
          disabled={!userType || !selectedProfile || !selectedCategory}
        >
          <Text style={styles.submitText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );


};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F6FA', // soft neutral background
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    margin:10,
    elevation: 3,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical:60
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.primary,
    // textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#6A6A6A',
    // textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 25,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    // elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  dropdown: {
    marginVertical: 10,
  },
  dropdownButton: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 10,

  },
  dropdownButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text_secondary,
  },
  submitButton: {
    marginTop: 35,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabledButton: {
    opacity: 0.6,
  },
});




export default ProfileTypeScreen;