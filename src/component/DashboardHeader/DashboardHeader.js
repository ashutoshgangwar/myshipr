import React from 'react';
import {View, TouchableOpacity} from 'react-native';

import styles from './DashboardHeader.styles';
import AppText from '../../theme/AppText';

const DashboardHeader = ({
  icon,
  title,
  subtitle,
  right,
  children,
  stats,
  style,
  headerStyle,
  height,
  width,
  padding,
  paddingHorizontal,
  paddingVertical,
  statsOffset,
  statsStyle,
  // When provided the stat cards become filter tabs: the selected one fills
  // with its own accent and flips its text to white.
  activeStat,
  onStatPress,
}) => {
  const hasStats = Array.isArray(stats) && stats.length > 0;

  const headerSizeStyle = {
    ...(height != null && {height}),
    ...(width != null && {width}),
    ...(padding != null && {padding}),
    ...(paddingHorizontal != null && {paddingHorizontal}),
    ...(paddingVertical != null && {paddingVertical}),
  };

  const statsRowStyle = statsOffset != null && {marginTop: statsOffset};

  return (
    <View style={[styles.wrap, style]}>
      <View
        style={[
          styles.header,
          hasStats && styles.headerWithStats,
          headerSizeStyle,
          headerStyle,
        ]}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            <View style={styles.brandTitleRow}>
              {icon ? <View style={styles.brandBadge}>{icon}</View> : null}
              <AppText style={styles.brandText}>{title}</AppText>
            </View>
            {subtitle ? <AppText style={styles.brandSub}>{subtitle}</AppText> : null}
          </View>

          {right ?? null}
        </View>

        {children}
      </View>

      {hasStats && (
        <View style={[styles.statsRow, statsRowStyle, statsStyle]}>
          {stats.map(stat => {
            const id = stat.key ?? stat.label;
            const selected = activeStat != null && activeStat === id;
            const onDark = selected && styles.statTextActive;

            return (
              <TouchableOpacity
                key={id}
                activeOpacity={onStatPress ? 0.85 : 1}
                disabled={!onStatPress}
                onPress={() => onStatPress?.(id)}
                style={[
                  styles.statCard,
                  {borderLeftColor: stat.accent},
                  selected && {
                    backgroundColor: stat.activeBg ?? stat.accent,
                    borderLeftColor: stat.activeBg ?? stat.accent,
                  },
                ]}>
                <AppText
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={[
                    styles.statLabel,
                    stat.labelColor && {color: stat.labelColor},
                    onDark,
                  ]}>
                  {stat.label}
                </AppText>
                <AppText
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  style={[styles.statValue, onDark]}>
                  {stat.value}
                </AppText>
                {stat.note ? (
                  <AppText
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.statNote,
                      stat.noteColor && {color: stat.noteColor},
                      onDark,
                    ]}>
                    {stat.up ? '↑ ' : ''}
                    {stat.note}
                  </AppText>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default DashboardHeader;
