import { StyleSheet } from "react-native";

export const settingStyles = StyleSheet.create({

  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,

  },

  profileContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    elevation: 4,
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    backgroundColor: '#fff'
  },

  editProfileButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 8,

  },
  editProfileText: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  profileDetails: {
    flex: 1,
    alignItems: 'flex-start',
    // marginLeft: 30,
    marginTop: 10

  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navText: {
    fontSize: 12,
    color: 'black',
    marginTop: 2,
  },

  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 80,
    marginBottom: 10,
  },
  detailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    overflow: 'hidden',

  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  avatarText: {
    fontSize: 50,
    fontWeight: 'bold',
  },
  avatarTextMini: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    flex: 1,
    color: 'black',
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },

  title1: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',  // Align label and detail in a row
    alignItems: 'center',  // Center the items vertically
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  colon: {
    width: 40, // Fixed width for the colon
    textAlign: 'center', // Center the colon
    color: '#808080',
    fontWeight: '500',
    fontSize: 15,
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
  drawerItem: {
    marginTop: 5,
    flexDirection: 'row',
    fontSize: 15,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 10,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  container: {
    flexGrow: 1,

  },


  version: {
    fontSize: 16,
    color: '#075cab',
    fontWeight: '500',
  },
  drawerLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: "#075cab",
    fontWeight: "500",
    marginVertical: 8,
  },

  subItemsContainer: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginHorizontal: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    // borderBottomRightRadius: 5,
    // borderBottomLeftRadius: 5,
  },

  appversion: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50

  },
  appText: {
    fontSize: 13,
    color: 'gray',
    // marginBottom: 5,
    fontWeight: '400',
    textAlign: 'justify',
    alignItems: 'center',

  },


  subItem: {
    padding: 5,
    marginHorizontal: 30,
    marginVertical: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "black",

  },

  container1: {
    flex: 1,
  },

  dropdownIcon: {
    marginLeft: 'auto',
    color: '#075cab',
  },
  collapsedProfile: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#ffffff',
    zIndex: 10,
    elevation: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dcdcdc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    justifyContent: 'center',
  },

  miniProfileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  miniLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  miniImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1.2,
    borderColor: '#7baee9',
    backgroundColor: '#e6f0ff',
  },

  miniName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e2a38',
    marginLeft: 10

  },
  avatarContainerMini: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  avatarTextMini: {
    fontSize: 18,
    fontWeight: 'bold',
  },

});