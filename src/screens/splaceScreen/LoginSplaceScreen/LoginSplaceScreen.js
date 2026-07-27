import React, {useRef, useState, useMemo} from 'react';
import {
  View,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {scale} from 'react-native-size-matters';
import publicIP from 'react-native-public-ip';
import makeStyles from './LoginSplaceScreen.styles';
import {colors} from '../../../theme/colors';
import Button from '../../../component/Button/Button';
import AppText from '../../../theme/AppText';
import StatusBar from '../../../component/StatusBar/StatusBar';
import useDeviceType from '../../../hooks/useDeviceType';
import BiometricLoginButton from '../../../component/BiometricLoginButton/BiometricLoginButton';

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

const LoginSplashScreen = ({navigation}) => {
  const {width, height} = useWindowDimensions();
  const {isTablet} = useDeviceType();
  const styles = useMemo(() => makeStyles(isTablet), [isTablet]);
  const heroSliderRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const heroHeight = isTablet ? Math.round(height * 0.55) : undefined;
  const tabletContent = isTablet
    ? {maxWidth: scale(420), width: '100%', alignSelf: 'center'}
    : null;

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

  const handleBiometricSuccess = () => {
    navigation.reset({index: 0, routes: [{name: 'MainApp'}]});
  };

  const handleBiometricError = err => {
    if (err) showError(err, {title: 'Biometric Login Failed'});
  };

  const handleCredentialsPress = () => {
    // navigation.reset({index: 0, routes: [{name: 'MainApp'}]});
    // navigation.navigate('HereSearchScreen');
    navigation.navigate('FavoriteDestination');
  };
  
  // To fetch the public IP address
(async () => {
  try {
    const ip = await publicIP();
    console.log('ip:', ip);
  } catch (error) {
    console.log(error);
  }
})();

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
      </View>
    </ScrollView>
  );
};

export default LoginSplashScreen;
