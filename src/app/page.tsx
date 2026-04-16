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
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [activeAuctions, setActiveAuctions] = useState<Auction[]>([]);
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    const unsub1 = subscribeToAuctions((data) => {
      setAllAuctions(data);
      setActiveAuctions(data.filter((a) => a.status === 'active').slice(0, 3));
    });
    const unsub2 = subscribeToProducts((data) => {
      const available = data.filter((p) => p.status === 'available');
      setFeaturedProducts(available.slice(0, 3));
      setProductCount(available.length);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const activeCount = activeAuctions.length;
  const totalEnded = allAuctions.filter((a) => a.status === 'ended').length;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">

        {/* Right: Hero Image — 紅色鬆獅蜥 */}
        <div
          className="absolute inset-y-0 right-0 w-full md:w-[62%]"
          style={{ zIndex: 0 }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/hero.jpg"
              alt="Red Bearded Dragon — RLG Reptile"
              fill
              className="object-cover object-top"
              priority
            />
            {/* Fade-to-left overlay：讓圖片與左側文字自然融合 */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to right, #000 0%, #000 8%, rgba(0,0,0,0.65) 38%, rgba(0,0,0,0.05) 100%)',
              }}
            />
            {/* 底部漸層 */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, #000 0%, transparent 30%)',
              }}
            />
            {/* 紅色光暈 */}
            <div
              className="absolute inset-0 opacity-25"
              style={{ background: 'radial-gradient(ellipse at 65% 50%, #cc0000 0%, transparent 55%)' }}
            />
          </div>
        </div>

        {/* Left: Content */}
        <div className="relative z-10 flex flex-col justify-center min-h-screen px-8 md:px-16 lg:px-24 pt-20 pb-8">
          <div className="max-w-xl">

            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-px bg-brand-red" />
              <span className="text-xs tracking-[0.4em] uppercase text-white/50 font-mono">
                PREMIUM SELECTION · TAIWAN
              </span>
            </div>

            {/* Headline */}
            <div className="mb-4 leading-none">
              <div
                className="font-display text-[clamp(80px,14vw,160px)] leading-none tracking-wide text-white"
                style={{ lineHeight: '0.92' }}
              >
                RLG
              </div>
              <div
                className="font-display text-[clamp(80px,14vw,160px)] leading-none tracking-wide text-brand-red"
                style={{ lineHeight: '0.92', textShadow: '0 0 60px rgba(204,0,0,0.4)' }}
              >
                REPTILE
              </div>
            </div>

            {/* Sub-title */}
            <p className="text-xs md:text-sm tracking-[0.5em] uppercase text-white/40 font-mono mb-6">
              STUDIO · 稀有爬蟲專門店
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['即時競標', '精選品系', '高品質活體'].map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-mono px-3 py-1 border border-white/15 text-white/50"
                >
                  <span className="w-1 h-1 rounded-full bg-brand-red inline-block" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-sm text-white/35 leading-relaxed mb-10 max-w-sm">
              台灣頂級爬蟲品牌，專注親繁高品質活體。
              <br />
              每一隻都是唯一，每一場都公平透明。
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/auction"
                className="group inline-flex items-center gap-3 border border-brand-red px-8 py-4 text-sm tracking-[0.2em] uppercase font-medium text-white hover:bg-brand-red transition-all duration-300"
              >
                進入競標
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                {activeCount > 0 && (
                  <span className="text-brand-red group-hover:text-white text-xs font-mono">
                    LIVE {activeCount}
                  </span>
                )}
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-3 px-8 py-4 text-sm tracking-[0.2em] uppercase font-medium text-white/40 hover:text-white border border-white/10 hover:border-white/30 transition-all duration-300"
              >
                零售商品
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div
          className="relative z-10 mt-auto border-t border-white/8"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        >
          <div className="max-w-6xl mx-auto px-8 md:px-16 lg:px-24">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/8">
              {[
                {
                  value: totalEnded > 0 ? `${totalEnded}+` : '—',
                  label: '成功交易場次',
                  sub: '持續增加中',
                },
                {
                  value: productCount > 0 ? `${productCount}` : '精選',
                  label: '零售商品在架',
                  sub: '親繁嚴選',
                },
                {
                  value: '2022',
                  label: '創立年份',
                  sub: '深耕爬蟲市場',
                },
                {
                  value: '每週',
                  label: '定期開標',
                  sub: '不定期特拍',
                },
              ].map(({ value, label, sub }) => (
                <div key={label} className="px-6 py-5 flex flex-col gap-1">
                  <span className="font-display text-3xl md:text-4xl text-white tracking-wide">
                    {value}
                  </span>
                  <span className="text-[10px] text-white/60 tracking-wider uppercase font-mono">{label}</span>
                  <span className="text-[9px] text-white/25 font-mono">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE AUCTIONS ── */}
      {activeAuctions.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-10 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-px bg-brand-red" />
                <span className="text-[10px] text-brand-red tracking-[0.4em] uppercase font-mono">LIVE NOW</span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl text-white tracking-wide">
                競標進行中
              </h2>
            </div>
            <Link
              href="/auction"
              className="hidden md:flex items-center gap-2 text-xs text-white/30 hover:text-brand-red transition-colors font-mono tracking-widest uppercase"
            >
              全部競標 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-px bg-gradient-to-r from-brand-red via-brand-red/20 to-transparent mb-10" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeAuctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>

          <div className="mt-8 md:hidden text-center">
            <Link href="/auction" className="btn-secondary text-sm">
              查看全部競標 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── BRAND STRIP ── */}
      <div className="border-y border-white/8 overflow-hidden">
        <div className="flex items-center">
          {/* Marquee-style strip */}
          <div className="flex items-center gap-12 px-8 py-4 whitespace-nowrap text-[10px] tracking-[0.4em] uppercase font-mono text-white/15 overflow-hidden">
            {Array(6).fill(null).map((_, i) => (
              <span key={i} className="flex items-center gap-12">
                <span>RLG REPTILE STUDIO</span>
                <span className="text-brand-red/40">✦</span>
                <span>TAIWAN</span>
                <span className="text-brand-red/40">✦</span>
                <span>PREMIUM BLOODLINE</span>
                <span className="text-brand-red/40">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RETAIL PRODUCTS ── */}
      {featuredProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-10 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-px bg-brand-red" />
                <span className="text-[10px] text-brand-red tracking-[0.4em] uppercase font-mono">RETAIL SHOP</span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl text-white tracking-wide">
                零售商品
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden md:flex items-center gap-2 text-xs text-white/30 hover:text-brand-red transition-colors font-mono tracking-widest uppercase"
            >
              全部商品 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-px bg-gradient-to-r from-brand-red via-brand-red/20 to-transparent mb-10" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/shop" className="btn-secondary text-sm">
              查看全部零售商品 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── ABOUT CTA ── */}
      <section className="relative overflow-hidden border-t border-white/8 py-20 px-6 md:px-10">
        {/* Red glow bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(204,0,0,0.08) 0%, transparent 60%)' }}
        />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-8 h-px bg-brand-red" />
              <span className="text-[10px] text-brand-red tracking-[0.4em] uppercase font-mono">ABOUT RLG</span>
              <div className="w-8 h-px bg-brand-red" />
            </div>
            <h2 className="font-display text-5xl md:text-7xl text-white tracking-wide mb-6">
              關於我們
            </h2>
            <p className="text-white/35 text-sm leading-relaxed mb-10 max-w-md mx-auto">
              RLG Reptile 從對爬蟲的純粹熱愛出發，致力提供台灣最高品質的爬蟲活體與交易平台。
              每一筆交易，我們都認真對待。
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/about"
                className="group inline-flex items-center gap-3 border border-brand-red px-8 py-4 text-sm tracking-[0.2em] uppercase font-medium text-white hover:bg-brand-red transition-all duration-300"
              >
                了解更多
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://lin.ee/o5UuAwc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 text-sm tracking-[0.2em] uppercase font-medium text-white/40 hover:text-white border border-white/10 hover:border-white/30 transition-all duration-300"
              >
                聯絡我們
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 py-8 px-6 md:px-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="RLG REPTILE" width={60} height={22} className="object-contain opacity-50" />
            <span className="text-[9px] text-white/15 font-mono tracking-widest">REPTILE STUDIO · TAIWAN</span>
          </div>
          <div className="flex items-center gap-6 text-[10px] text-white/20 font-mono tracking-widest uppercase">
            <Link href="/auction" className="hover:text-brand-red transition-colors">競標</Link>
            <Link href="/shop" className="hover:text-brand-red transition-colors">零售</Link>
            <Link href="/about" className="hover:text-brand-red transition-colors">關於</Link>
            <a href="https://www.instagram.com/rlg_reptile_studio/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-red transition-colors">IG</a>
            <a href="https://lin.ee/o5UuAwc" target="_blank" rel="noopener noreferrer" className="hover:text-brand-red transition-colors">LINE</a>
          </div>
          <p className="text-[9px] text-white/10 font-mono">© 2025 RLG REPTILE STUDIO</p>
        </div>
      </footer>
    </div>
  );
}
