'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProduct } from '@/lib/firebase/products';
import { formatCurrency, getImagePlaceholder } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/layout/Header';
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart } from 'lucide-react';
import type { Product } from '@/types';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    getProduct(id).then(p => {
      setProduct(p);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-10 mt-14 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="skeleton aspect-square rounded-none" />
          <div className="space-y-4">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-12 w-1/2" />
            <div className="skeleton h-24 w-full" />
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 mt-14">
          <p className="text-white/40">商品不存在</p>
          <Link href="/shop" className="text-sm text-white/60 hover:text-white underline">返回商城</Link>
        </div>
      </>
    );
  }

  const images = product.images?.length ? product.images : [getImagePlaceholder(product.title)];
  const isSoldOut = product.status === 'sold_out' || product.stock === 0;

  const handleAddToCart = () => {
    addToCart(product, qty);
  };

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8 mt-14 pb-20 md:pb-8">
        <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white mb-6 transition-colors font-mono tracking-wider uppercase text-[11px]">
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO SHOP
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square bg-black border border-white/10 overflow-hidden">
              <Image
                src={images[currentImage]}
                alt={product.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-black/80 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentImage(i => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-black/80 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-none">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={cn(
                      'relative w-14 h-14 shrink-0 overflow-hidden border transition-all',
                      i === currentImage ? 'border-white' : 'border-white/15 opacity-50 hover:opacity-80'
                    )}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="56px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-[10px] text-white/25 tracking-[0.35em] uppercase font-mono mb-2">
                {product.category || 'RLG REPTILE'}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {product.title}
              </h1>
              {product.ageClass && (
                <p className="text-sm text-white/40 mt-1 font-mono">{product.ageClass}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <p className="text-[10px] text-white/25 tracking-[0.3em] uppercase font-mono mb-1">PRICE</p>
              <p className="text-4xl font-mono font-bold text-white tabular-nums">
                {formatCurrency(product.price)}
              </p>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              {isSoldOut ? (
                <span className="border border-white/15 text-white/30 text-[10px] tracking-[0.2em] uppercase px-3 py-1">
                  SOLD OUT
                </span>
              ) : (
                <span className="bg-white text-black text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1">
                  IN STOCK · {product.stock} 件
                </span>
              )}
            </div>

            {/* Qty + Add to Cart */}
            {!isSoldOut && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] text-white/40 tracking-widest uppercase font-mono">數量</p>
                  <div className="flex items-center border border-white/20">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-mono text-sm">{qty}</span>
                    <button
                      onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                      className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-black font-bold tracking-[0.15em] uppercase text-sm hover:bg-brand-red hover:text-white transition-all"
                >
                  <ShoppingCart className="w-4 h-4" />
                  加入購物車
                </button>

                <Link
                  href="/cart"
                  onClick={handleAddToCart}
                  className="block w-full text-center py-3 border border-white/20 text-white/60 text-sm tracking-wider hover:border-white/50 hover:text-white transition-all font-mono uppercase text-[11px]"
                >
                  直接結帳
                </Link>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="border-t border-white/8 pt-5 space-y-2">
                <p className="text-[10px] text-white/25 tracking-[0.3em] uppercase font-mono">DESCRIPTION</p>
                <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-2 border-t border-white/8 pt-5">
              {[
                product.condition && { label: '商品狀態', value: product.condition },
                { label: '運送方式', value: product.shippingInfo || '郵寄 / 面交' },
              ].filter(Boolean).map(({ label, value }: any) => (
                <div key={label} className="bg-white/4 p-3">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-mono mb-1">{label}</p>
                  <p className="text-sm text-white/70">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
