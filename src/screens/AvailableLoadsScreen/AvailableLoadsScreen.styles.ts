import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import {colors} from '../../theme/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  /* FILTER BAR */
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: verticalScale(12),
    backgroundColor: colors.white,
    elevation: 3,
  },

  filterButton: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(20),
    backgroundColor: colors.border_Color,
  },

  filterActive: {
    backgroundColor: colors.accentBlue,
  },

  filterText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: colors.textStrong,
  },

  filterTextActive: {
    color: colors.white,
  },

  /* LOAD CARD */
  loadCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(16),
    marginBottom: verticalScale(14),
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    elevation: 4,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(6),
  },

  loadId: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: colors.textStrong,
  },

  rate: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: colors.success,
  },

  detailText: {
    fontSize: moderateScale(13),
    marginBottom: verticalScale(6),
    color: colors.textMuted,
  },

  locationText: {
    fontSize: moderateScale(13),
    marginBottom: verticalScale(4),
    color: colors.textStrong,
  },

  notes: {
    fontSize: moderateScale(12),
    color: colors.textMuted,
    marginVertical: verticalScale(6),
  },

  bidButton: {
    marginTop: verticalScale(10),
    backgroundColor: colors.accentBlue,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },

  bidText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: moderateScale(14),
  },

  /* MAP BUTTON */
  mapButton: {
    margin: moderateScale(16),
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(14),
    backgroundColor: colors.textStrong,
    alignItems: 'center',
  },

  mapButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: moderateScale(14),
  },

  listPadding: {
    paddingVertical: verticalScale(10),
  },
});

export default styles;
