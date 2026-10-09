import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
  activeBidActionBones,
  activeBidBannerBones,
  activeBidDetailBones,
  activeBidStopBones,
  activeBidTimerBones,
  activeBidVehicleBones,
} from '../../../component/Skeleton/Skeleton.layouts';
import ConfettiPoppers from '../../../component/ConfettiPoppers/ConfettiPoppers';
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
import AwardIcon from '../../../assets/svg_icon/Award_icon.svg';
import CheckIcon from '../../../assets/svg_icon/check.svg';
import type {RootStackScreenProps} from '../../../types/navigation';
import {playAppSound} from '../../../services/notificationSound';
import {getAutoBid, placeBid, setAutoBid} from '../../../config/driverApi';
import type {AutoBidMode, AutoBidState} from '../../../types/bidding';
import type {ApiErrorBody} from '../../../types/api';
import type {ErrorLike} from '../../../types/common';
import { IS_TABLET } from '../../../theme/device';

// One responsive size for the chip icons so they scale together on phone and
// tablet instead of being hardcoded.
const CHIP_ICON = ms(15);

// How long a toast stays up before it hides itself.
const TOAST_MS = 3000;
const TOAST_ERROR_MS = 4500;

// How long the "Your Bid has been placed" banner shows before falling back
// to the ongoing current-lowest banner.
const PLACED_BANNER_MS = 5000;

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
  // lands; fields the payload has no answer for read "
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

  const [yourBid, setYourBid] = useState<number | null>(null);
  // Lets a tap anywhere in the bordered box focus the field, not just the
  // narrow TextInput itself.
  const bidInputRef = useRef<TextInput>(null);
  const [vehicleIdx, setVehicleIdx] = useState(0);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [autoBidVisible, setAutoBidVisible] = useState(false);
  // The auto bid set on this auction (`GET .../auto-bid`); null until loaded.
  const [autoBid, setAutoBidState] = useState<AutoBidState | null>(null);
  const autoBidOn = autoBid?.enabled === true;
  // True until the first auto-bid call answers (success or failure), so the
  // buttons do not flash the manual pair before swapping to the auto-bid ones.
  const [autoBidLoading, setAutoBidLoading] = useState(!!auctionId);
  const loadAutoBid = useCallback(async () => {
    if (!auctionId) {
      setAutoBidLoading(false);
      return;
    }
    try {
      const state = await getAutoBid(auctionId);
      console.log('[AutoBid] state', JSON.stringify(state, null, 2));
      setAutoBidState(state);
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      console.log(
        `[AutoBid] get error (${err?.response?.status ?? 'no response'})`,
        JSON.stringify(err?.response?.data ?? err?.message, null, 2),
      );
      // Without the state the screen simply shows the manual-bid buttons.
    } finally {
      setAutoBidLoading(false);
    }
  }, [auctionId]);
  useEffect(() => {
    loadAutoBid();
  }, [loadAutoBid]);
  const [passVisible, setPassVisible] = useState(false);
  // `error` paints it red with a "!" instead of the green tick.
  const [toast, setToast] = useState<{text: string; error?: boolean} | null>(
    null,
  );
  const showToast = (text: string) => setToast({text});

  // The app's one dialog — a real backend error message, or the "are you
  // sure" a coin tap asks before it bids.
  const {
    modalProps: bidModalProps,
    showError: showBidError,
    confirm: confirmBid,
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
  const [status, setStatus] = useState<'placed' | null>(null);
  const [placedBid, setPlacedBid] = useState(0);
  // Starts at the auction's figure, then follows what each bid reports back.
  const [currentLowest, setCurrentLowest] = useState(data.currentLowest);
  const [placing, setPlacing] = useState(false);
  const [placingVia, setPlacingVia] = useState<'coin' | 'button' | null>(null);

  useEffect(() => {
    setCurrentLowest(data.currentLowest);
  }, [data.currentLowest]);
  const [flight, setFlight] = useState(0);
  const [flightFrom, setFlightFrom] = useState<FlightOrigin | null>(null);
  const [flightLabel, setFlightLabel] = useState<string | null>(null);

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

  const vehicles = data.vehicles.length ? data.vehicles : ELIGIBLE_VEHICLES;
  const bidSteps = data.bidSteps?.length
    ? data.bidSteps
    : BID_STEPS.map(step => step.value);
  const vehicle = vehicles[vehicleIdx];
  const belowLowest = yourBid != null && yourBid < currentLowest;
  const liveRemaining = useCountdown(data.endsAt);
  const timeRemaining = data.endsAt ? liveRemaining : data.timeRemaining;

  const submitBid = async (
    amount: number,
    flightInfo?: {origin: FlightOrigin; label: string},
  ) => {
    if (placing) return;
    if (!auctionId) {
      console.log('PlaceBid not sent- send complete details', {
        params: route?.params,
      });
      return;
    }

    setPlacing(true);
    setPlacingVia(flightInfo ? 'coin' : 'button');
    const request = {
      auctionId,
      amountCents: Math.round(amount * 100),
      // The truck comes from the selected vehicle once the vehicle API exists;
      // until then no asset id is sent rather than a made-up one.
      ...(vehicle?.assetId != null ? {assetId: vehicle.assetId} : {}),
    };
    console.log('[PlaceBid] request', JSON.stringify(request, null, 2));
    try {
      const result = await placeBid(request);
      console.log('[PlaceBid] response', JSON.stringify(result, null, 2));
      const placed = result?.yourBid ?? amount;
      setPlacedBid(placed);
      // Clear the input once the bid is accepted; the banner shows the amount.
      setYourBid(null);
      bidInputRef.current?.blur();
      if (Number.isFinite(result?.currentLowestBid)) {
        setCurrentLowest(result.currentLowestBid);
      }
      setStatus('placed');
      setTimeout(() => setStatus(null), PLACED_BANNER_MS);
      if (flightInfo) {
        playAppSound('celebration');
        setFlightFrom(flightInfo.origin);
        setFlightLabel(flightInfo.label);
        setFlight(n => n + 1);
      }
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      console.log(
        `[PlaceBid] error (${err?.response?.status ?? 'no response'})`,
        JSON.stringify(err?.response?.data ?? err?.message, null, 2),
      );

      const backendMessage =
        err?.response?.data?.message || err?.response?.data?.error;
      if (backendMessage) {
        showBidError(backendMessage);
      }
    } finally {
      setPlacing(false);
      setPlacingVia(null);
    }
  };

  const handleStep = (value: number, origin: FlightOrigin) => {
    const proposedBid = Math.max(0, currentLowest - value);
    confirmBid({
      title: 'Confirm your bid',
      message: `Are you sure your bid price is $${proposedBid}?`,
      confirmText: 'Submit',
      onConfirm: () => {
        submitBid(proposedBid, {origin, label: `-${value}`});
      },
    });
  };

  const handleBidChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setYourBid(digits ? Number(digits) : null);
  };

  const handlePlaceBid = () => {
    // Any amount goes, including $0 — the server decides whether it leads.
    // Only an empty field is stopped, since there is nothing to send.
    if (yourBid == null) return;
    submitBid(yourBid);
  };

  const handleSaveAutoBid = async ({
    mode,
    stopLoss,
  }: {
    mode: AutoBidMode;
    stopLoss: number | null;
  }) => {
    // Neither guard below ever reaches the backend, so neither shows a
    // message — only a real backend error message is ever surfaced.
    if (!auctionId) {
      return;
    }
    if (!stopLoss) {
      return;
    }

    const request = {
      auctionId,
      mode,
      stopLossCents: Math.round(stopLoss * 100),
      // The truck comes from the selected eligible vehicle.
      isActive: true,
      ...(vehicle?.assetId != null ? {assetId: vehicle.assetId} : {}),
    };
    console.log('[AutoBid] request', JSON.stringify(request, null, 2));
    try {
      const result = await setAutoBid(request);
      console.log('[AutoBid] response', JSON.stringify(result, null, 2));
      await loadAutoBid();
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      console.log(
        `[AutoBid] error (${err?.response?.status ?? 'no response'})`,
        JSON.stringify(err?.response?.data ?? err?.message, null, 2),
      );
      // Only ever shows the backend's own error text — never a
      // frontend-composed fallback.
      const backendMessage =
        err?.response?.data?.message || err?.response?.data?.error;
      if (backendMessage) {
        showBidError(backendMessage);
      }
    }
  };

  // Turn Off Auto-Bid — the same POST with `isActive: false`, keeping the mode
  // and stop loss the auto bid already has.
  const handleTurnOffAutoBid = async () => {
    if (!auctionId || !autoBid) return;
    const request = {
      auctionId,
      mode: autoBid.mode ?? 'GRADIENT',
      stopLossCents: autoBid.stopLossCents ?? autoBid.floorCents ?? 0,
      isActive: false,
      ...(autoBid.assetId != null ? {assetId: autoBid.assetId} : {}),
    };
    console.log('[AutoBid] turn off request', JSON.stringify(request, null, 2));
    try {
      const result = await setAutoBid(request);
      console.log('[AutoBid] turn off response', JSON.stringify(result, null, 2));
      await loadAutoBid();
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      console.log(
        `[AutoBid] turn off error (${err?.response?.status ?? 'no response'})`,
        JSON.stringify(err?.response?.data ?? err?.message, null, 2),
      );
      const backendMessage =
        err?.response?.data?.message || err?.response?.data?.error;
      if (backendMessage) {
        showBidError(backendMessage);
      }
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
            <Skeleton isLoading={loadingDetail} layout={activeBidTimerBones}>
              <AppText
                style={[
                  styles.timerValue,
                  timeRemaining === 'Closed' && styles.timerClosed,
                ]}>
                {timeRemaining}
              </AppText>
            </Skeleton>
          </View>
        </View>

        {/* STATUS BANNER — green flash right after you place a bid, then back
            to: the max bid cap while the auction has no lowest bid yet, or
            the orange current-lowest banner once it does. */}
        {loadingDetail ? (
          <Skeleton
            isLoading
            layout={activeBidBannerBones}
            containerStyle={styles.bannerSkeleton}
          />
        ) : data.awarded ? null : status === 'placed' ? (
          <View style={[styles.statusBanner, styles.statusPlaced]}>
            <View style={styles.placedIcon}>
              <CheckIcon width={ms(12)} height={ms(12)} />
            </View>
            <AppText style={[styles.statusText, styles.statusTextPlaced]}>
              Your Bid has been placed at ${placedBid}
            </AppText>
          </View>
        ) : !data.hasLowestBid ? (
          <View style={styles.currentBidRow}>
            <AppText style={styles.currentBidLabel}>Current highest Bid Price</AppText>
            <AppText style={styles.currentBidValue}>
              ${data.maxBidCap?.toLocaleString() ?? NOT_IN_API}
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

        {autoBidOn && !data.awarded ? (
          <View style={styles.autoBidBanner}>
            <View style={styles.autoBidBannerLeft}>
              <AppText style={styles.autoBidBannerTitle}>Auto bid is on</AppText>
              <AppText style={styles.autoBidBannerLabel}>Stop loss</AppText>
              <AppText style={styles.autoBidBannerHint}>
                Your Auto-bid will stop when it reaches your stop loss.
              </AppText>
            </View>
            <View style={styles.autoBidBannerRight}>
              <View style={styles.autoBidActivePill}>
                <AppText style={styles.autoBidActiveText}>● Active</AppText>
              </View>
              <AppText style={styles.autoBidStopLoss}>
                ${((autoBid?.stopLossCents ?? autoBid?.floorCents ?? 0) / 100).toLocaleString()}
              </AppText>
            </View>
          </View>
        ) : null}

        {/* VEHICLE + BID CARD — replaced by the award once the auction is AWARDED */}
        {data.awarded ? (
          <View style={styles.awardedCard}>
            <AwardIcon width={ms(64)} height={ms(64)} />
            <AppText style={styles.awardedTitle}>Bid Awarded</AppText>
            <AppText style={styles.awardedLabel}>Winning amount</AppText>
            <AppText style={styles.awardedAmount}>
              {data.winnerAmount != null
                ? `$${data.winnerAmount.toLocaleString()}`
                : NOT_IN_API}
            </AppText>
          </View>
        ) : (
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

            {loadingDetail ? (
              <Skeleton isLoading layout={activeBidVehicleBones} />
            ) : (
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
            )}

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
            {autoBidLoading ? (
              <Skeleton isLoading layout={activeBidActionBones} />
            ) : null}

            {!autoBidLoading && autoBidOn ? (
              <View style={styles.autoBidActionRow}>
                <TouchableOpacity
                  style={styles.turnOffBtn}
                  activeOpacity={0.85}
                  onPress={handleTurnOffAutoBid}>
                  <AppText style={styles.turnOffText}>Turn Off Auto-Bid</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editStopLossBtn}
                  activeOpacity={0.85}
                  onPress={() => setAutoBidVisible(true)}>
                  <AppText style={styles.placeBidText}>Edit Stop Loss</AppText>
                </TouchableOpacity>
              </View>
            ) : null}

            <AppText style={styles.kicker}>PLACE YOUR BID</AppText>
            <Pressable
              style={[styles.bidInputBox, autoBidOn && styles.bidInputBoxDisabled]}
              disabled={autoBidOn}
              onPress={() => bidInputRef.current?.focus()}>
              <AppText style={styles.bidCurrency}>$</AppText>
              <TextInput
                ref={bidInputRef}
                style={styles.bidInput}
                editable={!autoBidOn}
                value={yourBid != null ? String(yourBid) : ''}
                onChangeText={handleBidChange}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
              <AppText style={styles.bidHint} numberOfLines={1}>
                {belowLowest ? 'Lower than the current bid' : ''}
              </AppText>
            </Pressable>

            {!autoBidLoading && !autoBidOn ? (
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
                  yourBid == null && styles.placeBidBtnDisabled,
                ]}
                activeOpacity={0.85}
                disabled={placing || yourBid == null}
                onPress={handlePlaceBid}>
                {placingVia === 'button' ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <AppText style={styles.placeBidText}>Place Bid</AppText>
                )}
              </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
        )}

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
                  <AppText style={styles.stopCity}>
                    {stop.type === 'D' ? data.dest : data.origin}
                  </AppText>
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

      
      {!data.awarded ? (
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
            {bidSteps.map(value => (
              <View key={value} style={styles.coinSlot}>
                <BidCoin value={value} onPress={handleStep} />
              </View>
            ))}
          </View>
        </Animated.View>
      ) : null}

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
        title={autoBidOn ? 'Edit Stop Loss' : 'Set Up Auto Bid'}
        initialMode={autoBidOn ? autoBid?.mode : undefined}
        initialStopLoss={
          autoBidOn
            ? (autoBid?.stopLossCents ?? autoBid?.floorCents ?? 0) / 100
            : null
        }
      />

      <PassLoadModal
        visible={passVisible}
        subtitle={`${data.auctionRef} • ${data.origin} → ${data.dest}`}
        onClose={() => setPassVisible(false)}
        onPass={handlePass}
      />

      {/* The Place Bid result — success or failure — in the app's shared dialog. */}
      <ErrorModal {...bidModalProps} />
      {/* Party poppers fire once when the auction is awarded */}
      <ConfettiPoppers active={Boolean(data.awarded)} />
    </SafeAreaView>
  );
}
