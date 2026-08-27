import React, {useRef, useState, useMemo, useEffect} from 'react';
import {
  View,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {scale} from 'react-native-size-matters';
import makeStyles from './LoginSplaceScreen.styles';
import {colors} from '../../../theme/colors';
import Button from '../../../component/Button/Button';
import AppText from '../../../theme/AppText';
import StatusBar from '../../../component/StatusBar/StatusBar';
import useDeviceType from '../../../hooks/useDeviceType';
import BiometricLoginButton from '../../../component/BiometricLoginButton/BiometricLoginButton';
import {restoreSession} from '../../../config/api';
import type {RootStackScreenProps} from '../../../types/navigation';
import type {NativeScrollEvent, NativeSyntheticEvent} from 'react-native';
import type {ErrorLike} from '../../../types/common';

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

const LoginSplashScreen = ({navigation}: RootStackScreenProps<'LoginSplashScreen'>) => {
  const {width, height} = useWindowDimensions();
  const {isTablet} = useDeviceType();
  const styles = useMemo(() => makeStyles(isTablet), [isTablet]);
  const heroSliderRef = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [checkingSession, setCheckingSession] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const heroHeight = isTablet ? Math.round(height * 0.55) : undefined;
  const tabletContent = isTablet
    ? ({maxWidth: scale(420), width: '100%', alignSelf: 'center'} as const)
    : null;

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

  // Passing biometrics is not a login on its own — the stored session must
  // still be usable (refreshed first if the access token expired).
  const handleBiometricSuccess = async () => {
    setCheckingSession(true);
    try {
      const {authenticated, reason} = await restoreSession();
      if (!isMounted.current) return;

      if (authenticated) {
        navigation.reset({index: 0, routes: [{name: 'MainApp'}]});
        return;
      }

      if (reason === 'offline') {
        Alert.alert(
          'No Connection',
          'Could not reach the server. Check your connection and try again.',
        );
        return;
      }

      Alert.alert(
        'Login Required',
        'Your session has expired. Please log in with your username and password.',
        [{text: 'OK', onPress: () => navigation.navigate('LoginScreen')}],
      );
    } finally {
      if (isMounted.current) setCheckingSession(false);
    }
  };

  const handleBiometricError = (err?: ErrorLike | string | null) => {
    if (!err) return;
    Alert.alert(
      'Biometric Login Failed',
      (typeof err === 'string' ? err : err?.message) || 'Please try again.',
    );
  };

  const handleCredentialsPress = () => {
    // 'MainApp' is the bottom-tab navigator; its first tab is HomeTab (HomeScreen).
    // navigation.reset({index: 0, routes: [{name: 'MainApp', params: {screen: 'HomeTab'}}]});
    // navigation.navigate('HereNavigationDemo');
    navigation.navigate('LoginScreen'); 
    // navigation.navigate('FavoriteDestination');
    // navigation.navigate('HereSearchScreen');
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
        <View style={styles.buttonWraper}>
          <LinearGradient
            colors={BLEND_COLORS}
            locations={BLEND_LOCATIONS}
            style={[styles.contentWrapper, tabletContent]}>
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
            <View style={styles.contentText}>
              <AppText
                style={styles.title}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}>
                Smart Shipping Made Simple.
              </AppText>
            </View>

            <AppText style={styles.subtitle}>
             Stay updated every step of the 
            </AppText>
            <AppText style={styles.subtitle_line2}>
             way with live shipment tacking..
             
            </AppText>
            <BiometricLoginButton
              onSuccess={handleBiometricSuccess}
              onError={handleBiometricError}
              buttonStyle={[
                styles.faceIdButton,
                {backgroundColor: colors.white, marginTop: 0},
              ]}
              textStyle={[styles.faceIdButtonText, {color: colors.splashBorder}]}
              iconColor={colors.splashBorder}
              loaderColor={colors.splashBorder}
            />

            <Button
              title="Login with Username and Password"
              onPress={handleCredentialsPress}
              backgroundColor={colors.splashBackground}
              textColor={colors.white}
              borderColor={colors.white}
              style={styles.credentialsButton}
              textStyle={styles.credentialsButtonText}
            />
          </LinearGradient>
          </View>
        </View>

        {checkingSession && (
          <View style={sessionStyles.overlay}>
            <ActivityIndicator size="large" color={colors.white} />
            <AppText style={sessionStyles.text}>Signing you in…</AppText>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const sessionStyles = StyleSheet.create({
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

export default LoginSplashScreen;
