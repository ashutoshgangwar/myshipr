/**
 * The one way anything outside the fuel prompt asks it to open.
 *
 * The prompt itself is mounted once, above the navigator (see
 * `component/FuelPricePrompt`), so the sheet is the same one whatever screen
 * the driver is on and a stop at a pump can raise it from anywhere. Screens
 * that offer a "report a price" control — the DIESEL chip on Home — call
 * `openFuelPriceEntry` instead of keeping a sheet of their own.
 *
 * Deliberately not a context: the callers are buttons, not subscribers, and a
 * provider would re-render every screen under it each time the sheet opens.
 */

type Opener = () => void;

let opener: Opener | null = null;

/**
 * Called by the mounted prompt. The returned function unregisters, and only if
 * `open` is still the registered one — so a remount that registers before the
 * old copy's cleanup runs is not left unregistered.
 */
export const registerFuelPriceEntryOpener = (open: Opener): (() => void) => {
  opener = open;
  return () => {
    if (opener === open) opener = null;
  };
};

/**
 * Opens the fuel-price sheet at the station the driver is nearest to, from any
 * screen. A no-op before the prompt has mounted — i.e. while signed out.
 */
export const openFuelPriceEntry = (): void => {
  if (!opener) {
    console.log('[FuelPrice] no prompt mounted — open ignored');
    return;
  }
  opener();
};
