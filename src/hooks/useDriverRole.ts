import {CURRENT_DRIVER_ROLE, isFleetDriver} from '../constants/DriverRoles';

export default function useDriverRole() {
  const role = CURRENT_DRIVER_ROLE;

  return {role, isFleet: isFleetDriver(role)};
}
