import {select} from '../../theme/device';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';

// Same down-scale pair as the Profile screen this flow opens from, so the two
// headers and cards read at one size.
const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const VERTICAL_FACTOR = PHONE_FACTOR * select({phone: 1, tablet: 0.7});

export const ms = (n: number): number => baseMs(n) * PHONE_FACTOR;
export const vs = (n: number): number => baseVs(n) * VERTICAL_FACTOR;

export const FACE_LOCK_COPY = {
  headerTitle: 'Face Lock',
  headerSubtitle: 'Set your face ID',

  setUpTitle: 'Face lock is set up',
  notSetUpTitle: 'Face lock is not set up',

  // Shown until the first scan, and whenever the stored stamp is missing.
  notSetUpSub: 'Scan your face to sign in without typing your password.',
  scannedSub: (date: string) => `Last scanned on ${date}`,
  scannedUnknownSub: 'Your face is enrolled on this device.',

  rescanAction: 'Re- Scan My Face',
  scanAction: 'Scan My Face',

  passwordTitle: 'Enter your password',
  passwordLabel: 'Enter your Password',
  passwordPlaceholder: 'Enter your password',

  scanTitle: 'Scan Your Face',
  scanHint: 'Position your face inside the circle and hold still.',
  scanningHint: 'Scanning your face…',

  cameraDenied:
    'Camera access is needed to scan your face. Allow it and try again.',
  cameraMissing: 'This device has no camera to scan your face with.',

  successTitle: 'Face lock updated',
  successMessage: 'Your face has been scanned. You can use it to sign in.',
  failureTitle: 'Face lock not updated',
};
