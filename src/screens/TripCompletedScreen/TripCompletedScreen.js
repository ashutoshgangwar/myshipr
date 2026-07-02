import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';
import Svg, {Path, Circle} from 'react-native-svg';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import RoadImage from '../../assets/Image/Road_image.png';
import Load_DocIcon from '../../assets/svg_icon/Load_DocIcon.svg';
import Drop_Pin from '../../assets/svg_icon/Drop_Pin.svg';
import SuccessBurst from '../../component/SuccessBurst/SuccessBurst';
import Reciept_Icon from '../../assets/svg_icon/icons_reciept.svg';
import Info_Icon from '../../assets/svg_icon/Info_Icon.svg';
import Cross_Icon from '../../assets/svg_icon/Cross_Icon.svg';

export default function TripCompletedScreen({navigation, route}) {
  const {
    pickup = 'San Jose, CA',
    drop = 'San Jose, CA',
    loadId = 'LD123456778',
  } = route?.params || {};

  const handleClose = React.useCallback(() => {
    navigation?.reset?.({index: 0, routes: [{name: 'MainApp'}]});
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Scenic backdrop pinned to the bottom of the screen. */}
      <Image source={RoadImage} style={styles.backdrop} resizeMode="cover" />

      {/* Close button */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={handleClose}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <Cross_Icon  width={ms(30)} height={ms(30)}/>
      </TouchableOpacity>

      <View style={styles.body}>
        <SuccessBurst size={ms(72)} style={{alignSelf: 'center'}} />

        <AppText style={styles.title}>You have completed your trip</AppText>
        <AppText style={styles.subtitle}>
          Your payout for this trip will be visible in your earnings tab
        </AppText>

        {/* Pickup / Drop card */}
        <View style={styles.card}>
          <View style={styles.locRow}>
            <View style={styles.markerCol_pickup}>
              <Load_DocIcon width={ms(20)} height={ms(20)} />
            </View>
            <View style={styles.locTextCol}>
              <AppText style={styles.locLabel}>Pickup Location</AppText>
              <AppText style={styles.locValue}>{pickup}</AppText>
              <View style={styles.divider} />
            </View>
          </View>

          <View style={styles.locRow}>
            <View style={styles.markerCol_drop}>
              <Drop_Pin width={ms(20)} height={ms(20)} />
            </View>
            <View style={styles.locTextCol}>
              <AppText style={styles.locLabel}>Drop Location</AppText>
              <AppText style={styles.locValue}>{drop}</AppText>
            </View>
          </View>
        </View>

        {/* Load ID card */}
        <View style={[styles.card, styles.loadCard]}>
          <View style={styles.loadIconWrap}>
            <Reciept_Icon width={ms(20)} height={ms(20)} />
          </View>
          <View>
            <AppText style={styles.locLabel}>#Load ID</AppText>
            <AppText style={styles.loadValue}>{loadId}</AppText>
          </View>
        </View>
      </View>

      {/* Footer hint */}
      <View style={styles.footer}>
        <Info_Icon width={ms(16)} height={ms(16)} style={{marginLeft: ms(8)}} />
        <AppText style={styles.footerText}>
          You can download the receipt from Schedule Section
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.white},
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: vs(180),
  },
  closeBtn: {
    position: 'absolute',
    top: vs(35),
    right: ms(10),
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    // backgroundColor: colors.gray400,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: ms(20),
  },
  title: {
    color: colors.text_dark,
    fontSize: ms(22),
    fontWeight: '800',
    textAlign: 'center',
    marginTop: vs(18),
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: ms(13),
    lineHeight: ms(19),
    textAlign: 'center',
    marginTop: vs(8),
    paddingHorizontal: ms(24),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: colors.border_Color,
    padding: ms(16),
    marginTop: vs(20),
  },
  locRow: {flexDirection: 'row'},
  markerCol_pickup: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: '#D977061A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
  },
  markerCol_drop: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: '#16A33D1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
  },
  pickupOuter: {
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    backgroundColor: '#FCE9D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupRing: {
    width: ms(14),
    height: ms(14),
    borderRadius: ms(7),
    borderWidth: ms(4),
    borderColor: colors.button_color,
    backgroundColor: colors.white,
  },
  connector: {
    flex: 1,
    width: 1,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border_Color,
    marginVertical: vs(2),
  },
  locTextCol: {flex: 1, paddingLeft: ms(12)},
  locLabel: {
    color: colors.textMuted,
    fontSize: ms(12),
  },
  locValue: {
    color: colors.text_dark,
    fontSize: ms(16),
    fontWeight: '700',
    marginTop: vs(2),
  },
  divider: {
    height: 1,
    backgroundColor: colors.border_Color,
    marginTop: vs(12),
  },
  loadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(12),
  },
  loadIconWrap: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: '#EEEAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
  },
  loadValue: {
    color: colors.text_dark,
    fontSize: ms(16),
    fontWeight: '700',
    marginTop: vs(2),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(20),
    paddingBottom: vs(18),
  },
  footerText: {
    color: colors.text_dark,
    fontSize: ms(13),
    fontWeight: '600',
    marginLeft: ms(8),
    textAlign: 'center',
  },
});
