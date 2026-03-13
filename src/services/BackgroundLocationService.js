import { AppState, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundGeolocation from 'react-native-background-geolocation';

const LAST_BG_LOCATION_KEY = '@myshipr:lastBackgroundLocation';
const BG_EVENT_LOG_KEY = '@myshipr:bgEventLog';
const LOCATION_POLL_INTERVAL_MS = 1000000;

let isInitialized = false;
let appStateSubscription = null;
let locationSubscription = null;
let motionSubscription = null;
let heartbeatSubscription = null;
let foregroundPollingTimer = null;
let locationUpdateCallback = () => {};

const requestAndroidNotificationPermission = async () => {
  if (Platform.OS !== 'android' || Platform.Version < 33) {
    return true;
  }

  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Notification Permission',
        message:
          'myshipr shows a tracking notification while location is active in background.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.warn('Notification permission request failed:', error?.message);
    return false;
  }
};

const requestAndroidLocationPermissions = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const fineResult = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'myshipr needs location access to track trips.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );

    if (fineResult !== PermissionsAndroid.RESULTS.GRANTED) {
      return false;
    }

    if (Platform.Version >= 29) {
      const backgroundResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Background Location Permission',
          message:
            'myshipr needs background location to continue tracking when app is closed.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );

      if (backgroundResult !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.warn('Location permission request failed:', error?.message);
    return false;
  }
};

const saveLocation = async location => {
  try {
    const payload = {
      latitude: location?.coords?.latitude,
      longitude: location?.coords?.longitude,
      accuracy: location?.coords?.accuracy,
      speed: location?.coords?.speed,
      heading: location?.coords?.heading,
      timestamp: location?.timestamp || Date.now(),
      isMoving: location?.is_moving,
      provider: location?.provider,
    };

    await AsyncStorage.setItem(LAST_BG_LOCATION_KEY, JSON.stringify(payload));
    return payload;
  } catch (error) {
    console.warn('Failed to save background location:', error?.message);
    return null;
  }
};

const appendDebugEvent = async (eventName, extra = {}) => {
  try {
    const current = await AsyncStorage.getItem(BG_EVENT_LOG_KEY);
    const list = current ? JSON.parse(current) : [];
    const next = [
      {
        eventName,
        at: Date.now(),
        ...extra,
      },
      ...list,
    ].slice(0, 50);

    await AsyncStorage.setItem(BG_EVENT_LOG_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Failed to append bg debug event:', error?.message);
  }
};

const startForegroundPolling = onLocationUpdate => {
  if (foregroundPollingTimer) {
    clearInterval(foregroundPollingTimer);
  }

  foregroundPollingTimer = setInterval(async () => {
    try {
      const location = await BackgroundGeolocation.getCurrentPosition({
        samples: 1,
        persist: true,
        timeout: 30,
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        extras: { reason: 'foreground_interval_10s' },
      });

      const saved = await saveLocation(location);
      if (saved?.latitude != null && saved?.longitude != null) {
        await appendDebugEvent('foreground_interval_10s', {
          latitude: saved.latitude,
          longitude: saved.longitude,
        });
        onLocationUpdate(saved);
      }
    } catch (error) {
      console.warn('Foreground interval snapshot failed:', error?.message);
    }
  }, LOCATION_POLL_INTERVAL_MS);
};

const stopForegroundPolling = () => {
  if (foregroundPollingTimer) {
    clearInterval(foregroundPollingTimer);
    foregroundPollingTimer = null;
  }
};

const handleAppStateChange = nextState => {
  if (nextState === 'active') {
    BackgroundGeolocation.getCurrentPosition({
      timeout: 30,
      samples: 1,
      persist: true,
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      extras: { reason: 'app_foregrounded' },
    })
      .then(async location => {
        const saved = await saveLocation(location);
        if (saved?.latitude != null && saved?.longitude != null) {
          await appendDebugEvent('app_foregrounded', {
            latitude: saved.latitude,
            longitude: saved.longitude,
          });
          locationUpdateCallback(saved);
        }
      })
      .catch(error => {
        console.warn('Foreground snapshot failed:', error?.message);
      });

    return;
  }

  if (nextState === 'background' || nextState === 'inactive') {
    BackgroundGeolocation.changePace(true).catch(() => {});

    BackgroundGeolocation.getCurrentPosition({
      timeout: 30,
      samples: 1,
      persist: true,
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      extras: { reason: 'app_backgrounded' },
    })
      .then(async location => {
        const saved = await saveLocation(location);
        if (saved?.latitude != null && saved?.longitude != null) {
          await appendDebugEvent('app_backgrounded', {
            latitude: saved.latitude,
            longitude: saved.longitude,
          });
          console.log('[BG AppState Location]', saved.latitude, saved.longitude);
          locationUpdateCallback(saved);
        }
      })
      .catch(error => {
        console.warn('Background snapshot failed:', error?.message);
      });
  }
};

export const initBackgroundLocationTracking = async (onLocationUpdate = () => {}) => {
  if (isInitialized) {
    const state = await BackgroundGeolocation.getState();
    return state?.enabled;
  }

  await requestAndroidNotificationPermission();
  locationUpdateCallback = onLocationUpdate;
  const hasLocationPermissions = await requestAndroidLocationPermissions();
  if (!hasLocationPermissions) {
    throw new Error('BACKGROUND_LOCATION_PERMISSION_DENIED');
  }

  locationSubscription = BackgroundGeolocation.onLocation(
    async location => {
      const saved = await saveLocation(location);
      if (saved?.latitude != null && saved?.longitude != null) {
        await appendDebugEvent('location', {
          latitude: saved.latitude,
          longitude: saved.longitude,
        });
      }
      onLocationUpdate(saved);
    },
    error => {
      console.warn('[BG Location Error]:', error?.message);
    },
  );

  motionSubscription = BackgroundGeolocation.onMotionChange(event => {
    if (!event?.isMoving) {
      BackgroundGeolocation.getCurrentPosition({
        timeout: 20,
        samples: 1,
        persist: true,
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        extras: { reason: 'motion_stopped' },
      }).catch(() => {});
    }
  });

  heartbeatSubscription = BackgroundGeolocation.onHeartbeat(async () => {
    try {
      const location = await BackgroundGeolocation.getCurrentPosition({
        samples: 1,
        persist: true,
        timeout: 30,
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        extras: { reason: 'heartbeat' },
      });

      const saved = await saveLocation(location);
      if (saved?.latitude != null && saved?.longitude != null) {
        await appendDebugEvent('heartbeat', {
          latitude: saved.latitude,
          longitude: saved.longitude,
        });
        console.log('[BG Heartbeat Location]', saved.latitude, saved.longitude);
      }
    } catch (error) {
      console.warn('Heartbeat snapshot failed:', error?.message);
    }
  });

  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

  const state = await BackgroundGeolocation.ready({
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
    distanceFilter: 0,
    locationUpdateInterval: LOCATION_POLL_INTERVAL_MS,
    fastestLocationUpdateInterval: LOCATION_POLL_INTERVAL_MS,
    stopTimeout: 5,
    debug: false,
    logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
    stopOnTerminate: false,
    startOnBoot: true,
    enableHeadless: true,
    heartbeatInterval: 10,
    scheduleUseAlarmManager: true,
    disableStopDetection: true,
    preventSuspend: true,
    pausesLocationUpdatesAutomatically: false,
    allowIdenticalLocations: true,
    foregroundService: Platform.OS === 'android',
    notification: {
      title: 'myshipr Location Tracking',
      text: 'Tracking location in background / closed state',
      channelName: 'Location Tracking',
      priority: BackgroundGeolocation.NOTIFICATION_PRIORITY_HIGH,
      sticky: true,
    },
    locationAuthorizationRequest: 'Always',
    backgroundPermissionRationale: {
      title: 'Allow background location',
      message:
        'myshipr needs background location to keep latitude/longitude updated when app is in background or closed.',
      positiveAction: 'Allow',
      negativeAction: 'Cancel',
    },
  });

  if (!state.enabled) {
    await BackgroundGeolocation.start();
  }

  await BackgroundGeolocation.changePace(true);

  startForegroundPolling(onLocationUpdate);

  await appendDebugEvent('tracking_started', {
    enabled: true,
  });

  isInitialized = true;
  return true;
};

export const stopBackgroundLocationTracking = async () => {
  try {
    await BackgroundGeolocation.stop();
    locationSubscription?.remove();
    motionSubscription?.remove();
    heartbeatSubscription?.remove();
    appStateSubscription?.remove();
    stopForegroundPolling();

    locationSubscription = null;
    motionSubscription = null;
    heartbeatSubscription = null;
    appStateSubscription = null;
    isInitialized = false;

    return true;
  } catch (error) {
    console.warn('Failed to stop background location:', error?.message);
    return false;
  }
};

export const getLastBackgroundLocation = async () => {
  try {
    const value = await AsyncStorage.getItem(LAST_BG_LOCATION_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn('Failed to read last background location:', error?.message);
    return null;
  }
};

export const backgroundLocationHeadlessTask = async event => {
  const { name, params } = event || {};

  await appendDebugEvent('headless_event', {
    name,
  });

  if (name === 'location' && params?.location) {
    const saved = await saveLocation(params.location);
    if (saved?.latitude != null && saved?.longitude != null) {
      await appendDebugEvent('headless_location', {
        latitude: saved.latitude,
        longitude: saved.longitude,
      });
      console.log('[Headless BG Location]', saved.latitude, saved.longitude);
    }
  }

  if (name === 'heartbeat') {
    try {
      const location = await BackgroundGeolocation.getCurrentPosition({
        samples: 1,
        persist: true,
        timeout: 30,
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        extras: { reason: 'headless_heartbeat' },
      });

      const saved = await saveLocation(location);
      if (saved?.latitude != null && saved?.longitude != null) {
        await appendDebugEvent('headless_heartbeat', {
          latitude: saved.latitude,
          longitude: saved.longitude,
        });
        console.log('[Headless Heartbeat Location]', saved.latitude, saved.longitude);
      }
    } catch (error) {
      console.warn('Headless heartbeat snapshot failed:', error?.message);
    }
  }
};

export const getBackgroundTrackingDebugEvents = async () => {
  try {
    const value = await AsyncStorage.getItem(BG_EVENT_LOG_KEY);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.warn('Failed to read bg debug events:', error?.message);
    return [];
  }
};
