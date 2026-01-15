import {StyleSheet, Dimensions, Platform, StatusBar} from 'react-native';
import {moderateScale, verticalScale, scale} from 'react-native-size-matters';
import {colors} from '../../theme/colors';

const {width} = Dimensions.get('window');

const CARD_WIDTH = width * 0.65;
const DOC_WIDTH = width * 0.42;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  greetingContainer: {
    marginTop: verticalScale(16),
    marginLeft: moderateScale(16),
  },
  greetingText: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#111827',
  },
  searchInput: {
    width: '90%',
    marginTop: verticalScale(10),
    borderWidth: 1,
    borderRadius: moderateScale(8),

  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: colors.primary,
  },
  logo: {
    width: width * 0.45,
    height: verticalScale(40),
    marginLeft: moderateScale(10),
    alignSelf: 'center',
    resizeMode: 'contain',
  },

  topIcons: {
    flexDirection: 'row',
  },

  iconWrapper: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(10),
  },

  /* AVAILABILITY */
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: verticalScale(14),
    marginHorizontal: moderateScale(16),
  },

  availabilityButton: {
    flex: 1,
    marginHorizontal: moderateScale(4),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(25),
    borderWidth: 1,
    borderColor: '#9CA3AF',
    backgroundColor: '#fff',
    alignItems: 'center',
  },

  availabilitySelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },

  availabilityText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: moderateScale(13),
  },

  availabilityTextSelected: {
    color: '#fff',
  },

  /* SECTION TITLE */
  sectionTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    marginLeft: moderateScale(16),
    marginVertical: verticalScale(10),
    color: '#111827',
  },
  earningTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    marginVertical: verticalScale(5),
    color: '#111827',
  },

  /* BOOKING CARD */
  bookingCard: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(18),
    width: CARD_WIDTH,
    padding: moderateScale(14),
    marginRight: moderateScale(12),
  },

  bookingId: {
    fontWeight: '700',
    fontSize: moderateScale(14),
    marginBottom: verticalScale(6),
  },

  bookingLocation: {
    fontSize: moderateScale(13),
    marginBottom: verticalScale(4),
  },

  bookingDistance: {
    fontSize: moderateScale(12),
    marginBottom: verticalScale(4),
  },

  bookingStatus: {
    fontWeight: '600',
    fontSize: moderateScale(13),
  },

  /* EARNINGS */
  earningsCard: {
    backgroundColor: colors.primary,
    marginHorizontal: moderateScale(14),
    marginTop: verticalScale(18),
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
  },

  earningsText: {
    fontSize: moderateScale(14),
    marginTop: verticalScale(4),
  },

  /* DOCUMENT CARD */
  documentCard: {
    width: DOC_WIDTH,
    height: verticalScale(100),
    borderRadius: moderateScale(14),
    marginRight: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(10),
    elevation: 3,
  },

  documentText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: moderateScale(18),
  },
  documentExpiry: {
    color: '#fff',
    fontSize: moderateScale(12),
    marginTop: verticalScale(4),
  },
  actionContainer: {
    marginTop: verticalScale(20),
    marginHorizontal: moderateScale(16),
  },
});

export default styles;
