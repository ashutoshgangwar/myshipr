import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  // Deliberately not `flex: 1`: a skeleton sits inside a card that has already
  // decided its own height, and stretching would fight it. `stretch` is what
  // keeps a bone the full width of its column.
  container: {
    alignSelf: 'stretch',
  },
});
