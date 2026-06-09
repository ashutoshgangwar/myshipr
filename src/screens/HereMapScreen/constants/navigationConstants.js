export const NAVIGATION_ZOOM = 14.0;
export const NAVIGATION_START_ZOOM = 14.5;
export const NAVIGATION_TILT = 58;
export const NAVIGATION_ANIMATE = true;
export const NAVIGATION_CAMERA_DURATION_MS = 220;
export const NAVIGATION_CAMERA_INTERVAL_MS = 33;
export const NAVIGATION_MARKER_ANIMATION_MS = 180;
export const NAVIGATION_MIN_MOVE_METERS = 1.2;
export const NAVIGATION_MIN_TURN_DEGREES = 0.3;
export const NAVIGATION_MIN_SPEED_MPS = 1.2;
export const WRONG_WAY_BEARING_THRESHOLD = 135;
export const WRONG_WAY_PROGRESS_BACKTRACK_METERS = 12;
export const WRONG_WAY_STREAK_LIMIT = 2;

export const REROUTE_INTERVAL_MS = 12000;
export const OFF_ROUTE_THRESHOLD = 55;

export const NAVIGATION_MARKER = {
  // Increased marker size for clearer navigation marker on map
  size: 250,
  iconAsset: 'truck_icon.svg',
};
export const NAVIGATION_ROUTE_WIDTH = 20;

// Default locations for map
export const ORIGIN = {lat: 50.1109, lng: 8.6821};
export const DESTINATION = {lat: 48.1374, lng: 11.5755};
