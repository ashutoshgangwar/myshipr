import React, {useState} from 'react';
import {View, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './ActiveBidding.styles';
import {AUCTION, BID_STEPS, ms} from './constants';
import BidCoin from './components/BidCoin';
import AutoBidModal from './components/AutoBidModal';
import RouteMapThumb from './components/RouteMapThumb';
import StatusBar from '../../component/StatusBar/StatusBar';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import BackArrow from '../../assets/svg_icon/Back_arrow_map.svg';
import Blue_truck_icon from '../../assets/svg_icon/Truck_Frame.svg';
import CalendarIcon from '../../assets/svg_icon/Schedule.svg';
import Time_Icon from '../../assets/svg_icon/Time_Icon.svg';
import Gray_Truck from '../../assets/svg_icon/Gray_Truck.svg';

// One responsive size for the chip icons so they scale together on phone and
// tablet instead of being hardcoded.
const CHIP_ICON = ms(15);

export default function ActiveBidding({navigation, route}) {
  // The auction is passed by the row the user tapped; fall back to the sample.
  const data = route?.params?.auction || AUCTION;
  const leading = data.rank === 1;

  const [yourBid, setYourBid] = useState(data.yourBid);
  const [autoBidVisible, setAutoBidVisible] = useState(false);
  const [toast, setToast] = useState(null);
  // Dragging the route map must pan the map, not scroll the page.
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const gap = Math.max(0, yourBid - data.lowest);

  const handleStep = value => {
    setYourBid(prev => Math.max(0, prev - value));
  };

  const handleSaveAutoBid = stopLoss => {
    setToast(
      stopLoss
        ? `Auto bid set. Stop loss $${stopLoss.toLocaleString()}.`
        : 'Auto bid set.',
    );
  };

  const goBack = () => (navigation ? navigation.goBack() : null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.8}
          onPress={goBack}>
          <BackArrow width={18} height={18} />
        </TouchableOpacity>
      </View>

      {/* TOAST */}
      {toast ? (
        <View style={styles.toast}>
          <AppText style={styles.toastText}>✓ {toast}</AppText>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}>
        {/* ROUTE HEADER */}
        <View style={styles.chipsRow}>
          <View style={styles.chipsLeft}>
            <View style={styles.modePill}>
              <Blue_truck_icon width={CHIP_ICON} height={CHIP_ICON} />
              <AppText style={styles.modePillText}>{data.mode}</AppText>
            </View>
            <View style={styles.metaChip}>
              <CalendarIcon width={CHIP_ICON} height={CHIP_ICON} />
              <AppText style={styles.metaChipText}> {data.date}</AppText>
            </View>
            <View style={styles.metaChip}>
              <Time_Icon width={CHIP_ICON} height={CHIP_ICON} />
              <AppText style={styles.metaChipText}> {data.time}</AppText>
            </View>
          </View>
          <View style={styles.timerBox}>
            <AppText style={styles.timerLabel}>Time Remaining</AppText>
            <AppText style={styles.timerValue}>{data.timeRemaining}</AppText>
          </View>
        </View>

        <AppText style={styles.routeTitle}>
          {data.origin} <AppText style={styles.routeArrow}>→</AppText>{' '}
          {data.dest}
        </AppText>
        <AppText style={styles.routeSub}>
          <AppText style={styles.routeSubLabel}>Auction </AppText>
          <AppText style={styles.routeSubValue}>{data.auctionRef}</AppText>
          {'    '}
          <AppText style={styles.routeSubLabel}>Source </AppText>
          <AppText style={styles.routeSubValue}>{data.source}</AppText>
        </AppText>
        <AppText style={styles.routeSub}>
          <AppText style={styles.routeSubLabel}>Commodity </AppText>
          <AppText style={styles.routeSubValue}>{data.commodity}</AppText>
        </AppText>

        {/* RANK BANNER */}
        <View
          style={[
            styles.rankBanner,
            leading ? styles.rankLead : styles.rankBehind,
          ]}>
          <View style={[styles.rankBadge, leading && styles.rankBadgeLead]}>
            <AppText
              style={[
                styles.rankBadgeText,
                leading && styles.rankBadgeTextLead,
              ]}>
              #{data.rank}
            </AppText>
          </View>
          <View style={styles.rankTextWrap}>
            <AppText style={styles.rankKicker}>YOUR LIVE POSITION</AppText>
            <AppText style={styles.rankTitle}>
              {leading
                ? `Rank #${data.rank} · You are leading this auction`
                : `Rank #${data.rank} · need to bid lower`}
            </AppText>
            <AppText style={styles.rankMeta}>
              Your bid: ${yourBid} · Lowest: ${data.lowest} · Gap: ${gap}
            </AppText>
          </View>
        </View>

        {/* PRICE + BIDDING CARD */}
        <View style={styles.priceCard}>
          {/* INDICATIVE PRICE */}
          <View style={styles.indicativeRow}>
            <AppText style={styles.indicativeLabel}>INDICATIVE PRICE</AppText>
            <AppText style={styles.indicativeValue}>
              ${data.indicativePrice}
            </AppText>
          </View>
          <View style={styles.noteBox}>
            <AppText style={styles.noteText}>
              *This is your cost with margin built in , bid below it and your
              profit starts to decline.
            </AppText>
          </View>

          {/* CURRENT LOWEST */}
          <AppText style={styles.sectionLabel}>CURRENT LOWEST</AppText>
          <AppText style={styles.lowestValue}>${data.currentLowest}</AppText>
          <AppText style={styles.lowestMeta}>
            <AppText style={styles.lowestMetaStrong}>{data.bidders}</AppText>{' '}
            bidders{' '}
            <AppText style={styles.lowestMetaStrong}>
              ${data.indicative}
            </AppText>{' '}
            indicative{' '}
            <AppText style={styles.lowestMetaStrong}>
              ${data.hardCeiling.toLocaleString()}
            </AppText>{' '}
            hard ceiling
          </AppText>

          {/* BIDDING AS */}
          <AppText style={styles.sectionLabel}>BIDDING AS</AppText>
          <View style={styles.biddingAsCard}>
            <View style={styles.carrierRow}>
              <View style={styles.avatar}>
                <AppText style={styles.avatarText}>
                  {data.carrier.initials}
                </AppText>
              </View>
              <View style={styles.carrierTextWrap}>
                <AppText style={styles.carrierName}>
                  {data.carrier.name}
                </AppText>
                <AppText style={styles.carrierSub}>
                  {data.carrier.company} · {data.carrier.usdot} ·{' '}
                  {data.carrier.mc}
                </AppText>
              </View>
            </View>

            {/* TRUCK */}
            <View style={styles.truckRow}>
              <Gray_Truck
                width={ms(15)}
                height={ms(15)}
                style={styles.truckIcon}
              />
              <AppText
                style={styles.truckText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}>
                Truck {data.truck.id} - {data.truck.model}
                {'   '}
                <AppText style={styles.truckSub}>{data.truck.trailer}</AppText>
              </AppText>
            </View>
          </View>
        </View>

        {/* <View style={styles.divider} /> */}
        <View style={styles.locationBlock}>
          {/* ROUTE + MAP */}
          <AppText style={styles.sectionLabel}>
            ROUTE · {data.route.summary}
          </AppText>
          <View style={styles.routeBlock}>
            <View style={styles.routeStops}>
              <View style={styles.stopRow}>
                <View style={styles.stopMarker}>
                  <View style={[styles.stopDot, styles.stopDotPickup]} />
                  <View style={styles.stopLine} />
                </View>
                <View>
                  <AppText style={styles.stopLabel}>
                    {data.route.pickup.label}
                  </AppText>
                  <AppText style={styles.stopWindow}>
                    {data.route.pickup.window}
                  </AppText>
                </View>
              </View>
              <View style={styles.stopRow}>
                <View style={styles.stopMarker}>
                  <View style={[styles.stopDot, styles.stopDotDrop]} />
                  <View style={styles.stopLine} />
                </View>
                <View>
                  <AppText style={styles.stopLabel}>
                    {data.route.drop.label}
                  </AppText>
                  <AppText style={styles.stopWindow}>
                    {data.route.drop.window}
                  </AppText>
                </View>
              </View>
            </View>
            <RouteMapThumb
              pickup={data.route.pickup}
              drop={data.route.drop}
              onInteractStart={() => setScrollEnabled(false)}
              onInteractEnd={() => setScrollEnabled(true)}
            />
          </View>
        </View>

        {/* LOAD SPECIFICATIONS */}
        <View style={styles.specHeader}>
          <AppText style={styles.specHeaderText}>Load Specifications</AppText>
      
        <View style={styles.specTable}>
          {data.specs.map((spec, i) => (
            <View
              key={spec.label}
              style={[
                styles.specCell,
                i % 4 !== 3 && styles.specCellRightBorder,
                i < 4 && styles.specCellBottomBorder,
              ]}>
              <AppText style={styles.specLabel}>{spec.label}</AppText>
              <AppText style={styles.specValue}>{spec.value}</AppText>
            </View>
          ))}
        </View>
          </View>
      </ScrollView>

      {/* FLOATING BID NOW PANEL + AUTO BID right under it */}
      <View style={styles.bidDock}>
        <View style={styles.bidPanel}>
          <AppText style={styles.bidPanelTitle}>
            Bid <AppText style={styles.bidPanelTitleStrong}>NOW</AppText>
          </AppText>
          {BID_STEPS.map(step => (
            <View key={step.id} style={styles.coinSlot}>
              <BidCoin value={step.value} onPress={handleStep} />
            </View>
          ))}
        </View>

        {/* AUTO BID — its own button, directly below the panel */}
        <TouchableOpacity
          style={styles.autoBidBtn}
          activeOpacity={0.85}
          onPress={() => setAutoBidVisible(true)}>
          <AppText
            style={styles.autoBidText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}>
            AUTO BID
          </AppText>
        </TouchableOpacity>
      </View>

      <AutoBidModal
        visible={autoBidVisible}
        min={data.stopLossMin}
        onClose={() => setAutoBidVisible(false)}
        onSave={handleSaveAutoBid}
      />
    </SafeAreaView>
  );
}
