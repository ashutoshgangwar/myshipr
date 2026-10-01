import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AppState} from 'react-native';

import FuelPriceEntryModal from '../FuelPriceEntryModal/FuelPriceEntryModal';
import FuelPriceSuccessModal from '../FuelPriceSuccessModal/FuelPriceSuccessModal';
import {hasSession, onAuthStateChange} from '../../config/api';
import {
  LOCATING_LABEL,
  LOCATION_UNKNOWN_LABEL,
  useCurrentLocationLabel,
} from '../../services/currentLocation';
import {describeStationKinds, useFuelPriceEntry} from '../../services/fuelPriceEntry';
import type {SubmittedFuelPrice} from '../../services/fuelPriceEntry';
import {registerFuelPriceEntryOpener} from '../../services/fuelPricePrompt';
import {useFuelStopDetector} from '../../services/fuelStopDetector';
import {refreshFuelPrice} from '../../services/fuelPrice';
import {refreshFuelReward} from '../../services/fuelReward';
import {playNotificationSound} from '../../services/notificationSound';

/**
 * How long the sheets stay mounted after the last one closes. The entry sheet
 * fades out (`animationType="fade"`), and unmounting it mid-fade would snap it
 * off the screen instead.
 */
const SHEET_EXIT_MS = 400;

/** The report just filed, while its thank-you sheet is up. */
type FiledReport = SubmittedFuelPrice & {
  points: number | null;
  message?: string;
};

/**
 * Whether the driver is signed in, as an edge-driven flag.
 *
 * A session already on disk emits nothing through `onAuthStateChange` — it was
 * neither saved nor cleared this run — so a cold start has to ask as well.
 */
const useSignedIn = (): boolean => {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hasSession()
      .then(yes => {
        if (!cancelled) setSignedIn(yes);
      })
      .catch(() => {});
    const unsubscribe = onAuthStateChange(setSignedIn);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return signedIn;
};

/** Whether the app is in the foreground. */
const useAppActive = (): boolean => {
  const [active, setActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state =>
      setActive(state === 'active'),
    );
    return () => subscription.remove();
  }, []);

  return active;
};

/**
 * Where the report will be filed, for the sheets to print — '' rather than
 * "Locating…", which is a header's line and not a sheet's.
 *
 * Mounted only while a sheet is up (see below), so the reverse-geocode this
 * costs is spent when there is something to print it on.
 */
const useFiledAtLabel = (): string | undefined => {
  const {label} = useCurrentLocationLabel();
  return label === LOCATING_LABEL || label === LOCATION_UNKNOWN_LABEL
    ? undefined
    : label;
};

interface SheetsProps {
  entry: ReturnType<typeof useFuelPriceEntry>;
  filed: FiledReport | null;
  onCloseFiled: () => void;
}

/**
 * The two sheets, and with them the location label they print. Split out so
 * the label's hook — a fix and a reverse-geocode — only runs while one of them
 * is actually on screen.
 */
const FuelPriceSheets = ({entry, filed, onCloseFiled}: SheetsProps) => {
  const locationLabel = useFiledAtLabel();

  return (
    <>
      <FuelPriceEntryModal
        visible={entry.visible}
        submitting={entry.submitting}
        error={entry.error}
        stationName={entry.station?.name}
        stationDistanceMeters={entry.station?.distanceMeters}
        stationType={describeStationKinds(entry.station?.kinds ?? [])}
        stationLoading={entry.stationLoading}
        stationMessage={entry.stationMessage}
        onSearchStation={entry.searchStation}
        locationLabel={locationLabel}
        onSubmit={entry.submit}
        onClose={entry.close}
      />
      <FuelPriceSuccessModal
        visible={Boolean(filed)}
        points={filed?.points}
        message={filed?.message}
        pricePerGallon={filed?.pricePerGallon}
        stationName={filed?.stationName}
        locationLabel={locationLabel}
        onClose={onCloseFiled}
      />
    </>
  );
};

/**
 * The driver's "report the diesel price" sheet, for the whole app.
 *
 * Mounted once above the navigator, so it opens over whatever screen the
 * driver is on. Two things open it, and both reach the same sheet:
 *
 *  - stopping at a fuel station — the detector notices and this raises the
 *    sheet with the station already found, and chimes, since the driver is out
 *    at the pumps and did not ask for it;
 *  - `openFuelPriceEntry()` from a screen's own control (the DIESEL chip on
 *    Home), which opens silently, because tapping it is the asking.
 *
 * The detector only watches while the driver is signed in and the app is in
 * the foreground; a report refreshes the reward balance and the local pump
 * price for whichever cards are subscribed to them.
 */
const FuelPricePrompt = () => {
  const signedIn = useSignedIn();
  const appActive = useAppActive();
  const [filed, setFiled] = useState<FiledReport | null>(null);
  const closeFiled = useCallback(() => setFiled(null), []);

  const entry = useFuelPriceEntry(
    useCallback((result, submitted) => {
      const points = Number(result?.rewardPoints);
      setFiled({
        ...submitted,
        points: Number.isFinite(points) ? points : null,
        message: result?.message,
      });
      refreshFuelReward();
      refreshFuelPrice({force: true});
    }, []),
  );

  // The opener is registered as a ref-stable wrapper, so a re-render of this
  // component does not churn the registration.
  const openRef = useRef(entry.open);
  openRef.current = entry.open;
  useEffect(
    () => registerFuelPriceEntryOpener(() => openRef.current()),
    [],
  );

  const openAtStation = entry.openAtStation;
  const arriveAtStation = useCallback<typeof openAtStation>(
    (station, fix) => {
      playNotificationSound();
      openAtStation(station, fix);
    },
    [openAtStation],
  );

  useFuelStopDetector({
    enabled: signedIn && appActive,
    // The thank-you sheet counts as busy too, or a stop detected right after a
    // report would reopen the entry sheet behind it.
    paused: entry.visible || entry.submitting || Boolean(filed),
    onArrive: arriveAtStation,
  });

  // Signing out drops whatever is open on the way to the login screen. The
  // sign-out edge only — a cold start reads `signedIn` as false before the
  // stored session answers, and that is not a sign-out. `close` is read
  // through a ref because its identity changes with `submitting`.
  const closeRef = useRef(entry.close);
  closeRef.current = entry.close;
  const wasSignedIn = useRef(false);
  useEffect(() => {
    const signedOut = wasSignedIn.current && !signedIn;
    wasSignedIn.current = signedIn;
    if (!signedOut) return;
    setFiled(null);
    closeRef.current();
  }, [signedIn]);

  // The sheets — and the location label they cost — are mounted only while one
  // of them is up, plus the moment it takes the entry sheet to fade out.
  const anySheetUp = entry.visible || Boolean(filed);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (anySheetUp) {
      setMounted(true);
      return undefined;
    }
    const timer = setTimeout(() => setMounted(false), SHEET_EXIT_MS);
    return () => clearTimeout(timer);
  }, [anySheetUp]);

  if (!mounted) return null;

  return (
    <FuelPriceSheets
      entry={entry}
      filed={filed}
      onCloseFiled={closeFiled}
    />
  );
};

export default FuelPricePrompt;
