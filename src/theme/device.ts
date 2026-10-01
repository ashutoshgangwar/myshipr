import {Dimensions} from 'react-native';
import DeviceInfo from 'react-native-device-info';

export const DeviceType = {
  PHONE: 'phone',
  TABLET: 'tablet',
} as const;

/** `'phone' | 'tablet'` — derived from the map so the two cannot drift. */
export type DeviceTypeValue = (typeof DeviceType)[keyof typeof DeviceType];

function detectIsTablet(): boolean {
  let nativeIsTablet = false;
  try {
    nativeIsTablet = DeviceInfo.isTablet();
  } catch {
    // Optional catch binding: the error is deliberately ignored (any native
    // failure just means "assume phone"), and an unused `e` is a lint error
    // once the file is TypeScript.
    nativeIsTablet = false;
  }

  const {width, height} = Dimensions.get('window');
  const smallestEdge = Math.min(width, height);

  return nativeIsTablet || smallestEdge >= 600;
}

export const IS_TABLET = detectIsTablet();
export const IS_PHONE = !IS_TABLET;

export const getDeviceType = (): DeviceTypeValue =>
  IS_TABLET ? DeviceType.TABLET : DeviceType.PHONE;

/**
 * Picks the phone or tablet variant of a value.
 *
 * Generic rather than fixed to `number`: it is called with numbers (most
 * sizing), but also with the 0.82/1 scale factors and with whole style
 * objects, and `<T>` keeps the return type exactly what was passed in instead
 * of widening every call site.
 */
export const select = <T,>({phone, tablet}: {phone: T; tablet: T}): T =>
  IS_TABLET ? tablet : phone;
