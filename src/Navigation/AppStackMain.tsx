import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../screens/driver/Login/Login';
import AppBottomTabs from './AppBottomTabs';
import Profile from '../screens/driver/Profile/Profile';
import DeliveryConfirmation from '../screens/driver/DeliveryConfirmationScreen/DeliveryConfirmation';
import AvailableLoadsScreen from '../screens/driver/AvailableLoadsScreen/AvailableLoadsScreen';
import PlaceBidScreen from '../screens/driver/PlaceBidScreen/PlaceBidScreen';
import ResetPassword from '../screens/driver/ResetPassword/ResetPassword';
import Onboarding from '../screens/driver/Onboarding/Onboarding';
import Signup from '../screens/driver/Signup/Signup';
import SignatureCaptureScreen from '../screens/driver/SignatureCaptureScreen/SignatureCaptureScreen';
import HereMapScreen from '../screens/driver/HereMapScreen/HereMapScreen';
import HereSearchScreen from '../screens/driver/HereMapScreen/HereSearchScreen';
import HereNavigationDemo from '../screens/driver/HereNavigationDemo/HereNavigationDemo';
import ActiveTripScreen from '../screens/driver/ActiveTripScreen/ActiveTripScreen';
import PreviewSplaceScreen from '../screens/driver/splaceScreen/PreviewSplaceScreen/PreviewSplaceScreen';
import LoginSplashScreen from '../screens/driver/splaceScreen/LoginSplaceScreen/LoginSplaceScreen';
import FavoriteDestination from '../screens/driver/FavoriteDestination/FavoriteDestination';
import TruckAnimationScreen from '../screens/driver/TruckAnimationScreen/TruckAnimationScreen';
import TripCompletedScreen from '../screens/driver/TripCompletedScreen/TripCompletedScreen';
import CoinTestScreen from '../screens/driver/CoinTestScreen/CoinTestScreen';
import ActiveBidding from '../screens/driver/ActiveBidding/ActiveBidding';
import EarningsDetails from '../screens/driver/EarningsDetails/EarningsDetails';
import ShipmentDetails from '../screens/driver/ShipmentDetails/ShipmentDetails';
import NotificationScreen from '../screens/driver/NotificationScreen/NotificationScreen';
import FaceLock from '../screens/driver/FaceLock/FaceLock';
import type {RootStackParamList} from '../types/navigation';



const Stack = createNativeStackNavigator<RootStackParamList>();

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
      <Stack.Screen name="Shipmentdetails" component={ShipmentDetails} />
      <Stack.Screen name="Earningsdetails" component={EarningsDetails} />
      <Stack.Screen name="NotificationScreen" component={NotificationScreen} />


      {/* Extra flows (no bottom tab) */}
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="FaceLock" component={FaceLock} />
      <Stack.Screen name="HereSearchScreen" component={HereSearchScreen} />
      <Stack.Screen name="HereMapScreen" component={HereMapScreen} />
      <Stack.Screen name="HereNavigationDemo" component={HereNavigationDemo} />
      <Stack.Screen name="ActiveTripScreen" component={ActiveTripScreen} />
      <Stack.Screen name="TruckAnimationScreen" component={TruckAnimationScreen} />
      <Stack.Screen name="TripCompletedScreen" component={TripCompletedScreen} />
      <Stack.Screen name="CoinTestScreen" component={CoinTestScreen} />
      <Stack.Screen name="ActiveBidding" component={ActiveBidding} />
      <Stack.Screen name="DeliveryConfirmation" component={DeliveryConfirmation} />
      <Stack.Screen name="AvailableLoadsScreen" component={AvailableLoadsScreen} />
      <Stack.Screen name="PlaceBidScreen" component={PlaceBidScreen} />
      <Stack.Screen name="SignatureCaptureScreen" component={SignatureCaptureScreen} />
    </Stack.Navigator>
  );
}
