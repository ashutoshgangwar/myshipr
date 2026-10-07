import React, {useState, useRef, useEffect, useMemo} from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AppText from '../../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import {colors} from '../../../../theme/colors';
import {ms} from '../../../../theme/scale';
import ChevronDown from '../../../../assets/svg_icon/Chevron_Down.svg';
import CrossIcon from '../../../../assets/svg_icon/Cross_Icon.svg';
import type {LayoutChangeEvent} from 'react-native';

const CHEVRON_SIZE = ms(18);
const CLOSE_SIZE = ms(18);
const CHEVRON_HIT_SLOP = {top: 10, bottom: 10, left: 10, right: 10};
// Finger travel before we take over the touch, so taps on the buttons still work.
const DRAG_SLOP = 6;
const EDGE_PADDING = ms(8);

const clamp = (v: number, min: number, max: number): number =>
  min > max ? min : Math.min(Math.max(v, min), max);

export interface StepConfirmCardProps {
  visible?: boolean;
  /** Both numbers together caption the card "Step 2 of 5"; omit to show none. */
  step?: number;
  totalSteps?: number;
  title?: string;
  onConfirm?: () => void;
  /** The confirm call is in flight: the button spins and stops taking taps. */
  confirming?: boolean;
  /** Why the last confirm was turned down, shown under the button. */
  error?: string | null;
  /** Omit to hide the close (×) button — the card then only collapses. */
  onClose?: () => void;
}

export default function StepConfirmCard({
  visible = false,
  step,
  totalSteps,
  title = 'Pre Trip Inspection',
  onConfirm,
  confirming = false,
  error = null,
  onClose,
}: StepConfirmCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const insets = useSafeAreaInsets();
  const {width: winW, height: winH} = useWindowDimensions();

  const pan = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const panValue = useRef({x: 0, y: 0});
  // Resting frame of the card on screen, filled in by onLayout.
  // `wrapX`/`wrapW` are filled in by onWrapLayout; the card is right-aligned
  // inside the full-width wrap, so both layouts are needed to place it.
  const frame = useRef({x: 0, y: 0, w: 0, h: 0, wrapX: 0, wrapW: 0});

  useEffect(() => {
    const id = pan.addListener(v => {
      panValue.current = v;
    });
    return () => pan.removeListener(id);
  }, [pan]);

  const limits = () => {
    const {x, y, w, h} = frame.current;
    return {
      minX: -x + EDGE_PADDING,
      maxX: winW - (x + w) - EDGE_PADDING,
      minY: -y + insets.top + EDGE_PADDING,
      maxY: winH - (y + h) - insets.bottom - EDGE_PADDING,
    };
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > DRAG_SLOP || Math.abs(g.dy) > DRAG_SLOP,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          pan.setOffset({x: panValue.current.x, y: panValue.current.y});
          pan.setValue({x: 0, y: 0});
        },
        onPanResponderMove: Animated.event(
          [null, {dx: pan.x, dy: pan.y}],
          {useNativeDriver: false},
        ),
        onPanResponderRelease: () => {
          pan.flattenOffset();
          const {minX, maxX, minY, maxY} = limits();
          const x = clamp(panValue.current.x, minX, maxX);
          const y = clamp(panValue.current.y, minY, maxY);
          if (x !== panValue.current.x || y !== panValue.current.y) {
            Animated.spring(pan, {
              toValue: {x, y},
              useNativeDriver: false,
              friction: 7,
            }).start();
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pan, winW, winH, insets.top, insets.bottom],
  );

  if (!visible) {
    return null;
  }

  const wrapStyle = [
    styles.stepCardWrap,
    {bottom: styles.stepCardWrap.bottom + insets.bottom},
    {transform: pan.getTranslateTransform()},
  ];

  // The card sits right-aligned inside the full-width wrap; combine both layouts
  // to know where it actually is on screen.
  const onWrapLayout = ({nativeEvent: {layout}}: LayoutChangeEvent) => {
    frame.current.y = layout.y;
    frame.current.wrapX = layout.x;
    frame.current.wrapW = layout.width;
    frame.current.x = layout.x + layout.width - frame.current.w;
  };
  const onCardLayout = ({nativeEvent: {layout}}: LayoutChangeEvent) => {
    frame.current.w = layout.width;
    frame.current.h = layout.height;
    frame.current.x =
      (frame.current.wrapX || 0) + (frame.current.wrapW || 0) - layout.width;
  };

  // Only captioned when the caller says where in the run this step sits; the
  // pre-trip card is a single step and shows nothing.
  const stepLabel =
    Number.isFinite(step) && Number.isFinite(totalSteps)
      ? `Step ${step} of ${totalSteps}`
      : null;
  const toggle = () => setCollapsed(c => !c);

  const chevron = (
    <ChevronDown
      width={CHEVRON_SIZE}
      height={CHEVRON_SIZE}
      color={colors.textMuted}
      style={collapsed ? styles.stepChevronUp : null}
    />
  );

  // Collapsed: a pill that hugs its own text, keeping the card's right edge.
  if (collapsed) {
    return (
      <Animated.View
        style={wrapStyle}
        pointerEvents="box-none"
        onLayout={onWrapLayout}>
        <View onLayout={onCardLayout} {...panResponder.panHandlers}>
          <TouchableOpacity
            style={styles.stepPill}
            onPress={toggle}
            activeOpacity={0.85}>
            <View style={styles.stepPillTexts}>
              <AppText style={styles.stepPillTitle} numberOfLines={1}>
                {title}
              </AppText>
              {stepLabel ? (
                <AppText style={styles.stepLabel}>{stepLabel}</AppText>
              ) : null}
            </View>
            {chevron}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={wrapStyle}
      pointerEvents="box-none"
      onLayout={onWrapLayout}>
      <View
        style={styles.stepCard}
        onLayout={onCardLayout}
        {...panResponder.panHandlers}>
        <View style={styles.stepCardHeader}>
          {stepLabel ? (
            <AppText style={styles.stepLabel}>{stepLabel}</AppText>
          ) : (
            <AppText
              style={[styles.stepTitle, styles.stepHeaderTitle]}
              numberOfLines={2}>
              {title}
            </AppText>
          )}
          <View style={styles.stepHeaderIcons}>
            <TouchableOpacity
              onPress={toggle}
              hitSlop={CHEVRON_HIT_SLOP}
              activeOpacity={0.7}>
              {chevron}
            </TouchableOpacity>
            {!!onClose && (
              <TouchableOpacity
                onPress={onClose}
                hitSlop={CHEVRON_HIT_SLOP}
                activeOpacity={0.7}>
                <CrossIcon width={CLOSE_SIZE} height={CLOSE_SIZE} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {stepLabel ? <AppText style={styles.stepTitle}>{title}</AppText> : null}

        <TouchableOpacity
          style={styles.stepConfirmBtn}
          onPress={onConfirm}
          activeOpacity={0.85}
          disabled={confirming}>
          {confirming ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <AppText style={styles.stepConfirmText}>Confirm Done</AppText>
          )}
        </TouchableOpacity>

        {error ? <AppText style={styles.stepError}>{error}</AppText> : null}
      </View>
    </Animated.View>
  );
}
