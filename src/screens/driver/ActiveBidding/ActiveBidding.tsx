import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  ActivityIndicator,
  Animated,
} from 'react-native';
import type {AxiosError} from 'axios';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './ActiveBidding.styles';
import {AUCTION, BID_STEPS, ms} from './constants';
import BidCoin from './components/BidCoin';
import AutoBidModal from './components/AutoBidModal';
import PassLoadModal from './components/PassLoadModal';
import FalconFlight from '../../../component/FalconFlight/FalconFlight';
import type {FlightOrigin} from '../../../component/FalconFlight/FalconFlight';
import StatusBar from '../../../component/StatusBar/StatusBar';
import AppText from '../../../theme/AppText';
import {colors} from '../../../theme/colors';
import BackArrow from '../../../assets/svg_icon/Back_arrow_map.svg';
import Exclimination from '../../../assets/svg_icon/exclimination.svg';
import Blue_truck_icon from '../../../assets/svg_icon/Truck_Frame.svg';
import CalendarIcon from '../../../assets/svg_icon/Schedule.svg';
import Time_Icon from '../../../assets/svg_icon/Time_Icon.svg';
import LockIcon from '../../../assets/svg_icon/lock.svg';
import ChevronDown from '../../../assets/svg_icon/Chevron_Down.svg';
import CheckIcon from '../../../assets/svg_icon/check.svg';
import type {RootStackScreenProps} from '../../../types/navigation';
import {playAppSound} from '../../../services/notificationSound';
import {placeBid} from '../../../config/driverApi';
import {CURRENT_TRIP_ID} from '../HomeScreen/currentTrip';
import type {ApiErrorBody} from '../../../types/api';
import type {ErrorLike} from '../../../types/common';
import { IS_TABLET } from '../../../theme/device';

// One responsive size for the chip icons so they scale together on phone and
// tablet instead of being hardcoded.
const CHIP_ICON = ms(15);

// How long a toast stays up before it hides itself.
const TOAST_MS = 3000;
const TOAST_ERROR_MS = 4500;

// The truck every bid is placed with. Static until the vehicle picker's trucks
// come from the API with real asset ids.
const BID_ASSET_ID = 100896;

export default function ActiveBidding({navigation, route}: RootStackScreenProps<'ActiveBidding'>) {
  // The auction is passed by the row the user tapped; fall back to the sample.
  const data = route?.params?.auction || AUCTION;
  // The bidding rows navigate with `{item}`. An auction's id is its shipment's
  // id, so a row's `shipmentId` is what the bid is placed against.
  // A row's own `id` is a list key, not a shipment — never sent.
  const row = route?.params?.item as
    | {auctionId?: string; shipmentId?: string}
    | undefined;
  const auctionId =
    route?.params?.auctionId ||
    row?.auctionId ||
    row?.shipmentId ||
    data.auctionId ||
    // Static until the bidding list comes from the API — the same shipment the
    // Home card shows.
    CURRENT_TRIP_ID;

  const [yourBid, setYourBid] = useState(0);
  // Lets a tap anywhere in the bordered box focus the field, not just the
  // narrow TextInput itself.
  const bidInputRef = useRef<TextInput>(null);
  const [vehicleIdx, setVehicleIdx] = useState(0);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [autoBidVisible, setAutoBidVisible] = useState(false);
  const [passVisible, setPassVisible] = useState(false);
  // `error` paints it red with a "!" instead of the green tick.
  const [toast, setToast] = useState<{text: string; error?: boolean} | null>(
    null,
  );
  const showToast = (text: string) => setToast({text});
  const showError = (text: string) => setToast({text, error: true});

  // Each toast clears itself; a new one restarts the clock, and errors stay a
  // little longer so the server's message can be read.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(
      () => setToast(null),
      toast.error ? TOAST_ERROR_MS : TOAST_MS,
    );
    return () => clearTimeout(timer);
  }, [toast]);
  // Status banner under the route header: beaten by another bid, or your bid
  // went through.
  const [status, setStatus] = useState<'outbid' | 'placed' | null>(
    data.outbid ? 'outbid' : null,
  );
  const [placedBid, setPlacedBid] = useState(0);
  // Starts at the auction's figure, then follows what each bid reports back.
  const [currentLowest, setCurrentLowest] = useState(data.currentLowest);
  const [placing, setPlacing] = useState(false);
  // Bumped on every coin tap so the falcon replays even on back-to-back taps,
  // alongside the centre of the coin it flies out of and the amount it carries.
  const [flight, setFlight] = useState(0);
  const [flightFrom, setFlightFrom] = useState<FlightOrigin | null>(null);
  const [flightLabel, setFlightLabel] = useState<string | null>(null);

  // The "Bid NOW" coin dock slides off to the right edge and back. `dockAnim`
  // drives the slide (0 = open, panelWidth = tucked away), and `panelWidth` is
  // measured once the panel lays out so we know how far to push it.
  const [dockOpen, setDockOpen] = useState(true);
  const [panelWidth, setPanelWidth] = useState(0);
  const dockAnim = useRef(new Animated.Value(0)).current;

  const toggleDock = () => {
    const next = !dockOpen;
    setDockOpen(next);
    Animated.timing(dockAnim, {
      toValue: next ? 0 : panelWidth,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const vehicle = data.vehicles[vehicleIdx];
  const belowLowest = yourBid < currentLowest;

  const handleStep = (value: number, origin: FlightOrigin) => {
    // Same flourish as the falcon it launches: the tap sounds as well as
    // flies. Never throws and never blocks, so a silent build still bids.
    playAppSound('celebration');
    setYourBid(prev => Math.max(0, prev - value));
    setFlightFrom(origin);
    // Reads the same as the coin face, so the number that flies off is
    // recognisably the one the user hit.
    setFlightLabel(`-${value}`);
    setFlight(n => n + 1);
  };

  const handleBidChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setYourBid(digits ? Number(digits) : 0);
  };

  const handlePlaceBid = async () => {
    if (placing) return;
    // Any amount goes — the server decides whether it leads. Only an empty
    // field is stopped, since there is nothing to send.
    if (!yourBid) {
      showError('Enter your bid amount.');
      return;
    }
    if (!auctionId) {
      console.log('[PlaceBid] not sent — no shipmentId (auctionId)', {
        params: route?.params,
      });
      showError('This auction has no shipment ID, so the bid cannot be placed.');
      return;
    }

    setPlacing(true);
    setToast(null);
    const request = {
      auctionId,
      amountCents: Math.round(yourBid * 100),
      assetId: BID_ASSET_ID,
    };
    console.log('[PlaceBid] request', JSON.stringify(request, null, 2));
    try {
      const result = await placeBid(request);
      console.log('[PlaceBid] response', JSON.stringify(result, null, 2));
      const placed = result?.yourBid ?? yourBid;
      setPlacedBid(placed);
      setYourBid(placed);
      if (Number.isFinite(result?.currentLowestBid)) {
        setCurrentLowest(result.currentLowestBid);
      }
      setStatus(result?.leading === false ? 'outbid' : 'placed');
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      console.log(
        `[PlaceBid] error (${err?.response?.status ?? 'no response'})`,
        JSON.stringify(err?.response?.data ?? err?.message, null, 2),
      );
      showError(
        err?.response?.data?.message ||
          err?.message ||
          'Could not place your bid. Please try again.',
      );
    } finally {
      setPlacing(false);
    }
  };

  const handleSaveAutoBid = (stopLoss: number | null) => {
    showToast(
      stopLoss
        ? `Auto bid set. Stop loss $${stopLoss.toLocaleString()}.`
        : 'Auto bid set.',
    );
  };

  const handlePass = () => {
    setPassVisible(false);
    setStatus(null);
    showToast('Your bids have been withdrawn. Auto bid is off.');
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
          <BackArrow width={ IS_TABLET ? 34 : 18} height={ IS_TABLET ? 34 : 18} />
        </TouchableOpacity>
      </View>

      {/* TOAST */}
      {toast ? (
        <View style={[styles.toast, toast.error && styles.toastError]}>
          <AppText
            style={[styles.toastText, toast.error && styles.toastTextError]}>
            {toast.error ? '!' : '✓'} {toast.text}
          </AppText>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* ROUTE HEADER */}
        <View style={styles.routeHeader}>
          <View style={styles.routeLeft}>
            <View style={styles.chipsLeft}>
              <View style={styles.modePill}>
                <Blue_truck_icon width={CHIP_ICON} height={CHIP_ICON} />
                <AppText style={styles.modePillText}>{data.mode}</AppText>
              </View>
              <View style={styles.metaChip}>
                <CalendarIcon width={CHIP_ICON} height={CHIP_ICON} />
                <AppText style={styles.metaChipText}> {data.date}</AppText>
                <View style={styles.metaChipDivider} />
                <Time_Icon width={CHIP_ICON} height={CHIP_ICON} />
                <AppText style={styles.metaChipText}> {data.time}</AppText>
              </View>
            </View>

            <AppText style={styles.routeTitle}>
              {data.origin} <AppText style={styles.routeArrow}>→</AppText>{' '}
              {data.dest}
            </AppText>
            <AppText style={styles.routeSub}>
              <AppText style={styles.routeSubLabel}>Auction </AppText>
              <AppText style={styles.routeSubValue}>{data.auctionRef}</AppText>
            </AppText>
            <AppText style={styles.routeSub}>
              <AppText style={styles.routeSubLabel}>Commodity </AppText>
              <AppText style={styles.routeSubValue}>{data.commodity}</AppText>
            </AppText>
          </View>
          <View style={styles.timerBox}>
            <AppText style={styles.timerLabel}>Time Remaining</AppText>
            <AppText style={styles.timerValue}>{data.timeRemaining}</AppText>
          </View>
        </View>

        {/* STATUS BANNER */}
        {status === 'outbid' ? (
          <View style={[styles.statusBanner, styles.statusOutbid]}>
            <View style={styles.outbidIcon}>
              <Exclimination width={ms(12)} height={ms(12)} />
            </View>
            <AppText style={[styles.statusText, styles.statusTextOutbid]}>
              You have been OUTBID. The lowest bid now is ${currentLowest}
            </AppText>
          </View>
        ) : null}
        {status === 'placed' ? (
          <View style={[styles.statusBanner, styles.statusPlaced]}>
            <View style={styles.placedIcon}>
              <CheckIcon width={ms(12)} height={ms(12)} />
            </View>
            <AppText style={[styles.statusText, styles.statusTextPlaced]}>
              Your Bid has been placed at ${placedBid}
            </AppText>
          </View>
        ) : null}

        {/* VEHICLE + BID CARD */}
        <View style={styles.bidCard}>
          <View style={styles.bidCardTop}>
            <View style={styles.sectionHeadRow}>
              <AppText style={styles.kicker}>ELIGIBLE VEHICLE</AppText>
              <AppText style={styles.kicker}>
                {data.vehicles.length} OF {data.vehicles.length} MATCH
              </AppText>
            </View>

            <TouchableOpacity
              style={styles.vehicleSelect}
              activeOpacity={0.85}
              onPress={() => setVehicleOpen(o => !o)}>
              <View style={styles.vehicleIconBox}>
                <Blue_truck_icon width={ms(20)} height={ms(20)} />
              </View>
              <AppText style={styles.vehicleText} numberOfLines={1}>
                Truck {vehicle.id} {vehicle.model}
              </AppText>
              <ChevronDown
                width={IS_TABLET ? ms(15) : ms(20)}
                height={ IS_TABLET ? ms(15) : ms(20)}
                color={colors.textStrong}
                style={vehicleOpen ? styles.chevronUp : undefined}
              />
            </TouchableOpacity>

            {vehicleOpen ? (
              <View style={styles.vehicleList}>
                {data.vehicles.map((v, i) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.vehicleOption,
                      i === vehicleIdx && styles.vehicleOptionActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      setVehicleIdx(i);
                      setVehicleOpen(false);
                    }}>
                    <AppText style={styles.vehicleOptionText}>
                      Truck {v.id} {v.model}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <View style={styles.lockRow}>
              <LockIcon
                width={ms(10)}
                height={ms(10)}
                color={colors.textMuted}
                style={styles.lockIcon}
              />
              <AppText style={styles.lockText}>
                First rep to lock in claims this auction. The selected truck
                and trailer are{' '}
                <AppText style={styles.lockTextStrong}>reserved on award</AppText>
                , not at bid time.
              </AppText>
            </View>
          </View>

          <View style={styles.bidCardBottom}>
            <AppText style={styles.kicker}>PLACE YOUR BID</AppText>
            <Pressable
              style={styles.bidInputBox}
              onPress={() => bidInputRef.current?.focus()}>
              <AppText style={styles.bidCurrency}>$</AppText>
              <TextInput
                ref={bidInputRef}
                style={styles.bidInput}
                value={yourBid ? String(yourBid) : ''}
                onChangeText={handleBidChange}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
              <AppText style={styles.bidHint} numberOfLines={1}>
                {yourBid && belowLowest ? 'Lower than the current bid' : ''}
              </AppText>
            </Pressable>

            <View style={styles.bidBtnRow}>
              <TouchableOpacity
                style={styles.autoBidBtn}
                activeOpacity={0.85}
                onPress={() => setAutoBidVisible(true)}>
                <AppText style={styles.autoBidText}>Auto Bid</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.placeBidBtn,
                  !yourBid && styles.placeBidBtnDisabled,
                ]}
                activeOpacity={0.85}
                disabled={placing || !yourBid}
                onPress={handlePlaceBid}>
                {placing ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <AppText style={styles.placeBidText}>Place Bid</AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* STOPS & TIMINGS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHead}>
            <AppText style={styles.sectionCardTitle}>
              Stops & Timings |{' '}
              <AppText style={styles.sectionCardSub}>
                Per-leg pickup and drop schedule
              </AppText>
            </AppText>
          </View>
          {data.stops.map((stop, i) => (
            <View
              key={`${stop.type}-${i}`}
              style={[styles.stopItem, i > 0 && styles.stopItemBorder]}>
              <View
                style={[
                  styles.stopBadge,
                  stop.type === 'D' ? styles.stopBadgeDrop : null,
                ]}>
                <AppText
                  style={[
                    styles.stopBadgeText,
                    stop.type === 'D' ? styles.stopBadgeTextDrop : null,
                  ]}>
                  {stop.type}
                </AppText>
              </View>
              <View style={styles.stopTextWrap}>
                <AppText style={styles.stopCity}>{stop.city}</AppText>
                <AppText style={styles.stopDetail}>{stop.detail}</AppText>
              </View>
              {stop.date ? (
                <View style={styles.stopWhen}>
                  <AppText style={styles.stopDate}>{stop.date}</AppText>
                  <AppText style={styles.stopWindow}>{stop.window}</AppText>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        {/* SHIPMENT DETAILS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHead}>
            <AppText style={styles.sectionCardTitle}>Shipment Details</AppText>
          </View>
          <View style={styles.detailGrid}>
            {data.details.map(item => (
              <View key={item.label} style={styles.detailCell}>
                <AppText style={styles.detailLabel}>{item.label}</AppText>
                <AppText style={styles.detailValue}>{item.value}</AppText>
              </View>
            ))}
          </View>
        </View>

        {/* WITHDRAW */}
        <TouchableOpacity
          style={styles.withdrawBtn}
          activeOpacity={0.85}
          onPress={() => setPassVisible(true)}>
          <AppText style={styles.withdrawText}>Withdraw My Bids</AppText>
        </TouchableOpacity>
      </ScrollView>

      {/* FLOATING BID NOW PANEL — slides off to the right edge and back */}

      
      <Animated.View
        style={[styles.bidDock, {transform: [{translateX: dockAnim}]}]}>
        <TouchableOpacity
          style={styles.bidDockHandle}
          activeOpacity={0.85}
          onPress={toggleDock}>
          <ChevronDown
            width={ms(16)}
            height={ms(16)}
            color={colors.white}
            style={dockOpen ? styles.dockHandleIconOpen : styles.dockHandleIconClosed}
          />
        </TouchableOpacity>
        <View
          style={styles.bidPanel}
          onLayout={e => setPanelWidth(e.nativeEvent.layout.width)}>
          <AppText style={styles.bidPanelTitle}>
            Bid <AppText style={styles.bidPanelTitleStrong}>NOW</AppText>
          </AppText>
          {BID_STEPS.map(step => (
            <View key={step.id} style={styles.coinSlot}>
              <BidCoin value={step.value} onPress={handleStep} />
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Reward flourish — bursts out of the tapped coin, swoops across and
          lands at the top of the screen. */}
      <FalconFlight
        trigger={flight}
        origin={flightFrom}
        label={flightLabel}
      />

      <AutoBidModal
        visible={autoBidVisible}
        onClose={() => setAutoBidVisible(false)}
        onSave={handleSaveAutoBid}
      />

      <PassLoadModal
        visible={passVisible}
        subtitle={`${data.auctionRef} • ${data.origin} → ${data.dest}`}
        onClose={() => setPassVisible(false)}
        onPass={handlePass}
      />
    </SafeAreaView>
  );
}
