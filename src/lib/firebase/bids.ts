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
    const bidTimestamp = Date.now();
    await set(newBidRef, {
      userId,
      userName,
      userAvatar: userAvatar || '',
      amount: bidAmount,
      timestamp: bidTimestamp,
    });

    // ── 取得 bidCount 以便 payload 完整 ──
    const auctionSnap = await get(ref(db, `auctions/${auctionId}`));
    const auctionData = auctionSnap.val();

    // ── 送出 bid_placed 事件（透過 /api/events 或直接 sendEvent）──
    // 在 client-side context：call /api/events（由 BidForm 呼叫）
    // 在 server-side context：直接 sendEvent（已在 bids/route.ts）
    triggerBidWebhook({
      auctionId,
      userId,
      userName,
      bidAmount,
      bidCount: auctionData?.bidCount || 1,
      productName: auctionData?.title || '',
      category: auctionData?.category || '',
      isExtended: transactionResult.extended || false,
      newEndTime: transactionResult.newEndTime || 0,
    }).catch(() => {});

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
// Webhook trigger — 送出 bid_placed 事件到 /api/events
// =============================================

interface BidWebhookParams {
  auctionId: string;
  userId: string;
  userName: string;
  bidAmount: number;
  bidCount: number;
  productName: string;
  category: string;
  isExtended: boolean;
  newEndTime: number;
}

async function triggerBidWebhook(params: BidWebhookParams): Promise<void> {
  // Server-side: 直接用 eventService（避免自己打自己）
  if (typeof window === 'undefined') {
    const { sendEvent, buildEvent } = await import('@/lib/eventService');
    const event = buildEvent({
      event_type: 'bid_placed',
      source_channel: 'web',
      platform_user_id: params.userId,
      auction_id: params.auctionId,
      product_name: params.productName,
      category: params.category,
      bid_amount: params.bidAmount,
      bid_count_in_auction: params.bidCount,
      is_extended: params.isExtended,
      new_end_time: params.newEndTime,
    } as Parameters<typeof buildEvent>[0]);
    await sendEvent(event);
    return;
  }

  // Client-side: 透過 /api/events（Firebase token 在 BidForm 傳入）
  // 注意：client-side 的 bid_placed 由 BidForm.tsx 直接呼叫 /api/events
  // 這裡的 triggerBidWebhook 在 client context 不做任何事（避免重複）
}
