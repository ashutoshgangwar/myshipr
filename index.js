/**
 * @format
 */

import {AppRegistry} from 'react-native';
import { enableScreens } from 'react-native-screens';
import BackgroundGeolocation from 'react-native-background-geolocation';
import App from './App';
import {name as appName} from './app.json';
import {backgroundLocationHeadlessTask} from './src/services/BackgroundLocationService';

AppRegistry.registerComponent(appName, () => App);
BackgroundGeolocation.registerHeadlessTask(backgroundLocationHeadlessTask);
enableScreens();
