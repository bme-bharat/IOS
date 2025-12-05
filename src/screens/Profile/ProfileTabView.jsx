import React, { useState } from 'react';
import { View, useWindowDimensions, StyleSheet, Text } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

const ProfileTabView = ({ routes }) => {
    const layout = useWindowDimensions();
    const [index, setIndex] = useState(0);
  
    const renderScene = ({ route }) => {
      const found = routes.find(r => r.key === route.key);
      if (!found) return null;
      const Component = found.component;
      return <Component />;
    };
  
    return (
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            activeColor="#075cab"
            inactiveColor="#666"
            indicatorStyle={{ backgroundColor: '#075cab', height: 3 }}
            labelStyle={{ fontSize: 14, fontWeight: '600' }}
            style={{ backgroundColor: '#fff' }}
          />
        )}
      />
    );
  };
  

export default ProfileTabView;
