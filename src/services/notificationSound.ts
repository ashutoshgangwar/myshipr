import {NativeModules} from 'react-native';

interface NotificationSoundNative {
  /** Fire-and-forget: the tone plays, and nothing waits on it. */
  play(): void;
  /** Same, for one of the app's own bundled sounds. */
  playNamed(name: AppSound): void;
}

/**
 * The sounds the app ships, as both platforms name them.
 *
 * Adding one means adding the file to `android/app/src/main/res/raw/` and to
 * the iOS app target, then listing the name in both native modules — they
 * only play sounds they know, so a name alone does nothing.
 */
export type AppSound = 'celebration' | 'fuel_alert';

const native: NotificationSoundNative | undefined =
  NativeModules.NotificationSoundModule;

/**
 * Plays the app's alert tone.
 *
 * For alerts the driver is not looking at the screen for. Which sound this is
 * belongs to the native modules — the app's own bundled one where there is
 * one, the device's notification tone otherwise. Its volume and whether it
 * sounds at all are the device's own settings: silent mode stays silent.
 *
 * Never throws: an alert is worth less than whatever it interrupts, so a
 * missing module (an old build that predates it) or an unplayable tone is
 * swallowed and the caller carries on.
 */
export const playNotificationSound = (): void => {
  try {
    native?.play();
  } catch {
    // Silence is an acceptable outcome here.
  }
};

/**
 * Plays one of the app's own bundled sounds.
 *
 * For a sound that decorates something already on screen — a celebration over
 * a finished trip, say. Unlike [playNotificationSound] there is no system
 * fallback: where the sound is missing, nothing plays, because a notification
 * ding in its place would read as an alert that never happened.
 *
 * Never throws, and never blocks: a build whose native module predates this
 * (or predates the sound) is silent, and the caller carries on.
 */
export const playAppSound = (sound: AppSound): void => {
  try {
    native?.playNamed?.(sound);
  } catch {
    // Silence is an acceptable outcome here.
  }
};
