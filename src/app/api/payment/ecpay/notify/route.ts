/**
 * POST /api/payment/ecpay/notify
 * 綠界付款完成後的 Server 端通知（ReturnURL）
 * 必須回傳 "1|OK" 表示收到
 */

import { NextRequest } from 'next/server';
import { verifyCheckMacValue } from '@/lib/ecpay';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const params: Record<string, string> = Object.fromEntries(
      new URLSearchParams(text).entries()
    );

    const hashKey = process.env.ECPAY_HASH_KEY ?? '';
    const hashIV = process.env.ECPAY_HASH_IV ?? '';

    // 驗證簽章
    if (!verifyCheckMacValue(params, hashKey, hashIV)) {
      console.warn('[ecpay/notify] CheckMacValue mismatch');
      return new Response('0|CheckMacValue error', { status: 200 });
    }

    const { MerchantTradeNo, RtnCode, TradeNo } = params;
    const isPaid = RtnCode === '1';

    const db = adminDb();

    // 用 MerchantTradeNo（= orderNumber）查對應的 orderId
    const mapSnap = await db.ref(`ecpayOrders/${MerchantTradeNo}`).once('value');
    const orderId: string | null = mapSnap.val();

    if (orderId && isPaid) {
      await db.ref(`orders/${orderId}`).update({
        status: 'paid',
        paymentId: TradeNo,
        updatedAt: Date.now(),
      });
    }

    return new Response('1|OK', { status: 200 });
  } catch (err) {
    console.error('[ecpay/notify]', err);
    return new Response('0|Error', { status: 200 }); // ECPay 要求永遠回 200
  }
}
