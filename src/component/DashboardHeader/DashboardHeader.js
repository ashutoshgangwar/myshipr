import React from 'react';
import {View, TouchableOpacity} from 'react-native';

import styles from './DashboardHeader.styles';
import AppText from '../../theme/AppText';
import Sparkline from '../Sparkline/Sparkline';
import {IS_TABLET} from '../../theme/device';

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
  // 'chart' renders wide cards with a title, date range, value and inline
  // sparkline (the Home dashboard). Defaults to the compact stat cards.
  statsVariant = 'default',
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

      {hasStats && statsVariant === 'chart' && (
        <View style={[styles.statsRowChart, statsRowStyle, statsStyle]}>
          {stats.map(stat => {
            const id = stat.key ?? stat.label;
            return (
              <View
                key={id}
                style={[styles.chartCard, {borderLeftColor: stat.accent}]}>
                <View style={styles.chartCardTopRow}>
                  <AppText style={styles.chartCardTitle} numberOfLines={1}>
                    {stat.label}
                  </AppText>
                  {stat.note ? (
                    <AppText
                      numberOfLines={1}
                      style={[
                        styles.chartCardNote,
                        stat.noteColor && {color: stat.noteColor},
                      ]}>
                      {stat.note}
                    </AppText>
                  ) : null}
                </View>

                {stat.range ? (
                  <AppText style={styles.chartCardRange} numberOfLines={1}>
                    {stat.range}
                  </AppText>
                ) : null}

                <View style={styles.chartCardBottomRow}>
                  <AppText
                    style={styles.chartCardValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}>
                    {stat.value}
                  </AppText>
                  <View style={styles.chartCardSpark}>
                    <Sparkline
                      data={stat.chart}
                      color={stat.chartColor ?? stat.accent}
                      width={IS_TABLET ? 120 : 78}
                      height={IS_TABLET ? 38 : 30}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {hasStats && statsVariant !== 'chart' && (
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
