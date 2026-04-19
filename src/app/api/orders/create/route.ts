/**
 * POST /api/orders/create
 * 建立訂單：驗證庫存 → 扣庫存（transaction）→ 寫入 order
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

function generateOrderNumber(): string {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RLG${ts}${rand}`; // 15 chars, alphanumeric
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      buyerName, buyerEmail, buyerPhone,
      shippingAddress, shippingMethod,
      items,          // [{ productId, quantity }]
      paymentMethod,
      note,
    } = body;

    if (!buyerName || !buyerEmail || !buyerPhone || !shippingAddress || !items?.length) {
      return NextResponse.json({ error: '請填寫完整資料' }, { status: 400 });
    }

    const db = adminDb();

    // ── 1. 讀取商品資料並驗證庫存 ──────────────────────────────────
    const orderItems = [];
    let subtotal = 0;

    for (const { productId, quantity } of items) {
      const snap = await db.ref(`products/${productId}`).once('value');
      if (!snap.exists()) {
        return NextResponse.json({ error: `商品 ${productId} 不存在` }, { status: 400 });
      }
      const product = snap.val();
      if (product.status !== 'available' || product.stock < quantity) {
        return NextResponse.json(
          { error: `「${product.title}」庫存不足` },
          { status: 400 }
        );
      }
      subtotal += product.price * quantity;
      orderItems.push({
        productId,
        title: product.title,
        price: product.price,
        quantity,
        image: product.images?.[0] ?? '',
      });
    }

    const shippingFee = shippingMethod === 'face_to_face' ? 0 : 100;
    const totalAmount = subtotal + shippingFee;
    const orderNumber = generateOrderNumber();

    // ── 2. 扣庫存（transaction 保證原子性）──────────────────────────
    for (const { productId, quantity } of items) {
      let insufficient = false;
      await db.ref(`products/${productId}/stock`).transaction((current: number | null) => {
        if (current === null || current < quantity) {
          insufficient = true;
          return; // abort
        }
        return current - quantity;
      });
      if (insufficient) {
        return NextResponse.json({ error: '庫存不足，請重新整理後再試' }, { status: 409 });
      }
    }

    // ── 3. 如果庫存歸零，更新商品狀態 ───────────────────────────────
    for (const { productId } of items) {
      const stockSnap = await db.ref(`products/${productId}/stock`).once('value');
      if ((stockSnap.val() ?? 0) === 0) {
        await db.ref(`products/${productId}`).update({ status: 'sold_out', updatedAt: Date.now() });
      }
    }

    // ── 4. 寫入訂單 ──────────────────────────────────────────────────
    const orderData = {
      orderNumber,
      buyerName,
      buyerEmail,
      buyerPhone,
      shippingAddress,
      shippingMethod,
      items: orderItems,
      subtotal,
      shippingFee,
      totalAmount,
      paymentMethod,
      status: 'pending_payment',
      note: note || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const orderRef = db.ref('orders').push();
    await orderRef.set(orderData);
    const orderId = orderRef.key!;

    return NextResponse.json({ orderId, orderNumber, totalAmount, paymentMethod });
  } catch (err) {
    console.error('[orders/create]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
