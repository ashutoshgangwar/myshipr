import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import publicIP from 'react-native-public-ip';
import styles from './PreviewSplaceScreen.styles';
import {colors} from '../../../theme/colors';
import StatusBar from '../../../component/StatusBar/StatusBar';
import Button from '../../../component/Button/Button';
import AppText from '../../../theme/AppText';

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
  const {width} = useWindowDimensions();
  const heroSliderRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-navigate to the login splash screen after 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('LoginSplashScreen');
    }, 3500);

    return () => clearTimeout(timer);
  }, [navigation]);

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
          <View style={styles.heroWrap}>
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
      </View>
    </ScrollView>
  );
};

export default PreviewSplaceScreen;
