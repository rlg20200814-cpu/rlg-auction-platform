'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllAuctions, setAuctionStatus, updateAuction, finalizeAuction } from '@/lib/firebase/auctions';
import { formatCurrency, formatDateTime, getImagePlaceholder, getAuctionStatusLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Plus, Edit, Play, Square, Trophy, RefreshCw, TrendingUp, Clock, DollarSign, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Auction } from '@/types';
import LineQRCode from '@/components/LineQRCode';

export default function AdminPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await getAllAuctions();
    setAuctions(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleStart = async (id: string) => {
    setActionLoading(id + '_start');
    await setAuctionStatus(id, 'active');
    toast.success('競標已開始');
    await load();
    setActionLoading(null);
  };

  const handleEnd = async (id: string) => {
    if (!confirm('確定要結束此競標？此操作無法復原')) return;
    setActionLoading(id + '_end');
    await finalizeAuction(id);
    toast.success('競標已結束');
    await load();
    setActionLoading(null);
  };

  // Summary stats
  const stats = {
    total: auctions.length,
    active: auctions.filter((a) => a.status === 'active').length,
    totalBids: auctions.reduce((sum, a) => sum + (a.bidCount || 0), 0),
    totalValue: auctions
      .filter((a) => a.status === 'ended')
      .reduce((sum, a) => sum + (a.currentPrice || 0), 0),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">競標管理</h1>
          <p className="text-brand-gray-500 text-sm mt-1">管理所有競標商品</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost" disabled={loading}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <Link href="/line-qr" target="_blank" className="btn-ghost">
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">QR Code</span>
          </Link>
          <Link href="/admin/auctions/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            新增商品
          </Link>
        </div>
      </div>

      {/* QR Code 快速入口 */}
      {(process.env.NEXT_PUBLIC_LINE_OA_ID || process.env.NEXT_PUBLIC_SITE_URL) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LineQRCode
            lineOaId={process.env.NEXT_PUBLIC_LINE_OA_ID}
            siteUrl={process.env.NEXT_PUBLIC_SITE_URL}
            card
          />
          <div className="card p-5 flex flex-col justify-center space-y-3">
            <h3 className="font-semibold text-sm">現場分享</h3>
            <p className="text-xs text-brand-gray-400 leading-relaxed">
              將左側 QR Code 投影或列印，讓現場用戶掃描後即可：
            </p>
            <ul className="text-xs text-brand-gray-400 space-y-1.5 list-disc list-inside">
              <li>加入 LINE 官方帳號，接收出價通知</li>
              <li>直接進入競標平台出價</li>
            </ul>
            <Link href="/line-qr" target="_blank" className="btn-secondary text-xs py-2 mt-2 inline-flex items-center justify-center gap-2">
              <QrCode className="w-3.5 h-3.5" />
              全螢幕 QR Code 頁面
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp, label: '總商品數', value: stats.total, color: 'text-brand-white' },
          { icon: Play, label: '競標中', value: stats.active, color: 'text-green-400' },
          { icon: DollarSign, label: '總出價次數', value: stats.totalBids, color: 'text-brand-accent' },
          { icon: Trophy, label: '已成交總值', value: formatCurrency(stats.totalValue), color: 'text-amber-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-4">
            <Icon className={cn('w-4 h-4 mb-2', color)} />
            <p className={cn('text-xl font-bold tabular-nums', color)}>{value}</p>
            <p className="text-xs text-brand-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Auctions table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-16 card">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-brand-gray-700" />
          <p className="text-brand-gray-400 mb-4">還沒有任何競標商品</p>
          <Link href="/admin/auctions/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            新增第一個商品
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {auctions.map((auction) => {
            const image = auction.images?.[0] || getImagePlaceholder(auction.title);
            return (
              <div key={auction.id} className="card p-4 flex items-center gap-4">
                {/* Image */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-brand-gray-800">
                  <Image src={image} alt={auction.title} fill className="object-cover" sizes="64px" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      'badge text-xs',
                      auction.status === 'active' && 'badge-active',
                      auction.status === 'upcoming' && 'badge-upcoming',
                      auction.status === 'ended' && 'badge-ended',
                    )}>
                      {getAuctionStatusLabel(auction.status)}
                    </span>
                    <h3 className="font-medium text-sm truncate">{auction.title}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-brand-gray-500 flex-wrap">
                    <span className="font-mono text-brand-gray-300">{formatCurrency(auction.currentPrice || auction.startPrice)}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{auction.bidCount} 次出價</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDateTime(auction.endTime)}</span>
                    {auction.winnerName && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Trophy className="w-3 h-3" />得標：{auction.winnerName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/auctions/${auction.id}/edit`}
                    className="btn-ghost p-2"
                    aria-label="編輯"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  {auction.status === 'upcoming' && (
                    <button
                      onClick={() => handleStart(auction.id)}
                      disabled={actionLoading === auction.id + '_start'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-900/30 text-green-400 border border-green-800 text-xs font-medium hover:bg-green-900/50 transition-colors disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      開始
                    </button>
                  )}

                  {auction.status === 'active' && (
                    <button
                      onClick={() => handleEnd(auction.id)}
                      disabled={actionLoading === auction.id + '_end'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 border border-red-800 text-xs font-medium hover:bg-red-900/50 transition-colors disabled:opacity-50"
                    >
                      <Square className="w-3.5 h-3.5" />
                      結束
                    </button>
                  )}

                  {auction.status === 'ended' && (
                    <span className="flex items-center gap-1 text-xs text-brand-gray-600 px-3 py-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      已結標
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
