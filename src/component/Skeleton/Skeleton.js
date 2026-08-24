/**
 * App-themed wrapper around `react-native-reanimated-skeleton`.
 *
 * Every placeholder in the app goes through this so the bones share one
 * colour, one shimmer speed and one corner radius — a card that shimmered at
 * its own rate would read as a second thing happening on the screen.
 *
 * Two ways to use it:
 *
 *   // 1. Wrap the real content: bones while the call is in flight, the
 *   //    content itself once it answers.
 *   <Skeleton isLoading={loading} layout={TRIP_CARD_BONES}>…</Skeleton>
 *
 *   // 2. Stand in for it: rows a list has not got yet, with no children.
 *   <Skeleton isLoading layout={upcomingLoadBones(4)} />
 *
 * `containerStyle` is always passed down, defaulted here: the library's own
 * default is `flex: 1` + centred, which would take over whatever card it was
 * dropped into.
 */

import React from 'react';
import RNSkeleton from 'react-native-reanimated-skeleton';

import styles from './Skeleton.styles';

// On a white card. Grey enough to read as "not content yet" against
// colors.white, light enough not to read as a filled row.
const LIGHT = {bone: '#E4E9F0', highlight: '#F5F8FC'};

// On the navy gradient cards, where a grey bone reads as a hole punched in
// the card. Translucent white keeps the gradient showing through instead.
const DARK = {
  bone: 'rgba(255,255,255,0.16)',
  highlight: 'rgba(255,255,255,0.34)',
};

const Skeleton = ({
  isLoading,
  layout,
  containerStyle,
  onDark = false,
  children,
  ...rest
}) => {
  const palette = onDark ? DARK : LIGHT;

  return (
    <RNSkeleton
      isLoading={Boolean(isLoading)}
      layout={layout}
      containerStyle={containerStyle || styles.container}
      boneColor={palette.bone}
      highlightColor={palette.highlight}
      animationType="shiver"
      animationDirection="horizontalLeft"
      duration={1100}
      {...rest}>
      {children}
    </RNSkeleton>
  );
};

export default Skeleton;
