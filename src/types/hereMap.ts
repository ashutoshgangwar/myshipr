/**
 * The HERE map's style, language and feature vocabularies.
 *
 * Unlike its neighbours in this folder, this module carries runtime values —
 * the arrays are real exports. Each is now `as const`, which lets the union of
 * its members be derived below instead of written out twice.
 *
 * NOTE: nothing imports this module today. It is converted as-is (same
 * exports, same values, same order) rather than deleted.
 */

export const HERE_MAP_STYLES = [
  'explore.day',
  'explore.night',
  'lite.day',
  'lite.night',
  'satellite.day',
] as const;

/** One of the five map schemes the HERE renderer accepts. */
export type HereMapStyle = (typeof HERE_MAP_STYLES)[number];

export const HERE_LANGUAGE_CODES = ['en', 'hi', 'ar'] as const;

/** A guidance/label language code the SDK is configured with. */
export type HereLanguageCode = (typeof HERE_LANGUAGE_CODES)[number];

export const HERE_FEATURE_KEYS = [
  'pois',
  'congestion_zones',
  'environmental_zones',
  'public_transit',
  'vehicle_restrictions',
] as const;

/** A toggleable map feature layer. */
export type HereFeatureKey = (typeof HERE_FEATURE_KEYS)[number];
