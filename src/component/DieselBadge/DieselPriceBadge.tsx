import React from 'react';

import {useFuelPrice} from '../../services/fuelPrice';
import DieselBadge from './DieselBadge';
import type {DieselBadgeProps} from './DieselBadge';


export type DieselPriceBadgeProps = Omit<
  DieselBadgeProps,
  'value' | 'message' | 'muted' | 'loading'
>;

const DieselPriceBadge = (props: DieselPriceBadgeProps) => {
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
