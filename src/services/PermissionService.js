import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

/* ===================== CAMERA ===================== */

export const requestCameraPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const permission = PERMISSIONS.IOS.CAMERA;

      const result = await check(permission);

      if (result === RESULTS.GRANTED) {
        return true;
      }

      if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
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

      return false;
    }

    // ---------- ANDROID ----------
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.log('Camera permission error:', error);
    return false;
  }
};

/* ===================== GALLERY ===================== */

export const requestGalleryPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const permission = PERMISSIONS.IOS.PHOTO_LIBRARY;

      const result = await check(permission);

      if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
        return true;
      }

      if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        return (
          requestResult === RESULTS.GRANTED ||
          requestResult === RESULTS.LIMITED
        );
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

      return false;
    }

    // ---------- ANDROID ----------
    const permission =
      Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

    const granted = await PermissionsAndroid.request(permission);

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.log('Gallery permission error:', error);
    return false;
  }
};
