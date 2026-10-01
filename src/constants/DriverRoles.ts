import type {DriverRole} from '../types/auth';

export const DRIVER_ROLES = {
  FLEET: 'fleet_driver',
  SINGLE: 'single_driver',
  // SINGLE: 'fleet_driver',
} as const satisfies Record<string, DriverRole>;

export const CURRENT_DRIVER_ROLE: DriverRole = DRIVER_ROLES.SINGLE;

export const isFleetDriver = (role: string | null | undefined): boolean =>
  role === DRIVER_ROLES.FLEET;
