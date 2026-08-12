import {Alert} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {
  APP_PERMISSION_TYPES,
  requestAppPermission,
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

// Cancelling is a normal outcome, but an errorCode is not — returning a bare
// null for both makes a real failure look identical to "the button does
// nothing", so surface it.
const readAsset = (result, source) => {
  if (result?.didCancel) return null;

  if (result?.errorCode) {
    console.log(`${source} error:`, result.errorCode, result.errorMessage);
    Alert.alert(
      `${source} unavailable`,
      result.errorMessage || `Could not open the ${source.toLowerCase()}.`,
    );
    return null;
  }

  return result?.assets?.[0] ?? null;
};

export const openCamera = async () => {
  try {
    const permission = await requestAppPermission(APP_PERMISSION_TYPES.CAMERA);

    // A device with no camera — every iOS Simulator, and some Android
    // emulators — reports the permission as unavailable rather than granting
    // or denying it, because there is no hardware to gate. Fall back to the
    // library so the flow still works there; a real handset never gets here.
    if (permission.unavailable) {
      return openGallery();
    }

    if (!permission.granted) return null;

    return readAsset(await launchCamera(cameraOptions), 'Camera');
  } catch (error) {
    console.log('openCamera crash:', error);
    return null;
  }
};

export const openGallery = async () => {
  try {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return null;

    return readAsset(await launchImageLibrary(galleryOptions), 'Photo library');
  } catch (error) {
    console.log('openGallery crash:', error);
    return null;
  }
};
