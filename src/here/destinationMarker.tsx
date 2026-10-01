import React, {useEffect, useRef, useState} from 'react';
import {View} from 'react-native';

import DestinationFlag from '../assets/svg_icon/destination_flag.svg';
import type {Svg} from 'react-native-svg';
import type {MarkerOptions} from '../types/here';
import {colors} from '../theme/colors';

/** On-screen size, in px, of the flag on a full-screen map. */
export const DESTINATION_MARKER_SIZE = 240;

/** Route thumbnails, where the full-size flag would cover the route. */
export const DESTINATION_MARKER_THUMB_SIZE = 34;

/** The pole's orange — the native fallback tint until the bytes are ready. */
const DESTINATION_COLOR = colors.button_color;

const FLAG_ASPECT = 50 / 40; // the asset's viewBox, so the flag is not squashed
// Captured at least as large as DESTINATION_MARKER_SIZE, so native only ever
// scales the flag DOWN — scaling up is what makes a marker look soft.
const RASTER_PX = DESTINATION_MARKER_SIZE;

/** Base64 PNG bytes of the rasterised flag, once one has been produced. */
let cachedImage: string | null = null;

/** The rasterised flag, or null until the first rasteriser has finished. */
export const getDestinationMarkerImage = (): string | null => cachedImage;

/**
 * `addMarker` options for the destination stop.
 *
 *     await map.addMarker(destinationMarkerOptions({latitude, longitude}));
 *
 * Falls back to a plain coloured marker for the frame or two before the icon
 * has been rasterised, so a stop always shows even if the map beats it. That
 * fallback is the one thing that does NOT match across platforms, which is why
 * the rasteriser is mounted at the app root.
 */
export function destinationMarkerOptions({
  latitude,
  longitude,
  size = DESTINATION_MARKER_SIZE,
}: {
  latitude: number;
  longitude: number;
  size?: number;
}): MarkerOptions {
  return {
    latitude,
    longitude,
    color: DESTINATION_COLOR,
    ...(cachedImage ? {image: cachedImage, markerSize: size} : {}),
  };
}

/**
 * Renders the flag off-screen and rasterises it to a base64 PNG. Renders
 * nothing once the bytes are cached, so mounting it on several screens — or
 * once per row in a list of thumbnails — costs nothing after the first.
 */
export function DestinationMarkerRasterizer() {
  // `.svgrrc.js` sets `ref: true`, so the generated icon forwards its ref to
  // the underlying <Svg> — which is what `toDataURL()` is called on.
  const svgRef = useRef<Svg | null>(null);
  const [rasterised, setRasterised] = useState(cachedImage != null);

  useEffect(() => {
    if (cachedImage != null) return undefined;
    let cancelled = false;

    // Let RN mount and lay the off-screen SVG out before snapshotting it.
    const timer = setTimeout(() => {
      const svg = svgRef.current;
      if (!svg || typeof svg.toDataURL !== 'function') return;
      svg.toDataURL((base64: string) => {
        if (cancelled) return;
        cachedImage = String(base64).replace(/^data:image\/\w+;base64,/, '');
        setRasterised(true);
      });
    }, 80);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (rasterised) return null;

  return (
    <View
      pointerEvents="none"
      style={{position: 'absolute', left: -1000, top: -1000, opacity: 0}}>
      <DestinationFlag
        ref={svgRef}
        width={RASTER_PX}
        height={Math.round(RASTER_PX * FLAG_ASPECT)}
      />
    </View>
  );
}
