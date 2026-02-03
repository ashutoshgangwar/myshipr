import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppStackMain from './src/Navigation/AppStackMain';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  console.log('App Loaded');
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppStackMain />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
