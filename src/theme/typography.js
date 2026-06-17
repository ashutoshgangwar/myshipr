// 🔤 Poppins is bundled for both iOS and Android (see react-native.config.js +
// src/assets/fonts). Custom fonts don't respond to numeric `fontWeight`, so each
// weight maps to its own Poppins variant by PostScript / family name.
const FONT_WEIGHT_MAP = {
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

// Resolve the Poppins family for a given fontWeight (string or number).
const fontFamilyForWeight = weight => {
  if (weight == null) {
    return DEFAULT_FONT_FAMILY;
  }
  return FONT_WEIGHT_MAP[String(weight)] || DEFAULT_FONT_FAMILY;
};

const typography = {
  fontFamily: DEFAULT_FONT_FAMILY,
  fontFamilyForWeight,

  // Static typography scale for future development
  heading1: 36,
  heading2: 28,
  heading3: 24,
  paragraph: 16,

  // Backward-compatible aliases
  title: 24,
  subtitle: 16,
  body: 16,
  label: 13,
  button: 16,
};

export default typography;
export { DEFAULT_FONT_FAMILY, fontFamilyForWeight };
