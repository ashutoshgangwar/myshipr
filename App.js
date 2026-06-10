import React, { useEffect } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppStackMain from './src/Navigation/AppStackMain';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { hydrateLocationCache } from './src/services/LocationService';

export default function App() {
  console.log('App Loaded');
  // Load the persisted last-known location into memory so the first screen can
  // show it instantly while the first live GPS fix is still in flight.
  useEffect(() => {
    hydrateLocationCache();
  }, []);
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppStackMain />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
