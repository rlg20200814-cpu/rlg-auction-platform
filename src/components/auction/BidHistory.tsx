'use client';

import Image from 'next/image';
import { useBids } from '@/hooks/useBids';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Crown, TrendingUp } from 'lucide-react';

interface BidHistoryProps {
  auctionId: string;
  highestBidderId?: string | null;
}

export default function BidHistory({ auctionId, highestBidderId }: BidHistoryProps) {
  const { bids, loading } = useBids(auctionId, 30);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-3 w-16 rounded" />
            </div>
            <div className="skeleton h-4 w-20 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="text-center py-8 text-brand-gray-500">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">尚無出價紀錄</p>
        <p className="text-xs mt-1">成為第一個出價者！</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {bids.map((bid, index) => {
        const isHighest = bid.userId === highestBidderId && index === 0;
        return (
          <div
            key={bid.id}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              isHighest
                ? 'bg-brand-accent/5 border border-brand-accent/20'
                : 'hover:bg-brand-gray-800/50'
            )}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              {bid.userAvatar ? (
                <Image
                  src={bid.userAvatar}
                  alt={bid.userName}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-gray-700 flex items-center justify-center text-xs font-bold">
                  {bid.userName.charAt(0).toUpperCase()}
                </div>
              )}
              {isHighest && (
                <Crown className="absolute -top-1 -right-1 w-3.5 h-3.5 text-brand-accent" />
              )}
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium truncate', isHighest ? 'text-brand-white' : 'text-brand-gray-200')}>
                {bid.userName}
                {isHighest && <span className="ml-1.5 text-xs text-brand-accent">最高</span>}
              </p>
              <p className="text-xs text-brand-gray-500">{formatRelativeTime(bid.timestamp)}</p>
            </div>

            {/* Amount */}
            <p className={cn('price-display text-sm shrink-0', isHighest ? 'text-brand-accent' : 'text-brand-gray-300')}>
              {formatCurrency(bid.amount)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
