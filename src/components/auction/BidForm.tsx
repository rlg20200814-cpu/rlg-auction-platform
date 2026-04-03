'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { placeBid } from '@/lib/firebase/bids';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, getMinBid } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Gavel, Plus, Minus, AlertCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Auction } from '@/types';

interface BidFormProps {
  auction: Auction;
}

export default function BidForm({ auction }: BidFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastBidFlash, setLastBidFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const minBid = getMinBid(
    auction.currentPrice || auction.startPrice,
    auction.minIncrement
  );

  // Reset bid amount when auction price changes
  useEffect(() => {
    setBidAmount(minBid);
  }, [minBid]);

  // Flash animation when price updates
  useEffect(() => {
    setLastBidFlash(true);
    const t = setTimeout(() => setLastBidFlash(false), 1000);
    return () => clearTimeout(t);
  }, [auction.currentPrice]);

  const isAuctionActive = auction.status === 'active' && auction.endTime > Date.now();
  const isOwnHighestBid = auction.lastBidderId === user?.uid;
  const isEnded = auction.status === 'ended' || auction.endTime <= Date.now();

  const adjust = (delta: number) => {
    setBidAmount((prev) => Math.max(minBid, prev + delta));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    if (bidAmount < minBid) {
      toast.error(`出價必須至少 ${formatCurrency(minBid)}`);
      return;
    }

    setIsSubmitting(true);
    const result = await placeBid(
      auction.id,
      user.uid,
      user.name,
      user.avatar,
      bidAmount
    );
    setIsSubmitting(false);

    if (result.success) {
      if (result.extended) {
        toast.success(`出價成功！競標已延長至 60 秒後結標 ⚡`, { duration: 4000 });
      } else {
        toast.success('出價成功！你是目前最高出價者', { duration: 3000 });
      }
    } else {
      toast.error(result.error || '出價失敗');
      // Refresh min bid after failure
      setBidAmount(minBid);
    }
  };

  // ── Ended state ──
  if (isEnded) {
    return (
      <div className="card p-6 text-center space-y-2">
        <div className="text-3xl">🏆</div>
        {auction.winnerId ? (
          <>
            <p className="font-bold text-lg">競標已結束</p>
            <p className="text-brand-gray-400 text-sm">
              得標者：<span className="text-brand-white font-medium">{auction.winnerName}</span>
            </p>
            <p className="price-display text-2xl text-brand-accent">
              {formatCurrency(auction.currentPrice)}
            </p>
          </>
        ) : (
          <>
            <p className="font-bold text-lg">競標已結束</p>
            <p className="text-brand-gray-500 text-sm">無人出價</p>
          </>
        )}
      </div>
    );
  }

  // ── Upcoming state ──
  if (auction.status === 'upcoming') {
    return (
      <div className="card p-6 text-center">
        <p className="text-brand-gray-400 text-sm">競標尚未開始</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      {/* Current price */}
      <div className={cn('space-y-1 p-4 rounded-lg bg-brand-gray-800/60 transition-colors', lastBidFlash && 'bid-flash')}>
        <p className="text-xs text-brand-gray-500 uppercase tracking-widest">目前最高出價</p>
        <p className="price-display text-3xl md:text-4xl">
          {formatCurrency(auction.currentPrice || auction.startPrice)}
        </p>
        {auction.bidCount > 0 && (
          <p className="text-xs text-brand-gray-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            共 {auction.bidCount} 次出價 · 最高：{auction.lastBidderName}
          </p>
        )}
      </div>

      {/* Own highest bid warning */}
      {isOwnHighestBid && (
        <div className="flex items-center gap-2 text-brand-accent text-sm bg-brand-accent/5 border border-brand-accent/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>你已是目前最高出價者</span>
        </div>
      )}

      {/* Bid input */}
      <div className="space-y-2">
        <label className="text-xs text-brand-gray-400 uppercase tracking-widest">
          出價金額（最低 {formatCurrency(minBid)}）
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => adjust(-auction.minIncrement)}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-brand-gray-800 border border-brand-gray-700 text-brand-gray-300 hover:bg-brand-gray-700 active:scale-95 transition-all disabled:opacity-30"
            disabled={bidAmount <= minBid}
            aria-label="減少"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-500 text-sm">$</span>
            <input
              ref={inputRef}
              type="number"
              value={bidAmount}
              min={minBid}
              step={auction.minIncrement}
              onChange={(e) => setBidAmount(Math.max(minBid, parseInt(e.target.value) || minBid))}
              className="input pl-7 text-center text-lg font-bold"
              aria-label="出價金額"
            />
          </div>

          <button
            type="button"
            onClick={() => adjust(auction.minIncrement)}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-brand-gray-800 border border-brand-gray-700 text-brand-gray-300 hover:bg-brand-gray-700 active:scale-95 transition-all"
            aria-label="增加"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick bid presets */}
        <div className="flex gap-2">
          {[1, 2, 5].map((multiplier) => {
            const amount = auction.currentPrice + auction.minIncrement * multiplier;
            return (
              <button
                key={multiplier}
                type="button"
                onClick={() => setBidAmount(amount)}
                className={cn(
                  'flex-1 py-1.5 text-xs rounded-md border transition-all',
                  bidAmount === amount
                    ? 'bg-brand-accent text-brand-black border-brand-accent font-bold'
                    : 'bg-brand-gray-800 text-brand-gray-400 border-brand-gray-700 hover:border-brand-gray-500'
                )}
              >
                +{formatCurrency(auction.minIncrement * multiplier)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit button */}
      {user ? (
        <button
          type="submit"
          disabled={isSubmitting || !isAuctionActive || isOwnHighestBid}
          className="btn-primary w-full py-4 text-base"
        >
          <Gavel className="w-5 h-5" />
          {isSubmitting
            ? '出價中...'
            : isOwnHighestBid
            ? '你已是最高出價者'
            : `出價 ${formatCurrency(bidAmount)}`}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="btn-primary w-full py-4 text-base"
        >
          登入後出價
        </button>
      )}

      <p className="text-center text-xs text-brand-gray-600">
        最低加價幅度：{formatCurrency(auction.minIncrement)}
      </p>
    </form>
  );
}
