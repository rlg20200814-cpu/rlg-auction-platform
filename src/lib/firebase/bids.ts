import {
  ref,
  push,
  set,
  get,
  onValue,
  off,
  query,
  orderByChild,
  limitToLast,
  runTransaction,
} from 'firebase/database';
import { db } from './config';
import type { Bid, BidResult } from '@/types';

// =============================================
// Place Bid — Core Logic with Transaction
//
// Uses Firebase atomic transaction to prevent:
//  - Race conditions (two users bidding simultaneously)
//  - Duplicate bids from same user
//  - Bids below minimum increment
//  - Bids after auction ends
// =============================================

export async function placeBid(
  auctionId: string,
  userId: string,
  userName: string,
  userAvatar: string,
  bidAmount: number
): Promise<BidResult> {
  const auctionRef = ref(db, `auctions/${auctionId}`);

  let transactionResult: {
    committed: boolean;
    error?: string;
    extended?: boolean;
    newEndTime?: number;
  } = { committed: false };

  try {
    const txResult = await runTransaction(auctionRef, (currentAuction) => {
      // Abort if data not loaded yet
      if (currentAuction === null) return currentAuction;

      const now = Date.now();

      // ── Validation checks (abort if any fail) ──

      // 1. Auction must be active
      if (currentAuction.status !== 'active') {
        transactionResult.error = '競標尚未開始或已結束';
        return undefined; // abort
      }

      // 2. Auction must not have ended by time
      if (now >= currentAuction.endTime) {
        transactionResult.error = '競標已結束';
        return undefined;
      }

      // 3. Bid must meet minimum increment
      const minRequired = (currentAuction.currentPrice || currentAuction.startPrice) + currentAuction.minIncrement;
      if (bidAmount < minRequired) {
        transactionResult.error = `最低出價為 $${minRequired.toLocaleString()}`;
        return undefined;
      }

      // 4. Prevent same user from bidding twice in a row
      if (currentAuction.lastBidderId === userId) {
        transactionResult.error = '你已是目前最高出價者，無需再出價';
        return undefined;
      }

      // ── All checks passed, update auction ──

      const extended = (currentAuction.endTime - now) < 60_000;
      const newEndTime = extended ? now + 60_000 : currentAuction.endTime;

      transactionResult = {
        committed: true,
        extended,
        newEndTime,
      };

      return {
        ...currentAuction,
        currentPrice: bidAmount,
        bidCount: (currentAuction.bidCount || 0) + 1,
        lastBidderId: userId,
        lastBidderName: userName,
        endTime: newEndTime,
      };
    });

    if (!txResult.committed || !transactionResult.committed) {
      return {
        success: false,
        error: transactionResult.error || '出價失敗，請重試',
      };
    }

    // ── Record bid in bid log (non-atomic, best-effort) ──
    const bidsRef = ref(db, `bids/${auctionId}`);
    const newBidRef = push(bidsRef);
    await set(newBidRef, {
      userId,
      userName,
      userAvatar: userAvatar || '',
      amount: bidAmount,
      timestamp: Date.now(),
    });

    // ── Webhook notification (fire and forget) ──
    triggerBidWebhook(auctionId, userId, userName, bidAmount).catch(() => {});

    return {
      success: true,
      extended: transactionResult.extended,
      newEndTime: transactionResult.newEndTime,
    };
  } catch (err) {
    console.error('placeBid error:', err);
    return { success: false, error: '出價失敗，請稍後再試' };
  }
}

// =============================================
// Read Bids
// =============================================

export async function getBids(auctionId: string, limit = 50): Promise<Bid[]> {
  const bidsQuery = query(
    ref(db, `bids/${auctionId}`),
    orderByChild('timestamp'),
    limitToLast(limit)
  );
  const snapshot = await get(bidsQuery);
  if (!snapshot.exists()) return [];

  const bids: Bid[] = [];
  snapshot.forEach((child) => {
    bids.push({ id: child.key!, auctionId, ...child.val() } as Bid);
  });
  return bids.reverse(); // newest first
}

// =============================================
// Real-time Bid Subscription
// =============================================

export function subscribeToBids(
  auctionId: string,
  callback: (bids: Bid[]) => void,
  limit = 30
) {
  const bidsQuery = query(
    ref(db, `bids/${auctionId}`),
    orderByChild('timestamp'),
    limitToLast(limit)
  );

  const listener = onValue(bidsQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const bids: Bid[] = [];
    snapshot.forEach((child) => {
      bids.push({ id: child.key!, auctionId, ...child.val() } as Bid);
    });
    callback(bids.reverse());
  });

  return () => off(bidsQuery, 'value', listener);
}

// =============================================
// Get user's bid history
// =============================================

export async function getUserBids(userId: string): Promise<Bid[]> {
  // NOTE: Requires index on bids/{auctionId}/userId in Firebase rules
  // For now, this is a client-side approach
  return [];
}

// =============================================
// Webhook trigger (n8n / LINE Bot support)
// =============================================

async function triggerBidWebhook(
  auctionId: string,
  userId: string,
  userName: string,
  amount: number
): Promise<void> {
  const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'new_bid',
      auctionId,
      userId,
      userName,
      amount,
      timestamp: Date.now(),
    }),
  });
}
