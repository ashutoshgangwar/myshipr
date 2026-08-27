import {scale, verticalScale, moderateScale} from 'react-native-size-matters';

/**
 * Short aliases for `react-native-size-matters`.
 *
 * The signatures come from the library's own `index.d.ts`, so `ms(12)` and
 * `ms(12, 0.5)` are both typed without restating them here.
 */
export const ms = moderateScale;
export const vs = verticalScale;
export const s = scale;
