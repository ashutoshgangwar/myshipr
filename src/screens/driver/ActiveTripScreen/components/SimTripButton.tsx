/**
 * TEMP DEV TOOL — delete this whole file when done.
 *
 * A floating button on the Active Trip screen that drives the active route with
 * HERE's built-in LocationSimulator instead of real GPS, so guidance can be
 * exercised without actually moving. Tap it, pick a speed (Slow / Fast / Very
 * fast), and the truck starts moving along the route. Tap again to stop.
 *
 * Nothing here is wired into normal navigation; the simulator only runs on the
 * tap event. To remove the feature entirely: delete this file and the lines in
 * ActiveTripScreen.tsx marked `TEMP DEV: sim`.
 */
import React, {useState} from 'react';
import {Modal, View, TouchableOpacity, Pressable} from 'react-native';
import {moderateScale as ms, verticalScale as vs, scale as s} from 'react-native-size-matters';
import {colors} from '../../../../theme/colors';
import {fontSize} from '../../../../theme/fontSizes';
import AppText from '../../../../theme/AppText';

interface SimTripButtonProps {
  /** True while a simulated drive is running. */
  running: boolean;
  /** Button is busy (e.g. a route is still loading). */
  disabled?: boolean;
  /** Start simulating at the given speed multiplier (1 = real time). */
  onStart: (speedFactor: number) => void;
  /** Stop the running simulation. */
  onStop: () => void;
}

// Speed presets — the native LocationSimulator clamps to 0.1–20
// (HereNavigationModule.kt), so these stay inside that range.
const SPEEDS = [
  {label: 'Slow', factor: 2},
  {label: 'Fast', factor: 8},
  {label: 'Very fast', factor: 20},
];

const SimTripButton = ({running, disabled, onStart, onStop}: SimTripButtonProps) => {
  const [askOpen, setAskOpen] = useState(false);

  const handlePress = () => {
    if (running) {
      onStop();
      return;
    }
    setAskOpen(true);
  };

  const handlePick = (factor: number) => {
    onStart(factor);
    setAskOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.pill,
          running && styles.pillRunning,
          disabled && styles.pillDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.85}>
        <AppText style={styles.pillText}>
          {running ? '■ Stop sim' : '▶ Simulate'}
        </AppText>
      </TouchableOpacity>

      <Modal visible={askOpen} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setAskOpen(false)} />

        <View style={styles.card}>
          <AppText style={styles.title}>Simulate navigation</AppText>
          <AppText style={styles.note}>Pick how fast the truck drives.</AppText>

          {SPEEDS.map(speed => (
            <TouchableOpacity
              key={speed.label}
              style={styles.speedBtn}
              onPress={() => handlePick(speed.factor)}
              activeOpacity={0.85}>
              <AppText style={styles.speedText}>{speed.label}</AppText>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setAskOpen(false)}>
            <AppText style={styles.cancelText}>Cancel</AppText>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

export default SimTripButton;

/* ================= STYLES (temp) ================= */

const styles = {
  pill: {
    position: 'absolute',
    // Just above the side toolbar (which starts at top vs(200)), aligned to its
    // left edge (left s(14)).
    top: vs(155),
    left: s(14),
    paddingHorizontal: ms(12),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: colors.button_color,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 36,
    elevation: 6,
  },
  pillRunning: {backgroundColor: colors.danger},
  pillDisabled: {opacity: 0.5},
  pillText: {
    color: colors.white,
    fontSize: fontSize.caption,
    fontWeight: '700',
  },

  overlay: {flex: 1, backgroundColor: colors.blackAlpha45},
  card: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: colors.white,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    padding: ms(20),
  },
  title: {
    fontSize: fontSize.subHeading,
    fontWeight: '700',
    color: colors.textStrong,
    marginBottom: vs(6),
  },
  note: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    marginBottom: vs(14),
  },
  speedBtn: {
    paddingVertical: vs(14),
    borderRadius: ms(12),
    backgroundColor: colors.button_color,
    alignItems: 'center',
    marginBottom: vs(10),
  },
  speedText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.white,
  },
  cancelBtn: {
    paddingVertical: vs(12),
    borderRadius: ms(10),
    backgroundColor: colors.border_Color,
    alignItems: 'center',
    marginTop: vs(2),
  },
  cancelText: {fontWeight: '600', color: colors.textStrong},
} as const;
