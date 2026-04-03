'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency, getImagePlaceholder } from '@/lib/utils';
import Countdown from './Countdown';
import { cn } from '@/lib/utils';
import { Eye, TrendingUp } from 'lucide-react';
import type { Auction } from '@/types';

interface AuctionCardProps {
  auction: Auction;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const image = auction.images?.[0] || getImagePlaceholder(auction.title);
  const isActive = auction.status === 'active';
  const isEnded = auction.status === 'ended';

  return (
    <Link href={`/auction/${auction.id}`} className="group block">
      <div className={cn(
        'card-hover h-full flex flex-col',
        isEnded && 'opacity-60'
      )}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-gray-800">
          <Image
            src={image}
            alt={auction.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span className={cn(
              'badge text-xs',
              auction.status === 'active' && 'badge-active',
              auction.status === 'upcoming' && 'badge-upcoming',
              auction.status === 'ended' && 'badge-ended',
            )}>
              {auction.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse inline-block" />}
              {auction.status === 'active' ? '競標中' : auction.status === 'upcoming' ? '即將開始' : '已結標'}
            </span>
          </div>
          {/* Bid count */}
          {auction.bidCount > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              <TrendingUp className="w-3 h-3" />
              {auction.bidCount}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-3">
          {/* Title */}
          <div>
            <p className="text-xs text-brand-gray-500 uppercase tracking-wider mb-1">{auction.category}</p>
            <h3 className="font-semibold text-sm md:text-base line-clamp-2 group-hover:text-brand-white transition-colors">
              {auction.title}
            </h3>
          </div>

          <div className="mt-auto space-y-3">
            {/* Price */}
            <div>
              <p className="text-xs text-brand-gray-500 mb-0.5">
                {isEnded ? '成交價' : auction.bidCount > 0 ? '目前出價' : '起標價'}
              </p>
              <p className={cn('price-display text-xl md:text-2xl', isActive && 'text-brand-accent')}>
                {formatCurrency(auction.currentPrice || auction.startPrice)}
              </p>
            </div>

            {/* Countdown or winner */}
            {isActive && (
              <div className="pt-2 border-t border-brand-gray-800">
                <Countdown endTime={auction.endTime} size="sm" />
              </div>
            )}

            {isEnded && auction.winnerName && (
              <div className="pt-2 border-t border-brand-gray-800">
                <p className="text-xs text-brand-gray-500">
                  🏆 得標者：<span className="text-brand-gray-300">{auction.winnerName}</span>
                </p>
              </div>
            )}

            {auction.status === 'upcoming' && (
              <div className="pt-2 border-t border-brand-gray-800">
                <Countdown endTime={auction.startTime} size="sm" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
