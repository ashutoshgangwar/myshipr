/**
 * The shared spacing and corner-radius scale.
 *
 * `as const` so each value is its own literal type — a style written as
 * `padding: spacing.md` stays exactly `16`, and a typo like `spacing.mdd` is
 * caught rather than yielding `undefined`.
 */
const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
} as const;

export default spacing;
