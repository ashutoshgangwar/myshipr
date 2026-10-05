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

const fontFamilyForWeight = (weight?: TextStyle['fontWeight']): string => {
  if (weight == null) {
    return DEFAULT_FONT_FAMILY;
  }
  return FONT_WEIGHT_MAP[String(weight)] || DEFAULT_FONT_FAMILY;
};

const typography = {
  fontFamily: DEFAULT_FONT_FAMILY,
  fontFamilyForWeight,

  fontSize,

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
