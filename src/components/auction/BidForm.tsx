'use client';

import { useState, useEffect } from 'react';
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

/** 無條件進位到最近的 100 倍數，且不低於 minBid */
function roundUp100(value: number, minBid: number): number {
  const rounded = Math.ceil(value / 100) * 100;
  return Math.max(rounded, minBid);
}

export default function BidForm({ auction }: BidFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [bidAmount, setBidAmount] = useState<number>(0);
  // 使用者正在輸入的原始字串（允許中間狀態如空白或不完整數字）
  const [inputRaw, setInputRaw] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastBidFlash, setLastBidFlash] = useState(false);

  const minBid = getMinBid(
    auction.currentPrice || auction.startPrice,
    auction.minIncrement
  );

  // 重置出價金額
  useEffect(() => {
    setBidAmount(minBid);
    setInputRaw(String(minBid));
  }, [minBid]);

  // 閃爍動畫
  useEffect(() => {
    setLastBidFlash(true);
    const t = setTimeout(() => setLastBidFlash(false), 1000);
    return () => clearTimeout(t);
  }, [auction.currentPrice]);

  const isAuctionActive = auction.status === 'active' && auction.endTime > Date.now();
  const isOwnHighestBid = auction.lastBidderId === user?.uid;
  const isEnded = auction.status === 'ended' || auction.endTime <= Date.now();

  // +/- 按鈕：以 minIncrement 為單位（保證是 100 的倍數）
  const adjust = (delta: number) => {
    const next = Math.max(minBid, bidAmount + delta);
    setBidAmount(next);
    setInputRaw(String(next));
  };

  // 使用者輸入文字時
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputRaw(e.target.value);
  };

  // 離開輸入框時：取整到 100、不低於 minBid
  const handleInputBlur = () => {
    const parsed = parseInt(inputRaw) || 0;
    const snapped = roundUp100(parsed, minBid);
    setBidAmount(snapped);
    setInputRaw(String(snapped));
  };

  // 快速出價按鈕
  const handlePreset = (amount: number) => {
    setBidAmount(amount);
    setInputRaw(String(amount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }

    // 確保送出時也是 100 的倍數且不低於 minBid
    const finalAmount = roundUp100(bidAmount, minBid);
    if (finalAmount < minBid) {
      toast.error(`出價必須至少 ${formatCurrency(minBid)}`);
      return;
    }

    setIsSubmitting(true);
    const result = await placeBid(auction.id, user.uid, user.name, user.avatar, finalAmount);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(
        result.extended
          ? '出價成功！競標已延長至 60 秒後結標 ⚡'
          : '出價成功！你是目前最高出價者',
        { duration: 3000 }
      );

      // 即時寫入 CRM bids 表
      try {
        const { getAuth } = await import('firebase/auth');
        const idToken = await getAuth().currentUser?.getIdToken();
        if (idToken) {
          fetch('/api/events', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              event_type: 'bid_placed',
              platform_user_id: user.uid,
              auction_id: auction.id,
              product_name: auction.title,
              category: auction.category || '',
              bid_amount: finalAmount,
              bid_count_in_auction: (auction.bidCount || 0) + 1,
              is_extended: result.extended || false,
              new_end_time: result.newEndTime || auction.endTime,
            }),
          }).catch(() => {});
        }
      } catch { /* CRM 失敗不影響出價 */ }
    } else {
      toast.error(result.error || '出價失敗');
      setBidAmount(minBid);
      setInputRaw(String(minBid));
    }
  };

  // ── Ended ──
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
            <p className="price-display text-2xl">{formatCurrency(auction.currentPrice)}</p>
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

  // ── Upcoming ──
  if (auction.status === 'upcoming') {
    return (
      <div className="card p-6 text-center">
        <p className="text-brand-gray-400 text-sm">競標尚未開始</p>
      </div>
    );
  }

  // 快速加價選項（以 minIncrement 倍數為基準，取整到百）
  const presets = [1, 3, 5].map((m) => {
    const raw = (auction.currentPrice || auction.startPrice) + auction.minIncrement * m;
    return roundUp100(raw, minBid);
  });

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      {/* 目前最高出價 */}
      <div className={cn('space-y-1 p-4 bg-brand-gray-800/60 transition-colors', lastBidFlash && 'bid-flash')}>
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

      {/* 已是最高出價者提示 */}
      {isOwnHighestBid && (
        <div className="flex items-center gap-2 text-white text-sm bg-white/5 border border-white/15 px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>你已是目前最高出價者</span>
        </div>
      )}

      {/* 出價輸入區 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs text-brand-gray-400 uppercase tracking-widest">
            出價金額
          </label>
          <span className="text-xs text-brand-gray-500 font-mono">
            最低 {formatCurrency(minBid)} · 以百為單位
          </span>
        </div>

        {/* 輸入框 + +/- */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => adjust(-auction.minIncrement)}
            disabled={bidAmount <= minBid}
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center border border-white/15 text-white/60 hover:text-white hover:border-white/40 active:scale-95 transition-all disabled:opacity-20"
            aria-label="減少"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-500 text-sm pointer-events-none">$</span>
            <input
              type="number"
              value={inputRaw}
              min={minBid}
              step={100}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className="input pl-7 text-center text-xl font-bold font-mono tracking-tight"
              aria-label="出價金額"
            />
          </div>

          <button
            type="button"
            onClick={() => adjust(auction.minIncrement)}
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center border border-white/15 text-white/60 hover:text-white hover:border-white/40 active:scale-95 transition-all"
            aria-label="增加"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* 快速出價 */}
        <div className="flex gap-2">
          {presets.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handlePreset(amount)}
              className={cn(
                'flex-1 py-2 text-xs border transition-all tracking-wider',
                bidAmount === amount
                  ? 'bg-white text-black border-white font-bold'
                  : 'border-white/15 text-white/40 hover:border-white/40 hover:text-white/70'
              )}
            >
              {formatCurrency(amount)}
            </button>
          ))}
        </div>
      </div>

      {/* 送出 */}
      {user ? (
        <button
          type="submit"
          disabled={isSubmitting || !isAuctionActive || isOwnHighestBid}
          className="btn-primary w-full py-4 text-sm"
        >
          <Gavel className="w-4 h-4" />
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
          className="btn-primary w-full py-4 text-sm"
        >
          登入後出價
        </button>
      )}

      <p className="text-center text-xs text-brand-gray-600 font-mono">
        最低加價 {formatCurrency(auction.minIncrement)} · 出價以百為單位
      </p>
    </form>
  );
}
