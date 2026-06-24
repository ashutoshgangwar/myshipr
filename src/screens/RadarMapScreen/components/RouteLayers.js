import React from 'react';
import {ShapeSource, LineLayer, CircleLayer} from '@maplibre/maplibre-react-native';

import {colors} from '../../../theme/colors';

// Renders the route polyline (with a white casing) and the start/end markers as
// MapLibre layers. Must be rendered as a child of <MapView>.
export default function RouteLayers({coordinates}) {
  if (!coordinates?.length) return null;
  return (
    <ShapeSource
      id="routeSource"
      shape={{
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates,
            },
          },
          {
            type: 'Feature',
            properties: {marker: 'start'},
            geometry: {
              type: 'Point',
              coordinates: coordinates[0],
            },
          },
          {
            type: 'Feature',
            properties: {marker: 'end'},
            geometry: {
              type: 'Point',
              coordinates: coordinates[coordinates.length - 1],
            },
          },
        ],
      }}>
      <LineLayer
        id="routeLineCasing"
        style={{
          lineColor: '#ffffff',
          lineWidth: 8,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      <LineLayer
        id="routeLine"
        style={{
          lineColor: colors.accentBlue,
          lineWidth: 8,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      <CircleLayer
        id="routeEndpoints"
        filter={['has', 'marker']}
        style={{
          circleRadius: 7,
          circleColor: [
            'match',
            ['get', 'marker'],
            'start',
            '#2ecc71',
            'end',
            '#e74c3c',
            '#000000',
          ],
          circleStrokeColor: '#ffffff',
          circleStrokeWidth: 2,
        }}
      />
    </ShapeSource>
  );
}
