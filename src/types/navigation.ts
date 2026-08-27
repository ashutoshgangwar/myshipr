/**
 * React Navigation typing for the whole app.
 *
 * `RootStackParamList` is the single source of truth for route names and their
 * params. Once `AppStackMain` and `navigationRef` are typed against it,
 * `navigate('Typo')` and `navigate('Shipmentdetails', {})` both stop
 * compiling — today they are silent runtime no-ops.
 *
 * Every route below is declared in `Navigation/AppStackMain.js`, and every
 * param shape is one a screen actually reads or a caller actually passes.
 * Routes that take no params are `undefined`, which is what React Navigation
 * expects — not `{}`, which would demand an empty object at every call site.
 *
 * Types only: this module emits no runtime code.
 */

import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';

import type {MapLocation} from './common';

/**
 * The truck's dimensions and weights, as the TruckInputs form collects them.
 * Values are strings because they come straight off `<TextInput>` — the form
 * never parses them, so typing them as numbers would be wrong.
 */
export interface TruckDetails {
  currentWeight?: string;
  grossWeight?: string;
  length?: string;
  height?: string;
  axleCount?: string;
  trailerCount?: string;
}

/**
 * The origin/destination handoff shared by the three map screens. All five
 * keys are optional: each screen falls back to its own state when a param is
 * missing, which is what makes the map openable from a cold start.
 */
export interface MapRouteParams {
  sourceLocation?: MapLocation | null;
  destinationLocation?: MapLocation | null;
  sourceText?: string;
  destinationText?: string;
  truckDetails?: TruckDetails | null;
  /** Toll breakdown handed over from the search screen's route preview. */
  tollsData?: Record<string, unknown> | null;
}

/**
 * What the FavoriteDestination screen hands back to the tabs — either a typed
 * address or a point picked off the map.
 *
 * NOTE: nothing currently reads this param. It is typed rather than dropped
 * because the screen really does send it, and deleting the param would be a
 * behaviour change.
 */
export interface FavoriteAddress {
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export type FavoriteDestinationHandoff =
  | {type: 'manual'; address: FavoriteAddress}
  | {type: 'map'; coordinate: MapLocation};

/**
 * The demo payloads two screens fall back on when opened without params.
 * Derived from the constants themselves rather than re-declared, so the param
 * type can never drift from the mock the screen actually renders.
 */
export type PaymentDetail =
  (typeof import('../screens/EarningsDetails/constants'))['PAYMENT'];

export type AuctionDetail =
  (typeof import('../screens/ActiveBidding/constants'))['AUCTION'];

/**
 * A row of the loads board, as the bidding and delivery flows read it.
 *
 * Still mock data, so the shape is permissive and every field optional — the
 * ones named here are the ones the screens actually touch. Narrow it once the
 * loads endpoint exists.
 */
export interface AvailableLoad {
  id?: string;
  from?: string;
  to?: string;
  weight?: string;
  miles?: string | number;
  pay?: string | number;
  bids?: Array<{
    amount?: number;
    bidder?: string;
    time?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/** The bottom-tab set. Which four or three are mounted depends on the role. */
export type MainTabParamList = {
  HomeTab: undefined;
  EarningsTab: undefined;
  ShipmentTab: undefined;
  BiddingTab: undefined;
  SalaryTab: undefined;
  SettingsTab: undefined;
};

/** Every route in the root native-stack navigator. */
export type RootStackParamList = {
  // ── Splash ──────────────────────────────────────────────────────────────
  PreviewSplashScreen: undefined;

  // ── Auth ────────────────────────────────────────────────────────────────
  LoginSplashScreen: undefined;
  LoginScreen: undefined;
  SignupScreen: undefined;
  /**
   * Doubles as the driver-invite landing route: `DeepLinkService` resolves an
   * emailed link to `{token, email}`, while the in-app "Forgot password" flow
   * opens it with no params at all.
   */
  ResetPassword: {token?: string; email?: string} | undefined;
  Onboarding: undefined;

  // ── Tabs ────────────────────────────────────────────────────────────────
  MainApp:
    | NavigatorScreenParams<MainTabParamList>
    | {favoriteDestination?: FavoriteDestinationHandoff}
    | undefined;

  // ── Detail flows ────────────────────────────────────────────────────────
  FavoriteDestination: undefined;
  /** Lower-case `d` — the route name as registered, not a typo here. */
  Shipmentdetails: {shipmentId: string};
  Earningsdetails: {payment?: PaymentDetail} | undefined;
  NotificationScreen: undefined;

  // ── Extra flows (no bottom tab) ─────────────────────────────────────────
  Profile: undefined;
  FaceLock: undefined;
  HereSearchScreen: MapRouteParams | undefined;
  HereMapScreen: MapRouteParams | undefined;
  HereNavigationDemo: undefined;
  ActiveTripScreen: MapRouteParams | undefined;

  /**
   * A one-shot animation that forwards to `next` when it finishes. `next` is
   * constrained to a real route name, so a typo in the handoff is caught here
   * rather than stranding the driver on the animation.
   */
  TruckAnimationScreen:
    | {
        title?: string;
        subtitle?: string;
        next?: keyof RootStackParamList;
        nextParams?: object;
      }
    | undefined;
  TripCompletedScreen:
    | {pickup?: string; drop?: string; loadId?: string}
    | undefined;
  CoinTestScreen: undefined;

  /**
   * NOT REGISTERED IN ANY NAVIGATOR YET.
   *
   * `Signup` and `Onboarding` both finish with
   * `navigation.reset({routes: [{name: 'CdlDriverOnboarding'}]})`, so both
   * flows currently navigate nowhere. Declared here so those two call sites
   * type-check and stay visible; add a `<Stack.Screen>` for it in
   * `AppStackMain` to make the flows land somewhere.
   */
  CdlDriverOnboarding: undefined;

  /**
   * KNOWN DISCREPANCY, preserved deliberately: the screen reads
   * `route.params.auction`, but all three callers navigate with `{item}`. The
   * screen therefore always falls back to its `AUCTION` mock today. Both keys
   * are typed so neither side breaks; see the migration notes.
   */
  ActiveBidding: {auction?: AuctionDetail; item?: unknown} | undefined;

  DeliveryConfirmation: {load?: AvailableLoad} | undefined;
  AvailableLoadsScreen: undefined;
  PlaceBidScreen: {load?: AvailableLoad} | undefined;
  SignatureCaptureScreen: undefined;
};

/**
 * Props for a root-stack screen:
 *
 *     export default function Profile({navigation}: RootStackScreenProps<'Profile'>) {}
 *
 * `navigation` and `route` are both typed from the name alone — no manual
 * annotation of either.
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/**
 * Props for a bottom-tab screen. Composite because a tab screen can navigate
 * to root-stack routes too — which every tab does (Home opens the trip, the
 * Shipment table opens a shipment's details).
 */
export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

/**
 * Registers the param list globally, so bare `useNavigation()` — the form the
 * components use, without a generic — is typed rather than falling back to a
 * loose default.
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
