import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../screens/Login/Login';
import SplashScreen from '../screens/splaceScreen/splaceScreen';
import ProfileForm from '../screens/ProfileForm/ProfileForm';
import DriverOnboarding from '../screens/DriverOnboarding/DriverOnboarding';
import AppBottomTabs from './AppBottomTabs';
import DriverDetails from '../screens/DriverDetails/driverDetails';

const Stack = createNativeStackNavigator();

export default function AppStackMain() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      {/* Splash */}
      <Stack.Screen name="Splash" component={SplashScreen} />

      {/* Auth */}
      <Stack.Screen name="LoginScreen" component={Login} />

      {/* Main App with Bottom Tabs */}
      <Stack.Screen name="MainApp" component={AppBottomTabs} />

      {/* Extra flows (no bottom tab) */}
      <Stack.Screen name="ProfileForm" component={ProfileForm} />
      <Stack.Screen name="DriverOnboarding" component={DriverOnboarding} />
      <Stack.Screen name="DriverDetails" component={DriverDetails} />
    </Stack.Navigator>
  );
}
