'use client';

import { useState, useEffect, useRef } from 'react';
import { formatCountdown } from '@/lib/utils';

export function useCountdown(endTime: number | undefined, onExpire?: () => void) {
  const [remaining, setRemaining] = useState(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!endTime) return;

    const tick = () => {
      const ms = endTime - Date.now();
      setRemaining(Math.max(0, ms));
      if (ms <= 0 && onExpireRef.current) {
        onExpireRef.current();
      }
    };

    tick(); // immediate update
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return formatCountdown(remaining);
}
