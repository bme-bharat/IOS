
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import CustomDropdown from '../../components/CustomDropDown';
import { useNavigation } from '@react-navigation/native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import image from '../../images/homepage/logo.jpeg'
import FastImage from 'react-native-fast-image';
import AppStyles from '../AppUtils/AppStyles';

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
    <SafeAreaView style={styles.container1}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('LoginPhone')} >
        <Icon name="arrow-back" size={24} color="#075cab" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.imageContainer}>
          <Image source={image} style={styles.logo} />
        </View>

        <Text style={styles.title}>Let's get started</Text>

        {/* User Type Selection */}

        <CustomDropdown
          label="User Type"
          data={['Individual', 'Business']}
          selectedItem={userType === 'company' ? 'Business' : userType ? 'Individual' : ''} 
          onSelect={handleUserTypeSelect}
          style={styles.dropdown}
          buttonStyle={styles.dropdownButton}
          buttonTextStyle={styles.dropdownButtonText}
          placeholder="Select User Type"

        />



        <CustomDropdown
          label="Profile"
          data={profiles}
          onSelect={(profile) => {
            setSelectedProfile(profile);
            setSelectedCategory(''); // Reset category when profile changes
          }}
          disabled={!userType} // Disable if no user type is selected
          selectedItem={selectedProfile} // Ensure selected profile appears inside the dropdown
          style={styles.dropdown}
          buttonStyle={styles.dropdownButton}
          buttonTextStyle={styles.dropdownButtonText}
          placeholder="Select Profile"

        />


        {/* Category Selection */}
        <CustomDropdown
          label="Category"
          data={categories}
          selectedItem={selectedCategory} // Ensure selected category appears inside the dropdown
          onSelect={(category) => setSelectedCategory(category)}
          disabled={!selectedProfile} // Disable if no profile is selected
          style={styles.dropdown} // Add styling to the dropdown
          buttonStyle={styles.dropdownButton}
          buttonTextStyle={styles.dropdownButtonText}
          placeholder="Select Category"
        />



        {/* Submit Button */}
        <TouchableOpacity
          style={[
            AppStyles.Postbtn,
            !userType || !selectedProfile || !selectedCategory ? styles.disabledButton : null,
          ]}
          onPress={handleSubmit}
          disabled={!userType || !selectedProfile || !selectedCategory}
        >
          <Text style={AppStyles.PostbtnText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container1: {
    flex: 1,
    backgroundColor: '#ffff',
  },
  container: {
    paddingHorizontal: 40,  // Added horizontal padding for spacing on both sides
    paddingTop: 10,  // Padding from the top
    paddingBottom: 10,  // Padding from the bottom
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    color: '#075cab',
    marginBottom: 20,
    textAlign: 'center',
    top: -10,
  },

  imageContainer: {
    alignItems: 'center',
    marginVertical: 20, // Add margin to space out the image
  },
  logo: {
    width: 200, // Adjust size of the image
    height: 200, // Adjust size of the image
    resizeMode: 'contain', // Ensures the image retains its aspect ratio
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,

  },
  disabledButton: {
    backgroundColor: 'white',
  },
  dropdown: {
    marginVertical: 10,  // Add vertical margin between dropdowns
    marginHorizontal: 15,
  },
  dropdownButton: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom:10
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});

export default ProfileTypeScreen;