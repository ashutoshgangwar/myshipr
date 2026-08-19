
export const DRIVER_ROLES = {
  FLEET: 'fleet_driver',
  SINGLE: 'fleet_driver',
};

export const CURRENT_DRIVER_ROLE = DRIVER_ROLES.SINGLE;

export const isFleetDriver = role => role === DRIVER_ROLES.FLEET;
