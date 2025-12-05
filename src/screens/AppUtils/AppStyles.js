import { Platform, StyleSheet } from 'react-native';
import { colors } from '../../assets/theme';

const headerHeight = 60;
const bottomHeight = 60;

export default AppStyle = StyleSheet.create({

  scrollView: {
    paddingTop: headerHeight,
    paddingBottom: bottomHeight,


  },
  menuContainer: {
    padding: 10
  },
  bottom: {
    height: 60,
    backgroundColor: "#075cab",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  buttonContainer: {
    backgroundColor: '#075cab',
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  buttonContainer1: {
    width: 100,
    padding: 5,
    borderRadius: 20,
    borderColor: '#075cab',
    borderWidth: 0.5,
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cancelBtn: {
    width: 100,
    padding: 5,
    borderRadius: 20,
    borderColor: '#FF0000',
    borderWidth: 0.5,
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  UpdateContainer: {
    flexDirection: 'row', justifyContent: 'space-around', marginTop: 50

  },
  Postbtn: {
    alignSelf: 'center',
    width: 90,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#075cab',
    borderWidth: 1,
    marginVertical: 20,
  },

  PostbtnSkip: {
    alignSelf: 'center',
    width: 60,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#075cab',
    borderWidth: 1,
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },

  PostbtnText: {
    color: '#075cab',
    fontWeight: '500',
    fontSize: 15,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',

  },
  headerContainerForum: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  searchContainerForum: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 10,
    borderRadius: 10,

  },
  inputContainerForum: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  searchInputForum: {
    flex: 1,
    fontSize: 14,
    backgroundColor: "white",
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 30,
  },
  searchIconButtonForum: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',

  },
  iconButtonForum: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',


  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 10,
    borderRadius: 10,

  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 10,
    backgroundColor: 'whitesmoke',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    backgroundColor: "whitesmoke",
    paddingHorizontal: 15,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    color: '#000'
  },

  searchIconButton: {
    padding: 8,
    overflow: 'hidden',
    backgroundColor: '#e6f0ff',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  iconButton: {
    padding: 8,
    overflow: 'hidden',
    backgroundColor: '#e6f0ff',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,

  },
  circle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderRadius: 8,

  },
  shareText: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: '500',

  },
  dotsContainer: {
    marginTop: 12,
    gap: 8,
    position: 'absolute',
    bottom: 20, // move higher or lower as needed
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#888',
  },

  activeDot: {
    backgroundColor: '#000',
  },

  cardImage1: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 10,
  },

  cardImage: {
    width: '100%',
    height: '100%',
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8
  },
  avatarText: {
    fontSize: 50,
    fontWeight: 'bold',
  },
  avatarContainerDetails: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',

  },

});




export const styles = StyleSheet.create({

  // --- Original Styles ---
  card5: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },

  companyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },

  companyImageContainer: {
    width: '100%',
    height: 150,
  },

  eduCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    // marginHorizontal: 6,
    marginBottom: 5,
    // borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#ddd',
    height: 110,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },

  },

  eduCardLeft: {
    width: 110,
    height: 110,
    backgroundColor: '#f9f9f9',
    borderRightWidth: 0.5,
    borderColor: '#eee',
    padding: 5,
  },

  eduImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'contain',
    alignSelf: 'center'
  },

  eduCardRight: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    minWidth: 0,              // ✅ allows flex children to shrink instead of overflowing
    // lineHeight:20
  },

  eduTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text_primary,
    marginBottom: 5

  },

  eduSubText: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.text_primary,
    lineHeight: 20
  },


  label: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text_primary,
  },

  jobMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  // --- Enhancements (Additions Only) ---
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',   // ✅ centers icon + text vertically
    marginVertical: 4,
    flexShrink: 1,
  },

  rowText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text_primary,
    marginLeft: 6,
    flexShrink: 1,     // allow text to shrink
    minWidth: 0,          // ✅ space between icon and text
  },


  priceRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },

  modelText: {
    fontSize: 15,
    color: '#777',
    alignItems: 'flex-start'
  },

  descriptionText: {
    fontSize: 15,
    color: '#777'
  },

  companyNameText: {
    fontSize: 15,
    marginTop: 4,
  },

  price: {
    fontSize: 15,
    fontWeight: '500',
    color: 'black',
  },


  flatListContainer: {
    paddingBottom: '20%',
  },

  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  heroCard: {
    height: 230,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    marginHorizontal: 4,
    elevation: 4,
    backgroundColor: '#f0f0f0'
  },

  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0'
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  heroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },

  tagRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },

  tag: {
    paddingVertical: 4,
    borderRadius: 20,
  },

  tagText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },

  metaLine: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    flexShrink: 1,
  },

  metaLabel: {
    fontWeight: '600',
    color: '#fff',
  },

  metaValue: {
    fontWeight: '500',
    color: '#fff',
  },

  metaDate: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 8,
  },

  bodyText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '400',
  },

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
    elevation: 5,
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

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    paddingHorizontal: 10
  },
  searchBar: { height: 80, width: '50%' },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  notificationContainer: {
    padding: 8,
  },

  notificationBadge: {
    position: 'absolute',
    backgroundColor: 'firebrick',
    borderRadius: 14,
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  notificationText: {
    fontSize: 12,
    color: '#fff',
    paddingHorizontal: 1,
  },

  profileContainer: {

    width: 36,
    height: 36,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },


  detailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
  },

  headingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',

  },

  headingText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#075cab',
    padding: 10,
  },

  heading: {
    fontSize: 15,
    fontWeight: '500',
    color: "#075cab",
    padding: 10,
    alignItems: 'center',
  },

  cards: {
    // marginHorizontal: 2,
  },

  seeAllText: {
    fontSize: 14,
    color: "#075cab",
    fontWeight: '600',
    padding: 10,
  },

  tabScrollWrapper: {
    backgroundColor: 'whitesmoke',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 4,
  },


  tabListContent: {
    paddingHorizontal: 12,
  },

  tabWrapper: {
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    alignItems: 'center'
  },

  activeTab: {
    backgroundColor: '#fff',
    // shadowColor: '#075cab',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.2,
    // shadowRadius: 4,
    // elevation: 4,
    borderWidth: 1,
    borderColor: '#075cab'
  },

  tabText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },

  activeTabText: {
    color: '#075cab',
    fontWeight: '700',
  },

  articleCard: {
    padding: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#ddd',
    marginHorizontal: 6,
    marginBottom: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },

  },
  articleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 6
  },
  authorRow: {
    flexDirection: 'row',

  },
  authorSection: {
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: 100,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '300',
    color: colors.text_secondary,

  },
  authorImage: {
    width: 50,
    height: 50,
    borderRadius: 30,
    marginRight: 12,
    marginTop: 5
  },
  authorName: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    alignSelf: 'flex-start',
    maxWidth: 150,
  },
  articleMedia: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginLeft: 12,
  },
  articleTime: {
    fontSize: 11,
    fontWeight: "300",
    color: colors.text_secondary,
    marginTop: 2
  },

  PostedLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text_primary,

  },
  cardImage1: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 10,
  },

  cardImage: {
    width: '100%',
    height: '100%',
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd'
  }
});

export const commonStyles = StyleSheet.create({
  title: {
    flexDirection: 'row',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text_primary,
    marginBottom: 5,
    alignSelf: 'center'
  },

  labValContainer: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
  },
  valContainer: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    marginHorizontal: 10
  },
  label: {
    flex: 1,
    color: colors.text_primary,
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'left',
    alignSelf: 'flex-start',

  },

  colon: {
    width: 15,

  },
  value: {
    flex: 2, // Take the remaining space
    flexShrink: 1,
    color: colors.text_secondary,
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'left', // Align text to the left
    alignSelf: 'flex-start',
    letterSpacing: 0.2
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 80,
  },
  avatarText: {
    fontSize: 50,
    fontWeight: 'bold',
  },
})