import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import styles, {BADGE_SIZE} from './FuelPriceSuccessModal.styles';
import ConfettiPoppers from '../ConfettiPoppers/ConfettiPoppers';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {ms, vs} from '../../theme/scale';
import CrossIcon from '../../assets/svg_icon/Cross_Icon.svg';
import CoinIcon from '../../assets/svg_icon/coin.svg';
import SuccessTick from '../../assets/svg_icon/tick_success.svg';

const CLOSE_ICON = ms(24);
const COIN_ICON = ms(20);
const TICK_ICON = BADGE_SIZE;

const DEFAULT_MESSAGE = 'Fuel price submitted successfully.';

/** How long the reward points spend counting up from zero. */
const COUNT_MS = 900;

/** Breathing room kept between the card and the edge of the safe area. */
const EDGE_GAP = vs(24);

const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`;

export interface FuelPriceSuccessModalProps {
  visible?: boolean;
  /** Points this report earned; 0 or null hides the reward pill. */
  points?: number | null;
  /** The server's own words for what happened. */
  message?: string;
  /** The price as it was reported, in dollars per gallon. */
  pricePerGallon?: number | null;
  /** The station it was filed against; '' when the driver named none. */
  stationName?: string;
  /** Where it was filed, e.g. "Rock Springs, WY". */
  locationLabel?: string;
  onClose?: () => void;
}

/**
 * The thank-you sheet for a reported diesel price: two party poppers throw
 * streamers over the screen while the tick lands, the points earned count up,
 * and the report is read back so the driver can see it went in as typed.
 */
const FuelPriceSuccessModal = ({
  visible,
  points,
  message,
  pricePerGallon,
  stationName,
  locationLabel,
  onClose,
}: FuelPriceSuccessModalProps) => {
  const earned = Number(points);
  const hasPoints = Number.isFinite(earned) && earned > 0;

  const backdrop = useRef(new Animated.Value(0)).current;
  const card = useRef(new Animated.Value(0)).current;
  const badge = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const count = useRef(new Animated.Value(0)).current;
  const [shownPoints, setShownPoints] = useState(0);

  // The count is read back into state, so it cannot ride the native driver —
  // everything else does.
  useEffect(() => {
    const id = count.addListener(({value}) =>
      setShownPoints(Math.round(value)),
    );
    return () => count.removeListener(id);
  }, [count]);

  useEffect(() => {
    if (!visible) {
      backdrop.setValue(0);
      card.setValue(0);
      badge.setValue(0);
      halo.setValue(0);
      count.setValue(0);
      setShownPoints(0);
      return;
    }

    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // A short overshoot, so the card arrives rather than just appearing.
      Animated.spring(card, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(130),
        Animated.spring(badge, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(180),
        Animated.timing(halo, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(count, {
          toValue: hasPoints ? earned : 0,
          duration: COUNT_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    return () => {
      backdrop.stopAnimation();
      card.stopAnimation();
      badge.stopAnimation();
      halo.stopAnimation();
      count.stopAnimation();
    };
  }, [visible, earned, hasPoints, backdrop, card, badge, halo, count]);

  // The card is bounded by what is actually on screen rather than left to
  // grow with its content: the message, station and location all come from the
  // server, and a long enough set of them used to push the card past the
  // bottom of a centred, unclipped parent — taking the CTA off-screen with no
  // way to scroll to it.
  const {height: windowHeight} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const maxCardHeight = Math.min(
    windowHeight,
    Math.max(
      windowHeight - insets.top - insets.bottom - EDGE_GAP * 2,
      // A floor, so a bad inset reading cannot collapse the card to nothing —
      // capped by the window above, so the floor itself cannot overflow.
      vs(320),
    ),
  );

  const price =
    typeof pricePerGallon === 'number' && Number.isFinite(pricePerGallon)
      ? `$${pricePerGallon.toFixed(2)} /gal`
      : null;
  const station = stationName?.trim();

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, {opacity: backdrop}]} />
        <Pressable
          style={styles.backdropTouch}
          accessibilityLabel="Close"
          onPress={onClose}
        />

        <View style={styles.cardWrap} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.card,
              {
                maxHeight: maxCardHeight,
                opacity: card,
                transform: [
                  {
                    scale: card.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.86, 1],
                    }),
                  },
                  {
                    translateY: card.interpolate({
                      inputRange: [0, 1],
                      outputRange: [ms(28), 0],
                    }),
                  },
                ],
              },
            ]}>
            <View style={styles.header}>
              <LinearGradient
                colors={[colors.primary, colors.primaryGradientEnd]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.bubble, styles.bubbleLeft]} />
              <View style={[styles.bubble, styles.bubbleRight]} />
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.8}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              onPress={onClose}>
              <CrossIcon width={CLOSE_ICON} height={CLOSE_ICON} />
            </TouchableOpacity>

            <View style={styles.badgeWrap} pointerEvents="none">
              <Animated.View
                style={[
                  styles.halo,
                  {
                    opacity: halo.interpolate({
                      inputRange: [0, 0.4, 1],
                      outputRange: [0, 0.9, 0],
                    }),
                    transform: [
                      {
                        scale: halo.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 1.9],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={{
                  opacity: badge,
                  transform: [
                    {scale: badge},
                    {
                      rotate: badge.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-90deg', '0deg'],
                      }),
                    },
                  ],
                }}>
                <SuccessTick width={TICK_ICON} height={TICK_ICON} />
              </Animated.View>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.body}
              bounces={false}
              showsVerticalScrollIndicator={false}>
              <AppText style={styles.title}>Thank You!</AppText>
              <AppText style={styles.message}>
                {message || DEFAULT_MESSAGE}
              </AppText>

              {hasPoints ? (
                <Animated.View
                  style={[
                    styles.pointsPill,
                    {
                      opacity: badge,
                      transform: [
                        {
                          scale: badge.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                    },
                  ]}>
                  <CoinIcon width={COIN_ICON} height={COIN_ICON} />
                  <AppText style={styles.pointsValue}>+{shownPoints}</AppText>
                  <AppText style={styles.pointsLabel}>
                    reward {plural(earned, 'point')} earned
                  </AppText>
                </Animated.View>
              ) : null}

              {price || station || locationLabel ? (
                <View style={styles.summary}>
                  {price ? (
                    <View style={styles.summaryRow}>
                      <AppText style={styles.summaryLabel}>
                        Diesel price
                      </AppText>
                      <AppText style={styles.summaryValue}>{price}</AppText>
                    </View>
                  ) : null}
                  {station ? (
                    <View
                      style={[
                        styles.summaryRow,
                        !!price && styles.summaryDivider,
                      ]}>
                      <AppText style={styles.summaryLabel}>Station</AppText>
                      <AppText style={styles.summaryValue} numberOfLines={2}>
                        {station}
                      </AppText>
                    </View>
                  ) : null}
                  {locationLabel ? (
                    <View
                      style={[
                        styles.summaryRow,
                        !!(price || station) && styles.summaryDivider,
                      ]}>
                      <AppText style={styles.summaryLabel}>Location</AppText>
                      <AppText style={styles.summaryValue} numberOfLines={2}>
                        {locationLabel}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cta}
                activeOpacity={0.85}
                onPress={onClose}>
                <View style={styles.ctaFill}>
                  <AppText style={styles.ctaText}>Awesome!</AppText>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        <ConfettiPoppers active={Boolean(visible)} style={styles.confetti} />
      </View>
    </Modal>
  );
};

export default FuelPriceSuccessModal;
