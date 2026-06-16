import React from 'react';
import {moderateScale, verticalScale, scale} from 'react-native-size-matters';
import HomeIcon from '../../../assets/svg_icon/Home.svg';
import TruckIcon from '../../../assets/svg_icon/truck_icon.svg';
import CarIcon from '../../../assets/svg_icon/car.svg';

const ASSET_ICONS = {
  home: HomeIcon,
  truck: TruckIcon,
  car: CarIcon,
};

export const MARKER_ROLE_ICON = {
  source: 'home',
  destination: 'truck',
  vehicle: 'truck',
};

/**
 * Renders a marker icon at the requested size. Used for the in-app picker
 * preview and — via `svgRef.toDataURL()` — to rasterise the marker handed to
 * the native HERE map.
 *
 * @param {{iconKey?: 'home'|'truck'|'car', width?: number, svgRef?: object}} props
 */
export default function MarkerPin({iconKey = 'truck', width = moderateScale(48), svgRef}) {
  const Icon = ASSET_ICONS[iconKey] || ASSET_ICONS.truck;
  return <Icon ref={svgRef} width={width} height={width} />;
}
