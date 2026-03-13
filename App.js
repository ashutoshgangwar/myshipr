import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import AppStackMain from './src/Navigation/AppStackMain';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {initBackgroundLocationTracking} from './src/services/BackgroundLocationService';

export default function App() {
  useEffect(() => {
    initBackgroundLocationTracking(location => {
      if (location?.latitude != null && location?.longitude != null) {
        console.log('[BG Tracking Active]', location.latitude, location.longitude);
      }
    }).catch(error => {
      console.warn('Failed to initialize background location:', error?.message);
    });
  }, []);

  console.log('App Loaded');
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <NavigationContainer>
          <AppStackMain />
        </NavigationContainer>
      </Provider>
    </SafeAreaProvider>
  );
}
