import React, {useRef, useState} from 'react';
import {
  View,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styles from './splaceScreen.styles';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import StatusBar from '../../component/StatusBar/StatusBar';

const HERO_IMAGES = [
  require('../../assets/Image/bg_image_login.jpg'),
  require('../../assets/Image/truck_image.jpg'),
  require('../../assets/Image/bg_image_login.jpg'),
];

const BLEND_COLORS = [
  colors.overlayDarkStartTransparent,
  colors.overlayDarkMidStrong,
  colors.splashBackground,
];
const BLEND_LOCATIONS = [0, 0.5, 1];

const SplashScreen = ({navigation}) => {
  const {width} = useWindowDimensions();
  const heroSliderRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

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
    <ScrollView style={{flex: 1}} nestedScrollEnabled>
      <View style={styles.screen}>
        <StatusBar
          backgroundColor={colors.splashBackground}
          barStyle="light-content"
          translucent={false}
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
                style={[styles.heroImage, {width}]}
                imageStyle={styles.heroImageStyle}>
                <LinearGradient
                  colors={BLEND_COLORS}
                  locations={BLEND_LOCATIONS}
                  style={styles.heroBottomFade}
                />
              </ImageBackground>
            ))}
          </ScrollView>

          <LinearGradient
            colors={BLEND_COLORS}
            locations={BLEND_LOCATIONS}
            style={styles.contentWrapper}>
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
              <AppText style={styles.title}>
                Smart Shipping Made Simple.
              </AppText>
            </View>

            <AppText style={styles.subtitle}>
              Stay updated every step of the way with live shipment tracking.
            </AppText>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.loginButton}
              onPress={() => navigation.navigate('LoginScreen')}>
              <AppText style={styles.loginButtonText}>Login</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.signupButton}
              onPress={() => navigation.navigate('CreateAccount')}>
              <AppText style={styles.signupButtonText}>Sign Up</AppText>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </ScrollView>
  );
};

export default SplashScreen;
