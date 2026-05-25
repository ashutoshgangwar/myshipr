import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../screens/Login/Login';
import SplashScreen from '../screens/splaceScreen/splaceScreen';
import AppBottomTabs from './AppBottomTabs';
import Profile from '../screens/Profile/Profile';
import NavigationScreen from '../screens/NavigationScreen/NavigationScreen';
import DeliveryConfirmation from '../screens/DeliveryConfirmationScreen/DeliveryConfirmation';
import AvailableLoadsScreen from '../screens/AvailableLoadsScreen/AvailableLoadsScreen';
import PlaceBidScreen from '../screens/PlaceBidScreen/PlaceBidScreen';
import ResetPassword from '../screens/ResetPassword/ResetPassword';
import Onboarding from '../screens/Onboarding/Onboarding';
import Signup from '../screens/Signup/Signup';
import SignatureCaptureScreen from '../screens/SignatureCaptureScreen/SignatureCaptureScreen';
import { VectorMap } from '../screens/VectorMap/VectorMap';
import HereMapScreen from '../screens/HereMapScreen/HereMapScreen';


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
      <Stack.Screen name="SignupScreen" component={Signup} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen name="Onboarding" component={Onboarding} />

      {/* Main App with Bottom Tabs */}
      <Stack.Screen name="MainApp" component={AppBottomTabs} />

      {/* Extra flows (no bottom tab) */}
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="PTVNavigatorMap" component={NavigationScreen} />
      <Stack.Screen name="VectorMap" component={VectorMap} />
      <Stack.Screen name="HereMapScreen" component={HereMapScreen} />
      <Stack.Screen name="NavigationScreen" component={NavigationScreen} />
      <Stack.Screen name="DeliveryConfirmation" component={DeliveryConfirmation} />
      <Stack.Screen name="AvailableLoadsScreen" component={AvailableLoadsScreen} />
      <Stack.Screen name="PlaceBidScreen" component={PlaceBidScreen} />
      <Stack.Screen name="SignatureCaptureScreen" component={SignatureCaptureScreen} />
    </Stack.Navigator>
  );
}
