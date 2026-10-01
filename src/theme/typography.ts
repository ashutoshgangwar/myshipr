import type {TextStyle} from 'react-native';
import {fontSize} from './fontSizes';

const FONT_WEIGHT_MAP: Record<string, string> = {
  '100': 'Poppins-Regular',
  '200': 'Poppins-Regular',
  '300': 'Poppins-Regular',
  '400': 'Poppins-Regular',
  '500': 'Poppins-Medium',
  '600': 'Poppins-SemiBold',
  '700': 'Poppins-Bold',
  '800': 'Poppins-ExtraBold',
  '900': 'Poppins-ExtraBold',
  normal: 'Poppins-Regular',
  bold: 'Poppins-Bold',
};

const DEFAULT_FONT_FAMILY = 'Poppins-Regular';

/**
 * Resolve the Poppins family for a given fontWeight (string or number).
 *
 * The parameter is RN's own `TextStyle['fontWeight']` — which already covers
 * the numeric weights, the `'normal'`/`'bold'` keywords, `undefined` and
 * `null` — so a weight lifted straight off a flattened style passes through
 * with no cast. The lookup is by `String(weight)`, exactly as before.
 */
const fontFamilyForWeight = (weight?: TextStyle['fontWeight']): string => {
  if (weight == null) {
    return DEFAULT_FONT_FAMILY;
  }
  return FONT_WEIGHT_MAP[String(weight)] || DEFAULT_FONT_FAMILY;
};

const typography = {
  fontFamily: DEFAULT_FONT_FAMILY,
  fontFamilyForWeight,

  // The standard, device-responsive font-size scale. These are the sizes to
  // use in screen styles — see `fontSizes.ts` for the tokens and how they
  // scale per device.
  fontSize,

  // Named scale, mapped onto the standard tokens (responsive + tablet-aware).
  mainHeading: fontSize.mainHeading,
  heading: fontSize.heading,
  subHeading: fontSize.subHeading,
  title: fontSize.title,
  body: fontSize.body,
  label: fontSize.label,
  button: fontSize.label,
  paragraph: fontSize.body,
  subtitle: fontSize.subHeading,
};

export default typography;
export {DEFAULT_FONT_FAMILY, fontFamilyForWeight, fontSize};
