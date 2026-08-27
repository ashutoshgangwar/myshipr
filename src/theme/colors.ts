/**
 * The app's colour palette.
 *
 * `as const` makes every entry a literal string type, so `colors.navy` is
 * `'#00033E'` rather than `string` — which is what lets `StyleSheet.create`
 * accept these directly as `ColorValue`s, and makes a mistyped key an error
 * instead of `undefined`.
 */
export const colors = {
  navy: '#00033E',
  nearBlack: '#171717',
  gray400: '#f2efef',
  gray500: '#88888878',
  white: '#FFFFFF',
  placeholder: '#00000099',

  splashBackground: '#00033E',
  splashText: '#FFFFFF',
  splashBorder: '#171717',
  splashTitle: '#FFFFFF',
  splashSubtitle: '#767676',

  primary: '#00033E',
  primaryLight: '#999AB2',
  button_color: '#F57C00',
  text_color_button: '#000',
  text_color: '#FFFFFF',
  text_dark: '#111111',
  text_light: '#061e48ff',
  toggle_color: '#a6cdf9',


  input_bg: '#FFFFFF',
  border_Color: '#E5E7EB',
  success_text: '#15803D',
  success_bg_star: '#008926',
  sucess_border: '#56FF84',
  success_bg: '#86EFAC',
  success_bg_light: '#00A12D3B',
  
  muted: '#000000eb',
  background: '#F8F9FA',

  // Semantic accents used across dashboard cards
  success: '#16A34A',
  status: '#94A2B3',
   warning_text: '#DAA509' ,
   card_drive: '#FF9696',
   card_drive_load: '#7C5BE6',
  successLight: '#E4FBF3',
  accentBlue: '#2563EB',
  accentBlueLight: '#1883FF',
  accentBlueDark: '#1F00BF',
  warning: '#F59E0B',
  warningLight: '#eacd77',
  danger: '#DC2626',
  screenBg: '#F3F4F6',
  cardBorder: '#E2E8F0',
  textMuted: '#64748B',
  textStrong: '#000000',
  // NOTE: this key was declared twice. The second declaration (#0B1023,
  // below) is the one that won at runtime, so the shadowed first value
  // (#767676) is removed rather than the live one. Duplicate keys are a
  // TypeScript error (TS1117) as well as an ESLint one (no-dupe-keys).
  lightbg_gray: '#8888884D',
  lightbg_gray2: '#606060',
  lightbg_gray3:'#7171717D',


  surfaceDarkPrimary: '#00033E',
  overlayDarkStartTransparent: 'rgba(12, 32, 69, 0)',
  overlayDarkMidStrong: 'rgba(12, 32, 69, 0.85)',
  onDarkLow: 'rgba(255,255,255,0.6)',
  onDarkMedium: 'rgba(255,255,255,0.8)',
  onDarkHigh: 'rgba(255,255,255,0.9)',
  borderContrastStrong: '#171717',
  textOnLightStrong: '#0B1023',
} as const;
