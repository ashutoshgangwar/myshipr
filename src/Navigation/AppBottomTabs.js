import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen/HomeScreen';
import LoadsTab from '../screens/LoadsTab/LoadsTab';
import HOSTab from '../screens/HOSTab/HOSTab';
import Profile from '../screens/Profile/Profile';

import HomeIcon from '../assets/svg_icon/home.svg';
import LoadsIcon from '../assets/svg_icon/Loads.svg';
import HOSIcon from '../assets/svg_icon/HOS.svg';
import ProfileIcon from '../assets/svg_icon/profile.svg';

import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

/* 🔹 Reusable Label Component */
const TabLabel = ({ label, focused, color }) => (
  <Text
    style={{
      fontSize: 12,
      fontWeight: focused ? '700' : '400',
      color,
    }}
  >
    {label}
  </Text>
);

/* 🔹 Reusable Icon Wrapper */
const TabIcon = (IconComponent) => ({ color }) => (
  <IconComponent width={24} height={24} fill={color} />
);

export default function AppBottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: (props) => (
            <TabLabel {...props} label="Home" />
          ),
          tabBarIcon: TabIcon(HomeIcon),
        }}
      />

      <Tab.Screen
        name="LoadsTab"
        component={LoadsTab}
        options={{
          tabBarLabel: (props) => (
            <TabLabel {...props} label="Loads" />
          ),
          tabBarIcon: TabIcon(LoadsIcon),
        }}
      />

      <Tab.Screen
        name="HOSTab"
        component={HOSTab}
        options={{
          tabBarLabel: (props) => (
            <TabLabel {...props} label="HOS" />
          ),
          tabBarIcon: TabIcon(HOSIcon),
        }}
      />

      <Tab.Screen
        name="DriverProfileTab"
        component={Profile}
        options={{
          tabBarLabel: (props) => (
            <TabLabel {...props} label="Profile" />
          ),
          tabBarIcon: TabIcon(ProfileIcon),
        }}
      />
    </Tab.Navigator>
  );
}
