import {useCallback, useEffect, useRef, useState} from 'react';
import {Appearance, AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {MapStyleName} from '../types/here';

/** The shared, persisted map preferences. */
export interface MapPrefs {
  style: MapStyleName;
  /** Live traffic flow lines, coloured by congestion. */
  trafficFlow: boolean;
  /** Accident / closure / roadworks icons. */
  trafficIncidents: boolean;
}

/**
 * The map look, shared by every screen that shows a HERE map.
 *
 * Two things live here:
 *
 *   1. The day/night decision. `auto` is the default, and it means the map
 *      follows the driver's world: dark once the sun is down (or the phone is
 *      in dark mode), light again in the morning. Nothing has to be toggled.
 *   2. The driver's own choice — day, night or satellite — which is remembered
 *      across screens and app launches, so picking satellite on the trip map
 *      does not leave the search map on the plain scheme.
 *
 * Both resolve to a HERE `MapScheme` name, which is what the native views take
 * (`mapScheme` prop → Android `HereMapView.setMapScheme`, iOS `setMapScheme`).
 */

export const MAP_STYLE = {
  /** Light by day, dark by night — the default. */
  AUTO: 'auto',
  DAY: 'day',
  NIGHT: 'night',
  /** Aerial imagery. Roads and labels stay on so it is still drivable. */
  SATELLITE: 'satellite',
} as const satisfies Record<string, MapStyleName>;

export const MAP_STYLE_OPTIONS = [
  {value: MAP_STYLE.AUTO, label: 'Auto'},
  {value: MAP_STYLE.DAY, label: 'Day'},
  {value: MAP_STYLE.NIGHT, label: 'Night'},
  {value: MAP_STYLE.SATELLITE, label: 'Satellite'},
];

// Local-clock boundaries for the automatic switch. Deliberately blunt: HERE has
// no sunrise/sunset feed, and a driver at 19:00 wants the dark map whatever the
// exact sunset is that day.
const NIGHT_START_HOUR = 18;
const NIGHT_END_HOUR = 6;

// The auto watcher re-checks at the next boundary, but never sleeps longer than
// this — a shorter timer keeps React Native from complaining about long timers
// and makes a clock or time-zone change show up within a few minutes.
const MAX_WATCH_INTERVAL_MS = 5 * 60 * 1000;

const STORAGE_KEY = '@myshipr/map_prefs';

/** True when the local clock says it is night. */
export function isNightAt(date = new Date()) {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

/**
 * True when the map should be dark: after dark by the clock, or any time the
 * phone itself is in dark mode (a driver who set that has asked for it).
 */
export function isNightNow() {
  return Appearance.getColorScheme() === 'dark' || isNightAt();
}

/** Milliseconds until the next day↔night boundary, capped for the watcher. */
function msUntilNextBoundary(now = new Date()) {
  const next = new Date(now.getTime());
  next.setMinutes(0, 0, 0);
  const hour = now.getHours();
  if (hour < NIGHT_END_HOUR) {
    next.setHours(NIGHT_END_HOUR);
  } else if (hour < NIGHT_START_HOUR) {
    next.setHours(NIGHT_START_HOUR);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(NIGHT_END_HOUR);
  }
  const delay = next.getTime() - now.getTime();
  return Math.min(MAX_WATCH_INTERVAL_MS, Math.max(1000, delay));
}

/**
 * The HERE `MapScheme` name for a style.
 *
 * Satellite resolves to the *hybrid* scheme rather than the bare `satellite`
 * one: bare satellite is imagery with no roads or labels, which is unusable to
 * navigate by. Pass an explicit HERE scheme name to `<HereMapView mapScheme>`
 * when the plain imagery is what is wanted.
 *
 * @param style one of {@link MAP_STYLE}
 * @param night whether the night variant applies
 * @returns e.g. 'normalDay' | 'normalNight' | 'hybridDay'
 */
export function resolveMapScheme(
  style: MapStyleName | undefined,
  night: boolean = isNightNow(),
): string {
  switch (style) {
    case MAP_STYLE.DAY:
      return 'normalDay';
    case MAP_STYLE.NIGHT:
      return 'normalNight';
    case MAP_STYLE.SATELLITE:
      return night ? 'hybridNight' : 'hybridDay';
    case MAP_STYLE.AUTO:
    default:
      return night ? 'normalNight' : 'normalDay';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared preference store
//
// One in-memory value with listeners, mirrored to AsyncStorage. Screens read it
// through the hooks below; the store itself is deliberately tiny so a map view
// that mounts before the stored value has been read still renders with the
// defaults and updates a tick later.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PREFS: MapPrefs = {
  style: MAP_STYLE.AUTO,
  /** Live traffic flow lines — on by default; a driver wants to see jams. */
  trafficFlow: true,
  /** Accident / closure / roadworks icons. */
  trafficIncidents: true,
};

let prefs: MapPrefs = {...DEFAULT_PREFS};
let hydrated = false;
let hydrating: Promise<MapPrefs> | null = null;
const listeners = new Set<(next: MapPrefs) => void>();

function emit() {
  listeners.forEach(listener => listener(prefs));
}

function sanitize(raw: unknown): MapPrefs | null {
  if (!raw || typeof raw !== 'object') return null;
  const stored = raw as Partial<Record<keyof MapPrefs, unknown>>;
  const styleValid = MAP_STYLE_OPTIONS.some(o => o.value === stored.style);
  return {
    style: styleValid ? (stored.style as MapStyleName) : DEFAULT_PREFS.style,
    trafficFlow:
      typeof stored.trafficFlow === 'boolean'
        ? stored.trafficFlow
        : DEFAULT_PREFS.trafficFlow,
    trafficIncidents:
      typeof stored.trafficIncidents === 'boolean'
        ? stored.trafficIncidents
        : DEFAULT_PREFS.trafficIncidents,
  };
}

/** Loads the stored preferences once; later calls reuse the same promise. */
export function hydrateMapPrefs() {
  if (hydrated) return Promise.resolve(prefs);
  if (hydrating) return hydrating;
  hydrating = AsyncStorage.getItem(STORAGE_KEY)
    .then(raw => {
      const stored = raw ? sanitize(JSON.parse(raw)) : null;
      if (stored) {
        prefs = stored;
        emit();
      }
      return prefs;
    })
    .catch(() => prefs)
    .finally(() => {
      hydrated = true;
      hydrating = null;
    });
  return hydrating;
}

export function getMapPrefs(): MapPrefs {
  return prefs;
}

/**
 * Updates the shared preferences and persists them. Partial: pass only what
 * changed, e.g. `setMapPrefs({style: MAP_STYLE.SATELLITE})`.
 */
export function setMapPrefs(patch: Partial<MapPrefs>): MapPrefs {
  const next = {...prefs, ...patch};
  if (
    next.style === prefs.style &&
    next.trafficFlow === prefs.trafficFlow &&
    next.trafficIncidents === prefs.trafficIncidents
  ) {
    return prefs;
  }
  prefs = next;
  emit();
  // Persistence is best-effort: a failed write must not break the map.
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => {});
  return prefs;
}

export function subscribeMapPrefs(
  listener: (next: MapPrefs) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tracks "is it night" for the automatic day/night switch.
 *
 * Re-evaluates when the phone's colour scheme changes, when the app comes back
 * to the foreground (the clock may have moved on while it was away), and at the
 * next day↔night boundary.
 */
export function useIsNight() {
  const [night, setNight] = useState(isNightNow);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      if (cancelled) return;
      setNight(current => {
        const now = isNightNow();
        return now === current ? current : now;
      });
      timerRef.current = setTimeout(check, msUntilNextBoundary());
    };

    timerRef.current = setTimeout(check, msUntilNextBoundary());

    const appearanceSub = Appearance.addChangeListener(() => check());
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') check();
    });

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      appearanceSub?.remove?.();
      appStateSub?.remove?.();
    };
  }, []);

  return night;
}

/**
 * The shared map preferences, live.
 *
 * @returns {{style: string, trafficFlow: boolean, trafficIncidents: boolean,
 *   isNight: boolean, mapScheme: string, setStyle: Function,
 *   setTrafficFlow: Function, setTrafficIncidents: Function}}
 */
export function useMapPrefs() {
  const [value, setValue] = useState(getMapPrefs);
  const isNight = useIsNight();

  useEffect(() => {
    hydrateMapPrefs();
    return subscribeMapPrefs(setValue);
  }, []);

  const setStyle = useCallback(
    (style: MapStyleName) => setMapPrefs({style}),
    [],
  );
  const setTrafficFlow = useCallback(
    (trafficFlow: boolean) => setMapPrefs({trafficFlow}),
    [],
  );
  const setTrafficIncidents = useCallback(
    (trafficIncidents: boolean) => setMapPrefs({trafficIncidents}),
    [],
  );

  return {
    ...value,
    isNight,
    mapScheme: resolveMapScheme(value.style, isNight),
    setStyle,
    setTrafficFlow,
    setTrafficIncidents,
  };
}

/**
 * Just the resolved HERE scheme name.
 *
 * @param style pass a style to pin this map to it; omit to follow the shared
 *   preference (and therefore the automatic day/night switch).
 */
export function useMapScheme(style?: MapStyleName): string {
  const prefsValue = useMapPrefs();
  return style ? resolveMapScheme(style, prefsValue.isNight) : prefsValue.mapScheme;
}
