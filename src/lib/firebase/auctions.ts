import {
  ref,
  set,
  get,
  push,
  update,
  onValue,
  off,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  runTransaction,
  DataSnapshot,
} from 'firebase/database';
import { db } from './config';
import type { Auction, AuctionStatus } from '@/types';

// =============================================
// Read Operations
// =============================================

export async function getAuction(id: string): Promise<Auction | null> {
  const snapshot = await get(ref(db, `auctions/${id}`));
  if (!snapshot.exists()) return null;
  return { id: snapshot.key!, ...snapshot.val() } as Auction;
}

export async function getActiveAuctions(): Promise<Auction[]> {
  const snapshot = await get(
    query(ref(db, 'auctions'), orderByChild('status'), equalTo('active'))
  );
  if (!snapshot.exists()) return [];
  const auctions: Auction[] = [];
  snapshot.forEach((child) => {
    auctions.push({ id: child.key!, ...child.val() } as Auction);
  });
  return auctions.sort((a, b) => a.endTime - b.endTime);
}

export async function getAllAuctions(): Promise<Auction[]> {
  const snapshot = await get(ref(db, 'auctions'));
  if (!snapshot.exists()) return [];
  const auctions: Auction[] = [];
  snapshot.forEach((child) => {
    auctions.push({ id: child.key!, ...child.val() } as Auction);
  });
  return auctions.sort((a, b) => b.createdAt - a.createdAt);
}

// =============================================
// Real-time Subscriptions
// =============================================

export function subscribeToAuction(
  id: string,
  callback: (auction: Auction | null) => void
) {
  const auctionRef = ref(db, `auctions/${id}`);
  const listener = onValue(auctionRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({ id: snapshot.key!, ...snapshot.val() } as Auction);
  });
  // Return unsubscribe function
  return () => off(auctionRef, 'value', listener);
}

export function subscribeToAuctions(
  callback: (auctions: Auction[]) => void,
  statusFilter?: AuctionStatus
) {
  const auctionsRef = statusFilter
    ? query(ref(db, 'auctions'), orderByChild('status'), equalTo(statusFilter))
    : ref(db, 'auctions');

  const listener = onValue(auctionsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const auctions: Auction[] = [];
    snapshot.forEach((child) => {
      auctions.push({ id: child.key!, ...child.val() } as Auction);
    });
    callback(auctions.sort((a, b) => a.endTime - b.endTime));
  });

  return () => off(auctionsRef, 'value', listener);
}

// =============================================
// Write Operations (Admin)
// =============================================

export async function createAuction(
  data: Omit<Auction, 'id'>
): Promise<string> {
  const auctionsRef = ref(db, 'auctions');
  const newRef = push(auctionsRef);
  await set(newRef, data);
  return newRef.key!;
}

export async function updateAuction(
  id: string,
  data: Partial<Auction>
): Promise<void> {
  await update(ref(db, `auctions/${id}`), data);
}

export async function setAuctionStatus(
  id: string,
  status: AuctionStatus
): Promise<void> {
  await update(ref(db, `auctions/${id}`), { status });
}

// =============================================
// Auction End Logic (called server-side or via cron)
// =============================================

export async function finalizeAuction(auctionId: string): Promise<void> {
  const auction = await getAuction(auctionId);
  if (!auction || auction.status === 'ended') return;

  await update(ref(db, `auctions/${auctionId}`), {
    status: 'ended' as AuctionStatus,
    winnerId: auction.lastBidderId,
    winnerName: auction.lastBidderName,
  });

  // ── 送出 bid_won 事件（server-side only）──────────────────────────────
  if (typeof window === 'undefined' && auction.lastBidderId) {
    const { sendEvent, buildEvent } = await import('@/lib/eventService');
    const endedAt = new Date().toISOString();

    // 得標者：bid_won
    const wonEvent = buildEvent({
      event_type: 'bid_won',
      source_channel: 'admin',
      platform_user_id: auction.lastBidderId,
      auction_id: auctionId,
      product_name: auction.title,
      category: auction.category || '',
      final_price: auction.currentPrice,
      total_bid_count: auction.bidCount,
      ended_at: endedAt,
    } as Parameters<typeof buildEvent>[0]);
    await sendEvent(wonEvent).catch(() => {});

    // 得標者自動建立訂單事件
    const orderId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${auctionId.slice(-4).toUpperCase()}`;
    const orderEvent = buildEvent({
      event_type: 'order_created',
      source_channel: 'admin',
      platform_user_id: auction.lastBidderId,
      order_id: orderId,
      auction_id: auctionId,
      product_name: auction.title,
      amount: auction.currentPrice,
      payment_status: 'pending',
      shipping_status: 'pending',
    } as Parameters<typeof buildEvent>[0]);
    await sendEvent(orderEvent).catch(() => {});
  }
}

// =============================================
// View Count
// =============================================

export async function incrementViewCount(auctionId: string): Promise<void> {
  const viewRef = ref(db, `auctions/${auctionId}/viewCount`);
  await runTransaction(viewRef, (current) => (current || 0) + 1);
}
