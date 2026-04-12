'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency, getImagePlaceholder } from '@/lib/utils';
import Countdown from './Countdown';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';
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
        'relative border overflow-hidden flex flex-col h-full transition-all duration-300',
        'bg-brand-gray-900',
        isEnded
          ? 'border-white/6 opacity-50'
          : 'border-white/10 hover:border-white/30 hover:-translate-y-0.5'
      )}>

        {/* Corner brackets — top left */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/40 z-10 transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-white/70" />
        {/* Corner brackets — bottom right */}
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/40 z-10 transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-white/70" />

        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-black">
          <Image
            src={image}
            alt={auction.title}
            fill
            className={cn(
              'object-cover transition-all duration-500',
              'group-hover:scale-103 filter grayscale-[20%] group-hover:grayscale-0'
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Status — top left */}
          <div className="absolute top-3 left-3 z-10">
            {auction.status === 'active' && (
              <span className="flex items-center gap-1.5 bg-white text-black text-[10px] font-bold tracking-[0.2em] uppercase px-2 py-0.5">
                <span className="w-1 h-1 rounded-full bg-black animate-pulse-fast" />
                LIVE
              </span>
            )}
            {auction.status === 'upcoming' && (
              <span className="border border-white/40 text-white/70 text-[10px] font-medium tracking-[0.2em] uppercase px-2 py-0.5">
                SOON
              </span>
            )}
            {auction.status === 'ended' && (
              <span className="border border-white/15 text-white/30 text-[10px] tracking-[0.2em] uppercase px-2 py-0.5">
                ENDED
              </span>
            )}
          </div>

          {/* Bid count — top right */}
          {auction.bidCount > 0 && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-black/70 text-white/60 text-[10px] px-2 py-0.5 font-mono">
              <TrendingUp className="w-2.5 h-2.5" />
              {auction.bidCount}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-3">
          {/* Category + Title */}
          <div>
            <p className="text-[9px] text-white/25 tracking-[0.35em] uppercase font-mono mb-1">
              {auction.category || 'RLG REPTILE'}
            </p>
            <h3 className="font-semibold text-sm md:text-base line-clamp-2 text-white/90 group-hover:text-white transition-colors tracking-tight">
              {auction.title}
            </h3>
          </div>

          <div className="mt-auto space-y-3">
            {/* Separator */}
            <div className="flex items-center gap-2">
              <hr className="flex-1 border-none h-px bg-white/8" />
            </div>

            {/* Price */}
            <div>
              <p className="text-[9px] text-white/25 tracking-[0.3em] uppercase font-mono mb-1">
                {isEnded ? 'FINAL PRICE' : auction.bidCount > 0 ? 'CURRENT BID' : 'START PRICE'}
              </p>
              <p className={cn(
                'font-mono font-bold tabular-nums tracking-tight',
                isActive ? 'text-white text-xl md:text-2xl' : 'text-white/60 text-xl md:text-2xl'
              )}>
                {formatCurrency(auction.currentPrice || auction.startPrice)}
              </p>
            </div>

            {/* Countdown */}
            {isActive && (
              <div className="border-t border-white/8 pt-2">
                <Countdown endTime={auction.endTime} size="sm" />
              </div>
            )}

            {isEnded && auction.winnerName && (
              <div className="border-t border-white/8 pt-2">
                <p className="text-[10px] text-white/30 font-mono tracking-wider">
                  WINNER · <span className="text-white/50">{auction.winnerName}</span>
                </p>
              </div>
            )}

            {auction.status === 'upcoming' && (
              <div className="border-t border-white/8 pt-2">
                <Countdown endTime={auction.startTime} size="sm" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
