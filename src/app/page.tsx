'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import { subscribeToAuctions } from '@/lib/firebase/auctions';
import { subscribeToProducts } from '@/lib/firebase/products';
import AuctionCard from '@/components/auction/AuctionCard';
import ProductCard from '@/components/product/ProductCard';
import type { Auction, Product } from '@/types';
import { ArrowRight, Gavel, ShoppingBag, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [activeAuctions, setActiveAuctions] = useState<Auction[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [auctionCount, setAuctionCount] = useState(0);

  useEffect(() => {
    const unsub1 = subscribeToAuctions((data) => {
      const active = data.filter((a) => a.status === 'active');
      setActiveAuctions(active.slice(0, 3));
      setAuctionCount(active.length);
    });
    const unsub2 = subscribeToProducts((data) => {
      const available = data.filter((p) => p.status === 'available');
      setFeaturedProducts(available.slice(0, 3));
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  return (
    <>
      <div className="cyber-scanline" />
      <Header />

      <main>
        {/* ── Hero ── */}
        <section className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden px-6 md:px-12">
          {/* Decorative large background text */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
            aria-hidden
          >
            <span className="text-[20vw] font-black text-white/[0.025] tracking-[-0.05em] leading-none whitespace-nowrap">
              RLG
            </span>
          </div>

          {/* Corner brackets */}
          <div className="absolute top-8 left-6 md:left-12 w-8 h-8 border-t border-l border-white/30" />
          <div className="absolute bottom-8 right-6 md:right-12 w-8 h-8 border-b border-r border-white/30" />

          <div className="relative max-w-6xl mx-auto w-full">
            {/* Eyebrow */}
            <p className="text-xs text-white/25 tracking-[0.4em] uppercase font-mono mb-6">
              RLG REPTILE · TAIWAN
            </p>

            {/* Main headline */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-[-0.03em] leading-[0.9] text-white mb-8">
              稀有爬蟲<br />
              <span className="text-white/30">競標・零售</span>
            </h1>

            <p className="text-white/40 text-base md:text-lg max-w-lg mb-12 leading-relaxed tracking-wide">
              台灣頂級爬蟲品牌，專注於高品質活體交易。
              即時競標系統，公平透明，讓每一次交易都安心。
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 items-center">
              <Link href="/auction" className="btn-primary">
                <Gavel className="w-4 h-4" />
                查看競標
                {auctionCount > 0 && (
                  <span className="ml-1 opacity-60 text-xs font-mono">LIVE {auctionCount}</span>
                )}
              </Link>
              <Link href="/shop" className="btn-secondary">
                <ShoppingBag className="w-4 h-4" />
                零售商品
              </Link>
              <Link href="/about" className="btn-ghost text-white/50 hover:text-white">
                關於我們
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </section>

        {/* ── Live Auctions ── */}
        {activeAuctions.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 md:px-6 py-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[10px] text-white/25 tracking-[0.4em] uppercase font-mono mb-2">
                  LIVE NOW
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  競標進行中
                  <span className="flex items-center gap-1.5 text-xs font-mono text-white/40 tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-fast" />
                    {auctionCount}
                  </span>
                </h2>
              </div>
              <Link
                href="/auction"
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors font-mono tracking-widest uppercase"
              >
                全部 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <hr className="rlg-rule mb-8" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {activeAuctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>

            {auctionCount > 3 && (
              <div className="text-center mt-8">
                <Link href="/auction" className="btn-secondary py-2 px-6 text-sm">
                  查看全部 {auctionCount} 個競標
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </section>
        )}

        {/* ── Feature strips ── */}
        <section className="border-y border-white/8 py-8 overflow-x-auto">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="flex items-stretch divide-x divide-white/8 min-w-max md:min-w-0 md:grid md:grid-cols-3">
              {[
                {
                  title: '即時競標系統',
                  desc: '出價前 60 秒自動延長，確保所有人公平競標機會',
                  tag: 'AUCTION',
                },
                {
                  title: '稀有活體直送',
                  desc: '親自繁殖或嚴選品質，每隻均附基本資訊與健康保證',
                  tag: 'QUALITY',
                },
                {
                  title: 'LINE 即時通知',
                  desc: '得標、被超出價即時推播，不錯過任何關鍵時刻',
                  tag: 'NOTIFY',
                },
              ].map(({ title, desc, tag }) => (
                <div key={tag} className="px-6 md:px-8 py-4 first:pl-0 last:pr-0 flex-1">
                  <p className="text-[9px] text-white/20 tracking-[0.4em] uppercase font-mono mb-2">{tag}</p>
                  <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured Products ── */}
        {featuredProducts.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 md:px-6 py-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[10px] text-white/25 tracking-[0.4em] uppercase font-mono mb-2">
                  RETAIL SHOP
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  零售商品
                </h2>
              </div>
              <Link
                href="/shop"
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors font-mono tracking-widest uppercase"
              >
                全部 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <hr className="rlg-rule mb-8" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/shop" className="btn-secondary py-2 px-6 text-sm">
                查看全部零售商品
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {/* ── About CTA ── */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          <div className="border border-white/8 p-8 md:p-12 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 opacity-5">
              <Image src="/logo-dark.png" alt="" fill className="object-contain object-right-top" />
            </div>

            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/40" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/40" />

            <div className="relative max-w-xl">
              <p className="text-[10px] text-white/25 tracking-[0.4em] uppercase font-mono mb-3">
                ABOUT RLG
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
                關於 RLG REPTILE
              </h2>
              <p className="text-white/40 text-sm leading-relaxed mb-6">
                RLG Reptile 專注於台灣爬蟲市場，致力於提供高品質的活體與相關周邊。
                我們相信每一次交易都應該是透明、公平、安心的。
              </p>
              <Link href="/about" className={cn('btn-secondary py-2.5 px-5 text-sm')}>
                <Info className="w-4 h-4" />
                了解更多
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/8 py-8">
          <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="RLG REPTILE" width={70} height={26} className="object-contain opacity-60" />
              <span className="text-[10px] text-white/20 font-mono tracking-widest">REPTILE · TAIWAN</span>
            </div>
            <div className="flex items-center gap-6 text-[10px] text-white/20 font-mono tracking-widest uppercase">
              <Link href="/auction" className="hover:text-white/50 transition-colors">競標</Link>
              <Link href="/shop" className="hover:text-white/50 transition-colors">零售</Link>
              <Link href="/about" className="hover:text-white/50 transition-colors">關於</Link>
            </div>
            <p className="text-[10px] text-white/15 font-mono">© 2025 RLG REPTILE</p>
          </div>
        </footer>
      </main>
    </>
  );
}
