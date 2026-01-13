import { PermissionsAndroid, Platform } from 'react-native';

export const requestMicPermission = async () => {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone Permission',
      message: 'We need microphone access to fill form using voice',
      buttonPositive: 'Allow',
    }
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};
