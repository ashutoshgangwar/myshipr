import { Alert, Platform } from 'react-native';
import {
  check,
  checkNotifications,
  openSettings,
  PERMISSIONS,
  request,
  requestNotifications,
  RESULTS,
} from 'react-native-permissions';

export const APP_PERMISSION_TYPES = {
  CAMERA: 'camera',
  GALLERY: 'gallery',
  LOCATION: 'location',
  BACKGROUND_LOCATION: 'background_location',
  MICROPHONE: 'microphone',
  NOTIFICATIONS: 'notifications',
};

const PERMISSION_META = {
  [APP_PERMISSION_TYPES.CAMERA]: {
    title: 'Camera Permission Required',
    message: 'Please enable camera access in Settings to scan documents.',
    androidRationale: {
      title: 'Camera Permission',
      message: 'myshipr needs camera access to scan documents.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  },
  [APP_PERMISSION_TYPES.GALLERY]: {
    title: 'Photo Library Permission Required',
    message: 'Please enable photo library access in Settings.',
    androidRationale: {
      title: 'Photo Permission',
      message: 'myshipr needs access to your photos to upload documents.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  },
  [APP_PERMISSION_TYPES.LOCATION]: {
    title: 'Location Permission Required',
    message: 'Please allow location permission from Settings.',
    androidRationale: {
      title: 'Location Permission',
      message: 'myshipr needs location access to track trips.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  },
  [APP_PERMISSION_TYPES.BACKGROUND_LOCATION]: {
    title: 'Background Location Permission Required',
    message:
      'Please enable background location from Settings so tracking continues when the app is closed.',
    androidRationale: {
      title: 'Background Location Permission',
      message:
        'myshipr needs background location to continue tracking when the app is closed.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  },
  [APP_PERMISSION_TYPES.MICROPHONE]: {
    title: 'Microphone Permission Required',
    message: 'Please enable microphone access in Settings to use voice input.',
    androidRationale: {
      title: 'Microphone Permission',
      message: 'myshipr needs microphone access to fill forms using voice.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  },
  [APP_PERMISSION_TYPES.NOTIFICATIONS]: {
    title: 'Notification Permission Required',
    message:
      'Please enable notifications in Settings so myshipr can show important updates and tracking status.',
    androidRationale: {
      title: 'Notification Permission',
      message:
        'myshipr shows a tracking notification while location is active in background.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  },
};

const isAndroid = Platform.OS === 'android';
const isIos = Platform.OS === 'ios';

const isGrantedStatus = status =>
  status === RESULTS.GRANTED || status === RESULTS.LIMITED;

const buildPermissionResponse = (type, status, permission = null, extra = {}) => ({
  type,
  permission,
  status,
  granted: isGrantedStatus(status),
  blocked: status === RESULTS.BLOCKED,
  denied: status === RESULTS.DENIED,
  unavailable: status === RESULTS.UNAVAILABLE,
  limited: status === RESULTS.LIMITED,
  ...extra,
});

const showBlockedPermissionAlert = (type, customMessage) => {
  const meta = PERMISSION_META[type] || {};

  Alert.alert(meta.title || 'Permission Required', customMessage || meta.message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => openSettings() },
  ]);
};

const getAndroidPermission = type => {
  switch (type) {
    case APP_PERMISSION_TYPES.CAMERA:
      return PERMISSIONS.ANDROID.CAMERA;
    case APP_PERMISSION_TYPES.GALLERY:
      return Platform.Version >= 33
        ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
    case APP_PERMISSION_TYPES.LOCATION:
      return PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    case APP_PERMISSION_TYPES.BACKGROUND_LOCATION:
      return Platform.Version >= 29
        ? PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    case APP_PERMISSION_TYPES.MICROPHONE:
      return PERMISSIONS.ANDROID.RECORD_AUDIO;
    case APP_PERMISSION_TYPES.NOTIFICATIONS:
      return Platform.Version >= 33
        ? PERMISSIONS.ANDROID.POST_NOTIFICATIONS
        : null;
    default:
      return null;
  }
};

const getIosPermission = type => {
  switch (type) {
    case APP_PERMISSION_TYPES.CAMERA:
      return PERMISSIONS.IOS.CAMERA;
    case APP_PERMISSION_TYPES.GALLERY:
      return PERMISSIONS.IOS.PHOTO_LIBRARY;
    case APP_PERMISSION_TYPES.LOCATION:
      return PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
    case APP_PERMISSION_TYPES.BACKGROUND_LOCATION:
      return PERMISSIONS.IOS.LOCATION_ALWAYS;
    case APP_PERMISSION_TYPES.MICROPHONE:
      return PERMISSIONS.IOS.MICROPHONE;
    default:
      return null;
  }
};

const resolvePlatformPermission = type => {
  if (isAndroid) {
    return getAndroidPermission(type);
  }

  if (isIos) {
    return getIosPermission(type);
  }

  return null;
};

const getRationale = (type, options = {}) => {
  if (!isAndroid) {
    return undefined;
  }

  if (options.rationale) {
    return options.rationale;
  }

  return PERMISSION_META[type]?.androidRationale;
};

const requestResolvedPermission = async (type, permission, options = {}) => {
  const currentStatus = await check(permission);

  if (isGrantedStatus(currentStatus) || currentStatus === RESULTS.UNAVAILABLE) {
    return buildPermissionResponse(type, currentStatus, permission);
  }

  if (currentStatus === RESULTS.BLOCKED) {
    if (options.showBlockedAlert !== false) {
      showBlockedPermissionAlert(type, options.blockedMessage);
    }

    return buildPermissionResponse(type, currentStatus, permission);
  }

  const nextStatus = await request(permission, getRationale(type, options));

  if (nextStatus === RESULTS.BLOCKED && options.showBlockedAlert !== false) {
    showBlockedPermissionAlert(type, options.blockedMessage);
  }

  return buildPermissionResponse(type, nextStatus, permission);
};

export const openAppSettings = () => openSettings();

export const checkAppPermission = async type => {
  try {
    if (type === APP_PERMISSION_TYPES.NOTIFICATIONS) {
      if (isAndroid && Platform.Version < 33) {
        return buildPermissionResponse(type, RESULTS.GRANTED);
      }

      const { status } = await checkNotifications();
      return buildPermissionResponse(type, status);
    }

    const permission = resolvePlatformPermission(type);

    if (!permission) {
      return buildPermissionResponse(type, RESULTS.UNAVAILABLE);
    }

    const status = await check(permission);
    return buildPermissionResponse(type, status, permission);
  } catch (error) {
    console.log('checkAppPermission error:', type, error);
    return buildPermissionResponse(type, RESULTS.UNAVAILABLE, null, { error });
  }
};

export const requestAppPermission = async (type, options = {}) => {
  try {
    if (type === APP_PERMISSION_TYPES.NOTIFICATIONS) {
      if (isAndroid && Platform.Version < 33) {
        return buildPermissionResponse(type, RESULTS.GRANTED);
      }

      if (isIos) {
        const current = await checkNotifications();
        if (isGrantedStatus(current.status)) {
          return buildPermissionResponse(type, current.status, null, {
            settings: current.settings,
          });
        }

        const next = await requestNotifications(['alert', 'sound', 'badge']);
        if (next.status === RESULTS.BLOCKED && options.showBlockedAlert !== false) {
          showBlockedPermissionAlert(type, options.blockedMessage);
        }

        return buildPermissionResponse(type, next.status, null, {
          settings: next.settings,
        });
      }

      const androidNotificationPermission = resolvePlatformPermission(type);

      if (!androidNotificationPermission) {
        return buildPermissionResponse(type, RESULTS.GRANTED);
      }

      return requestResolvedPermission(type, androidNotificationPermission, options);
    }

    if (type === APP_PERMISSION_TYPES.BACKGROUND_LOCATION) {
      const foregroundLocation = await requestAppPermission(
        APP_PERMISSION_TYPES.LOCATION,
        options,
      );

      if (!foregroundLocation.granted) {
        return buildPermissionResponse(type, foregroundLocation.status, null, {
          prerequisite: APP_PERMISSION_TYPES.LOCATION,
        });
      }
    }

    const permission = resolvePlatformPermission(type);

    if (!permission) {
      return buildPermissionResponse(type, RESULTS.UNAVAILABLE);
    }

    return requestResolvedPermission(type, permission, options);
  } catch (error) {
    console.log('requestAppPermission error:', type, error);
    return buildPermissionResponse(type, RESULTS.UNAVAILABLE, null, { error });
  }
};

export const requestMultipleAppPermissions = async (types = [], options = {}) => {
  const uniqueTypes = [...new Set(types)];
  const results = {};

  for (const type of uniqueTypes) {
    results[type] = await requestAppPermission(type, options[type] || options);
  }

  return results;
};

export const requestCameraPermission = async options =>
  (await requestAppPermission(APP_PERMISSION_TYPES.CAMERA, options)).granted;

export const requestGalleryPermission = async options =>
  (await requestAppPermission(APP_PERMISSION_TYPES.GALLERY, options)).granted;

export const requestLocationPermission = async options =>
  (await requestAppPermission(APP_PERMISSION_TYPES.LOCATION, options)).granted;

export const requestBackgroundLocationPermission = async options =>
  (await requestAppPermission(APP_PERMISSION_TYPES.BACKGROUND_LOCATION, options)).granted;

export const requestMicrophonePermission = async options =>
  (await requestAppPermission(APP_PERMISSION_TYPES.MICROPHONE, options)).granted;

export const requestMicPermission = requestMicrophonePermission;

export const requestNotificationPermission = async options =>
  (await requestAppPermission(APP_PERMISSION_TYPES.NOTIFICATIONS, options)).granted;
