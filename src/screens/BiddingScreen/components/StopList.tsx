import React from 'react';

import LoadRoute from '../../../component/LoadRoute/LoadRoute';
import type {StyleProp, TextStyle} from 'react-native';
import type {LoadRouteStop} from '../../../component/LoadRoute/LoadRoute';

// Bidding stops carry {city, type}; LoadRoute reads the city and derives the
// "1 Pickup N Drop" summary, so the route matches Home and Earnings exactly.
export default function StopList({
  stops,
  textStyle,
  summaryStyle,
}: {
  stops?: LoadRouteStop[];
  textStyle?: StyleProp<TextStyle>;
  summaryStyle?: StyleProp<TextStyle>;
}) {
  return (
    <LoadRoute
      stops={stops}
      showSummary
      textStyle={textStyle}
      summaryStyle={summaryStyle}
    />
  );
}
