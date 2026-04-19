'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/layout/Header';
import { formatCurrency, getImagePlaceholder } from '@/lib/utils';
import { Banknote, CreditCard, ChevronRight, Lock } from 'lucide-react';

type ShippingMethod = 'mail' | 'face_to_face';
type PaymentMethod = 'bank_transfer' | 'credit_card';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const ecpayFormRef = useRef<HTMLFormElement>(null);

  const [form, setForm] = useState({
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    shippingAddress: '',
    note: '',
  });
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('mail');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ECPay form fields (set before auto-submit)
  const [ecpayData, setEcpayData] = useState<{ action: string; fields: Record<string, string> } | null>(null);

  const shippingFee = shippingMethod === 'face_to_face' ? 0 : 100;
  const totalAmount = total + shippingFee;

  if (items.length === 0) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] mt-14 gap-4">
          <p className="text-white/30 font-mono tracking-widest text-sm">購物車是空的</p>
          <Link href="/shop" className="text-white/50 hover:text-white underline text-sm">前往商城</Link>
        </div>
      </>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // 1. 建立訂單
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          shippingMethod,
          paymentMethod,
          items: items.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || '下單失敗，請稍後再試');
        setSubmitting(false);
        return;
      }

      const { orderId, orderNumber, totalAmount: amount } = orderData;
      clearCart();

      if (paymentMethod === 'bank_transfer') {
        // 直接跳轉到訂單確認頁（顯示匯款資訊）
        router.push(`/orders/${orderId}`);
        return;
      }

      // 2. 刷卡 → 取得 ECPay 表單並自動提交
      const itemName = items.map(i => i.product.title).join('#');
      const payRes = await fetch('/api/payment/ecpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, orderNumber, totalAmount: amount, itemName }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        setError(payData.error || '無法連接付款系統');
        setSubmitting(false);
        return;
      }

      // 設定表單資料後，由 useEffect 觸發提交
      setEcpayData(payData);

      // 使用 setTimeout 確保 DOM 更新後再提交
      setTimeout(() => {
        ecpayFormRef.current?.submit();
      }, 100);

    } catch (err) {
      setError('網路錯誤，請稍後再試');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />

      {/* ECPay hidden form（刷卡時自動提交） */}
      {ecpayData && (
        <form ref={ecpayFormRef} method="POST" action={ecpayData.action} style={{ display: 'none' }}>
          {Object.entries(ecpayData.fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        </form>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8 mt-14 pb-20 md:pb-8">
        <h1 className="font-mono text-[11px] tracking-[0.3em] uppercase text-white/30 mb-6">CHECKOUT</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6">
            {/* Left: Form */}
            <div className="space-y-6">
              {/* Buyer info */}
              <section className="border border-white/10 p-5 space-y-4 bg-brand-gray-900">
                <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40">聯絡資訊</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-white/30 tracking-widest uppercase font-mono mb-1.5">姓名 *</label>
                    <input
                      name="buyerName" value={form.buyerName} onChange={handleChange}
                      required placeholder="王小明"
                      className="w-full bg-black border border-white/15 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-white/40 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/30 tracking-widest uppercase font-mono mb-1.5">手機 *</label>
                    <input
                      name="buyerPhone" value={form.buyerPhone} onChange={handleChange}
                      required placeholder="0912345678" type="tel"
                      className="w-full bg-black border border-white/15 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-white/40 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-white/30 tracking-widest uppercase font-mono mb-1.5">Email *</label>
                  <input
                    name="buyerEmail" value={form.buyerEmail} onChange={handleChange}
                    required placeholder="email@example.com" type="email"
                    className="w-full bg-black border border-white/15 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-white/40 focus:outline-none transition-colors"
                  />
                </div>
              </section>

              {/* Shipping method */}
              <section className="border border-white/10 p-5 space-y-4 bg-brand-gray-900">
                <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40">運送方式</h2>

                <div className="space-y-2">
                  {[
                    { value: 'mail', label: '郵寄到府', desc: '費用 $100，3–5 個工作天', fee: 100 },
                    { value: 'face_to_face', label: '面交', desc: '雙方約定時間地點，免運費', fee: 0 },
                  ].map(opt => (
                    <label key={opt.value} className={`flex items-center gap-3 p-4 border cursor-pointer transition-all ${shippingMethod === opt.value ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/30'}`}>
                      <input
                        type="radio" name="shippingMethod" value={opt.value}
                        checked={shippingMethod === opt.value}
                        onChange={() => setShippingMethod(opt.value as ShippingMethod)}
                        className="accent-white"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{opt.label}</p>
                        <p className="text-[11px] text-white/40">{opt.desc}</p>
                      </div>
                      <span className="font-mono text-sm text-white/60">
                        {opt.fee === 0 ? '免費' : `+${formatCurrency(opt.fee)}`}
                      </span>
                    </label>
                  ))}
                </div>

                {shippingMethod === 'mail' && (
                  <div>
                    <label className="block text-[10px] text-white/30 tracking-widest uppercase font-mono mb-1.5">收件地址 *</label>
                    <input
                      name="shippingAddress" value={form.shippingAddress} onChange={handleChange}
                      required={shippingMethod === 'mail'}
                      placeholder="台北市中正區忠孝東路一段1號"
                      className="w-full bg-black border border-white/15 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-white/40 focus:outline-none transition-colors"
                    />
                  </div>
                )}

                {shippingMethod === 'face_to_face' && (
                  <div>
                    <label className="block text-[10px] text-white/30 tracking-widest uppercase font-mono mb-1.5">面交地區 / 備註</label>
                    <input
                      name="shippingAddress" value={form.shippingAddress} onChange={handleChange}
                      placeholder="如：台北市、板橋等"
                      className="w-full bg-black border border-white/15 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-white/40 focus:outline-none transition-colors"
                    />
                  </div>
                )}
              </section>

              {/* Payment method */}
              <section className="border border-white/10 p-5 space-y-4 bg-brand-gray-900">
                <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40">付款方式</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-4 border cursor-pointer transition-all ${paymentMethod === 'bank_transfer' ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/30'}`}>
                    <input
                      type="radio" name="paymentMethod" value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="accent-white"
                    />
                    <Banknote className="w-5 h-5 text-white/60 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">ATM 匯款</p>
                      <p className="text-[11px] text-white/40">下單後提供帳號資訊</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-4 border cursor-pointer transition-all ${paymentMethod === 'credit_card' ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/30'}`}>
                    <input
                      type="radio" name="paymentMethod" value="credit_card"
                      checked={paymentMethod === 'credit_card'}
                      onChange={() => setPaymentMethod('credit_card')}
                      className="accent-white"
                    />
                    <CreditCard className="w-5 h-5 text-white/60 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">信用卡</p>
                      <p className="text-[11px] text-white/40">綠界 ECPay 安全付款</p>
                    </div>
                  </label>
                </div>

                {paymentMethod === 'credit_card' && (
                  <p className="text-[11px] text-white/30 flex items-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    信用卡資訊由綠界科技加密處理，本站不儲存任何卡號
                  </p>
                )}
              </section>

              {/* Note */}
              <section className="border border-white/10 p-5 bg-brand-gray-900">
                <label className="block text-[10px] text-white/30 tracking-widest uppercase font-mono mb-2">備註（選填）</label>
                <textarea
                  name="note" value={form.note} onChange={handleChange}
                  placeholder="有特別需求或問題請在此說明"
                  rows={3}
                  className="w-full bg-black border border-white/15 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-white/40 focus:outline-none transition-colors resize-none"
                />
              </section>

              {error && (
                <p className="text-red-400 text-sm border border-red-900/50 bg-red-950/30 px-4 py-3">{error}</p>
              )}
            </div>

            {/* Right: Order summary */}
            <div className="space-y-4">
              <div className="border border-white/10 p-5 space-y-4 bg-brand-gray-900 sticky top-20">
                <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30">訂單明細</h2>

                {/* Items */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map(({ product, quantity }) => {
                    const image = product.images?.[0] || getImagePlaceholder(product.title);
                    return (
                      <div key={product.id} className="flex gap-3">
                        <div className="relative w-12 h-12 shrink-0 overflow-hidden bg-black">
                          <Image src={image} alt={product.title} fill className="object-cover" sizes="48px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/80 line-clamp-1">{product.title}</p>
                          <p className="text-[11px] text-white/30 font-mono">×{quantity}</p>
                        </div>
                        <p className="font-mono text-sm text-white shrink-0">{formatCurrency(product.price * quantity)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="border-t border-white/8 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-white/50">
                    <span>小計</span>
                    <span className="font-mono">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-white/40 text-xs">
                    <span>運費</span>
                    <span className="font-mono">{shippingFee === 0 ? '免費' : `+${formatCurrency(shippingFee)}`}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-white/8">
                    <span className="text-[10px] uppercase tracking-widest font-mono text-white/50">合計</span>
                    <span className="font-mono text-white text-lg tabular-nums">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-black font-bold tracking-[0.15em] uppercase text-sm hover:bg-brand-red hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="animate-pulse">處理中...</span>
                  ) : (
                    <>
                      確認下單
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <Link href="/cart" className="block text-center text-[11px] font-mono uppercase tracking-widest text-white/25 hover:text-white transition-colors">
                  ← 返回購物車
                </Link>
              </div>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
