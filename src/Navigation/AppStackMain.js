import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../screens/Login/Login';
import SplashScreen from '../screens/splaceScreen/splaceScreen';
import AppBottomTabs from './AppBottomTabs';
import Profile from '../screens/Profile/Profile';
import NavigationScreen from '../screens/NavigationScreen/NavigationScreen';
import DeliveryConfirmation from '../screens/DeliveryConfirmationScreen/DeliveryConfirmation';
import AvailableLoadsScreen from '../screens/AvailableLoadsScreen/AvailableLoadsScreen';
import CdlDriverOnboarding from '../screens/DriverOnboarding/CdlDriverOnboarding/CdlDriverOnboarding';
import MedicalCertificate from '../screens/DriverOnboarding/MedicalCertificate/MedicalCertificate';
import SocialSecurityItin from '../screens/DriverOnboarding/SocialSecurityItin/SocialSecurityItin';
import ProofOfAddress from '../screens/DriverOnboarding/ProofOfAddress/ProofOfAddress';
import BackgroundCheckConsent from '../screens/DriverOnboarding/BackgroundCheckConsent/BackgroundCheckConsent';
import ForgotPassword from '../screens/ForgotPassword/ForgotPassword';
import ResetPassword from '../screens/ResetPassword/ResetPassword';



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
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />

      {/* Main App with Bottom Tabs */}
      <Stack.Screen name="MainApp" component={AppBottomTabs} />

      {/* Extra flows (no bottom tab) */}
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="NavigationScreen" component={NavigationScreen} />
      <Stack.Screen name="DeliveryConfirmation" component={DeliveryConfirmation} />
      <Stack.Screen name="AvailableLoadsScreen" component={AvailableLoadsScreen} />
      <Stack.Screen name="CdlDriverOnboarding" component={CdlDriverOnboarding} />
      <Stack.Screen name="MedicalCertificate" component={MedicalCertificate} />
      <Stack.Screen name="SocialSecurityItin" component={SocialSecurityItin} />
      <Stack.Screen name="ProofOfAddress" component={ProofOfAddress} />
      <Stack.Screen name="BackgroundCheckConsent" component={BackgroundCheckConsent} />
    </Stack.Navigator>
  );
}
