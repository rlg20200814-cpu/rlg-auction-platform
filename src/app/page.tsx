'use client';

import { useState, useEffect } from 'react';
import { subscribeToAuctions } from '@/lib/firebase/auctions';
import AuctionCard from '@/components/auction/AuctionCard';
import Header from '@/components/layout/Header';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Auction, AuctionStatus } from '@/types';

type FilterTab = 'all' | AuctionStatus;

export default function HomePage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('active');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAuctions((data) => {
      setAuctions(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = filter === 'all'
    ? auctions
    : auctions.filter((a) => a.status === filter);

  const counts = {
    all: auctions.length,
    active: auctions.filter((a) => a.status === 'active').length,
    upcoming: auctions.filter((a) => a.status === 'upcoming').length,
    ended: auctions.filter((a) => a.status === 'ended').length,
  };

  return (
    <>
      {/* Cyberpunk scan line */}
      <div className="cyber-scanline" />

      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero — RLG style */}
        <section className="mb-12 relative">
          {/* Top rule */}
          <hr className="rlg-rule mb-6" />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              {/* Label */}
              <p className="text-xs text-white/30 tracking-[0.3em] uppercase mb-3 font-mono">
                RLG REPTILE / AUCTION
              </p>
              {/* Headline */}
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-none text-white mb-3">
                即時競標
              </h1>
              <p className="text-white/40 text-sm tracking-wider max-w-md">
                稀有爬蟲即時競標　出價前60秒自動延長　公平透明
              </p>
            </div>

            {/* Logo mark */}
            <div className="hidden md:block opacity-20 hover:opacity-40 transition-opacity">
              <Image src="/logo-dark.png" alt="RLG" width={100} height={60} className="object-contain" />
            </div>
          </div>

          {/* Bottom rule with live indicator */}
          <div className="flex items-center gap-4 mt-6">
            <hr className="rlg-rule flex-1" />
            {counts.active > 0 && (
              <div className="flex items-center gap-2 text-xs text-white/50 font-mono tracking-widest whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-fast inline-block" />
                LIVE · {counts.active}
              </div>
            )}
            <hr className="rlg-rule w-12" />
          </div>
        </section>

        {/* Filter tabs */}
        <div className="flex items-center gap-0 mb-8 border border-white/10 w-fit">
          {([
            { key: 'active', label: '競標中' },
            { key: 'upcoming', label: '即將開始' },
            { key: 'ended', label: '已結標' },
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
                  <div className="skeleton h-2 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-white/8">
            <p className="text-white/20 font-mono text-xs tracking-widest uppercase mb-2">NO DATA</p>
            <p className="text-white/40 text-sm">
              {filter === 'active' ? '目前沒有進行中的競標' : '此分類沒有競標'}
            </p>
            <p className="text-white/20 text-xs mt-1 font-mono">請稍後再回來查看</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 animate-fade-in">
            {filtered.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
