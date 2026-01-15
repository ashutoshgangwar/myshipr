import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale, scale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  // Current Load Card
  loadCard: {
    backgroundColor: '#2563EB',
    marginHorizontal: moderateScale(16),
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    marginTop: verticalScale(16),
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(12),
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    marginBottom: verticalScale(8),
    color: '#fff',
  },
  cardText: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(4),
    color: '#E0F2FE',
  },
  iconRow: {
    flexDirection: 'row',
    marginVertical: verticalScale(8),
  },
  status: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#FFF',
    marginTop: verticalScale(6),
  },

  // Map Container
  mapContainer: {
    marginTop: verticalScale(16),
    marginHorizontal: moderateScale(16),
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    height: verticalScale(380),
    backgroundColor: '#E5E7EB',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Floating Action Buttons
  floatingButtons: {
    position: 'absolute',
    bottom: verticalScale(16),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: moderateScale(16),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(6),
    shadowOffset: { width: 0, height: 3 },
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: moderateScale(12),
    marginLeft: moderateScale(6),
  },

  // Geofence Notification
  geofenceCard: {
    backgroundColor: '#FACC15',
    marginHorizontal: moderateScale(16),
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    marginTop: verticalScale(16),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(8),
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  geofenceText: {
    fontSize: moderateScale(14),
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default styles;
