import { Platform } from 'react-native';

// 🔤 default font per platform
const DEFAULT_FONT_FAMILY = Platform.select({
  ios: 'System',
  android: 'monospace',
  default: 'System',
});

const typography = {
  fontFamily: DEFAULT_FONT_FAMILY,

  title: 22,
  subtitle: 14,
  body: 15,
  label: 13,
  button: 16,
};

export default typography;
export { DEFAULT_FONT_FAMILY };