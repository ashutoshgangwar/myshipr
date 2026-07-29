import React from 'react';
import {View, TouchableOpacity} from 'react-native';

import styles from './DashboardHeader.styles';
import AppText from '../../theme/AppText';
import Sparkline from '../Sparkline/Sparkline';
import {IS_TABLET} from '../../theme/device';
import {ms} from '../../theme/scale';

// Keep the sparkline narrow enough that the value beside it never has to
// shrink — cards with different value widths must still match visually.
const SPARK_W = IS_TABLET ? ms(105) : ms(60);
const SPARK_H = IS_TABLET ? ms(30) : ms(20);

const DashboardHeader = ({
  icon,
  title,
  subtitle,
  right,
  children,
  stats,
  style,
  headerStyle,
  titleStyle,
  subtitleStyle,
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
              <AppText style={[styles.brandText, titleStyle]} numberOfLines={1}>
                {title}
              </AppText>
            </View>
            {subtitle ? (
              <AppText style={[styles.brandSub, subtitleStyle]}>{subtitle}</AppText>
            ) : null}
          </View>

          {right ? <View style={styles.headerRightSlot}>{right}</View> : null}
        </View>

        {children}
      </View>

      {hasStats && statsVariant === 'chart' && (
        <View style={[styles.statsRowChart, statsRowStyle, statsStyle]}>
          {stats.map(stat => {
            const id = stat.key ?? stat.label;

            // Icon cards use the newer layout: icon + title/subtitle, a
            // divider, then the value with its sparkline and a delta pill.
            if (stat.icon) {
              const up = stat.deltaUp;
              return (
                <View key={id} style={[styles.chartCard, styles.chartCardPlain]}>
                  <View style={styles.chartCardIconRow}>
                    <View style={styles.chartCardIcon}>{stat.icon}</View>
                    <View style={styles.chartCardHeading}>
                      <AppText
                        style={styles.chartCardTitle}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.95}>
                        {stat.label}
                      </AppText>
                      {stat.range ? (
                        <AppText style={styles.chartCardRange} numberOfLines={1}>
                          {stat.range}
                        </AppText>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.chartCardDivider} />

                  <View style={styles.chartCardBottomRow}>
                    <AppText
                      style={styles.chartCardValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.95}>
                      {stat.value}
                    </AppText>
                    <View style={styles.chartCardSpark}>
                      <Sparkline
                        data={stat.chart}
                        color={stat.chartColor ?? stat.accent}
                        width={SPARK_W}
                        height={SPARK_H}
                      />
                    </View>
                  </View>

                  {stat.delta ? (
                    <View style={styles.chartCardDeltaRow}>
                      <View
                        style={[
                          styles.chartCardDeltaPill,
                          up
                            ? styles.chartCardDeltaPillUp
                            : styles.chartCardDeltaPillDown,
                        ]}>
                        <AppText
                          numberOfLines={1}
                          style={[
                            styles.chartCardDeltaText,
                            up
                              ? styles.chartCardDeltaTextUp
                              : styles.chartCardDeltaTextDown,
                          ]}>
                          {stat.delta} {up ? '↗' : '↙'}
                        </AppText>
                      </View>
                      {stat.deltaNote ? (
                        <AppText
                          numberOfLines={1}
                          style={styles.chartCardDeltaNote}>
                          {stat.deltaNote}
                        </AppText>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            }

            return (
              <View
                key={id}
                style={[styles.chartCard, {borderLeftColor: stat.accent}]}>
                <View style={styles.chartCardTopRow}>
                  <AppText
                    style={styles.chartCardTitle}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}>
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
                      width={SPARK_W}
                      height={SPARK_H}
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
            // Two selected looks: `activeTint` is a light fill the existing dark
            // copy still reads against, `activeBg` is a saturated fill that
            // needs the text flipped to white.
            const tint = selected && stat.activeTint;
            const onDark = selected && !tint && styles.statTextActive;
            const fill = tint || stat.activeBg || stat.accent;

            return (
              <TouchableOpacity
                key={id}
                activeOpacity={onStatPress ? 0.85 : 1}
                disabled={!onStatPress}
                onPress={() => onStatPress?.(id)}
                style={[
                  styles.statCard,
                  stat.accent && [
                    styles.statCardStripe,
                    {borderLeftColor: selected ? fill : stat.accent},
                  ],
                  selected && {backgroundColor: fill},
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
