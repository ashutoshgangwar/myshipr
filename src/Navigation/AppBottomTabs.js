import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen/HomeScreen';
import HomeIcon from '../assets/svg_icon/home.svg';
import ProfileIcon from '../assets/svg_icon/profile.svg';
import { colors } from '../theme/colors';
import Profile from '../screens/Profile/Profile';

const Tab = createBottomTabNavigator();

export default function AppBottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={{
                fontSize: 12,
                fontWeight: focused ? '700' : '400',
                color,
              }}
            >
              Home
            </Text>
          ),
          tabBarIcon: ({ color }) => (
            <HomeIcon width={24} height={24} fill={color} />
          ),
        }}
      />

      <Tab.Screen
        name="DriverProfileTab"
        component={Profile}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={{
                fontSize: 12,
                fontWeight: focused ? '700' : '400',
                color,
              }}
            >
              Profile
            </Text>
          ),
          tabBarIcon: ({ color }) => (
            <ProfileIcon width={24} height={24} fill={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
