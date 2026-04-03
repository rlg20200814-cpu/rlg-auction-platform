'use client';

import { useState, useEffect } from 'react';
import { subscribeToAuction } from '@/lib/firebase/auctions';
import type { Auction } from '@/types';

export function useAuction(auctionId: string) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auctionId) return;

    setLoading(true);
    const unsubscribe = subscribeToAuction(auctionId, (data) => {
      setAuction(data);
      setLoading(false);
      if (!data) setError('競標商品不存在');
    });

    return unsubscribe;
  }, [auctionId]);

  return { auction, loading, error };
}
