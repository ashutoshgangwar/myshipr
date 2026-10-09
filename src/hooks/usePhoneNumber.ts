import {useEffect, useState} from 'react';

import {getPhoneNumber, onAuthStateChange} from '../config/api';

export default function usePhoneNumber(): string | null {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const read = (): void => {
      getPhoneNumber()
        .then(value => {
          if (alive) setPhoneNumber(value);
        })
        .catch(() => {
          // Unreadable store reads as "no session" everywhere else; same here.
          if (alive) setPhoneNumber(null);
        });
    };

    read();
    const unsubscribe = onAuthStateChange(read);

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  return phoneNumber;
}
