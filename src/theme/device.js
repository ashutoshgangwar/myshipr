import {Dimensions} from 'react-native';
import DeviceInfo from 'react-native-device-info';

export const DeviceType = {
  PHONE: 'phone',
  TABLET: 'tablet',
};

function detectIsTablet() {
  let nativeIsTablet = false;
  try {
    nativeIsTablet = DeviceInfo.isTablet();
  } catch (e) {
    nativeIsTablet = false;
  }

  const {width, height} = Dimensions.get('window');
  const smallestEdge = Math.min(width, height);

  return nativeIsTablet || smallestEdge >= 600;
}

export const IS_TABLET = detectIsTablet();
export const IS_PHONE = !IS_TABLET;

export const getDeviceType = () =>
  IS_TABLET ? DeviceType.TABLET : DeviceType.PHONE;

export const select = ({phone, tablet}) => (IS_TABLET ? tablet : phone);
