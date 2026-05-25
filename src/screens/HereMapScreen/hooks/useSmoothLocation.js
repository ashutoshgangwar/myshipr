import {useRef, useCallback} from 'react';
import {isValidCoord, isUsableNavCoord} from '../utils/coordinateValidation';
import {
  computeBearing,
  haversineDistanceMeters,
  lerp,
  lerpBearing,
} from '../utils/mathUtils';

export function useSmoothLocation() {
  const smoothPos = useRef({lat: 0, lng: 0, bearing: 0, speed: 0});
  const targetPos = useRef({lat: 0, lng: 0, bearing: 0, speed: 0});
  const animStartPosRef = useRef({lat: 0, lng: 0, bearing: 0, speed: 0});
  const prevRawPos = useRef(null);
  const animFrameRef = useRef(null);
  const animStartRef = useRef(0);
  const ANIM_DURATION = 700;
  const hasFirstFix = useRef(false);
  const listenersRef = useRef([]);

  const subscribe = useCallback(cb => {
    listenersRef.current.push(cb);
    return () => {
      listenersRef.current = listenersRef.current.filter(l => l !== cb);
    };
  }, []);

  const notify = useCallback(() => {
    const pos = {...smoothPos.current};
    listenersRef.current.forEach(cb => cb(pos));
  }, []);

  const runAnimation = useCallback(() => {
    const now = Date.now();
    const elapsed = now - animStartRef.current;
    const rawT = Math.min(elapsed / ANIM_DURATION, 1);
    const t = 1 - Math.pow(1 - rawT, 3);

    smoothPos.current = {
      lat: lerp(animStartPosRef.current.lat, targetPos.current.lat, t),
      lng: lerp(animStartPosRef.current.lng, targetPos.current.lng, t),
      bearing: lerpBearing(
        animStartPosRef.current.bearing,
        targetPos.current.bearing,
        t,
      ),
      speed: lerp(animStartPosRef.current.speed, targetPos.current.speed, t),
    };
    notify();

    if (rawT < 1) {
      animFrameRef.current = requestAnimationFrame(runAnimation);
    } else {
      smoothPos.current = {
        lat: targetPos.current.lat,
        lng: targetPos.current.lng,
        bearing: targetPos.current.bearing,
        speed: targetPos.current.speed,
      };
      notify();
    }
  }, [notify]);

  const pushLocation = useCallback(
    (lat, lng, overrideBearing, overrideSpeed) => {
      if (!isValidCoord(lat, lng)) return;

      const now = Date.now();
      let bearing = overrideBearing ?? targetPos.current.bearing;
      let speed =
        typeof overrideSpeed === 'number' && isFinite(overrideSpeed) && overrideSpeed >= 0
          ? overrideSpeed
          : targetPos.current.speed;
      if (overrideBearing == null && prevRawPos.current) {
        const dist =
          Math.abs(lat - prevRawPos.current.lat) +
          Math.abs(lng - prevRawPos.current.lng);
        if (dist > 0.00003) {
          bearing = computeBearing(
            prevRawPos.current.lat,
            prevRawPos.current.lng,
            lat,
            lng,
          );
        }
      }
      if (prevRawPos.current) {
        const dtSec = Math.max(0.001, (now - prevRawPos.current.ts) / 1000);
        const distMeters = haversineDistanceMeters(
          prevRawPos.current.lat,
          prevRawPos.current.lng,
          lat,
          lng,
        );
        if (!(typeof overrideSpeed === 'number' && isFinite(overrideSpeed))) {
          speed = distMeters / dtSec;
        }
      }
      prevRawPos.current = {lat, lng, ts: now};

      if (!hasFirstFix.current) {
        hasFirstFix.current = true;
        smoothPos.current = {lat, lng, bearing, speed};
        targetPos.current = {lat, lng, bearing, speed};
        notify();
        return;
      }

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animStartPosRef.current = {
        lat: smoothPos.current.lat,
        lng: smoothPos.current.lng,
        bearing: smoothPos.current.bearing,
        speed: smoothPos.current.speed,
      };
      targetPos.current = {lat, lng, bearing, speed};
      animStartRef.current = now;
      animFrameRef.current = requestAnimationFrame(runAnimation);
    },
    [runAnimation, notify],
  );

  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    listenersRef.current = [];
  }, []);

  return {pushLocation, subscribe, smoothPos, cleanup};
}

export {isValidCoord, isUsableNavCoord};
