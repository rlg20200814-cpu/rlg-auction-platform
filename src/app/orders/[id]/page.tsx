'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getOrder } from '@/lib/firebase/orders';
import { formatCurrency, getImagePlaceholder } from '@/lib/utils';
import Header from '@/components/layout/Header';
import { CheckCircle, Clock, Banknote, CreditCard, Copy, Check } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';

const STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  pending_payment: { label: '待付款', color: 'text-yellow-400' },
  paid:            { label: '已付款', color: 'text-green-400' },
  processing:      { label: '處理中', color: 'text-blue-400' },
  shipped:         { label: '已出貨', color: 'text-purple-400' },
  completed:       { label: '已完成', color: 'text-emerald-400' },
  cancelled:       { label: '已取消', color: 'text-red-400' },
};

const BANK_NAME    = process.env.NEXT_PUBLIC_BANK_NAME    ?? '玉山銀行';
const BANK_CODE    = process.env.NEXT_PUBLIC_BANK_CODE    ?? '808';
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? '請聯繫賣家取得帳號';
const BANK_HOLDER  = process.env.NEXT_PUBLIC_BANK_HOLDER  ?? 'RLG REPTILE';

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const fromEcpay = searchParams.get('ecpay') === '1';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getOrder(id).then(o => {
      setOrder(o);
      setLoading(false);
    });
  }, [id]);

  const copyAccount = () => {
    navigator.clipboard.writeText(BANK_ACCOUNT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 mt-14 space-y-4">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-40 w-full" />
          <div className="skeleton h-32 w-full" />
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] mt-14 gap-4">
          <p className="text-white/30 font-mono text-sm">訂單不存在</p>
          <Link href="/shop" className="text-white/50 hover:text-white underline text-sm">返回商城</Link>
        </div>
      </>
    );
  }

  const statusInfo = STATUS_LABELS[order.status];
  const isBankTransfer = order.paymentMethod === 'bank_transfer';
  const isPaid = ['paid', 'processing', 'shipped', 'completed'].includes(order.status);

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10 mt-14 pb-20 md:pb-10 space-y-6">

        {/* Success header */}
        <div className="text-center space-y-3 py-4">
          <CheckCircle className="w-12 h-12 mx-auto text-green-400" />
          <h1 className="text-xl font-bold text-white">
            {fromEcpay && isPaid ? '付款成功！' : '訂單已建立'}
          </h1>
          <p className="text-white/40 text-sm font-mono">訂單編號：{order.orderNumber}</p>
        </div>

        {/* Status */}
        <div className="border border-white/10 p-5 bg-brand-gray-900 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-widest font-mono mb-1">訂單狀態</p>
            <p className={`font-semibold text-lg ${statusInfo.color}`}>{statusInfo.label}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/25 uppercase tracking-widest font-mono mb-1">付款方式</p>
            <p className="text-sm text-white/70 flex items-center gap-1.5 justify-end">
              {isBankTransfer
                ? <><Banknote className="w-4 h-4" />ATM 匯款</>
                : <><CreditCard className="w-4 h-4" />信用卡</>
              }
            </p>
          </div>
        </div>

        {/* Bank transfer instructions */}
        {isBankTransfer && order.status === 'pending_payment' && (
          <div className="border border-yellow-900/50 bg-yellow-950/20 p-5 space-y-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <Clock className="w-4 h-4" />
              <span className="font-semibold text-sm">請於 3 天內完成匯款</span>
            </div>

            <div className="space-y-3">
              {[
                { label: '銀行', value: `${BANK_NAME}（${BANK_CODE}）` },
                { label: '戶名', value: BANK_HOLDER },
                { label: '帳號', value: BANK_ACCOUNT },
                { label: '金額', value: formatCurrency(order.totalAmount) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-[11px] text-yellow-400/60 uppercase tracking-widest font-mono">{label}</span>
                  <span className="text-sm text-white font-mono">{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={copyAccount}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-yellow-800/50 text-yellow-400 text-[11px] uppercase tracking-widest font-mono hover:bg-yellow-900/20 transition-all"
            >
              {copied ? <><Check className="w-3.5 h-3.5" />已複製帳號</> : <><Copy className="w-3.5 h-3.5" />複製帳號</>}
            </button>

            <p className="text-[11px] text-white/30 leading-relaxed">
              匯款完成後，我們將於確認後 24 小時內安排出貨，並透過 LINE 或 Email 通知您。
            </p>
          </div>
        )}

        {/* Order items */}
        <div className="border border-white/10 p-5 bg-brand-gray-900 space-y-4">
          <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30">訂購商品</h2>

          <div className="space-y-3">
            {order.items.map(item => {
              const image = item.image || getImagePlaceholder(item.title);
              return (
                <div key={item.productId} className="flex gap-3">
                  <div className="relative w-14 h-14 shrink-0 overflow-hidden bg-black">
                    <Image src={image} alt={item.title} fill className="object-cover" sizes="56px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80">{item.title}</p>
                    <p className="text-[11px] text-white/30 font-mono">×{item.quantity}</p>
                  </div>
                  <p className="font-mono text-sm text-white">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              );
            })}
          </div>

          {/* Amount breakdown */}
          <div className="border-t border-white/8 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-white/40">
              <span>小計</span>
              <span className="font-mono">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-white/40 text-xs">
              <span>運費 ({order.shippingMethod === 'face_to_face' ? '面交' : '郵寄'})</span>
              <span className="font-mono">{order.shippingFee === 0 ? '免費' : formatCurrency(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between font-bold pt-1 border-t border-white/8">
              <span className="text-[10px] uppercase tracking-widest font-mono text-white/40">合計</span>
              <span className="font-mono text-white tabular-nums">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Buyer info */}
        <div className="border border-white/10 p-5 bg-brand-gray-900 space-y-3">
          <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30">聯絡資訊</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: '姓名', value: order.buyerName },
              { label: '手機', value: order.buyerPhone },
              { label: 'Email', value: order.buyerEmail },
              { label: '地址', value: order.shippingAddress || '面交' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-white/25 uppercase tracking-widest font-mono mb-0.5">{label}</p>
                <p className="text-white/70 text-sm break-all">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/shop" className="flex-1 text-center py-3 border border-white/15 text-white/40 text-[11px] tracking-widest uppercase font-mono hover:text-white hover:border-white/40 transition-all">
            繼續購物
          </Link>
          <Link href="/" className="flex-1 text-center py-3 bg-white text-black font-bold text-[11px] tracking-widest uppercase hover:bg-brand-red hover:text-white transition-all">
            回到首頁
          </Link>
        </div>
      </main>
    </>
  );
}
