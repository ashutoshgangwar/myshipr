import React from 'react';
import Svg, {G, Path} from 'react-native-svg';

/**
 * Turn arrow for the next maneuver, drawn rather than shipped as an asset so a
 * single component covers every HERE action/direction pair.
 *
 * Every glyph lives in the same 24×24 box and is built the same way — a stroked
 * stem plus a filled head — so the whole set reads at one weight.
 */

// Actions where a hard turn arrow would overstate the maneuver: you drift onto
// a ramp or a fork, you don't turn onto it. These get the shallow arrow.
const SOFT_ACTIONS = new Set(['keep', 'merge', 'ramp', 'exit']);

/** Picks the glyph for a `{action, direction}` pair from the HERE maneuver. */
function glyphFor(action, direction) {
  if (action === 'arrive') return 'arrive';
  if (direction === 'uturn') return 'uturn';
  if (typeof action === 'string' && action.startsWith('roundabout')) {
    return 'roundabout';
  }

  const soft = SOFT_ACTIONS.has(action);
  switch (direction) {
    case 'left':
      return soft ? 'slight-left' : 'left';
    case 'right':
      return soft ? 'slight-right' : 'right';
    // A sharp turn borrows the plain turn arrow — the label carries the rest.
    case 'sharp-left':
      return 'left';
    case 'sharp-right':
      return 'right';
    case 'slight-left':
      return 'slight-left';
    case 'slight-right':
      return 'slight-right';
    default:
      return 'straight';
  }
}

/** Straight-ahead arrow; the slight variants are this one, pivoted. */
function StraightArrow({color, strokeWidth}) {
  return (
    <>
      <Path
        d="M12 21 V9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M12 3 L6.5 10.5 H17.5 Z" fill={color} />
    </>
  );
}

export default function ManeuverIcon({
  action,
  direction,
  size = 24,
  color = '#FFFFFF',
  strokeWidth = 2.4,
}) {
  const glyph = glyphFor(action, direction);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Right-hand turns are their left-hand twin, mirrored about the centre. */}
      <G
        transform={
          glyph === 'right' || glyph === 'slight-right'
            ? 'translate(24, 0) scale(-1, 1)'
            : undefined
        }>
        {(glyph === 'straight' || glyph === 'depart') && (
          <StraightArrow color={color} strokeWidth={strokeWidth} />
        )}

        {(glyph === 'slight-left' || glyph === 'slight-right') && (
          // Same arrow, pivoted about its tail so the stem still starts where
          // the driver is rather than off to one side.
          <G transform="rotate(-35, 12, 21)">
            <StraightArrow color={color} strokeWidth={strokeWidth} />
          </G>
        )}

        {(glyph === 'left' || glyph === 'right') && (
          <>
            <Path
              d="M15.5 21 V13 Q15.5 8 10.5 8 H9"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
            <Path d="M3 8 L9.5 3 V13 Z" fill={color} />
          </>
        )}

        {glyph === 'uturn' && (
          <>
            <Path
              d="M17 21 V12 A5 5 0 0 0 7 12 V15"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
            <Path d="M7 21 L2.5 14 H11.5 Z" fill={color} />
          </>
        )}

        {glyph === 'roundabout' && (
          <>
            <Path
              d="M12 21 V11"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M12 3 A4 4 0 1 1 11.99 3"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Path
              d="M16 7 H18"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
            <Path d="M17.5 3.5 V10.5 L22 7 Z" fill={color} />
          </>
        )}

        {glyph === 'arrive' && (
          <>
            <Path
              d="M6.5 21 V3"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
            <Path d="M6.5 3.5 H18 L15 8 L18 12.5 H6.5 Z" fill={color} />
          </>
        )}
      </G>
    </Svg>
  );
}
