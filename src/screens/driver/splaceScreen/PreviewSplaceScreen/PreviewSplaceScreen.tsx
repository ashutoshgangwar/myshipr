import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styles from './PreviewSplaceScreen.styles';
import {colors} from '../../../../theme/colors';
import StatusBar from '../../../../component/StatusBar/StatusBar';
import AppText from '../../../../theme/AppText';
import useDeviceType from '../../../../hooks/useDeviceType';
import {hasSession, restoreSession} from '../../../../config/api';
import {
  peekInitialDeepLink,
  markInitialDeepLinkHandled,
} from '../../../../services/DeepLinkService';
import type {RootStackScreenProps} from '../../../../types/navigation';
import type {NativeScrollEvent, NativeSyntheticEvent} from 'react-native';
import type {RootStackParamList} from '../../../../types/navigation';

// How long the splash stays up no matter how fast the session check finishes.
// This is a brand hold, nothing waits on it — keep it short enough that a
// driver opening the app to take a load is not watching a carousel.
const SPLASH_MIN_MS = 1200;

// How long the session check gets before the splash stops waiting on it.
// `restoreSession()` can end up inside a token refresh, and that request
// carries the full 30s API timeout behind it — long enough to strand a cold
// start on the splash whenever the connection is poor. Running out of budget
// here is handled exactly like the offline branch inside `restoreSession`: a
// session on disk is trusted, and if it turns out to be dead the first
// authenticated call bounces the driver back to login.
const SESSION_RESTORE_MAX_MS = 5000;

const HERO_IMAGES = [
  require('../../../../assets/Image/bg_image_login.jpg'),
  require('../../../../assets/Image/truck_image.jpg'),
  require('../../../../assets/Image/bg_image_login.jpg'),
];

const BLEND_COLORS = [
  colors.overlayDarkStartTransparent,
  colors.overlayDarkMidStrong,
  colors.primary,
];
const BLEND_LOCATIONS = [0, 0.5, 1];

const PreviewSplaceScreen = ({navigation}: RootStackScreenProps<'PreviewSplashScreen'>) => {
  const {width, height} = useWindowDimensions();
  const {isTablet} = useDeviceType();
  const heroSliderRef = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  // True only when the session check outlives the splash and the user is
  // actually left waiting (e.g. a refresh call on a slow connection).
  const [restoring, setRestoring] = useState(false);

  // On tablets the hero fills more of the larger screen instead of staying a
  // fixed scaled height that leaves a big empty band below it.
  const heroHeight = isTablet ? Math.round(height * 0.82) : undefined;

  // Decide where to go while the splash is on screen: straight to the home
  // screen when a stored session is still good (refreshing it first if the
  // access token expired), otherwise on to the login flow.
  //
  // A driver who got here by tapping an invite link overrides all of that — see
  // the deep-link branch below.
  useEffect(() => {
    let cancelled = false;
    let loaderTimer: ReturnType<typeof setTimeout> | undefined;
    let budgetTimer: ReturnType<typeof setTimeout> | undefined;

    // Started here, before anything is awaited, so the hold and the session
    // check run side by side instead of end to end.
    const splashHeld = new Promise<void>(resolve =>
      setTimeout(() => resolve(), SPLASH_MIN_MS),
    );

    const clearTimers = () => {
      if (loaderTimer !== undefined) clearTimeout(loaderTimer);
      if (budgetTimer !== undefined) clearTimeout(budgetTimer);
    };

    (async () => {
      // The app was launched from an invite / reset link. That link is the
      // whole reason the driver opened the app, so it wins over the stored
      // session and skips the brand hold — nobody should watch a carousel
      // after tapping a link in their inbox.
      let launchLink = null;
      try {
        launchLink = await peekInitialDeepLink();
      } catch {
        launchLink = null;
      }

      if (launchLink) {
        // Bail out WITHOUT marking it handled: on iOS the launch URL cannot be
        // read a second time, so a link burned here would be lost for good.
        if (cancelled) return;
        markInitialDeepLinkHandled();
        clearTimers();
        navigation.replace(
          launchLink.screen as keyof RootStackParamList,
          launchLink.params as never,
        );
        return;
      }

      // The spinner is for the driver the session check actually keeps
      // waiting, so it is armed only once the hold is the thing that has
      // already finished.
      loaderTimer = setTimeout(() => {
        if (!cancelled) setRestoring(true);
      }, SPLASH_MIN_MS);

      let authenticated = false;
      try {
        const restored = await Promise.race([
          restoreSession(),
          new Promise<null>(resolve => {
            budgetTimer = setTimeout(() => resolve(null), SESSION_RESTORE_MAX_MS);
          }),
        ]);
        authenticated = restored
          ? restored.authenticated
          : // Out of budget — trust the session on disk, as the offline
            // branch inside `restoreSession()` does.
            await hasSession();
      } catch {
        // Never strand the user on the splash — fall back to the login flow.
        authenticated = false;
      }

      await splashHeld;
      if (cancelled) return;

      clearTimers();
      navigation.replace(authenticated ? 'MainApp' : 'LoginSplashScreen');
    })();

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [navigation]);

  const onHeroScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextSlide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (nextSlide !== activeSlide) {
      setActiveSlide(nextSlide);
    }
  };

  const onDotPress = (index: number) => {
    setActiveSlide(index);
    heroSliderRef.current?.scrollTo({x: index * width, animated: true});
  };

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: colors.primary}}
      contentContainerStyle={{flexGrow: 1, backgroundColor: colors.primary}}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      bounces={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
      contentInsetAdjustmentBehavior="never"
      endFillColor={colors.primary}>
      <View style={styles.screen}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent={true}
        />

        <View style={styles.container}>
          <View style={[styles.heroWrap, !!heroHeight && {height: heroHeight}]}>
            <ScrollView
              ref={heroSliderRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onHeroScrollEnd}
              style={styles.heroPager}
              decelerationRate="fast">
              {HERO_IMAGES.map((imageSource, index) => (
                <ImageBackground
                  key={index}
                  source={imageSource}
                  style={[styles.heroImage, {width}, !!heroHeight && {height: heroHeight}]}
                  imageStyle={styles.heroImageStyle}>
                  <LinearGradient
                    colors={BLEND_COLORS}
                    locations={BLEND_LOCATIONS}
                    style={styles.heroBottomFade}
                  />
                </ImageBackground>
              ))}
            </ScrollView>

            <View style={styles.dotsRow}>
              {HERO_IMAGES.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  onPress={() => onDotPress(index)}
                  style={styles.dotTapArea}>
                  <View style={[styles.dot, activeSlide === index && styles.activeDot]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {restoring && (
          <View style={restoreStyles.overlay} pointerEvents="auto">
            <ActivityIndicator size="large" color={colors.white} />
            <AppText style={restoreStyles.text}>Signing you in…</AppText>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const restoreStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blackAlpha45,
  },
  text: {
    marginTop: 12,
    color: colors.white,
    fontSize: 15,
  },
});

export default PreviewSplaceScreen;
