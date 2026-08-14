import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, ActivityIndicator} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';

import styles from '../ActiveBidding.styles';
import {colors} from '../../../theme/colors';
import {HereMapView, HereRouting} from '../../../here';
import {fitCameraToRoute} from '../../../utils/here/mapHelpers';

const TILE = 256;
const MIN_ZOOM = 2;
const MAX_ZOOM = 15;
// Leaves ~25% breathing room so the two pins never sit on the thumbnail edge.
const PADDING = 1.35;

const RASTER_PX = 96; // captured oversized so the downscaled pin stays crisp
const MARKER_SIZE = 34; // on-screen pin size inside the small thumbnail

const ROUTE_WIDTH = 6;

// Web-mercator Y as a 0..1 fraction of the world, so a latitude span can be
// compared against pixels the same way a longitude span can.
const mercatorY = lat => {
  const clamped = Math.max(-85, Math.min(85, lat));
  const rad = (clamped * Math.PI) / 180;
  return (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2;
};

/**
 * Zoom at which both stops fit inside a box of `width` x `height` px. Far legs
 * come back small (zoomed out), short legs come back large (zoomed in) — the
 * thumbnail itself never changes size.
 */
const fitZoom = (pickup, drop, width, height) => {
  const lngSpan = Math.abs(pickup.lng - drop.lng) / 360;
  const latSpan = Math.abs(mercatorY(pickup.lat) - mercatorY(drop.lat));

  const zoomFor = (span, px) =>
    span > 0 ? Math.log2(px / PADDING / (TILE * span)) : MAX_ZOOM;

  const zoom = Math.min(zoomFor(lngSpan, width), zoomFor(latSpan, height));
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
};

// Teardrop pin, anchored at its bottom tip — both natives anchor a JS-supplied
// image marker at (0.5, 1.0), so the tip lands exactly on the coordinate.
const Pin = ({color, svgRef}) => (
  <Svg ref={svgRef} width={RASTER_PX} height={RASTER_PX} viewBox="0 0 32 32">
    <Path
      d="M16 2c-5.5 0-10 4.4-10 9.9 0 7.3 9 17.4 9.4 17.8a.8.8 0 0 0 1.2 0C17 29.3 26 19.2 26 11.9 26 6.4 21.5 2 16 2z"
      fill={color}
      stroke="#FFFFFF"
      strokeWidth={1.6}
    />
    <Circle cx="16" cy="12" r="3.6" fill="#FFFFFF" />
  </Svg>
);

/**
 * Small HERE map for a load's route block — the shipment and the auction screen
 * both show it beside their stop list.
 *
 * It runs on the same HERE SDK as the trip screen: the map initialises itself
 * (`<HereMapView>`) and the line is a real truck route from HERE's routing
 * engine, so the thumbnail shows the roads the load will actually be driven on
 * rather than a ruler line between two pins. If routing fails — offline, or a
 * leg with no truck-legal road — it falls back to the straight leg so the block
 * still reads as a route.
 *
 * The map is pannable/zoomable; while a finger is down on it the parent tells
 * its ScrollView to stop scrolling via onInteractStart/End so the drag reaches
 * the native map instead of scrolling the page.
 *
 * `style` overrides the thumbnail's own box (size/margins) for callers whose
 * route block is a different shape — ShipmentDetails lists four stops beside it.
 */
export default function RouteMapThumb({
  pickup,
  drop,
  onInteractStart,
  onInteractEnd,
  style,
}) {
  const mapRef = useRef(null);
  const pickupPinRef = useRef(null);
  const dropPinRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [size, setSize] = useState(null);
  const [pins, setPins] = useState(null);

  const hasCoords =
    Number.isFinite(pickup?.lat) &&
    Number.isFinite(pickup?.lng) &&
    Number.isFinite(drop?.lat) &&
    Number.isFinite(drop?.lng);

  const centerLat = hasCoords ? (pickup.lat + drop.lat) / 2 : 0;
  const centerLng = hasCoords ? (pickup.lng + drop.lng) / 2 : 0;
  const zoom =
    hasCoords && size ? fitZoom(pickup, drop, size.width, size.height) : 10;

  // Rasterise both pins to base64 PNGs. Android's native addMarker ignores the
  // `color` option (it falls back to a system icon), so shipping the bytes is
  // the only way the same pin renders on iOS and Android.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const strip = b64 =>
        String(b64).replace(/^data:image\/\w+;base64,/, '');
      const result = {};
      let remaining = 2;
      const done = () => {
        remaining -= 1;
        if (remaining <= 0 && !cancelled) setPins(result);
      };
      [
        ['pickup', pickupPinRef],
        ['drop', dropPinRef],
      ].forEach(([key, ref]) => {
        const svg = ref.current;
        if (!svg || typeof svg.toDataURL !== 'function') return done();
        svg.toDataURL(b64 => {
          if (cancelled) return;
          result[key] = strip(b64);
          done();
        });
      });
    }, 80);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  /**
   * The leg's real geometry, or null when HERE cannot route it. Truck routing
   * matches how the load will actually be driven, which is the point of showing
   * a map here rather than a picture of two dots.
   */
  const routeLeg = useCallback(async () => {
    try {
      return await HereRouting.calculateTruckRoute(
        pickup.lat,
        pickup.lng,
        drop.lat,
        drop.lng,
      );
    } catch (_) {
      return null;
    }
  }, [pickup, drop]);

  // Draw the leg + both pins once the map surface exists. Each step is guarded
  // on its own so one failing native call can't swallow the rest, and the whole
  // thing is silent — the thumbnail is decorative.
  useEffect(() => {
    if (!mapReady || !hasCoords || !size) return undefined;

    let cancelled = false;
    let drawnRouteId = null;

    const step = async fn => {
      try {
        await fn();
      } catch (_) {
        // Decorative — never surface a native draw failure.
      }
    };

    (async () => {
      const map = mapRef.current;
      if (!map) return;

      await step(() => map.clearRoute());
      await step(() => map.clearMarkers());
      if (cancelled) return;

      const route = await routeLeg();
      if (cancelled) return;

      if (route?.routeId) {
        drawnRouteId = route.routeId;
        await step(() =>
          map.drawRoute({
            routeId: route.routeId,
            color: colors.accentBlue,
            width: ROUTE_WIDTH,
          }),
        );
      } else {
        // No route — the straight leg still says "here to there".
        await step(() =>
          map.drawRoute({
            coordinates: [
              {lat: pickup.lat, lng: pickup.lng},
              {lat: drop.lat, lng: drop.lng},
            ],
            color: colors.accentBlue,
            width: ROUTE_WIDTH,
          }),
        );
      }
      if (cancelled) return;

      await step(() =>
        map.addMarker({
          latitude: pickup.lat,
          longitude: pickup.lng,
          color: colors.accentBlue,
          ...(pins?.pickup
            ? {image: pins.pickup, markerSize: MARKER_SIZE}
            : {}),
        }),
      );
      await step(() =>
        map.addMarker({
          latitude: drop.lat,
          longitude: drop.lng,
          color: colors.success,
          ...(pins?.drop ? {image: pins.drop, markerSize: MARKER_SIZE} : {}),
        }),
      );
      if (cancelled) return;

      // Frame the route itself when there is one — a road route can bow well
      // outside the box a straight-leg zoom would fit.
      if (route?.polyline?.length > 1) {
        await step(() => fitCameraToRoute(mapRef, route.polyline));
      } else {
        await step(() => map.moveCamera({lat: centerLat, lng: centerLng, zoom}));
      }
    })();

    return () => {
      cancelled = true;
      // The native route store is shared with navigation and only holds a
      // handful of entries, so a thumbnail hands its own back rather than
      // pushing a live trip's route out of it.
      if (drawnRouteId) HereRouting.releaseRoute(drawnRouteId).catch(() => {});
    };
  }, [
    mapReady,
    hasCoords,
    size,
    pins,
    pickup,
    drop,
    centerLat,
    centerLng,
    zoom,
    routeLeg,
  ]);

  const onLayout = e => {
    const {width, height} = e.nativeEvent.layout;
    if (!width || !height) return;
    setSize(prev =>
      prev && prev.width === width && prev.height === height
        ? prev
        : {width, height},
    );
  };

  // Off-screen pin rasteriser — kept mounted so the PNGs exist before the map
  // is ready to take them.
  const rasteriser = (
    <View
      pointerEvents="none"
      style={{position: 'absolute', left: -1000, top: -1000, opacity: 0}}>
      <Pin color={colors.accentBlue} svgRef={pickupPinRef} />
      <Pin color={colors.success} svgRef={dropPinRef} />
    </View>
  );

  // Without both stops there is no leg to draw, so the box stays a placeholder
  // rather than mounting a map centred on nothing.
  if (!hasCoords) {
    return (
      <View
        style={[styles.mapImage, styles.mapLoading, style]}
        onLayout={onLayout}>
        <ActivityIndicator size="small" color={colors.accentBlue} />
        {rasteriser}
      </View>
    );
  }

  return (
    <View
      style={[styles.mapImage, style]}
      onLayout={onLayout}
      onTouchStart={onInteractStart}
      onTouchEnd={onInteractEnd}
      onTouchCancel={onInteractEnd}>
      {/* HereMapView initialises the SDK itself and renders its own loading /
          error state, so it is mounted unconditionally. */}
      <HereMapView
        ref={mapRef}
        style={styles.mapFill}
        centerLat={centerLat}
        centerLng={centerLng}
        zoomLevel={zoom}
        // A thumbnail is read at a glance: traffic lines at this size only
        // muddy the route. Day/night still follows the shared preference.
        showTrafficFlow={false}
        showTrafficIncidents={false}
        onMapReady={() => setMapReady(true)}
      />
      {rasteriser}
    </View>
  );
}
