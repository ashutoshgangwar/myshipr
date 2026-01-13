import { Platform, PermissionsAndroid, Alert } from 'react-native';

export const requestCameraPermission = async () => {
  if (Platform.OS === 'ios') return true;

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
  if (Platform.OS === 'ios') return true;

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
