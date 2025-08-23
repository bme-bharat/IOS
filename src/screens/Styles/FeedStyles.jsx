import { StyleSheet } from "react-native";

export const FeedStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'whitesmoke',
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
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd'
    },
    backButton: {
        alignSelf: 'center',
        padding: 10,

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

    tabBarContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 4, // Add elevation to match Material Design tabs
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    swipeableTabs: {
        flex: 1,
    },
    navigationTab: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginVertical: 4,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    activeNavigationTab: {
        backgroundColor: 'rgba(7, 92, 171, 0.1)',
    },
    navigationTabText: {
        color: '#075cab',
        fontSize: 14,
        fontWeight: '600',
    },
    tabBar: {
        backgroundColor: '#fff',
        elevation: 0, // Remove default elevation from TabBar since container has it
    },
    indicator: {
        backgroundColor: '#075cab',
        height: 3,
    },
    label: {
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    companyCount: {
        fontSize: 14,
        fontWeight: '400',
        color: 'black',
        padding: 5,
        paddingHorizontal: 10,
    },

});