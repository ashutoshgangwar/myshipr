import React from 'react';
import {View} from 'react-native';

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
}) => {
  const hasStats = Array.isArray(stats) && stats.length > 0;

  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.header, hasStats && styles.headerWithStats, headerStyle]}>
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
        <View style={styles.statsRow}>
          {stats.map(stat => (
            <View
              key={stat.label}
              style={[styles.statCard, {borderLeftColor: stat.accent}]}>
              <AppText
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[styles.statLabel, stat.labelColor && {color: stat.labelColor}]}>
                {stat.label}
              </AppText>
              <AppText
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={styles.statValue}>
                {stat.value}
              </AppText>
              {stat.note ? (
                <AppText
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[styles.statNote, stat.noteColor && {color: stat.noteColor}]}>
                  {stat.up ? '↑ ' : ''}
                  {stat.note}
                </AppText>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default DashboardHeader;
