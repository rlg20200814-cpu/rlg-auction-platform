'use client';

import { useState, useEffect } from 'react';
import { subscribeToBids } from '@/lib/firebase/bids';
import type { Bid } from '@/types';

export function useBids(auctionId: string, limit = 30) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auctionId) return;

    setLoading(true);
    const unsubscribe = subscribeToBids(
      auctionId,
      (data) => {
        setBids(data);
        setLoading(false);
      },
      limit
    );

    return unsubscribe;
  }, [auctionId, limit]);

  return { bids, loading };
}
