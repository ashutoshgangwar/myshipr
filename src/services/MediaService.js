import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  requestCameraPermission,
  requestGalleryPermission,
} from './PermissionService';

const cameraOptions = {
  mediaType: 'photo',
  cameraType: 'back',
  quality: 0.8,
  saveToPhotos: false,
};

const galleryOptions = {
  mediaType: 'photo',
  quality: 0.8,
  selectionLimit: 1,
};

export const openCamera = async () => {
  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return null;

    const result = await launchCamera(cameraOptions);

    if (result?.didCancel) return null;

    if (result?.errorCode) {
      console.log('Camera Error:', result.errorMessage);
      return null;
    }

    return result?.assets?.[0] ?? null;
  } catch (error) {
    console.log('openCamera crash:', error);
    return null;
  }
};

export const openGallery = async () => {
  try {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return null;

    const result = await launchImageLibrary(galleryOptions);

    if (result?.didCancel) return null;

    if (result?.errorCode) {
      console.log('Gallery Error:', result.errorMessage);
      return null;
    }

    return result?.assets?.[0] ?? null;
  } catch (error) {
    console.log('openGallery crash:', error);
    return null;
  }
};
