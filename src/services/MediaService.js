import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  requestCameraPermission,
  requestGalleryPermission,
} from './PermissionService';

const options = {
  mediaType: 'photo',
  quality: 1,
  saveToPhotos: true,
};

export const openCamera = async () => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return null;

  const result = await launchCamera(options);

  if (result.didCancel || !result.assets?.length) return null;
  return result.assets[0];
};

export const openGallery = async () => {
  const hasPermission = await requestGalleryPermission();
  if (!hasPermission) return null;

  const result = await launchImageLibrary(options);

  if (result.didCancel || !result.assets?.length) return null;
  return result.assets[0];
};
