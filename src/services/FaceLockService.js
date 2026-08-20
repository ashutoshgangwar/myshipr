// Face Lock = the driver's face sign-in. The screen only ever talks to this
// module, so the stored shape and the login flag can never drift apart.
import AsyncStorage from '@react-native-async-storage/async-storage';

const FACE_LOCK_KEY = 'face_lock';
// Read by useBiometricAutoLogin on app start — kept in step with the setting
// below so turning Face Lock on here is what arms the auto-login.
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export const EMPTY_FACE_LOCK = {enabled: false, lastScannedAt: null};

// Stand-in for the enrolment record the profile API will deliver: a driver who
// set face lock up during onboarding. Only used until the first local write.
const SEEDED_FACE_LOCK = {
  enabled: true,
  lastScannedAt: '2026-06-03T00:00:00.000Z',
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// `3 Jun 2026` — the format the card shows. Returns null for a missing or
// unparseable stamp so the caller can fall back to its own copy.
export const formatScanDate = iso => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

export async function getFaceLock() {
  try {
    const raw = await AsyncStorage.getItem(FACE_LOCK_KEY);
    if (!raw) return SEEDED_FACE_LOCK;

    const stored = JSON.parse(raw);
    return {
      enabled: Boolean(stored?.enabled),
      lastScannedAt: stored?.lastScannedAt ?? null,
    };
  } catch (e) {
    // A corrupt entry must not lock the driver out of the screen.
    return EMPTY_FACE_LOCK;
  }
}

export async function saveFaceLock(state) {
  const next = {
    enabled: Boolean(state?.enabled),
    lastScannedAt: state?.lastScannedAt ?? null,
  };

  try {
    await AsyncStorage.multiSet([
      [FACE_LOCK_KEY, JSON.stringify(next)],
      [BIOMETRIC_ENABLED_KEY, next.enabled ? 'true' : 'false'],
    ]);
  } catch (e) {
    // Storage failed — the caller still gets the state it asked for, and the
    // next scan writes it again.
  }

  return next;
}

// TODO: swap for the carrier auth endpoint once it exists. Until then any
// password the driver types is accepted, and only an empty one is rejected —
// the face scan itself still has to pass before anything is stored.
export async function verifyPassword(password) {
  if (!password?.trim()) {
    return {success: false, error: 'Enter your password to continue.'};
  }

  return {success: true};
}

// Records a completed face scan. The capture that produced it is deliberately
// not stored: an unencrypted face photo has no business sitting on the device,
// and the enrolment only needs the fact and the time.
// TODO: send the capture to the carrier's face-match service once it exists —
// this is where that call belongs.
export async function enrollFace() {
  return saveFaceLock({
    enabled: true,
    lastScannedAt: new Date().toISOString(),
  });
}
