import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../screens/Login/Login';
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
import HereMapScreen from '../screens/HereMapScreen/HereMapScreen';
import HereSearchScreen from '../screens/HereMapScreen/HereSearchScreen';
import ActiveTripScreen from '../screens/ActiveTripScreen/ActiveTripScreen';
import PreviewSplaceScreen from '../screens/splaceScreen/PreviewSplaceScreen/PreviewSplaceScreen';
import LoginSplashScreen from '../screens/splaceScreen/LoginSplaceScreen/LoginSplaceScreen';
import FavoriteDestination from '../screens/FavoriteDestination/FavoriteDestination';
import RadarMapScreen from '../screens/RadarMapScreen/RadarMapScreen';
import RadarSetupScreen from '../screens/RadarMapScreen/RadarSetupScreen';
import TruckAnimationScreen from '../screens/TruckAnimationScreen/TruckAnimationScreen';


const Stack = createNativeStackNavigator();

export default function AppStackMain() {
  return (
    <Stack.Navigator
      initialRouteName="PreviewSplashScreen"
      screenOptions={{ headerShown: false }}
    >
      {/* Splash */}
  
      <Stack.Screen name="PreviewSplashScreen" component={PreviewSplaceScreen} />

      {/* Auth */}
      <Stack.Screen name="LoginSplashScreen" component={LoginSplashScreen} />
      <Stack.Screen name="LoginScreen" component={Login} />
      <Stack.Screen name="SignupScreen" component={Signup} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen name="Onboarding" component={Onboarding} />
      {/* <Stack.Screen name="TruckInputs" component={TruckInputs} /> */}

      {/* Main App with Bottom Tabs */}
      <Stack.Screen name="MainApp" component={AppBottomTabs} />

      <Stack.Screen name="FavoriteDestination" component={FavoriteDestination} />
      <Stack.Screen name="RadarSetupScreen" component={RadarSetupScreen} />
      <Stack.Screen name="RadarMapScreen" component={RadarMapScreen} />

      {/* Extra flows (no bottom tab) */}
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="PTVNavigatorMap" component={NavigationScreen} />
      <Stack.Screen name="HereSearchScreen" component={HereSearchScreen} />
      <Stack.Screen name="HereMapScreen" component={HereMapScreen} />
      <Stack.Screen name="ActiveTripScreen" component={ActiveTripScreen} />
      <Stack.Screen name="TruckAnimationScreen" component={TruckAnimationScreen} />
      <Stack.Screen name="NavigationScreen" component={NavigationScreen} />
      <Stack.Screen name="DeliveryConfirmation" component={DeliveryConfirmation} />
      <Stack.Screen name="AvailableLoadsScreen" component={AvailableLoadsScreen} />
      <Stack.Screen name="PlaceBidScreen" component={PlaceBidScreen} />
      <Stack.Screen name="SignatureCaptureScreen" component={SignatureCaptureScreen} />
    </Stack.Navigator>
  );
}
