
import { StyleSheet, Text, View, Image, ScrollView, Modal, Linking, Platform, TouchableOpacity, SafeAreaView, TouchableWithoutFeedback } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import maleImage from '../../images/homepage/dummy.png';
import femaleImage from '../../images/homepage/female.jpg';
import ContactSupplierModal from '../helperComponents/ContactsModal';
import { openMediaViewer } from '../helperComponents/mediaViewer';
import ResumeModal from '../helperComponents/resumeModal';


const CompanyGetJobCandidatesScreen = () => {
  const route = useRoute();
  const { posts, imageUrl } = route.params;
  const navigation = useNavigation()
  const scrollViewRef = useRef(null)
  const [modalVisible1, setModalVisible1] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  return (

    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#075cab" />
        </TouchableOpacity>

      </View>

      <ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, paddingBottom:'20%' }}
        showsVerticalScrollIndicator={false} ref={scrollViewRef} >
        <TouchableOpacity
          onPress={() => {
            if (typeof imageUrl === 'string') {
              openMediaViewer([{ type: 'image', url: imageUrl }]);
            }
          }}
          activeOpacity={0.8}
          style={styles.imageContainer}
        >
          {typeof imageUrl === 'string' ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onError={(e) =>
                console.error('Image load error:', e.nativeEvent.error)
              }
            />
          ) : (
            <View
              style={[
                styles.image,
                { backgroundColor: imageUrl?.backgroundColor || '#ccc' },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  { color: imageUrl?.textColor || '#000' },
                ]}
              >
                {imageUrl?.initials || 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>



        <View style={styles.textContainer}>
          <Text style={styles.name}>{`${posts.first_name || ""} ${posts.last_name || ""}`}
          </Text>
          <View style={styles.detail}>
            <Text style={styles.label}>Gender</Text>
            <Text style={styles.colon}>:</Text>

            <Text style={styles.value}>{posts.gender || ""}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.label}>Work experience</Text>
            <Text style={styles.colon}>:</Text>

            <Text style={styles.value}>{(posts.work_experience || "").trimStart().trimEnd()}</Text>
          </View>
          {posts.college?.trim() ? (
            <View style={styles.detail}>
              <Text style={styles.label}>College</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{posts.college.trim()}</Text>
            </View>
          ) : null}

          {posts.education_qualifications?.trim() && (
            <View style={styles.detail}>
              <Text style={styles.label}>Educational qualification</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{posts.education_qualifications.trim()}</Text>
            </View>
          )}

          <View style={styles.detail}>
            <Text style={styles.label}>Expert in</Text>
            <Text style={styles.colon}>:</Text>

            <View style={{ flexDirection: "column", flex: 2 }}>
              {posts.expert_in
                .split(",")
                .map((language, index) => (
                  <Text key={index} style={styles.value}>
                    {language.trim()},
                  </Text>
                ))}
            </View>
          </View>
          <View style={styles.detail}>
            <Text style={styles.label}>City</Text>
            <Text style={styles.colon}>:</Text>

            <Text style={styles.value}>{posts.city || ""}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.label}>State</Text>
            <Text style={styles.colon}>:</Text>

            <Text style={styles.value}>{posts.state || ""}</Text>
          </View>

          <View style={styles.detail}>
            <Text style={styles.label}>Domain strength</Text>
            <Text style={styles.colon}>:</Text>

            <Text style={styles.value}>{posts.domain_strength || ""}</Text>
          </View>
          {posts?.industry_type?.trim() && (
            <View style={styles.detail}>
              <Text style={styles.label}>Industry type</Text>
              <Text style={styles.colon}>:</Text>

              <Text style={styles.value}>{posts.industry_type || ""}</Text>
            </View>

          )}

          {posts.languages?.trim() && (
            <View style={styles.detail}>
              <Text style={styles.label}>Languages known</Text>
              <Text style={styles.colon}>:</Text>

              <View style={{ flexDirection: "column", flex: 2 }}>
                {posts.languages
                  .split(",")
                  .map((language, index) => (
                    <Text key={index} style={styles.value}>
                      {language.trim()}
                    </Text>
                  ))}
              </View>
            </View>
          )}

          {posts.preferred_cities?.trim() && (
            <View style={styles.detail}>
              <Text style={styles.label}>Preferred cities</Text>
              <Text style={styles.colon}>:</Text>

              <View style={{ flexDirection: "column", flex: 2 }}>
                {posts.preferred_cities
                  .split(",")
                  .map((city, index) => (
                    <Text key={index} style={styles.value}>
                      {city.trim()}
                    </Text>
                  ))}
              </View>
            </View>
          )}

          {posts.expected_salary?.trim() && (
            <View style={styles.detail}>
              <Text style={styles.label}>Expected salary</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{posts.expected_salary.trim()}</Text>
            </View>
          )}

        </View>


        <TouchableOpacity onPress={() => setModalVisible1(true)} >
          <Text style={styles.contact}>Contact details</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setModalVisible(true)} >
          <Text style={styles.contact}>View resume</Text>
        </TouchableOpacity>
        <ContactSupplierModal
          visible={modalVisible1}
          onClose={() => setModalVisible1(false)}
          company_id={posts.user_id}
        />
        <ResumeModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          company_id={posts.user_id}
        />

      </ScrollView>

    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'

  },
  imageContainer: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 10
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
  },

  textContainer: {
    // borderWidth: 1,
    // borderColor: '#ccc',
    borderRadius: 10,
    // padding: 15,
    backgroundColor: 'white',

  },
  name: {
    fontSize: 20,
    fontWeight: '400',
    marginBottom: 15,
    textAlign: 'center',
    color: 'black',

  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    elevation: 3, // Android shadow
    backgroundColor: 'white',
    shadowColor: '#000', // iOS shadow color
    shadowOffset: { width: 0, height: 2 }, // iOS shadow offset
    shadowOpacity: 0.2, // iOS shadow opacity
    shadowRadius: 3, // iOS shadow radius
    borderRadius: 10,
    padding: 10
  },
  colon: {
    width: 20, // Fixed width for the colon
    textAlign: 'center', // Center the colon
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    alignSelf: 'flex-start',

  },
  label: {
    flex: 1, // Take up available space
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',

  },
  value: {
    flex: 2, // Take the remaining space
    flexShrink: 1,
    color: 'black',
    fontWeight: '400',
    fontSize: 15,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
  },
  labelText: {
    flex: 7,  // 70% of the width
    fontSize: 16,
    color: '#333',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,

  },
  contact: {
    fontSize: 16,
    color: '#075cab',
    textDecorationLine: 'underline',
    padding: 10,
    textAlign: 'center',

  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'space-between', // Make sure the content is spaced properly
    height: '12%', // Adjust height based on the content
  },
  cancelButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'transparent',
    padding: 5,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#000',
    marginBottom: 10,
  },
  phoneNumber: {
    color: '#075cab',
    fontWeight: 'bold',
    top: 10,
  },

  stickyContactButton: {
    position: 'absolute',
    bottom: -100,
    right: 10,
    backgroundColor: '#075cab',
    borderRadius: 50,
    padding: 15,
  },

  modalContainerImage: { flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  closeButton1: { position: 'absolute', top: 60, right: 20 },
  modalImage: { width: '100%', height: '100%', borderRadius: 10 },

  dropdownContainer1: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    elevation: 5,
    zIndex: 1,
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  icon: {
    marginRight: 10,
  },

  dropdownText: {
    fontSize: 16,
    color: '#075cab',
  },
});

export default CompanyGetJobCandidatesScreen;