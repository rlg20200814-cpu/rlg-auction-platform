import { NextRequest, NextResponse } from 'next/server';
import { placeBid } from '@/lib/firebase/bids';

/**
 * POST /api/bids
 * Alternative server-side bid endpoint.
 * Primarily used for server-side webhook triggers and rate limiting.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { auctionId, userId, userName, userAvatar, bidAmount } = body;

    if (!auctionId || !userId || !bidAmount) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
    }

    if (typeof bidAmount !== 'number' || bidAmount < 0) {
      return NextResponse.json({ success: false, error: '出價金額無效' }, { status: 400 });
    }

    const result = await placeBid(auctionId, userId, userName, userAvatar, bidAmount);

    if (!result.success) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Bid API error:', err);
    return NextResponse.json({ success: false, error: '伺服器錯誤' }, { status: 500 });
  }
}
