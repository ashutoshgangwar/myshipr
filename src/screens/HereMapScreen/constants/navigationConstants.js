/**
 * Navigation Constants
 */

// 2D flat navigation view settings
export const NAVIGATION_ZOOM = 14.0;
export const NAVIGATION_START_ZOOM = 13.8;
export const NAVIGATION_TILT = 56;
export const NAVIGATION_ANIMATE = false;
export const NAVIGATION_CAMERA_DURATION_MS = 300;
export const NAVIGATION_CAMERA_INTERVAL_MS = 100;
export const NAVIGATION_MARKER_ANIMATION_MS = 300;
export const NAVIGATION_MIN_MOVE_METERS = 2;
export const NAVIGATION_MIN_TURN_DEGREES = 0.5;
export const NAVIGATION_MIN_SPEED_MPS = 1.8;
export const WRONG_WAY_BEARING_THRESHOLD = 135;
export const WRONG_WAY_PROGRESS_BACKTRACK_METERS = 12;
export const WRONG_WAY_STREAK_LIMIT = 2;

export const REROUTE_INTERVAL_MS = 12000;
export const OFF_ROUTE_THRESHOLD = 55;

export const NAVIGATION_MARKER = {
  size: 140,
  iconAsset: 'truck_icon.svg',
};
export const NAVIGATION_ROUTE_WIDTH = 50;

// Default locations for map
export const ORIGIN = {lat: 50.1109, lng: 8.6821};
export const DESTINATION = {lat: 48.1374, lng: 11.5755};
