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
import publicIP from 'react-native-public-ip';
import styles from './PreviewSplaceScreen.styles';
import {colors} from '../../../theme/colors';
import StatusBar from '../../../component/StatusBar/StatusBar';
import AppText from '../../../theme/AppText';
import useDeviceType from '../../../hooks/useDeviceType';
import {restoreSession} from '../../../config/api';
import {
  peekInitialDeepLink,
  markInitialDeepLinkHandled,
} from '../../../services/DeepLinkService';

// How long the splash stays up no matter how fast the session check finishes.
const SPLASH_MIN_MS = 3500;

const HERO_IMAGES = [
  require('../../../assets/Image/bg_image_login.jpg'),
  require('../../../assets/Image/truck_image.jpg'),
  require('../../../assets/Image/bg_image_login.jpg'),
];

const BLEND_COLORS = [
  colors.overlayDarkStartTransparent,
  colors.overlayDarkMidStrong,
  colors.splashBackground,
];
const BLEND_LOCATIONS = [0, 0.5, 1];

const PreviewSplaceScreen = ({navigation}) => {
  const {width, height} = useWindowDimensions();
  const {isTablet} = useDeviceType();
  const heroSliderRef = useRef(null);
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

    const splashHeld = new Promise(resolve => setTimeout(resolve, SPLASH_MIN_MS));
    const loaderTimer = setTimeout(() => {
      if (!cancelled) setRestoring(true);
    }, SPLASH_MIN_MS);

    (async () => {
      // The app was launched from an invite / reset link. That link is the
      // whole reason the driver opened the app, so it wins over the stored
      // session and skips the brand hold — nobody should watch a 3.5s carousel
      // after tapping a link in their inbox.
      let launchLink = null;
      try {
        launchLink = await peekInitialDeepLink();
      } catch (_) {
        launchLink = null;
      }

      if (launchLink) {
        // Bail out WITHOUT marking it handled: on iOS the launch URL cannot be
        // read a second time, so a link burned here would be lost for good.
        if (cancelled) return;
        markInitialDeepLinkHandled();
        clearTimeout(loaderTimer);
        navigation.replace(launchLink.screen, launchLink.params);
        return;
      }

      let authenticated = false;
      try {
        ({authenticated} = await restoreSession());
      } catch (_) {
        // Never strand the user on the splash — fall back to the login flow.
        authenticated = false;
      }

      await splashHeld;
      if (cancelled) return;

      clearTimeout(loaderTimer);
      navigation.replace(authenticated ? 'MainApp' : 'LoginSplashScreen');
    })();

    return () => {
      cancelled = true;
      clearTimeout(loaderTimer);
    };
  }, [navigation]);

  // Log the public IP once per mount (not on every render).
  useEffect(() => {
    let cancelled = false;
    publicIP()
      .then(ip => !cancelled && console.log('ip:', ip))
      .catch(error => console.log(error));
    return () => {
      cancelled = true;
    };
  }, []);

  const onHeroScrollEnd = event => {
    const nextSlide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (nextSlide !== activeSlide) {
      setActiveSlide(nextSlide);
    }
  };

  const onDotPress = index => {
    setActiveSlide(index);
    heroSliderRef.current?.scrollTo({x: index * width, animated: true});
  };

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: colors.splashBackground}}
      contentContainerStyle={{flexGrow: 1, backgroundColor: colors.splashBackground}}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      bounces={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
      contentInsetAdjustmentBehavior="never"
      endFillColor={colors.splashBackground}>
      <View style={styles.screen}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent={true}
        />

        <View style={styles.container}>
          <View style={[styles.heroWrap, heroHeight && {height: heroHeight}]}>
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
                  style={[styles.heroImage, {width}, heroHeight && {height: heroHeight}]}
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
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  text: {
    marginTop: 12,
    color: colors.white,
    fontSize: 15,
  },
});

export default PreviewSplaceScreen;
