import { Platform, StyleSheet } from 'react-native';

const headerHeight = 60;
const bottomHeight = 60;

export default AppStyle = StyleSheet.create({
  
  scrollView: {
    paddingTop: headerHeight,
    paddingBottom: bottomHeight,

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
    marginTop: 20,
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
    backgroundColor: 'whitesmoke',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,

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
    borderRadius: 10,
    height: 30,
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
    padding: 8,
    borderRadius: 8,

  },
  shareText: {
    color: '#075cab',
    fontSize: 15,
    fontWeight: '500',

  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
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
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
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
    borderRadius: 14,
    padding: 10,
    marginHorizontal: 4,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },

  cardContent4: {
    marginVertical: 10,
    gap: 6,
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
    marginHorizontal: 6,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#ddd',
    height: 100
  },

  eduCardLeft: {
    width: 100,
    height: 100,
    backgroundColor: '#f9f9f9',
    borderRightWidth: 0.5,
    borderColor: '#eee',
  },

  eduImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    resizeMode: 'contain',
  },

  eduCardRight: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },

  eduTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 6,
  },

  eduSubText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000',
    marginTop: 4,
  },

  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  priceRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },

  modelText: {
    fontSize: 15,
    color: '#777'

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
    marginBottom: 8,
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
    paddingLeft: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd'
  },

  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  notificationContainer: {
    padding: 6,
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
    padding: 6,
  },

  detailImageWrapper: {
    width: 36,
    height: 36,
    borderRadius: 80,
    backgroundColor: '#e0e0e0',
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

  heading: {
    fontSize: 15,
    fontWeight: '500',
    color: "#075cab",
    padding: 10,
  },

  cards: {
    marginTop: 10,
    marginHorizontal: 2,
  },

  seeAllText: {
    fontSize: 14,
    color: "#075cab",
    fontWeight: '600',
    paddingHorizontal: 10,
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
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
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
    alignItems: 'center',
    marginBottom: 10,

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
    color: '#000',

  },
  authorImage: {
    width: 30,
    height: 30,
    borderRadius: 25,
    backgroundColor: '#ddd',
    marginHorizontal: 12
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
    fontSize: 13,
    fontWeight: "300",
    color: '#666',
  },
  articleExcerpt: {
    marginTop: 6,
    fontSize: 15,
    color: '#000',
  },
  PostedLabel: {
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 10

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

export const appUtilStyles = StyleSheet.create({
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
})