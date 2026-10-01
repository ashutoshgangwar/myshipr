import {select} from '../../theme/device';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';

// Same phone down-scale as ShipmentDetails so a load reads at one size whether
// you open it from the shipment table or from an earnings row.
const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
export const ms = (n: number): number => baseMs(n) * PHONE_FACTOR;
export const vs = (n: number): number => baseVs(n) * PHONE_FACTOR;

// Filled status pill colours, mirroring the earnings table's own mapping.
export const STATUS_COLOR: Record<string, string> = {
  Paid: colors.success,
  'In - Transit': colors.button_color,
  Cancelled: colors.danger,
};
