/**
 * The HERE SDK bridge, as JavaScript sees it.
 *
 * These describe the shapes crossing the native boundary — the map view's
 * imperative handle, its props, and the routing/navigation payloads. They are
 * hand-written because the bridge is a native module: there is no generated
 * contract to derive them from, so every field here was read off the calls in
 * `src/here/` rather than guessed.
 *
 * Types only: this module emits no runtime code.
 */

import type {StyleProp, ViewStyle} from 'react-native';

import type {LatLng, Nullable} from './common';

/** The four looks the map offers; `auto` follows sunrise/sunset. */
export type MapStyleName = 'auto' | 'day' | 'night' | 'satellite';

/** A camera move. Only the coordinate is required. */
export interface CameraTarget extends LatLng {
  zoom?: number;
  bearing?: number;
  tilt?: number;
  animate?: boolean;
  animationDuration?: number;
}

/** Where the camera currently is. */
export interface CameraState extends Partial<LatLng> {
  bearing?: number;
  tilt?: number;
  distanceMeters?: number;
}

/** A marker dropped on the map. */
export interface MarkerOptions {
  latitude: number;
  longitude: number;
  color?: string;
  /** A rasterised image, as produced by `destinationMarker`. */
  image?: unknown;
  markerSize?: number;
}

/**
 * Route geometry to draw: either a `routeId` from `HereRouting` (which can be
 * coloured by live congestion) or an explicit coordinate array (which cannot).
 */
export interface DrawRouteOptions {
  routeId?: string;
  coordinates?: LatLng[];
  color?: string;
  width?: number;
  traffic?: boolean;
}

/** A tap, long-press or POI tap on the map surface. */
export interface MapTapEvent {
  latitude: number;
  longitude: number;
  x: number;
  y: number;
  /** Present on POI taps only. */
  name?: string;
  categoryId?: string;
}

/** Why the map could not be shown. */
export interface MapErrorEvent {
  code?: string;
  message?: string;
}

/**
 * The imperative handle `<HereMapView>` exposes on its ref.
 *
 * Every method rejects when the map is not mounted or the native module is
 * missing, rather than throwing synchronously — which is why they all return
 * promises even where the underlying call looks instant.
 */
export interface HereMapViewHandle {
  /** Resolves once the map scene is renderable — await before drawing. */
  loadMap(options?: {scheme?: string} | null): Promise<unknown>;
  setCenter(latitude: number, longitude: number, zoom?: number): Promise<unknown>;
  showCurrentLocation(
    latitude?: number,
    longitude?: number,
    options?: Record<string, unknown>,
  ): Promise<unknown>;
  hideCurrentLocation(): Promise<unknown>;
  addMarker(options: MarkerOptions): Promise<unknown>;
  clearMarkers(): Promise<unknown>;
  /** @returns the number of vertices drawn */
  drawRoute(route: DrawRouteOptions): Promise<number>;
  clearRoute(): Promise<unknown>;
  moveCamera(camera: CameraTarget): Promise<unknown>;
  getCameraState(): Promise<Nullable<CameraState>>;
  resetNorth(): Promise<unknown>;
  setMapScheme(name: string): Promise<unknown>;
  /** Omit either flag to leave it as it is. */
  setTraffic(options?: {flow?: boolean; incidents?: boolean}): Promise<unknown>;
  /** The React tag, for native calls that take an explicit `mapViewTag`. */
  getTag(): number | null;
}

/** Props accepted by `<HereMapView>`. */
export interface HereMapViewProps {
  style?: StyleProp<ViewStyle>;
  centerLat?: number;
  centerLng?: number;
  zoomLevel?: number;
  /** Omit to follow the shared preference (which defaults to `auto`). */
  mapStyle?: MapStyleName;
  /** A raw HERE scheme name; overrides `mapStyle` when both are given. */
  mapScheme?: string;
  showTrafficFlow?: boolean;
  showTrafficIncidents?: boolean;
  buildings3D?: boolean;
  onMapTap?: (event: MapTapEvent) => void;
  onMapLongPress?: (event: MapTapEvent) => void;
  /** Adds `{name, categoryId}` for HERE's built-in POIs. */
  onPoiTap?: (event: MapTapEvent) => void;
  onMapError?: (error: MapErrorEvent) => void;
  /**
   * Fired exactly once, with the imperative handle — so a caller can start
   * drawing without also holding a ref.
   */
  onMapReady?: (api: HereMapViewHandle) => void;
}

/** One toll booth on a calculated route. */
export interface HereTollItem {
  tollSystem?: string;
  countryCode?: string;
  price?: number;
  currency?: string;
  [key: string]: unknown;
}

/** A calculated route, as `HereRouting` returns it. */
export interface HereRoute {
  routeId: string;
  distanceMeters?: number;
  durationSeconds?: number;
  /**
   * Turn-by-turn list. Kept loose (`Record`) rather than importing the
   * screen-level `ManeuverStep`, so this transport type stays independent of
   * the UI that renders it.
   */
  maneuvers?: Array<Record<string, unknown>>;
  polyline?: LatLng[];
  consumptionKwh?: number;
  /** Toll summary for the route, when the request asked for one. */
  tolls?: {
    total?: number;
    currency?: string;
    items?: HereTollItem[];
  } | null;
  [key: string]: unknown;
}

/** Whether guidance is running, and on which route. */
export interface NavigationSessionState {
  running?: boolean;
  navigating?: boolean;
  rendering?: boolean;
  routeId?: Nullable<string>;
}
