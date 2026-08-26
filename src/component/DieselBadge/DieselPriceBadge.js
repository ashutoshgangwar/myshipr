import React from 'react';

import {useFuelPrice} from '../../services/fuelPrice';
import DieselBadge from './DieselBadge';

const DieselPriceBadge = props => {
  const {value, message, muted, pending} = useFuelPrice();

  return (
    <DieselBadge
      value={value}
      message={message}
      muted={muted}
      loading={pending}
      {...props}
    />
  );
};

export default DieselPriceBadge;
