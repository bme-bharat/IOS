
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
const AboutUs = () => {

  const navigation = useNavigation()

  return (

    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name="arrow-left" size={24} color="#075cab" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollViewContainer} showsVerticalScrollIndicator={false} >

        <View style={styles.container}>
          <Text style={styles.sectionHeading}>About Us</Text>
          <Text style={styles.paragraph}>
            We are a team of professionals, passionate about the innovative and dynamic field of biomedical engineering. By providing a platform that promotes knowledge sharing, collaboration, and innovation, we hope to inspire the next generation of biomedical engineers and contribute to a healthier and more advanced world.
          </Text>

          <Text style={styles.paragraph}>
            Our mission is to provide a comprehensive resource hub for all things related to biomedical engineering, from cutting-edge research to practical applications that impact lives around the world.
          </Text>

          <Text style={styles.paragraph}>
            We envision a world where biomedical engineering breakthroughs revolutionize healthcare and contribute to global well-being.
          </Text>

          <Text style={styles.paragraph}>
            Through our app, we aim to promote awareness and understanding of this transformative discipline, bridging the gap between academia, industry, and the general public.
          </Text>

          <Text style={styles.sectionHeading}>Biomedical Engineering</Text>
          <Text style={styles.paragraph}>
            Biomedical Engineering is an exciting and rapidly evolving field that combines the principles of engineering and medical sciences to innovate, design, and develop cutting-edge solutions that revolutionize healthcare and improve people's lives. At its core, biomedical engineering seeks to bridge the gap between medicine and technology, empowering healthcare professionals with advanced tools and techniques to diagnose, treat, and prevent diseases. It plays a pivotal role in developing new medical devices, diagnostic tools, therapies, and treatment methods, ultimately advancing healthcare and enhancing patient care.
          </Text>

          <Text style={styles.sectionHeading}>Why Choose BME Bharat App?</Text>
          <Text style={styles.paragraph}>
            BME Bharat app is your gateway to the fascinating realm of biomedical engineering. Whether you are an aspiring biomedical engineer, a medical healthcare professional, or just a curious individual intrigued by the intersection of technology and medicine, you've come to the right place, this app is tailored to meet your needs.
          </Text>
          <Text style={styles.paragraph}>At BME India we have developed an easy-to-use mobile application where:</Text>

          <Text style={styles.listItem}>- Connect with professionals in the biomedical industry</Text>
          <Text style={styles.listItem}>- Access a variety of vendors and suppliers</Text>
          <Text style={styles.listItem}>- List products for a wide audience (manufacturers, service providers, dealers, distributors)</Text>
          <Text style={styles.listItem}>- Receive newsletters and articles from senior biomedical professionals</Text>
          <Text style={styles.listItem}>- Share knowledge and ask questions</Text>
          <Text style={styles.listItem}>- Get quick answers from experienced professionals</Text>
          <Text style={styles.featureTitle}>Key Features:</Text>
          <Text style={styles.featureTitle}>Industry Insights:</Text>
          <Text style={styles.paragraph}>Stay updated with the conferences, workshops, industry events, latest trends and advancements in biomedical engineering. Our app offers real-time news and expert insights from leading professionals, ensuring you never miss a crucial breakthrough or important opportunity to expand your knowledge and network.</Text>
          <Text style={styles.featureTitle}>Career Guidance:</Text>
          <Text style={styles.paragraph}>If you are considering a career in biomedical engineering, let us guide you through the various educational paths, job prospects, and skill requirements. Discover internship and job opportunities from top healthcare institutions and companies.</Text>
          <Text style={styles.featureTitle}>Innovation Showcase:</Text>
          <Text style={styles.paragraph}>Discover groundbreaking innovations and technological advancements in the healthcare industry. From prosthetics and wearable devices to state-of-the-art imaging technologies, explore the future of medicine at your fingertips.</Text>
          <Text style={styles.featureTitle}>Networking Opportunities:</Text>
          <Text style={styles.paragraph}>Connect with like-minded individuals, researchers, and professionals in the biomedical engineering community. Engage in discussions, share knowledge, exchange ideas, and collaborate on projects to contribute to the future of healthcare technology. We encourage discussions, forums, and networking opportunities, fostering a supportive environment for growth and learning.</Text>
          <Text style={styles.sectionHeading}>Who Can Benefit from the App?</Text>
          <Text style={styles.featureTitle}>Students:</Text>
          <Text style={styles.paragraph}>Our app is an invaluable resource for students pursuing degrees in biomedical engineering or related fields. It enhances the learning experience by offering hands-on experiences and access to valuable resources. Whether you're a medical student, engineering student, or a student in a related discipline, this app can supplement your education and help you stay up-to-date with the latest developments in the field.</Text>
          <Text style={styles.featureTitle}>Medical Professionals:</Text>
          <Text style={styles.paragraph}>For healthcare practitioners, this app is a gateway to staying informed about the latest technologies and medical advancements. It offers a curated feed of information on groundbreaking medical innovations, which can transform the way you diagnose and treat patients. As a medical professional, you can benefit from the app's continuous updates and expert insights to deliver the best care to your patients.</Text>
          <Text style={styles.featureTitle}>Researchers:</Text>
          <Text style={styles.paragraph}>Access to a wealth of knowledge and data is crucial for researchers in the biomedical engineering and related areas. Our app provides a platform for researchers to stay updated with the most recent studies, breakthroughs, and datasets. It's an invaluable tool to support your research efforts, helping you make advancements in your chosen field.</Text>
          <Text style={styles.featureTitle}>Enthusiasts:</Text>
          <Text style={styles.paragraph}>If you're someone with a passion for learning about groundbreaking medical technologies and innovations, this app caters to your curiosity. You don't need a formal background in biomedical engineering to benefit from the app. It's designed to be user-friendly and informative, making it easy for enthusiasts to explore and understand the exciting developments in the field.</Text>
          <Text style={styles.featureTitle}>Job Seekers:</Text>
          <Text style={styles.paragraph}>Job seekers looking for opportunities in the biomedical engineering and related industries can utilize the app to find job listings, stay updated on industry trends, and access resources that will help them prepare for interviews. It serves as a valuable tool in your job search and career development.</Text>
          <Text style={styles.featureTitle}>Buyers:</Text>
          <Text style={styles.paragraph}>Individuals and organizations looking to purchase medical equipment, devices, or related products can use the app to discover and compare options. It provides a marketplace for buyers to browse a wide range of products and make informed decisions.</Text>
          <Text style={styles.featureTitle}>Companies:</Text>
          <Text style={styles.paragraph}>For businesses operating in the biomedical engineering and medical technology sectors, the app offers a platform to showcase and list their products and services. By doing so, they can reach a vast audience of potential customers and clients, ultimately expanding their reach and increasing their sales.</Text>
          <Text style={styles.featureTitle}>How to Contribute:</Text>
          <Text style={styles.paragraph}>We welcome contributions from our community. If you have an article, research paper, case study, or opinion piece you'd like to share, please submit your content through our submission portal. Our editorial team will review your submission and publish it if it meets our quality standards.</Text>
        </View>
      </ScrollView>
    </View>

  );
};
const styles = StyleSheet.create({
  scrollViewContainer: {
    paddingHorizontal: 10,
    paddingBottom: '20%',

  },

  backButton: {
    alignSelf: 'flex-start',
    padding: 10,

  },

  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '500',
    color: "black",
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: 'black',
    marginBottom: 12,
    fontWeight: '300',
    textAlign: 'justify'
  },
  container: {
    flex: 1,
    width: '100%',

  },

  listItem: {
    fontSize: 14,
    color: 'black',
    marginLeft: 10,
    marginBottom: 4,
    fontWeight: '300',
    textAlign: 'justify'
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: "black",
    marginTop: 20,
    marginBottom: 10,
  },
});


export default AboutUs;