import { Platform } from 'react-native';

// 🔤 default font per platform
const DEFAULT_FONT_FAMILY = Platform.select({
  ios: 'System',
  android: 'Poppins',
  default: 'System',
});

const typography = {
  fontFamily: DEFAULT_FONT_FAMILY,

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
export { DEFAULT_FONT_FAMILY };