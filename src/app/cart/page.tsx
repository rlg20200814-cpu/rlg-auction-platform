'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/layout/Header';
import { formatCurrency, getImagePlaceholder } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { items, count, total, updateQty, removeFromCart } = useCart();

  if (count === 0) {
    return (
      <>
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-16 mt-14 text-center space-y-6">
          <ShoppingCart className="w-16 h-16 mx-auto text-white/10" />
          <p className="text-white/30 font-mono tracking-widest uppercase text-sm">購物車是空的</p>
          <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold tracking-wider uppercase text-sm hover:bg-brand-red hover:text-white transition-all">
            前往商城
            <ArrowRight className="w-4 h-4" />
          </Link>
        </main>
      </>
    );
  }

  const shippingFee = 100; // 郵寄費用，面交在結帳頁選擇

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 mt-14 pb-20 md:pb-8">
        <h1 className="font-mono text-[11px] tracking-[0.3em] uppercase text-white/30 mb-6">
          SHOPPING CART · {count} 件商品
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
          {/* Cart items */}
          <div className="space-y-3">
            {items.map(({ product, quantity }) => {
              const image = product.images?.[0] || getImagePlaceholder(product.title);
              return (
                <div key={product.id} className="flex gap-4 border border-white/10 p-4 bg-brand-gray-900">
                  {/* Image */}
                  <Link href={`/shop/${product.id}`} className="relative w-20 h-20 shrink-0 overflow-hidden bg-black">
                    <Image src={image} alt={product.title} fill className="object-cover" sizes="80px" />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-[9px] text-white/25 tracking-[0.3em] uppercase font-mono">{product.category}</p>
                    <Link href={`/shop/${product.id}`} className="block font-semibold text-sm text-white/90 hover:text-white line-clamp-1">
                      {product.title}
                    </Link>
                    <p className="font-mono font-bold text-white">{formatCurrency(product.price)}</p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center border border-white/15">
                        <button
                          onClick={() => updateQty(product.id, quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-mono text-xs">{quantity}</span>
                        <button
                          onClick={() => updateQty(product.id, Math.min(product.stock, quantity + 1))}
                          className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="ml-2 p-1.5 text-white/20 hover:text-red-400 transition-colors"
                        aria-label="移除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="shrink-0 text-right">
                    <p className="font-mono font-bold text-white tabular-nums">
                      {formatCurrency(product.price * quantity)}
                    </p>
                    {quantity > 1 && (
                      <p className="text-[10px] text-white/25 font-mono">{quantity} × {formatCurrency(product.price)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order summary */}
          <div className="space-y-4">
            <div className="border border-white/10 p-5 space-y-4 bg-brand-gray-900 sticky top-20">
              <h2 className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30">ORDER SUMMARY</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>小計</span>
                  <span className="font-mono">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-white/40 text-[12px]">
                  <span>運費（郵寄）</span>
                  <span className="font-mono">+{formatCurrency(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-white/25">
                  <span>面交免運費</span>
                  <span className="font-mono">$0</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">預估合計</span>
                <span className="font-mono text-white text-lg tabular-nums">{formatCurrency(total + shippingFee)}</span>
              </div>

              <Link
                href="/checkout"
                className="block w-full text-center py-3.5 bg-white text-black font-bold tracking-[0.15em] uppercase text-sm hover:bg-brand-red hover:text-white transition-all"
              >
                前往結帳
              </Link>

              <Link
                href="/shop"
                className="block w-full text-center py-2.5 border border-white/15 text-white/40 text-[11px] tracking-widest uppercase font-mono hover:text-white hover:border-white/40 transition-all"
              >
                繼續購物
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
