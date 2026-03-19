import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import AppStackMain from './src/Navigation/AppStackMain';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
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
