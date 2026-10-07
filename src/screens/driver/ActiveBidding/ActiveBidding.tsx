import React, {useEffect, useMemo, useRef, useState} from 'react';
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
import {BID_STEPS, ELIGIBLE_VEHICLES, ms} from './constants';
import {
  NOT_IN_API,
  toActiveBidding,
  useBidDetail,
  useCountdown,
} from './bidDetail';
import BidCoin from './components/BidCoin';
import AutoBidModal from './components/AutoBidModal';
import PassLoadModal from './components/PassLoadModal';
import ErrorModal from '../../../component/ErrorModal/ErrorModal';
import useErrorModal from '../../../hooks/useErrorModal';
import Skeleton from '../../../component/Skeleton/Skeleton';
import {
  activeBidDetailBones,
  activeBidStopBones,
} from '../../../component/Skeleton/Skeleton.layouts';
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
import {placeBid, setAutoBid} from '../../../config/driverApi';
import type {AutoBidMode} from '../../../types/bidding';
import type {ApiErrorBody} from '../../../types/api';
import type {ErrorLike} from '../../../types/common';
import { IS_TABLET } from '../../../theme/device';

// One responsive size for the chip icons so they scale together on phone and
// tablet instead of being hardcoded.
const CHIP_ICON = ms(15);

// How long a toast stays up before it hides itself.
const TOAST_MS = 3000;
const TOAST_ERROR_MS = 4500;

export default function ActiveBidding({navigation, route}: RootStackScreenProps<'ActiveBidding'>) {
  // The auction built from the tapped row — paints the screen instantly and
  // answers the fields the detail endpoint does not carry.
  const passed = route?.params?.auction;
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
    passed?.auctionId;

  // The real auction detail — `GET /drivers/bids/{auctionId}/detail`, mapped
  // onto the shape the screen renders. Falls back to the tapped row until it
  // lands; fields the payload has no answer for read "Not in API".
  // Poll every 5s so the current lowest bid and the rest of the auction stay
  // live while the driver is on the screen.
  const {detail, loading: detailLoading} = useBidDetail(auctionId, 5000);
  const data = useMemo(
    () => toActiveBidding(detail, passed),
    [detail, passed],
  );
  // Bones for the detail-driven sections while the call is in flight and none
  // of its data is on screen yet.
  const loadingDetail = detailLoading && !detail;

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

  // The app's one dialog — the Place Bid result (success or failure) shows here.
  const {
    modalProps: bidModalProps,
    showSuccess: showBidSuccess,
    showError: showBidError,
    showWarning: showBidWarning,
  } = useErrorModal();

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

  // Keep the lowest in step with the detail payload — it carries the real
  // `current_lowest_bid_cents`, which lands after the first render.
  useEffect(() => {
    setCurrentLowest(data.currentLowest);
  }, [data.currentLowest]);
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

  // Prefer the auction's own trucks when it carries any; until a vehicle API
  // exists that list is empty, so fall back to the static eligible list.
  const vehicles = data.vehicles.length ? data.vehicles : ELIGIBLE_VEHICLES;
  const vehicle = vehicles[vehicleIdx];
  const belowLowest = yourBid < currentLowest;
  // The live, ticking time left. Falls back to the snapshot string when the
  // auction carries no end timestamp.
  const liveRemaining = useCountdown(data.endsAt);
  const timeRemaining = data.endsAt ? liveRemaining : data.timeRemaining;

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
      showBidWarning('Enter your bid', 'Enter your bid amount.');
      return;
    }
    if (!auctionId) {
      console.log('[PlaceBid] not sent — no shipmentId (auctionId)', {
        params: route?.params,
      });
      showBidError('This auction has no shipment ID, so the bid cannot be placed.');
      return;
    }

    setPlacing(true);
    const request = {
      auctionId,
      amountCents: Math.round(yourBid * 100),
      // The truck comes from the selected vehicle once the vehicle API exists;
      // until then no asset id is sent rather than a made-up one.
      ...(vehicle?.assetId != null ? {assetId: vehicle.assetId} : {}),
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
      // The server tells us whether this bid now leads: a win is good news, a
      // bid that is already undercut is a heads-up rather than a success.
      if (result?.leading === false) {
        showBidWarning(
          'You have been outbid',
          `Your bid of $${placed} was placed, but it is not the lowest. The current lowest bid is $${
            result?.currentLowestBid ?? currentLowest
          }.`,
        );
      } else {
        showBidSuccess(`Your bid of $${placed} has been placed successfully!`);
      }
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      console.log(
        `[PlaceBid] error (${err?.response?.status ?? 'no response'})`,
        JSON.stringify(err?.response?.data ?? err?.message, null, 2),
      );
      showBidError(err, {
        message:
          err?.response?.data?.message ||
          err?.message ||
          'Could not place your bid. Please try again.',
      });
    } finally {
      setPlacing(false);
    }
  };

  const handleSaveAutoBid = async ({
    mode,
    stopLoss,
  }: {
    mode: AutoBidMode;
    stopLoss: number | null;
  }) => {
    if (!auctionId) {
      showBidError('This auction has no shipment ID, so auto bid cannot be set.');
      return;
    }
    if (!stopLoss) {
      showBidWarning('Enter a stop loss', 'Enter the stop loss for your auto bid.');
      return;
    }

    const request = {
      auctionId,
      mode,
      stopLossCents: Math.round(stopLoss * 100),
      // The truck comes from the selected eligible vehicle.
      ...(vehicle?.assetId != null ? {assetId: vehicle.assetId} : {}),
    };
    console.log('[AutoBid] request', JSON.stringify(request, null, 2));
    try {
      const result = await setAutoBid(request);
      console.log('[AutoBid] response', JSON.stringify(result, null, 2));
      showBidSuccess(
        `Auto bid set — ${
          mode === 'GRADIENT' ? 'Gradient' : 'No Gradient'
        }, stop loss $${stopLoss.toLocaleString()}.`,
      );
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      console.log(
        `[AutoBid] error (${err?.response?.status ?? 'no response'})`,
        JSON.stringify(err?.response?.data ?? err?.message, null, 2),
      );
      showBidError(err, {
        message:
          err?.response?.data?.message ||
          err?.message ||
          'Could not set auto bid. Please try again.',
      });
    }
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
            <AppText
              style={[
                styles.timerValue,
                timeRemaining === 'Closed' && styles.timerClosed,
              ]}>
              {timeRemaining}
            </AppText>
          </View>
        </View>

        {/* STATUS BANNER — the current lowest is always shown; it flips to the
            "placed" confirmation right after a successful bid. */}
        {status === 'placed' ? (
          <View style={[styles.statusBanner, styles.statusPlaced]}>
            <View style={styles.placedIcon}>
              <CheckIcon width={ms(12)} height={ms(12)} />
            </View>
            <AppText style={[styles.statusText, styles.statusTextPlaced]}>
              Your Bid has been placed at ${placedBid}
            </AppText>
          </View>
        ) : (
          <View style={[styles.statusBanner, styles.statusOutbid]}>
            <View style={styles.outbidIcon}>
              <Exclimination width={ms(12)} height={ms(12)} />
            </View>
            <AppText style={[styles.statusText, styles.statusTextOutbid]}>
              You have been OUTBID. The lowest bid now is ${currentLowest}
            </AppText>
          </View>
        )}

        {/* MAX BID CAP — the auction's ceiling, shown only while the auction has
            no current lowest bid; once one exists the banner above carries it. */}
        {!data.hasLowestBid && (
          <AppText style={styles.maxBidCapText}>
            Max Bid Cap: ${data.maxBidCap?.toLocaleString() ?? NOT_IN_API}
          </AppText>
        )}

        {/* VEHICLE + BID CARD */}
        <View style={styles.bidCard}>
          <View style={styles.bidCardTop}>
            <View style={styles.sectionHeadRow}>
              <AppText style={styles.kicker}>ELIGIBLE VEHICLE</AppText>
              <AppText style={styles.kicker}>
                {vehicles.length
                  ? `${vehicles.length} OF ${vehicles.length} MATCH`
                  : NOT_IN_API}
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
                {vehicle ? `Truck ${vehicle.id} ${vehicle.model}` : NOT_IN_API}
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
                {vehicles.map((v, i) => (
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
          <Skeleton isLoading={loadingDetail} layout={activeBidStopBones(2)}>
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
          </Skeleton>
        </View>

        {/* SHIPMENT DETAILS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHead}>
            <AppText style={styles.sectionCardTitle}>Shipment Details</AppText>
          </View>
          <Skeleton isLoading={loadingDetail} layout={activeBidDetailBones}>
            <View style={styles.detailGrid}>
              {data.details.map(item => (
                <View key={item.label} style={styles.detailCell}>
                  <AppText style={styles.detailLabel}>{item.label}</AppText>
                  <AppText style={styles.detailValue}>{item.value}</AppText>
                </View>
              ))}
            </View>
          </Skeleton>
        </View>

        {/* WITHDRAW */}
        {/* <TouchableOpacity
          style={styles.withdrawBtn}
          activeOpacity={0.85}
          onPress={() => setPassVisible(true)}>
          <AppText style={styles.withdrawText}>Withdraw My Bids</AppText>
        </TouchableOpacity> */}
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

      {/* The Place Bid result — success or failure — in the app's shared dialog. */}
      <ErrorModal {...bidModalProps} />
    </SafeAreaView>
  );
}
