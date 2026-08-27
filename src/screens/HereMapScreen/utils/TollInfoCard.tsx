import React, {useEffect, useRef, useCallback} from 'react';
import {View, Text, ScrollView, Animated, StyleSheet} from 'react-native';
/**
 * The toll shapes this card reads out of a HERE route response. Described only
 * as deeply as the parser walks them — every level is optional because a route
 * with no tolls simply omits them.
 */
interface TollFare {
  price?: {value?: number; currency?: string};
  /** Present on season/return tickets; absent on a single crossing. */
  pass?: {returnJourney?: boolean; validityPeriod?: unknown};
  [key: string]: unknown;
}

interface TollEntry {
  fares?: TollFare[];
  tollSystem?: string;
  name?: string;
  [key: string]: unknown;
}

interface TollSection {
  tolls?: TollEntry[];
  [key: string]: unknown;
}

interface TollRouteData {
  routes?: Array<{sections?: TollSection[]}>;
  [key: string]: unknown;
}

/** One toll booth, flattened out of the sections. */
interface Booth {
  system: string;
  amount: number;
  currency: string;
  paymentMethods: string[];
  [key: string]: unknown;
}

/** Booths grouped by the operator that charges them. */
interface TollGroup {
  system: string;
  booths: Booth[];
  subtotal: number;
  currency: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * For each toll booth the API returns multiple fare OPTIONS:
 *  - single trip (no pass field)
 *  - return journey  (pass.returnJourney = true)
 *  - monthly pass    (pass.validityPeriod != null)
 *
 * We pick the cheapest SINGLE one-way INR fare per booth,
 * then group booths by their state/system name.
 */

const getCurrencySymbol = (currency?: string): string => {
  switch (currency) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'INR':
      return '₹';
    default:
      return currency ?? '';
  }
};
const parseTollInfo = (routeData?: TollRouteData | null) => {
  if (!routeData?.routes?.length) {
    return {
      total: 0,
      currency: 'USD',
      symbol: '$',
      groups: [],
      hasTolls: false,
      boothCount: 0,
    };
  }

  let total = 0;
  const booths: Booth[] = [];
  let detectedCurrency = 'USD';

  routeData.routes[0].sections?.forEach((section: TollSection) => {
    section.tolls?.forEach((toll: TollEntry) => {
      const allFares = toll.fares || [];

      if (!allFares.length) {
        return;
      }

      detectedCurrency = allFares[0]?.price?.currency || detectedCurrency;

      const currencyFares = allFares.filter(
        (f: TollFare) => f?.price?.currency === detectedCurrency,
      );

      const pool = currencyFares.length > 0 ? currencyFares : allFares;

      const singleFares = pool.filter((f: TollFare) => {
        if (!f.pass) return true;
        if (f.pass.returnJourney === true) return false;
        if (f.pass.validityPeriod != null) return false;
        return true;
      });

      const best = (singleFares.length ? singleFares : pool).reduce(
        (min: TollFare, f: TollFare) =>
          (f.price?.value ?? 0) < (min.price?.value ?? 0) ? f : min,
      );

      // `best` came out of a non-empty pool, but its price fields are still
      // optional on the wire — a missing amount counts as zero, which is how
      // this already behaved (NaN would have shown as "—").
      const amount = best.price?.value ?? 0;

      booths.push({
        system: toll.tollSystem || 'Toll Booth',
        amount,
        currency: best.price?.currency ?? detectedCurrency,
        paymentMethods: (best.paymentMethods as string[]) || [],
      });

      total += amount;
    });
  });

  const groupMap: Record<string, TollGroup> = {};

  booths.forEach((b: Booth) => {
    if (!groupMap[b.system]) {
      groupMap[b.system] = {
        system: b.system,
        booths: [],
        subtotal: 0,
        currency: b.currency,
      };
    }

    groupMap[b.system].booths.push(b);
    groupMap[b.system].subtotal += b.amount;
  });

  const groups: TollGroup[] = Object.values(groupMap);

  const symbol = getCurrencySymbol(detectedCurrency);

  console.log('──────────────────────────────────────────');
  console.log('🛣️ TollInfoCard');
  console.log(`Currency : ${detectedCurrency}`);
  console.log(`Booths   : ${booths.length}`);
  console.log(`Total    : ${symbol}${total.toFixed(2)}`);

  groups.forEach(g => {
    console.log(
      `${g.system} × ${g.booths.length} = ${symbol}${g.subtotal.toFixed(2)}`,
    );
  });

  console.log('──────────────────────────────────────────');

  return {
    total,
    currency: detectedCurrency,
    symbol,
    groups,
    hasTolls: booths.length > 0,
    boothCount: booths.length,
  };
};

const paymentIcon = (method?: string): string => {
  const m = (method || '').toLowerCase();
  if (m.includes('cash')) return '💵';
  if (m.includes('credit') || m.includes('card')) return '💳';
  if (m.includes('electronic') || m.includes('etc') || m.includes('tag'))
    return '📡';
  if (m.includes('app') || m.includes('mobile')) return '📱';
  if (m.includes('pass') || m.includes('subscription')) return '🎫';
  return '🪙';
};

// "HARYANA NH TOLL" → "Haryana"
const stateName = (system?: string): string =>
  (system || '')
    .split(' ')[0]
    .replace(/^\w/, (c: string) => c.toUpperCase())
    .toLowerCase()
    .replace(/^\w/, (c: string) => c.toUpperCase());

// ─── component ───────────────────────────────────────────────────────────────

export interface TollInfoCardProps {
  /** The route payload carrying the toll breakdown. */
  routeData?: TollRouteData | null;
}

const TollInfoCard = ({routeData}: TollInfoCardProps) => {
  const slideAnim = useRef(new Animated.Value(140)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const tollInfo = parseTollInfo(routeData);

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 55,
        friction: 11,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 55,
        friction: 11,
      }),
    ]).start();
  }, [slideAnim, fadeAnim, scaleAnim]);

  useEffect(() => {
    if (!routeData) return;
    animateIn();
  }, [routeData, animateIn]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}, {scale: scaleAnim}],
        },
      ]}>
      <View style={styles.accentBar} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <Text style={styles.headerEmoji}>🛣️</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Toll Summary</Text>
            <Text style={styles.headerSub}>
              {tollInfo.hasTolls
                ? `${tollInfo.boothCount} booth${
                    tollInfo.boothCount > 1 ? 's' : ''
                  } · cheapest one-way`
                : 'No tolls on this route'}
            </Text>
          </View>
        </View>

        <View style={styles.totalPill}>
          <Text style={styles.totalCurrLabel}>{tollInfo.currency}</Text>
          <Text style={styles.totalAmount}>
            {tollInfo.symbol}
            {tollInfo.total.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── BODY ── */}
      {!tollInfo.hasTolls ? (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>Toll-free route</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {tollInfo.groups.map((group, gi) => (
            <View
              key={gi}
              style={[styles.groupBlock, gi > 0 && styles.groupBlockBorder]}>
              {/* state header row */}
              <View style={styles.stateRow}>
                <View style={styles.stateChip}>
                  <Text style={styles.stateChipText}>
                    {stateName(group.system)}
                  </Text>
                </View>
                <Text style={styles.boothCountText}>
                  {group.booths.length} booth
                  {group.booths.length > 1 ? 's' : ''}
                </Text>
                <View style={styles.flex1} />
                <Text style={styles.groupTotal}>
                  {tollInfo.symbol}
                  {group.subtotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>

              {/* per-booth rows */}
              {group.booths.map((booth, bi) => (
                <View key={bi} style={styles.boothRow}>
                  <View style={styles.boothDot} />
                  <Text style={styles.boothName} numberOfLines={1}>
                    {booth.system}
                  </Text>
                  <View style={styles.payIcons}>
                    {booth.paymentMethods.slice(0, 2).map((pm: string, pi: number) => (
                      <Text key={pi} style={styles.payIcon}>
                        {paymentIcon(pm)}
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.boothAmount}>
                    {tollInfo.symbol}
                    {booth.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── FOOTER ── */}
      {tollInfo.hasTolls && (
        <>
          <View style={styles.footerDivider} />
          <View style={styles.footerRow}>
            <Text style={styles.footerNote}>* Cheapest one-way per booth</Text>
            <Text style={styles.footerTotal}>
              {tollInfo.symbol}
              {tollInfo.total.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        </>
      )}
    </Animated.View>
  );
};

// ─── styles ──────────────────────────────────────────────────────────────────

const CARD_BG = '#151C2C';
const BORDER = '#1F2D45';
const ACCENT = '#3B7EFF';
const TEXT_PRI = '#EEF2FF';
const TEXT_SEC = '#6B82A8';
const GREEN = '#22C55E';
const YELLOW = '#FACC15';

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 96,
    left: 12,
    right: 12,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    maxHeight: 290,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 14,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: ACCENT,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },

  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 13,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  headerLeft: {flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1},
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#1A2540',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {fontSize: 17},
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRI,
    letterSpacing: 0.2,
  },
  headerSub: {fontSize: 11, color: TEXT_SEC, marginTop: 1},
  totalPill: {
    backgroundColor: '#0F1929',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ACCENT + '55',
    paddingHorizontal: 11,
    paddingVertical: 5,
    alignItems: 'center',
    minWidth: 82,
  },
  totalCurrLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: 1.3,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: YELLOW,
    letterSpacing: -0.5,
    lineHeight: 20,
  },

  divider: {height: 1, backgroundColor: BORDER, marginHorizontal: 16},

  // scroll body
  scroll: {paddingHorizontal: 14, paddingTop: 2, maxHeight: 195},

  groupBlock: {paddingBottom: 4},
  groupBlockBorder: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 4,
    paddingTop: 6,
  },

  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  stateChip: {
    backgroundColor: ACCENT + '22',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ACCENT + '44',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  stateChipText: {fontSize: 11, fontWeight: '700', color: ACCENT},
  boothCountText: {fontSize: 11, color: TEXT_SEC},
  flex1: {flex: 1},
  groupTotal: {fontSize: 13, fontWeight: '700', color: GREEN},

  boothRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingLeft: 8,
    gap: 6,
  },
  boothDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: ACCENT + '66',
  },
  boothName: {flex: 1, fontSize: 11, color: TEXT_SEC},
  payIcons: {flexDirection: 'row', gap: 2},
  payIcon: {fontSize: 11},
  boothAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_PRI,
    minWidth: 56,
    textAlign: 'right',
  },

  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  emptyIcon: {fontSize: 16},
  emptyText: {fontSize: 13, color: TEXT_SEC, fontWeight: '500'},

  footerDivider: {height: 1, backgroundColor: BORDER, marginHorizontal: 14},
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  footerNote: {fontSize: 10, color: TEXT_SEC, flex: 1},
  footerTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: YELLOW,
    letterSpacing: -0.3,
  },
});

export default TollInfoCard;
