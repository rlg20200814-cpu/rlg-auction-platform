/**
 * GET /api/cron/auction-notify
 * Vercel Cron Job — 每分鐘執行一次
 *
 * 功能：
 * 1. 結標前 60 分鐘提醒所有出價者
 * 2. 結標前 10 分鐘提醒所有出價者
 * 3. 結標前 1 分鐘提醒所有出價者
 * 4. 結標後通知得標者
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { multicast, pushMessage, extractLineUserId } from '@/lib/line/messaging';
import { finalizeAuction } from '@/lib/firebase/auctions';

// 通知類型
type NotifyType = '60min' | '10min' | '1min' | 'ended';

// 各通知的時間視窗（距離結標幾毫秒內觸發）
const NOTIFY_WINDOWS: Record<NotifyType, { target: number; window: number }> = {
  '60min': { target: 60 * 60 * 1000, window: 60 * 1000 },   // 60min ± 1min
  '10min': { target: 10 * 60 * 1000, window: 60 * 1000 },   // 10min ± 1min
  '1min':  { target:  1 * 60 * 1000, window: 60 * 1000 },   //  1min ± 1min
  'ended': { target: 0,              window: 0 },            // 已結束
};

export async function GET(req: NextRequest) {
  // ── 驗證 Cron Secret ───────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = adminDb();
  const now = Date.now();
  const results: string[] = [];

  try {
    // ── 取得所有 active 競標 ─────────────────────────────────────────────
    const auctionsSnap = await db.ref('auctions').orderByChild('status').equalTo('active').once('value');
    if (!auctionsSnap.exists()) {
      return NextResponse.json({ ok: true, message: 'No active auctions' });
    }

    const auctions: Record<string, any> = auctionsSnap.val();

    for (const [auctionId, auction] of Object.entries(auctions)) {
      const timeLeft = auction.endTime - now;

      // ── 結標處理 ──────────────────────────────────────────────────────
      if (timeLeft <= 0) {
        const alreadyNotified = await checkNotified(db, auctionId, 'ended');
        if (!alreadyNotified) {
          await markNotified(db, auctionId, 'ended');
          // 結標
          await finalizeAuction(auctionId);
          // 通知得標者
          if (auction.lastBidderId) {
            const lineId = extractLineUserId(auction.lastBidderId);
            if (lineId) {
              await pushMessage(lineId,
                `🏆 恭喜得標！\n\n商品：${auction.title}\n得標價：$${auction.currentPrice?.toLocaleString()}\n\n請等候賣家聯繫付款及出貨資訊。`
              );
            }
          }
          results.push(`${auctionId}: ended + winner notified`);
        }
        continue;
      }

      // ── 結標前提醒 ────────────────────────────────────────────────────
      for (const [type, { target, window }] of Object.entries(NOTIFY_WINDOWS) as [NotifyType, typeof NOTIFY_WINDOWS[NotifyType]][]) {
        if (type === 'ended') continue;
        if (Math.abs(timeLeft - target) > window) continue;

        const alreadyNotified = await checkNotified(db, auctionId, type);
        if (alreadyNotified) continue;

        await markNotified(db, auctionId, type);

        // 取得所有出價者的 LINE userId
        const lineIds = await getBidderLineIds(db, auctionId);
        if (lineIds.length === 0) continue;

        const label = type === '60min' ? '1 小時' : type === '10min' ? '10 分鐘' : '1 分鐘';
        const msg =
          `⏰ 競標提醒\n\n「${auction.title}」將在 ${label} 後結標！\n` +
          `目前最高出價：$${auction.currentPrice?.toLocaleString() ?? auction.startPrice?.toLocaleString()}\n\n` +
          `趕快出價，別讓別人搶走！\nhttps://rlg-auction-platform.vercel.app/auction/${auctionId}`;

        await multicast(lineIds, msg);
        results.push(`${auctionId}: ${type} reminder → ${lineIds.length} users`);
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error('[auction-notify cron] error:', err);
    return NextResponse.json({ ok: false, error: String(err) });
  }
}

// ── 工具函式 ──────────────────────────────────────────────────────────────

/** 檢查是否已發送過通知 */
async function checkNotified(db: ReturnType<typeof adminDb>, auctionId: string, type: NotifyType): Promise<boolean> {
  const snap = await db.ref(`auctionNotifications/${auctionId}/${type}`).once('value');
  return snap.exists();
}

/** 標記已發送通知 */
async function markNotified(db: ReturnType<typeof adminDb>, auctionId: string, type: NotifyType): Promise<void> {
  await db.ref(`auctionNotifications/${auctionId}/${type}`).set(Date.now());
}

/** 取得該競標所有出價者中有 LINE 帳號的 userId */
async function getBidderLineIds(db: ReturnType<typeof adminDb>, auctionId: string): Promise<string[]> {
  const bidsSnap = await db.ref(`bids/${auctionId}`).once('value');
  if (!bidsSnap.exists()) return [];

  const seen = new Set<string>();
  bidsSnap.forEach((child) => {
    const userId: string = child.val().userId || '';
    const lineId = extractLineUserId(userId);
    if (lineId) seen.add(lineId);
  });

  return Array.from(seen);
}
