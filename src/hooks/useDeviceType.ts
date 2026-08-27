import {useMemo} from 'react';
import {useWindowDimensions} from 'react-native';
import {IS_TABLET, IS_PHONE, getDeviceType, select} from '../theme/device';

// Reactive form-factor hook. `isTablet` is stable, but exposing the live
// window dimensions lets screens also react to orientation changes on tablets.
export default function useDeviceType() {
  const {width, height} = useWindowDimensions();

  return useMemo(() => {
    const isLandscape = width > height;
    return {
      isTablet: IS_TABLET,
      isPhone: IS_PHONE,
      deviceType: getDeviceType(),
      isLandscape,
      isPortrait: !isLandscape,
      width,
      height,
      // select({phone, tablet}) scoped to this hook for convenience.
      select,
    };
  }, [width, height]);
}
