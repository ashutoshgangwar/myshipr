import React, {useRef, useState} from 'react';
import {
  View,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import publicIP from 'react-native-public-ip';
import styles from './splaceScreen.styles';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import StatusBar from '../../component/StatusBar/StatusBar';
import Button from '../../component/Button/Button';

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

  const handleLoginPress = () => {
    navigation.navigate('LoginScreen');
  };

  const handleSignupPress = () => {
    navigation.navigate('SignupScreen');
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
        <View style={styles.buttonWraper}>
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

            <Button
              title="Login"
              onPress={handleLoginPress}
              backgroundColor={colors.splashText}
              textColor={colors.splashBorder}
              borderColor={colors.splashBorder}
              style={styles.loginButton}
              textStyle={styles.loginButtonText}
            />

            <Button
              title="Sign Up"
              onPress={handleSignupPress}
              backgroundColor="transparent"
              textColor={colors.splashText}
              borderColor={colors.splashText}
              style={styles.signupButton}
              textStyle={styles.signupButtonText}
            />
          </LinearGradient>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default SplashScreen;
