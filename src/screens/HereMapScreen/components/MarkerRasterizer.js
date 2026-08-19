import React, {useEffect, useRef} from 'react';
import {View} from 'react-native';
import MarkerPin, {MARKER_ROLE_ICON} from './MarkerPin';

// Per-role tint (only affects icons that use currentColor, e.g. the car).
// The drop stop is not here: it has its own icon, see `here/destinationMarker`.
export const MARKER_ROLE_COLORS = {
  source: '#22C55E',
  vehicle: '#2563EB',
};

const RASTER_PX = 96; // captured at @2x-ish for crisp markers on the map

/**
 * Renders the marker icons off-screen (one hidden <Svg> per role) and
 * rasterises each to a base64 PNG via react-native-svg's `toDataURL`. The
 * resulting `{source, vehicle}` map is handed back through
 * `onReady` so the screen can pass the bytes to the native HERE map.
 *
 * The source icon is fixed (see MarkerPin.MARKER_ROLE_ICON); the vehicle icon
 * follows the Truck/Car picker via `vehicleShape`.
 */
export default function MarkerRasterizer({vehicleShape = 'truck', onReady}) {
  const sourceRef = useRef(null);
  const vehicleRef = useRef(null);
  const refs = {
    source: sourceRef,
    vehicle: vehicleRef,
  };

  const iconKeys = {
    source: MARKER_ROLE_ICON.source,
    vehicle: vehicleShape || MARKER_ROLE_ICON.vehicle,
  };

  useEffect(() => {
    let cancelled = false;
    const roles = Object.keys(MARKER_ROLE_COLORS);
    const result = {};
    let remaining = roles.length;

    // Let RN mount/lay out the off-screen SVGs before snapshotting them.
    const timer = setTimeout(() => {
      roles.forEach(role => {
        const svg = refs[role].current;
        if (!svg || typeof svg.toDataURL !== 'function') {
          remaining -= 1;
          if (remaining <= 0 && !cancelled && Object.keys(result).length) {
            onReady && onReady(result);
          }
          return;
        }
        svg.toDataURL(base64 => {
          if (cancelled) return;
          result[role] = String(base64).replace(/^data:image\/\w+;base64,/, '');
          remaining -= 1;
          if (remaining <= 0) onReady && onReady(result);
        });
      });
    }, 80);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleShape]);

  return (
    <View
      pointerEvents="none"
      style={{position: 'absolute', left: -1000, top: -1000, opacity: 0}}>
      {Object.keys(MARKER_ROLE_COLORS).map(role => (
        <MarkerPin
          key={role}
          svgRef={refs[role]}
          iconKey={iconKeys[role]}
          color={MARKER_ROLE_COLORS[role]}
          width={RASTER_PX}
        />
      ))}
    </View>
  );
}
