import React, {useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';

import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {MAP_STYLE, MAP_STYLE_OPTIONS, useMapPrefs} from '../../here';
import styles from './MapStyleControl.styles';

/**
 * The map-look control: a floating layers button that opens the day / night /
 * satellite choice and the traffic toggles.
 *
 * The choice is not this component's state — it lives in the shared map
 * preference (`src/here/mapStyle.js`), so picking satellite here also changes
 * the trip map, the map picker and every other HERE map in the app, and it
 * survives a restart. `Auto` hands the decision back to the clock: light by
 * day, dark once the sun is down or the phone is in dark mode.
 *
 * Positioning is the screen's job — pass `style` with the edge offsets, the way
 * the GPS button is placed:
 *
 *     <MapStyleControl style={[styles.mapStyleBtn, {bottom: base + insets.bottom}]} />
 *
 * @param {Object} [style] absolute-position style for the whole control
 * @param {boolean} [showTraffic=true] include the traffic rows in the menu
 * @param {'left'|'right'} [align='right'] which edge the menu lines up with
 */
export default function MapStyleControl({
  style,
  showTraffic = true,
  align = 'right',
}) {
  const [open, setOpen] = useState(false);
  const {
    style: mapStyle,
    trafficFlow,
    trafficIncidents,
    isNight,
    setStyle,
    setTrafficFlow,
    setTrafficIncidents,
  } = useMapPrefs();

  // Auto shows what it currently resolves to, so the driver can tell why the
  // map went dark without having to open anything.
  const activeLabel =
    mapStyle === MAP_STYLE.AUTO
      ? `Auto · ${isNight ? 'Night' : 'Day'}`
      : MAP_STYLE_OPTIONS.find(o => o.value === mapStyle)?.label ?? 'Auto';

  return (
    <View
      style={[
        styles.wrap,
        align === 'left' ? styles.wrapLeft : styles.wrapRight,
        style,
      ]}>
      {open && (
        <View style={styles.menu}>
          <AppText style={styles.menuTitle}>Map view</AppText>

          {MAP_STYLE_OPTIONS.map(option => {
            const selected = option.value === mapStyle;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.row, selected && styles.rowSelected]}
                activeOpacity={0.7}
                onPress={() => {
                  setStyle(option.value);
                  setOpen(false);
                }}>
                <AppText
                  style={[styles.rowLabel, selected && styles.rowLabelSelected]}>
                  {option.value === MAP_STYLE.AUTO ? activeLabel : option.label}
                </AppText>
                {selected ? <View style={styles.selectedDot} /> : null}
              </TouchableOpacity>
            );
          })}

          {showTraffic && (
            <>
              <View style={styles.divider} />
              <ToggleRow
                label="Traffic"
                value={trafficFlow}
                onPress={() => setTrafficFlow(!trafficFlow)}
              />
              <ToggleRow
                label="Incidents"
                value={trafficIncidents}
                onPress={() => setTrafficIncidents(!trafficIncidents)}
              />
            </>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, open && styles.buttonOpen]}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Map view: ${activeLabel}`}
        onPress={() => setOpen(prev => !prev)}>
        <LayersIcon color={open ? colors.white : colors.navy} />
      </TouchableOpacity>
    </View>
  );
}

/** A menu row that reads as on/off — used for the two traffic layers. */
function ToggleRow({label, value, onPress}) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <AppText style={[styles.rowLabel, value && styles.rowLabelSelected]}>
        {label}
      </AppText>
      <View style={[styles.switch, value && styles.switchOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </TouchableOpacity>
  );
}

/** Stacked-sheets glyph — the usual "map layers" mark. */
function LayersIcon({color = colors.navy, size = 22}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3 2.5 8 12 13l9.5-5L12 3Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M3.5 12.5 12 17l8.5-4.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.5 16.5 12 21l8.5-4.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
