/**
 * POST /api/auctions/finalize
 * 前端倒數結束後呼叫，觸發結標邏輯
 * 任何人都能呼叫，但 finalizeAuction 內部有冪等保護（已結標就跳過）
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { finalizeAuction } from '@/lib/firebase/auctions';
import { pushMessage, extractLineUserId } from '@/lib/line/messaging';

export async function POST(req: NextRequest) {
  try {
    const { auctionId } = await req.json();
    if (!auctionId) {
      return NextResponse.json({ error: '缺少 auctionId' }, { status: 400 });
    }

    const db = adminDb();
    const snap = await db.ref(`auctions/${auctionId}`).once('value');
    if (!snap.exists()) {
      return NextResponse.json({ error: '競標不存在' }, { status: 404 });
    }

    const auction = snap.val();

    // 尚未到結標時間，且還有超過 5 秒緩衝，拒絕提前結標
    if (auction.endTime - Date.now() > 5000) {
      return NextResponse.json({ error: '競標尚未結束' }, { status: 400 });
    }

    // 已結標就直接回傳（冪等）
    if (auction.status === 'ended') {
      return NextResponse.json({ ok: true, alreadyEnded: true });
    }

    // 執行結標
    await finalizeAuction(auctionId);

    // 通知得標者（LINE push）
    if (auction.lastBidderId) {
      const lineId = extractLineUserId(auction.lastBidderId);
      if (lineId) {
        await pushMessage(
          lineId,
          `🏆 恭喜得標！\n\n商品：${auction.title}\n得標價：$${auction.currentPrice?.toLocaleString()}\n\n請等候賣家聯繫付款及出貨資訊。`
        ).catch(() => {});
      }
    }

    // 標記 cron 不要重複處理
    await db.ref(`auctionNotifications/${auctionId}/ended`).set(Date.now());

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[finalize] error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
