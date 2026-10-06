import {ms} from './scale';
import {select} from './device';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});

const size = (base: number): number => ms(base) * PHONE_FACTOR;

export const fontSize = {
  giant: size(48),
  hero: size(32),
  display: size(28),

  mainHeading: size(24),
  heading: size(20),
  title: size(18),
  subHeading: size(16),

  body: size(16),
  subBody: size(13),
  label: size(12),
  caption: size(11),
  small: size(10),
  tiny: size(9),
  micro: size(8),
  // Sub-micro steps for dense, multi-column UI (e.g. the tablet bidding card's
  // route labels and footer stats) where micro is still too large to fit.
  nano: size(7),
  pico: size(6),
} as const;

export type FontSizeToken = keyof typeof fontSize;

export default fontSize;
