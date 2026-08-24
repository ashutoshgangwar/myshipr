/**
 * Number, money and clock formatting shared by the driver screens.
 *
 * Kept out of any one screen's folder because the same figures show up in the
 * Home cards, the Shipment table and the loads list — and because Hermes does
 * not reliably carry Intl, so these are hand-rolled rather than delegated.
 */

export const isNumber = value =>
  Number.isFinite(Number(value)) && value !== null && value !== '';

/** "1,250" — grouped without Intl, which Hermes does not always carry. */
export const group = value => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** 0.1 → "$0.10", 1250 → "$1,250" */
export const formatMoney = value => {
  if (!isNumber(value)) return '—';
  const amount = Number(value);
  const whole = Math.trunc(Math.abs(amount));
  const rounded = Math.round(Math.abs(amount) * 100) / 100;
  const text =
    rounded === whole
      ? group(whole)
      : `${group(whole)}.${String(Math.round((rounded - whole) * 100)).padStart(2, '0')}`;
  return `${amount < 0 ? '-' : ''}$${text}`;
};

/**
 * 241.63 → "241.63 mi", 3.8 → "3.8 mi", 1234.5 → "1,234.5 mi".
 *
 * @param value  the distance as the backend sent it
 * @param unit   suffix; the Shipment table spells it out as "Miles"
 */
export const formatMiles = (value, unit = 'mi') => {
  if (!isNumber(value)) return '—';
  const miles = Number(value);
  // Printed exactly as the backend sent it — 241.63 stays 241.63, not 242, and
  // a whole number gains no decimals. Only the thousands separator is added.
  const [whole, decimals] = String(Math.abs(miles)).split('.');
  return `${miles < 0 ? '-' : ''}${group(whole)}${
    decimals ? `.${decimals}` : ''
  } ${unit}`;
};

/** 250 → "4h 10m", 45 → "45m" */
export const formatMinutes = value => {
  if (!isNumber(value)) return '—';
  const total = Math.max(0, Math.round(Number(value)));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (!hours) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
};

/** "12:10 PM" for a wall-clock time, from a Date. */
export const clock = date => {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours < 12 ? 'AM' : 'PM';
  return `${hours % 12 || 12}:${minutes} ${suffix}`;
};

/** "08:30" / "2026-07-26T08:30:00" → "8:30 AM". Non-times pass through. */
export const stopTime = value => {
  if (!value) return '';
  const text = String(value).trim();

  const bare = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(text);
  if (bare) {
    const hours = Number(bare[1]);
    return `${hours % 12 || 12}:${bare[2]} ${hours < 12 ? 'AM' : 'PM'}`;
  }

  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? clock(new Date(parsed)) : text;
};

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
