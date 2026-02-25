import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';
import AppText from '../../theme/AppText';

const COIN_COUNT = 28;
const COIN_SIZE = moderateScale(40);
const BURST_DISTANCE = moderateScale(140);

const CoinsAnimation = ({ isActive, amount = 0 }) => {
  const [coins, setCoins] = useState([]);
  const amountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) return;

    const newCoins = Array.from({ length: COIN_COUNT }, (_, index) => ({
      id: index,
      progress: new Animated.Value(0),
      rotate: new Animated.Value(0),
      delay: index * 180,
    }));

    setCoins(newCoins);

    const animations = newCoins.map((coin) =>
      Animated.sequence([
        Animated.delay(coin.delay),
        Animated.parallel([
          Animated.timing(coin.progress, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
          }),
          Animated.timing(coin.rotate, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    Animated.timing(amountAnim, {
      toValue: 2,
      duration: 5000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.parallel(animations).start(() => {
      setCoins([]);
      amountAnim.setValue(0);
    });
  }, [isActive]);

  const getCoinStyle = (coin) => {
    const angle = (coin.id * 360) / COIN_COUNT;

    const translateX = coin.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, Math.cos((angle * Math.PI) / 180) * BURST_DISTANCE],
    });

    const translateY = coin.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, Math.sin((angle * Math.PI) / 180) * BURST_DISTANCE],
    });

    const opacity = coin.progress.interpolate({
      inputRange: [0, 0.7, 1],
      outputRange: [1, 1, 0],
    });

    const scale = coin.progress.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0.4, 1.3, 0.8],
    });

    const rotate = coin.rotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '720deg'],
    });

    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { scale },
        { rotate },
      ],
    };
  };

  const amountStyle = {
    opacity: amountAnim,
    transform: [
      {
        translateY: amountAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [verticalScale(20), -verticalScale(25)],
        }),
      },
      {
        scale: amountAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1.2],
        }),
      },
    ],
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {coins.map((coin) => (
        <Animated.View
          key={coin.id}
          style={[styles.coin, getCoinStyle(coin)]}
        >
          <View style={styles.coinInner}>
            <AppText style={styles.coinText}>💰</AppText>
          </View>
        </Animated.View>
      ))}

      {amount > 0 && (
        <Animated.View style={[styles.amountText, amountStyle]}>
          <AppText style={styles.amountValue}>+${amount}</AppText>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },

  coin: {
    position: 'absolute',
    width: COIN_SIZE,
    height: COIN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  coinInner: {
    width: COIN_SIZE,
    height: COIN_SIZE,
    borderRadius: COIN_SIZE / 2,
    backgroundColor: colors.primary || '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: moderateScale(10),
  },

  coinText: {
    fontSize: moderateScale(22),
  },

  amountText: {
    position: 'absolute',
  },

  amountValue: {
    fontSize: moderateScale(34),
    fontWeight: 'bold',
    color: colors.primary || '#FFD700',
  },
});

export default CoinsAnimation;
