'use client';

import { useState, useEffect } from 'react';
import { subscribeToProducts } from '@/lib/firebase/products';
import ProductCard from '@/components/product/ProductCard';
import Header from '@/components/layout/Header';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

type FilterTab = 'all' | 'available' | 'sold_out';

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('available');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToProducts((data) => {
      // 前台只顯示非隱藏的商品
      setProducts(data.filter((p) => p.status !== 'hidden'));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = filter === 'all'
    ? products
    : products.filter((p) => p.status === filter);

  const counts = {
    all: products.length,
    available: products.filter((p) => p.status === 'available').length,
    sold_out: products.filter((p) => p.status === 'sold_out').length,
  };

  return (
    <>
      <div className="cyber-scanline" />
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <section className="mb-12 relative">
          <hr className="rlg-rule mb-6" />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs text-white/30 tracking-[0.3em] uppercase mb-3 font-mono">
                RLG REPTILE / SHOP
              </p>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-none text-white mb-3">
                零售商品
              </h1>
              <p className="text-white/40 text-sm tracking-wider max-w-md">
                精選爬蟲活體與周邊商品　直接購買　歡迎詢問
              </p>
            </div>

            <div className="hidden md:block opacity-20 hover:opacity-40 transition-opacity">
              <Image src="/logo-dark.png" alt="RLG" width={100} height={60} className="object-contain" />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <hr className="rlg-rule flex-1" />
            {counts.available > 0 && (
              <div className="flex items-center gap-2 text-xs text-white/50 font-mono tracking-widest whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-fast inline-block" />
                IN STOCK · {counts.available}
              </div>
            )}
            <hr className="rlg-rule w-12" />
          </div>
        </section>

        {/* Filter tabs */}
        <div className="flex items-center gap-0 mb-8 border border-white/10 w-fit">
          {([
            { key: 'available', label: '有庫存' },
            { key: 'sold_out', label: '已售完' },
            { key: 'all', label: '全部' },
          ] as { key: FilterTab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-widest uppercase transition-all border-r border-white/10 last:border-r-0',
                filter === key
                  ? 'bg-white text-black'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              )}
            >
              {label}
              <span className={cn(
                'font-mono text-xs',
                filter === key ? 'text-black/50' : 'text-white/20'
              )}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border border-white/8 overflow-hidden">
                <div className="skeleton aspect-[4/3]" />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-2 w-16" />
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-6 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-white/8">
            <p className="text-white/20 font-mono text-xs tracking-widest uppercase mb-2">NO DATA</p>
            <p className="text-white/40 text-sm">
              {filter === 'available' ? '目前沒有在售商品' : '此分類沒有商品'}
            </p>
            <p className="text-white/20 text-xs mt-1 font-mono">請稍後再回來查看</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 animate-fade-in">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
