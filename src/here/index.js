/**
 * HERE SDK Navigate — JavaScript API (Android only).
 *
 *     import {HereSdk, HereRouting, HereNavigation, HereMapView} from '../here';
 *
 *     await HereSdk.initialize();
 *     const route = await HereRouting.calculateTruckRoute(oLat, oLng, dLat, dLng);
 *     await mapRef.current.drawRoute({routeId: route.routeId});
 *     await HereNavigation.startNavigation(route.routeId, {simulate: true});
 *
 * See `src/screens/HereNavigationDemo/HereNavigationDemo.js` for a complete
 * initialise → map → route → draw → navigate flow.
 *
 * Guidance belongs to the SDK, not to the screen that started it: it keeps
 * running, speaking and emitting events after that screen unmounts. So a trip
 * can move between maps — full screen, then the floating card on Home, then
 * back — by handing over the rendering rather than starting again:
 *
 *     const state = await HereNavigation.getSessionState();   // still running?
 *     if (state.navigating) {
 *       await HereNavigation.attachToMapView(mapRef.current.getTag(),
 *                                            {mode: 'fixed'});
 *     }
 *
 * `src/services/TripSessionService.js` is the JS side of that: which trip is
 * live, for screens that need to know without owning the session.
 */

export {default as HereSdk} from './HereSdk';
export {default as HereRouting} from './HereRouting';
export {default as HereNavigation, NavigationEvents} from './HereNavigation';
export {default as HereMapView} from './HereMapView';
