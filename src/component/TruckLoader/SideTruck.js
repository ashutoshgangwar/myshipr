import React from 'react';
import Svg, {Rect, Circle, G, Line, Path} from 'react-native-svg';

/**
 * Side-view cargo truck (blue trailer + cab) used by the TruckLoader
 * animation. Drawn to a 220 × 96 viewBox; scale via the width/height props.
 */
export default function SideTruck({width = 180, height = 78}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 220 96">
      {/* ── Trailer / container (left) ── */}
      <Rect x="4" y="14" width="132" height="54" rx="4" fill="#2F6FED" />
      <Rect
        x="4"
        y="14"
        width="132"
        height="54"
        rx="4"
        fill="none"
        stroke="#1B4FB0"
        strokeWidth="2"
      />
      {/* container ribs */}
      <G stroke="#5B8DF4" strokeWidth="2">
        <Line x1="28" y1="18" x2="28" y2="64" />
        <Line x1="52" y1="18" x2="52" y2="64" />
        <Line x1="76" y1="18" x2="76" y2="64" />
        <Line x1="100" y1="18" x2="100" y2="64" />
        <Line x1="124" y1="18" x2="124" y2="64" />
      </G>

      {/* ── Cab (right) ── */}
      <Path
        d="M140 30 L168 30 Q176 30 181 37 L196 56 Q200 60 200 66 L200 68 L140 68 Z"
        fill="#E33B3B"
      />
      {/* cab roof / body */}
      <Rect x="140" y="20" width="14" height="48" rx="3" fill="#2F6FED" />
      {/* windshield */}
      <Path d="M170 34 L182 34 Q188 34 192 40 L196 50 L170 50 Z" fill="#BFE0FF" />
      {/* headlight */}
      <Rect x="197" y="58" width="4" height="6" rx="1.5" fill="#FFD54A" />

      {/* coupling between trailer and cab */}
      <Rect x="136" y="60" width="6" height="6" fill="#444" />

      {/* ── Wheels ── */}
      <G>
        <Circle cx="40" cy="74" r="13" fill="#1C1C1C" />
        <Circle cx="40" cy="74" r="5" fill="#9AA3AE" />
        <Circle cx="74" cy="74" r="13" fill="#1C1C1C" />
        <Circle cx="74" cy="74" r="5" fill="#9AA3AE" />
        <Circle cx="170" cy="74" r="13" fill="#1C1C1C" />
        <Circle cx="170" cy="74" r="5" fill="#9AA3AE" />
      </G>
    </Svg>
  );
}
