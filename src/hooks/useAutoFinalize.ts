'use client';

import { useEffect, useRef } from 'react';
import type { Auction } from '@/types';

/**
 * 自動偵測已過期但狀態仍為 active 的競標，並呼叫 finalize API。
 * 在任何有 auctions 列表的頁面引入，確保即使無人開著競標詳情頁也能自動結標。
 */
export function useAutoFinalize(auctions: Auction[]) {
  // 記錄已觸發過的 auctionId，避免重複呼叫
  const triggered = useRef<Set<string>>(new Set());

  useEffect(() => {
    const now = Date.now();
    const expired = auctions.filter(
      (a) => a.status === 'active' && a.endTime <= now + 2000 // +2s 緩衝
    );

    for (const auction of expired) {
      if (triggered.current.has(auction.id)) continue;
      triggered.current.add(auction.id);

      fetch('/api/auctions/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId: auction.id }),
      }).catch(() => {});
    }
  }, [auctions]);

  // 每 10 秒重新掃描一次（補抓在這頁面停留期間到期的競標）
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const expired = auctions.filter(
        (a) => a.status === 'active' && a.endTime <= now + 2000
      );
      for (const auction of expired) {
        if (triggered.current.has(auction.id)) continue;
        triggered.current.add(auction.id);
        fetch('/api/auctions/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auctionId: auction.id }),
        }).catch(() => {});
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [auctions]);
}
