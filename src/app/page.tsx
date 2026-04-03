'use client';

import { useState, useEffect } from 'react';
import { subscribeToAuctions } from '@/lib/firebase/auctions';
import AuctionCard from '@/components/auction/AuctionCard';
import Header from '@/components/layout/Header';
import { Gavel, TrendingUp, Filter } from 'lucide-react';
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
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <section className="mb-10 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
            <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center">
              <Gavel className="w-5 h-5 text-brand-black" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">即時競標</h1>
          </div>
          <p className="text-brand-gray-400 text-sm md:text-base max-w-lg mx-auto md:mx-0">
            稀有商品即時競標，毫秒出價，全程透明。出價前60秒延長機制，確保每筆競標公平完成。
          </p>
        </section>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto scrollbar-none">
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
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                filter === key
                  ? 'bg-brand-white text-brand-black'
                  : 'text-brand-gray-400 hover:text-brand-white hover:bg-brand-gray-800'
              )}
            >
              {label}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                filter === key ? 'bg-brand-black/20' : 'bg-brand-gray-800 text-brand-gray-500'
              )}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton aspect-[4/3]" />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-3 w-16 rounded" />
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-6 w-1/2 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-brand-gray-700" />
            <p className="text-brand-gray-400 font-medium">
              {filter === 'active' ? '目前沒有進行中的競標' : '此分類沒有競標'}
            </p>
            <p className="text-brand-gray-600 text-sm mt-1">請稍後再回來查看</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in">
            {filtered.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
