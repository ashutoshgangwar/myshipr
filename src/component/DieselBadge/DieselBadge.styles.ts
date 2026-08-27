import {Platform, StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {IS_TABLET, select} from '../../theme/device';

const PHONE_FACTOR = select({phone: 0.78, tablet: 1});
const ms = (n: number): number => baseMs(n) * PHONE_FACTOR;
const vs = (n: number): number => baseVs(n) * PHONE_FACTOR;

/**
 * The price is set at one size and left there.
 *
 * It was briefly auto-fitted, which was a mistake twice over: HomeScreen's
 * `loadWhen` already records that `adjustsFontSizeToFit` sizes each line on
 * its own and lands them at visibly different sizes, and on iOS pairing it
 * with a fixed `lineHeight` shrinks the type far past what the width actually
 * needs — on a tablet the price came out noticeably smaller than the design.
 * So the type is fixed, and the box around it is built to fit the type
 * instead of the other way round.
 */
const VALUE_FONT_SIZE = ms(10);

/**
 * How far the driver's own text-size setting may take that type.
 *
 * The chip is a fixed slot in a header row, so it cannot follow an
 * accessibility setting all the way up — but the box below is sized for this
 * multiplier, so everything short of it fits without clipping or shrinking.
 */
const MAX_FONT_SCALE = 1.15;

/**
 * The width the price is given, whatever the price turns out to be.
 *
 * The chip is otherwise as wide as its contents, and its contents come from
 * an API: $3.89/gal today, $12.05/gal on a bad week, $0.00/gal before it has
 * ever answered, and a shimmering bone in between. Left to measure itself the
 * chip changes width under each of those, and it does not change alone — on
 * Home it sits in a row between the notification bell and the avatar, so
 * every re-measure shoves both of them sideways for the rest of the shift.
 *
 * So the value gets a slot, and the slot is measured rather than guessed:
 * the widest price a pump prints ("$12.05/gal") sets to about 5.05em in
 * Poppins Medium, 5.4 leaves that a few percent of air for the places the
 * per-glyph estimate is off, and the cap above is the most the type can grow.
 * Every term is in the type's own units, so the phone and the tablet each get
 * a slot in proportion to their own text.
 */
export const VALUE_SLOT_WIDTH = Math.ceil(VALUE_FONT_SIZE * 5.4 * MAX_FONT_SCALE);

/**
 * And the height, which is what the skeleton used to break.
 *
 * The slot holds two different things over the chip's life — a shimmering
 * bone while the first call is out, then the price — and they used to measure
 * themselves separately: the bone in `vs` units against HEADER_FACTOR, the
 * price in a line box off a `ms` font size against PHONE_FACTOR. They never
 * agreed, so the chip changed height the moment the skeleton cleared, the
 * header row changed with it, and the whole scroll below jumped.
 *
 * Now both fill one box, and the box is Poppins' own line box at the largest
 * the type is allowed to get: ascender to descender is 1.4em, and 1.5 keeps
 * the tail of the "g" in /gal off the floor. The price is centred in it
 * rather than given it as a `lineHeight`, which is what dragged the auto-fit
 * down on iOS.
 */
export const VALUE_SLOT_HEIGHT = Math.ceil(VALUE_FONT_SIZE * 1.5 * MAX_FONT_SCALE);

/** The cap, for the two AppTexts in the chip that have to respect it. */
export {MAX_FONT_SCALE};

export default StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: ms(12),
    paddingHorizontal: IS_TABLET ? ms(11) : ms(10),
    paddingVertical: IS_TABLET ? vs(2) : Platform.OS === 'ios' ? vs(8) : vs(6),
    alignItems: 'flex-start',
  },

  label: {
    color: colors.onDarkLow,
    fontSize: ms(8),
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  value: {
    color: colors.success,
    fontSize: VALUE_FONT_SIZE,
    fontWeight: '500',
  },

  // Never had a price to show — $0.00/gal is a stand-in, not a figure the
  // driver can act on, so it drops the green a real price is printed in.
  valueMuted: {
    color: colors.onDarkLow,
  },

  // The skeleton wraps the value, so it is the piece that carries the fixed
  // slot — both dimensions of it, and the gap above it. Everything inside is
  // sized to fill this box, so the chip measures the same whether it is
  // holding a bone or a price, and the header never re-lays-out around it.
  valueSkeleton: {
    alignSelf: 'flex-start',
    width: VALUE_SLOT_WIDTH,
    height: VALUE_SLOT_HEIGHT,
    // The price sits in the middle of the box at its own size. The bone fills
    // the box outright, so this does nothing to it.
    justifyContent: 'center',
    // Carried here rather than on the bone and the price separately, which is
    // how the two came to disagree about it in the first place.
    marginTop: vs(2),
  },
});
