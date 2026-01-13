import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppStackMain from './src/Navigation/AppStackMain';




export default function App() {
  console.log('App Loaded');
  return (
    <NavigationContainer>
      <AppStackMain />
    </NavigationContainer>
  );
}
