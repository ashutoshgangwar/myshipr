import React from 'react';

import {useFuelPrice} from '../../services/fuelPrice';
import DieselBadge from './DieselBadge';
import type {DieselBadgeProps} from './DieselBadge';

/**
 * The live-price wrapper: it owns the fetch and forwards everything else, so
 * it takes every DieselBadge prop except the four it supplies itself.
 */
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
