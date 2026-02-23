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
import CdlDriverOnboarding from '../screens/DriverOnboarding/CdlDriverOnboarding/CdlDriverOnboarding';
import ForgotPassword from '../screens/ForgotPassword/ForgotPassword';
import ResetPassword from '../screens/ResetPassword/ResetPassword';
import CreateAccount from '../screens/CreateAccount/CreateAccount';
import VerifyPhone from '../screens/VarifyPhone/VarifyPhone';
import WelcomeHome from '../screens/WelcomeHome/WelcomeHome';
import Onboarding from '../screens/Onboarding/Onboarding';



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
      <Stack.Screen name="CreateAccount" component={CreateAccount} />
      <Stack.Screen name="VerifyPhone" component={VerifyPhone} />
      <Stack.Screen name="WelcomeHome" component={WelcomeHome} />
      <Stack.Screen name="Onboarding" component={Onboarding} />

      {/* Main App with Bottom Tabs */}
      <Stack.Screen name="MainApp" component={AppBottomTabs} />

      {/* Extra flows (no bottom tab) */}
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="NavigationScreen" component={NavigationScreen} />
      <Stack.Screen name="DeliveryConfirmation" component={DeliveryConfirmation} />
      <Stack.Screen name="AvailableLoadsScreen" component={AvailableLoadsScreen} />
      <Stack.Screen name="PlaceBidScreen" component={PlaceBidScreen} />
      <Stack.Screen name="CdlDriverOnboarding" component={CdlDriverOnboarding} />
    </Stack.Navigator>
  );
}
