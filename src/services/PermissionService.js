import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const requestCameraPermission = async () => {
  if (Platform.OS === 'ios') {
    const result = await check(PERMISSIONS.IOS.CAMERA);
    
    if (result === RESULTS.GRANTED) {
      return true;
    }
    
    if (result === RESULTS.DENIED) {
      const requestResult = await request(PERMISSIONS.IOS.CAMERA);
      if (requestResult === RESULTS.GRANTED) {
        return true;
      }
    }
    
    if (result === RESULTS.BLOCKED) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in Settings to scan documents.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    
    Alert.alert('Permission Required', 'Camera permission is required to scan documents');
    return false;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA
  );

  if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    Alert.alert('Permission Required', 'Camera permission is required');
    return false;
  }
  return true;
};

export const requestGalleryPermission = async () => {
  if (Platform.OS === 'ios') {
    const result = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
    
    if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
      return true;
    }
    
    if (result === RESULTS.DENIED) {
      const requestResult = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      if (requestResult === RESULTS.GRANTED || requestResult === RESULTS.LIMITED) {
        return true;
      }
    }
    
    if (result === RESULTS.BLOCKED) {
      Alert.alert(
        'Photo Library Permission Required',
        'Please enable photo library access in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    
    Alert.alert('Permission Required', 'Photo library permission is required');
    return false;
  }

  const permission =
    Platform.Version >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

  const granted = await PermissionsAndroid.request(permission);

  if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    Alert.alert('Permission Required', 'Gallery permission is required');
    return false;
  }
  return true;
};
