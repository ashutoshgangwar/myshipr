import { StyleSheet, Dimensions, Platform } from 'react-native';
import { moderateScale, verticalScale, scale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const CARD_WIDTH = width * 0.65;
const DOC_WIDTH = width * 0.42;

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    height: Platform.OS === 'ios' ? verticalScale(60) : verticalScale(60),
    marginTop: Platform.OS === 'ios' ? 0 : verticalScale(1),
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: {
    width: width * 0.45,
    marginTop: Platform.OS === 'ios' ? 0 : verticalScale(1),
    height: Platform.OS === 'ios' ? verticalScale(80) : verticalScale(80),
    resizeMode: 'contain',
  },

  iconWrapper: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginTop: Platform.OS === 'ios' ? 0 : verticalScale(1),
    marginRight: moderateScale(20),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    paddingBottom: verticalScale(40),
    backgroundColor: colors.white,
    paddingHorizontal: scale(5),
  },

  availabilityContainer: {
    flexDirection: 'row',
    marginVertical: verticalScale(14),
    marginHorizontal: moderateScale(10),
  },

  availabilityButton: {
    flex: 1,
    marginHorizontal: moderateScale(4),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(25),
    borderWidth: 1,
    borderColor: '#9CA3AF',
    alignItems: 'center',
  },

  availabilitySelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  availabilityText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#111827',
  },

  availabilityTextSelected: {
    color: '#fff',
  },

  sectionTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    marginLeft: moderateScale(16),
    marginVertical: verticalScale(10),
    color: '#111827',
  },

  bookingCard: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(18),
    width: CARD_WIDTH,
    padding: moderateScale(14),
    marginRight: moderateScale(12),
  },

  bookingId: {
    fontSize: moderateScale(14),
    fontWeight: '700',
  },

  bookingRoute: {
    fontSize: moderateScale(13),
    marginVertical: 4,
  },

  bookingDistance: {
    fontSize: moderateScale(12),
  },

  bookingStatus: {
    fontWeight: '600',
    marginTop: 6,
  },

  statusPending: {
    color: '#FACC15',
  },

  statusPaid: {
    color: '#22C55E',
  },

  earningsCard: {
    backgroundColor: colors.primary,
    margin: moderateScale(16),
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
  },

  earningTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
  },

  earningsText: {
    fontSize: moderateScale(14),
    marginTop: 4,
  },

  documentCard: {
    width: DOC_WIDTH,
    height: verticalScale(100),
    borderRadius: moderateScale(14),
    marginRight: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },

  documentText: {
    color: '#fff',
    fontSize: moderateScale(18),
    fontWeight: '700',
  },

  documentExpiry: {
    color: '#fff',
    fontSize: moderateScale(12),
    marginTop: 4,
  },

  actionContainer: {
    margin: moderateScale(16),
  },
});
