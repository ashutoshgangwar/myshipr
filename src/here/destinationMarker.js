/**
 * The destination pin: one SVG icon, rasterised once, shared by every map.
 *
 * Android's native `addMarker` ignores the `color` option — it falls back to a
 * system icon, while iOS draws HERE's own pin — so handing native the bytes is
 * what makes the same pin appear on both platforms. react-native-svg turns the
 * asset into those bytes at runtime (`toDataURL`), which is why the icon
 * reaches the map through this module instead of being drawn by each screen.
 *
 * Mount `<DestinationMarkerRasterizer />` once on any screen that drops a pin,
 * then build the marker with `destinationMarkerOptions`. The bytes are cached
 * for the life of the process, so only the first mount does any work and every
 * screen after it gets the pin straight away.
 *
 * Native scales the bytes to `markerSize` (longest edge, aspect preserved) and
 * anchors them at (0.5, 1.0), so the tip of the pin sits on the coordinate.
 */
import React, {useEffect, useRef, useState} from 'react';
import {View} from 'react-native';

import DestinationPin from '../assets/svg_icon/destination_pin.svg';

/** On-screen size, in px, of the pin on a full-screen map. */
export const DESTINATION_MARKER_SIZE = 220;

/** Route thumbnails, where the full-size pin would cover the route. */
export const DESTINATION_MARKER_THUMB_SIZE = 34;

/** Matches the asset's fill — the native fallback until the bytes are ready. */
const DESTINATION_COLOR = '#FF3366';

const RASTER_PX = 96; // captured at @2x-ish for a crisp pin on the map
const PIN_ASPECT = 31 / 24; // the asset's viewBox, so the pin is not squashed

let cachedImage = null;

/** The rasterised pin, or null until the first rasteriser has finished. */
export const getDestinationMarkerImage = () => cachedImage;

/**
 * `addMarker` options for the destination stop.
 *
 *     await map.addMarker(destinationMarkerOptions({latitude, longitude}));
 *
 * Falls back to a plain coloured marker for the frame or two before the icon
 * has been rasterised, so a stop always shows even if the map beats it.
 *
 * @param {{latitude: number, longitude: number, size?: number}} stop
 */
export function destinationMarkerOptions({
  latitude,
  longitude,
  size = DESTINATION_MARKER_SIZE,
}) {
  return {
    latitude,
    longitude,
    color: DESTINATION_COLOR,
    ...(cachedImage ? {image: cachedImage, markerSize: size} : {}),
  };
}

/**
 * Renders the pin off-screen and rasterises it to a base64 PNG. Renders
 * nothing once the bytes are cached, so mounting it on several screens — or
 * once per row in a list of thumbnails — costs nothing after the first.
 */
export function DestinationMarkerRasterizer() {
  const svgRef = useRef(null);
  const [rasterised, setRasterised] = useState(cachedImage != null);

  useEffect(() => {
    if (cachedImage != null) return undefined;
    let cancelled = false;

    // Let RN mount and lay the off-screen SVG out before snapshotting it.
    const timer = setTimeout(() => {
      const svg = svgRef.current;
      if (!svg || typeof svg.toDataURL !== 'function') return;
      svg.toDataURL(base64 => {
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
      <DestinationPin
        ref={svgRef}
        width={RASTER_PX}
        height={Math.round(RASTER_PX * PIN_ASPECT)}
      />
    </View>
  );
}
