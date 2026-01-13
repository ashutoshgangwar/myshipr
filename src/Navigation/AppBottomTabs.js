import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


import HomeScreen from '../screens/HomeScreen/HomeScreen';
import DriverDetails from '../screens/DriverDetails/driverDetails';

const Tab = createBottomTabNavigator();

export default function AppBottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />

      <Tab.Screen
        name="DriverProfileTab"
        component={DriverDetails}
        options={{ tabBarLabel: 'Profile' }}
      />

    </Tab.Navigator>
  );
}
