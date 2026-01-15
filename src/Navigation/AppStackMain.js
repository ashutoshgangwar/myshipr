import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../screens/Login/Login';
import SplashScreen from '../screens/splaceScreen/splaceScreen';
import DriverOnboarding from '../screens/DriverOnboarding/DriverOnboarding';
import AppBottomTabs from './AppBottomTabs';
import Profile from '../screens/Profile/Profile';
import NavigationScreen from '../screens/NavigationScreen/NavigationScreen';
import DeliveryConfirmation from '../screens/DeliveryConfirmationScreen/DeliveryConfirmation';
import AvailableLoadsScreen from '../screens/AvailableLoadsScreen/AvailableLoadsScreen';

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
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="DriverOnboarding" component={DriverOnboarding} />
      <Stack.Screen name="NavigationScreen" component={NavigationScreen} />
      <Stack.Screen name="DeliveryConfirmation" component={DeliveryConfirmation} />
      <Stack.Screen name="AvailableLoadsScreen" component={AvailableLoadsScreen} />
    </Stack.Navigator>
  );
}
