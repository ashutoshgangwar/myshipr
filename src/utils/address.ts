/**
 * Address formatting for the places a trip names.
 *
 * Stop addresses arrive from the backend as one free-form line — street,
 * city, state, postcode, often a country tail — which is far more than a
 * bottom sheet has room for. On the paperwork the driver only needs to know
 * which towns the leg runs between, so this trims a line down to the city.
 */

/** A country tail, which carries nothing once the city is known. */
const COUNTRY =
  /^(u\.?s\.?a?\.?|united states(\s+of\s+america)?|canada|mexico|méxico|india|bharat)$/i;

/**
 * A postcode, in the shapes the backend hands back: a US ZIP ("75201",
 * "75201-1234"), an Indian PIN ("560001", written either solid or as
 * "560 001") and a Canadian one ("K1A 0B1").
 */
const POSTCODE_BODY =
  '\\d{5}(-\\d{4})?|\\d{3}\\s?\\d{3}|[A-Z]\\d[A-Z]\\s?\\d[A-Z]\\d';

/** A part that is only a postcode. */
const POSTCODE = new RegExp(`^(${POSTCODE_BODY})$`, 'i');

/** The postcode glued onto the end of a part: "TX 75201", "Karnataka 560001". */
const TRAILING_POSTCODE = new RegExp(`[\\s,]+(${POSTCODE_BODY})$`, 'i');

/**
 * "1234 Main St, Dallas, TX 75201, USA" → "Dallas".
 *
 * Comma-driven on purpose: the last meaningful part of a postal address is
 * the state and the one before it is the city, which holds whether or not a
 * street, a business name or a postcode came along. The state and postcode
 * are dropped — the driver reads these fields at a glance and the town is
 * the part that identifies the stop. Anything that does not look like an
 * address — a single unpunctuated place name, say — is handed back as it
 * came rather than guessed at.
 */
export const city = (address?: string | null): string => {
  const parts = String(address ?? '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  // Drop the tail the driver cannot use: country, then a postcode that was
  // given its own part.
  while (
    parts.length &&
    (COUNTRY.test(parts[parts.length - 1]) ||
      POSTCODE.test(parts[parts.length - 1]))
  ) {
    parts.pop();
  }
  if (!parts.length) return '';

  // The last part is the state; the one before it is the city. With only one
  // part left there is no state to strip — that part is the place itself.
  const place =
    parts.length > 1 ? parts[parts.length - 2] : parts[parts.length - 1];

  return place.replace(TRAILING_POSTCODE, '').trim();
};
