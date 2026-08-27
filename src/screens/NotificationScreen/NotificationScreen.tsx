import React, {useMemo, useState} from 'react';
import {View, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './NotificationScreen.styles';
import {FILTERS, NOTIFICATIONS, NOTIF_TYPE, ms} from './constants';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';
import BackArrow from '../../assets/svg_icon/Back_arrow_map.svg';
import TruckIcon from '../../assets/svg_icon/Truck_Frame.svg';
import BiddingIcon from '../../assets/svg_icon/Bidding_Icon.svg';
import EarningIcon from '../../assets/svg_icon/earning_sign.svg';
import TimeIcon from '../../assets/svg_icon/Time_Icon.svg';
import InfoIcon from '../../assets/svg_icon/Info_Icon.svg';
import type {RootStackScreenProps} from '../../types/navigation';

/** One notification row. */
interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  /** The day heading this row is grouped under. */
  section: string;
}

/** Rows grouped by their day heading. */
interface NotificationSection {
  title: string;
  items: NotificationItem[];
}

const BADGE_ICON = IS_TABLET ? ms(15) : ms(17);

// Badge look per notification type: the icon and the tint behind it.
const TYPE_BADGE = {
  [NOTIF_TYPE.BID]: {
    Icon: BiddingIcon,
    tint: '#FFF1E0',
    // Bidding_Icon draws with currentColor, so it takes the accent directly.
    color: colors.button_color,
  },
  [NOTIF_TYPE.LOAD]: {Icon: TruckIcon, tint: '#E8F3FF'},
  [NOTIF_TYPE.PAYMENT]: {Icon: EarningIcon, tint: '#E4FBF3'},
  [NOTIF_TYPE.HOS]: {Icon: TimeIcon, tint: colors.gray400},
  [NOTIF_TYPE.SYSTEM]: {Icon: InfoIcon, tint: colors.gray400},
};

const FILTER_TABS = [
  {key: FILTERS.ALL, label: 'All'},
  {key: FILTERS.UNREAD, label: 'Unread'},
];

const NotificationRow = ({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress?: (id: string) => void;
}) => {
  const badge = TYPE_BADGE[item.type] ?? TYPE_BADGE[NOTIF_TYPE.SYSTEM];
  const {Icon} = badge;

  return (
    <TouchableOpacity
      style={[styles.card, item.unread && styles.cardUnread]}
      activeOpacity={0.85}
      onPress={() => onPress?.(item.id)}>
      <View style={[styles.iconBadge, {backgroundColor: badge.tint}]}>
        <Icon width={BADGE_ICON} height={BADGE_ICON} color={badge.color} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <AppText style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </AppText>
          <AppText style={styles.cardTime}>{item.time}</AppText>
        </View>
        <AppText style={styles.cardMessage}>{item.message}</AppText>
      </View>

      {item.unread ? <View style={styles.unreadDot} /> : null}
    </TouchableOpacity>
  );
};

export default function NotificationScreen({navigation}: RootStackScreenProps<'NotificationScreen'>) {
  const [items, setItems] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState(FILTERS.ALL);

  const unreadCount = items.filter(n => n.unread).length;

  // Rows stay grouped by their section label ("Today", "Earlier") so the feed
  // keeps its order after a row is read or the filter changes.
  const sections = useMemo(() => {
    const visible =
      filter === FILTERS.UNREAD ? items.filter(n => n.unread) : items;

    return visible.reduce((acc, item) => {
      const group = acc.find(g => g.title === item.section);
      if (group) {
        group.items.push(item);
      } else {
        acc.push({title: item.section, items: [item]});
      }
      return acc;
    }, [] as NotificationSection[]);
  }, [items, filter]);

  const markRead = (id: string) =>
    setItems(prev =>
      prev.map(n => (n.id === id ? {...n, unread: false} : n)),
    );

  const markAllRead = () =>
    setItems(prev => prev.map(n => ({...n, unread: false})));

  const goBack = () => (navigation ? navigation.goBack() : null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />

      <View style={styles.page}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* HEADER — the filter row rides up over its bottom edge, so the
              header scrolls with the content instead of sitting above it. */}
          <DashboardHeader
            title="NOTIFICATIONS"
            subtitle={
              unreadCount ? `${unreadCount} unread` : 'You are all caught up'
            }
            headerStyle={styles.dashboardHeader}
            titleStyle={styles.headerTitle}
            subtitleStyle={styles.headerSubtitle}
            icon={
              <TouchableOpacity
                style={styles.backBtn}
                activeOpacity={0.8}
                onPress={goBack}>
                <BackArrow
                  width={IS_TABLET ? 24 : 18}
                  height={IS_TABLET ? 24 : 18}
                />
              </TouchableOpacity>
            }
            right={
              unreadCount ? (
                <TouchableOpacity
                  style={styles.markAllBtn}
                  activeOpacity={0.85}
                  onPress={markAllRead}>
                  <AppText style={styles.markAllText}>Mark all read</AppText>
                </TouchableOpacity>
              ) : null
            }
          />

          {/* FILTERS */}
          <View style={styles.filterRow}>
            {FILTER_TABS.map(tab => {
              const active = filter === tab.key;
              const count = tab.key === FILTERS.UNREAD ? unreadCount : null;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  activeOpacity={0.85}
                  onPress={() => setFilter(tab.key)}>
                  <AppText
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}>
                    {tab.label}
                    {count ? ` (${count})` : ''}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.body}>
            {sections.length ? (
              sections.map(section => (
                <View key={section.title}>
                  <AppText style={styles.sectionLabel}>{section.title}</AppText>
                  {section.items.map(item => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      onPress={markRead}
                    />
                  ))}
                </View>
              ))
            ) : (
              <View style={styles.emptyWrap}>
                <InfoIcon
                  width={IS_TABLET ? ms(28) : ms(32)}
                  height={IS_TABLET ? ms(28) : ms(32)}
                />
                <AppText style={styles.emptyTitle}>Nothing unread</AppText>
                <AppText style={styles.emptyNote}>
                  New bids, loads and payouts will show up here.
                </AppText>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
