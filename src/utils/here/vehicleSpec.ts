/**
 * Turns the trip payload's `equipmentDetail` into the vehicle profile the HERE
 * router wants.
 *
 * Two things have to happen in between, and neither is optional:
 *
 * 1. **Units.** The backend sends US customary — pounds and feet. Both native
 *    `buildVehicleSpecification()` implementations (`HereRoutingModule.kt`,
 *    `HereRoutingModule.swift`) write straight into HERE's
 *    `VehicleSpecification`, whose fields are `…InKilograms` and
 *    `…InCentimeters`. Handing feet to a centimetre field is not a rounding
 *    error, it is a truck that fits under every bridge in Texas.
 * 2. **Key names.** `grossWeightLbs` → `grossWeight`, `heightFt` → `height`,
 *    and so on. The native side reads the map flat — there is no `vehicle`
 *    nesting on the `calculateTruckRoute()` path.
 *
 * The result is what makes the route and the ETA the truck's own: HERE keeps
 * the drive off restricted roads and low clearances, and prices the duration
 * against truck speed limits rather than a car's.
 */

import type {EquipmentDetail} from '../../types/shipment';
import type {TruckDetails} from '../../types/navigation';

const LBS_TO_KG = 0.45359237;
const FT_TO_CM = 30.48;

/**
 * Ceilings applied to the converted dimensions, in centimetres.
 *
 * A dimension above these is not a big truck, it is a bad field: US federal
 * limits put a rig at roughly 13'6" tall and 8'6" wide, and HERE answers a
 * request that exceeds them by routing around every structure in the way —
 * usually "No route found" over any real distance. The trip endpoint is
 * currently sending 25 ft of height and 15 ft of width for a 53 ft dry van, so
 * a driver would get no route at all if these went through untouched.
 *
 * Clamping keeps the trip drivable; the warning is what says the payload needs
 * fixing. Drop this once the backend sends real dimensions.
 */
const MAX_DIMENSION_CM = {
  height: Math.round(14 * FT_TO_CM), // 427 — the tallest US states allow
  width: Math.round(8.5 * FT_TO_CM), // 259 — federal maximum
  length: Math.round(80 * FT_TO_CM), // 2438 — tractor + 53 ft trailer
};

const isPositive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/** Pounds → kilograms, rounded: the SDK's weight fields are integers. */
const lbsToKg = (lbs: unknown): number | undefined =>
  isPositive(lbs) ? Math.round(lbs * LBS_TO_KG) : undefined;

/** Feet → centimetres, clamped to {@link MAX_DIMENSION_CM} and warned about. */
const ftToCm = (
  ft: unknown,
  field: keyof typeof MAX_DIMENSION_CM,
): number | undefined => {
  if (!isPositive(ft)) return undefined;

  const cm = Math.round(ft * FT_TO_CM);
  const max = MAX_DIMENSION_CM[field];
  if (cm <= max) return cm;

  console.warn(
    `[vehicleSpec] equipmentDetail.${field} is ${ft} ft (${cm} cm), past the ` +
      `${max} cm road limit — clamped so HERE can still find a route. The ` +
      'trip payload needs fixing.',
  );
  return max;
};

/**
 * A trailer means a tractor unit; without one the body is rigid. HERE uses the
 * distinction for turn restrictions, so it is worth sending even though the
 * payload never states it outright.
 */
const truckType = (trailerCount: unknown): TruckDetails['truckType'] =>
  isPositive(trailerCount) ? 'tractor' : 'straight';

/**
 * The HERE vehicle profile for a load's equipment, or `null` when the payload
 * carried nothing usable — routing without a profile is the old behaviour and
 * still better than routing against zeroes.
 *
 * @param equipment `equipmentDetail` off `GET /drivers/shipments/{tripId}`
 */
export function toVehicleSpec(
  equipment: EquipmentDetail | null | undefined,
): TruckDetails | null {
  if (!equipment) return null;

  const spec: TruckDetails = {
    grossWeight: lbsToKg(equipment.grossWeightLbs),
    weightPerAxle: lbsToKg(equipment.weightPerAxleLbs),
    height: ftToCm(equipment.heightFt, 'height'),
    width: ftToCm(equipment.widthFt, 'width'),
    length: ftToCm(equipment.lengthFt, 'length'),
    axleCount: isPositive(equipment.axleCount) ? equipment.axleCount : undefined,
    trailerCount: isPositive(equipment.trailerCount)
      ? equipment.trailerCount
      : undefined,
    truckType: truckType(equipment.trailerCount),
  };

  // Drop the fields the payload had nothing for: an explicit `undefined` still
  // crosses the bridge as a key, and the native readers treat a present-but-null
  // value differently from an absent one.
  (Object.keys(spec) as Array<keyof TruckDetails>).forEach(key => {
    if (spec[key] === undefined) delete spec[key];
  });

  // `truckType` alone is not a profile — it is derived, not sent.
  const hasMeasurements = Object.keys(spec).some(key => key !== 'truckType');
  return hasMeasurements ? spec : null;
}

export default toVehicleSpec;
