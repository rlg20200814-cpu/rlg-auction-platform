/**
 * POST /api/payment/ecpay
 * 產生送往綠界的付款表單欄位
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildECPayForm } from '@/lib/ecpay';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { orderId, orderNumber, totalAmount, itemName } = await req.json();

    const hashKey = process.env.ECPAY_HASH_KEY;
    const hashIV = process.env.ECPAY_HASH_IV;
    const merchantId = process.env.ECPAY_MERCHANT_ID;

    if (!hashKey || !hashIV || !merchantId) {
      return NextResponse.json(
        { error: '尚未設定 ECPay 環境變數，請聯繫管理員' },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const isTest = process.env.ECPAY_IS_TEST === 'true';

    const formData = buildECPayForm({
      merchantId,
      merchantTradeNo: orderNumber,   // 以訂單編號作為 MerchantTradeNo
      tradeDesc: 'RLG REPTILE 購物',
      itemName,
      totalAmount,
      returnUrl: `${siteUrl}/api/payment/ecpay/notify`,
      orderResultUrl: `${siteUrl}/orders/${orderId}?ecpay=1`,
      hashKey,
      hashIV,
      isTest,
    });

    // 儲存 merchantTradeNo → orderId 的對應，供 notify 使用
    const db = adminDb();
    await db.ref(`ecpayOrders/${orderNumber}`).set(orderId);

    return NextResponse.json(formData);
  } catch (err) {
    console.error('[payment/ecpay]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
