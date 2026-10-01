import { StyleSheet } from 'react-native';
import spacing from '../../theme/spacing';


export default StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
