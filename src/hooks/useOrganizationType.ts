import {useEffect, useState} from 'react';

import {getOrganizationType, onAuthStateChange} from '../config/api';

export default function useOrganizationType(): string | null {
  const [organizationType, setOrganizationType] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const read = (): void => {
      getOrganizationType()
        .then(value => {
          if (alive) setOrganizationType(value);
        })
        .catch(() => {
          // Unreadable store reads as "no session" everywhere else; same here.
          if (alive) setOrganizationType(null);
        });
    };

    read();
    const unsubscribe = onAuthStateChange(read);

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  return organizationType;
}
