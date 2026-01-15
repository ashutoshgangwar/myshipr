import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  /* FILTER BAR */
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: verticalScale(12),
    backgroundColor: '#fff',
    elevation: 3,
  },

  filterButton: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(20),
    backgroundColor: '#E5E7EB',
  },

  filterActive: {
    backgroundColor: '#2563EB',
  },

  filterText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#111827',
  },

  filterTextActive: {
    color: '#fff',
  },

  /* LOAD CARD */
  loadCard: {
    backgroundColor: '#fff',
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
    color: '#111827',
  },

  rate: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#16A34A',
  },

  detailText: {
    fontSize: moderateScale(13),
    marginBottom: verticalScale(6),
    color: '#374151',
  },

  locationText: {
    fontSize: moderateScale(13),
    marginBottom: verticalScale(4),
    color: '#1F2937',
  },

  notes: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    marginVertical: verticalScale(6),
  },

  bidButton: {
    marginTop: verticalScale(10),
    backgroundColor: '#2563EB',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },

  bidText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(14),
  },

  /* MAP BUTTON */
  mapButton: {
    margin: moderateScale(16),
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(14),
    backgroundColor: '#111827',
    alignItems: 'center',
  },

  mapButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(14),
  },

  listPadding: {
    paddingVertical: verticalScale(10),
  },
});

export default styles;
