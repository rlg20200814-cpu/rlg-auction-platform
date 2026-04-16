'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuction } from '@/hooks/useAuction';
import { incrementViewCount } from '@/lib/firebase/auctions';
import { formatCurrency, formatDateTime, getImagePlaceholder } from '@/lib/utils';
import Header from '@/components/layout/Header';
import BidForm from '@/components/auction/BidForm';
import BidHistory from '@/components/auction/BidHistory';
import Countdown from '@/components/auction/Countdown';
import { cn } from '@/lib/utils';
import { ArrowLeft, Eye, Share2, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuctionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { auction, loading, error } = useAuction(id);
  const [currentImage, setCurrentImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'bids' | 'info'>('bids');
  const [prevBidCount, setPrevBidCount] = useState(0);
  const [initialEndTime, setInitialEndTime] = useState<number | null>(null);

  // 記錄初始結標時間，用來偵測是否被延長
  useEffect(() => {
    if (auction && initialEndTime === null) {
      setInitialEndTime(auction.endTime);
    }
  }, [auction?.id]);

  // Track view
  useEffect(() => {
    if (id) incrementViewCount(id).catch(() => {});
  }, [id]);

  // Flash notification on new bid
  useEffect(() => {
    if (!auction) return;
    if (prevBidCount > 0 && auction.bidCount > prevBidCount) {
      toast(`📢 新出價：${formatCurrency(auction.currentPrice)} — ${auction.lastBidderName}`, {
        duration: 2500,
      });
    }
    setPrevBidCount(auction.bidCount);
  }, [auction?.bidCount]);

  // 倒數到 0 自動觸發結標
  useEffect(() => {
    if (!auction || auction.status !== 'active') return;
    const remaining = auction.endTime - Date.now();
    if (remaining <= 0) {
      fetch('/api/auctions/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId: auction.id }),
      }).catch(() => {});
      return;
    }
    const timer = setTimeout(() => {
      fetch('/api/auctions/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId: auction.id }),
      }).catch(() => {});
    }, remaining + 1000); // +1s 緩衝
    return () => clearTimeout(timer);
  }, [auction?.id, auction?.endTime, auction?.status]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="skeleton aspect-square rounded-xl" />
            <div className="space-y-4">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-8 w-3/4 rounded" />
              <div className="skeleton h-12 w-1/2 rounded" />
              <div className="skeleton h-40 rounded-xl" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !auction) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-brand-gray-400">{error || '競標商品不存在'}</p>
          <Link href="/" className="btn-secondary">返回首頁</Link>
        </div>
      </>
    );
  }

  const images = auction.images?.length ? auction.images : [getImagePlaceholder(auction.title)];

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: auction.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('連結已複製');
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20 md:pb-8">
        {/* Breadcrumb */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-brand-gray-500 hover:text-brand-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          所有競標
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6 lg:gap-10">
          {/* Left: Images + Info */}
          <div className="space-y-6">
            {/* Image gallery */}
            <div className="relative">
              <div className="relative aspect-square md:aspect-[4/3] bg-brand-gray-900 rounded-xl overflow-hidden">
                <Image
                  src={images[currentImage]}
                  alt={auction.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />

                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImage((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImage((i) => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Status overlay */}
                <div className="absolute top-3 left-3">
                  <span className={cn(
                    'badge',
                    auction.status === 'active' && 'badge-active',
                    auction.status === 'upcoming' && 'badge-upcoming',
                    auction.status === 'ended' && 'badge-ended',
                  )}>
                    {auction.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse inline-block" />}
                    {auction.status === 'active' ? '競標中' : auction.status === 'upcoming' ? '即將開始' : '已結標'}
                  </span>
                </div>

                {/* Meta */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button onClick={handleShare} className="flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                    分享
                  </button>
                  <div className="flex items-center gap-1 bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-full backdrop-blur-sm">
                    <Eye className="w-3.5 h-3.5" />
                    {auction.viewCount || 0}
                  </div>
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={cn(
                        'relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                        i === currentImage ? 'border-brand-white' : 'border-transparent opacity-50 hover:opacity-80'
                      )}
                    >
                      <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description + Details — desktop */}
            <div className="hidden md:block space-y-4">
              <div>
                <p className="text-xs text-brand-gray-500 uppercase tracking-wider mb-1">{auction.category}</p>
                <h1 className="text-2xl font-bold">{auction.title}</h1>
              </div>
              <p className="text-brand-gray-300 leading-relaxed text-sm whitespace-pre-wrap">{auction.description}</p>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { label: '商品狀態', value: auction.condition || '未標示' },
                  ...(auction.ageClass ? [{ label: '品相', value: auction.ageClass }] : []),
                  { label: '起標價', value: formatCurrency(auction.startPrice) },
                  { label: '最低加價', value: formatCurrency(auction.minIncrement) },
                  { label: '開始時間', value: formatDateTime(auction.startTime) },
                  { label: '結標時間', value: formatDateTime(auction.endTime) },
                  { label: '運送方式', value: auction.shippingInfo || '面交 / 郵寄' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-brand-gray-900 rounded-lg p-3">
                    <p className="text-xs text-brand-gray-500 mb-1">{label}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Bid panel (sticky on desktop) */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* Title — mobile only */}
            <div className="md:hidden">
              <p className="text-xs text-brand-gray-500 uppercase tracking-wider mb-1">{auction.category}</p>
              <h1 className="text-xl font-bold">{auction.title}</h1>
            </div>

            {/* Countdown */}
            {auction.status === 'active' && (
              <div className="card p-5">
                <Countdown
                  endTime={auction.endTime}
                  size="lg"
                  wasExtended={initialEndTime !== null && auction.endTime > initialEndTime}
                  showExtendedBadge
                />
              </div>
            )}

            {/* Bid form */}
            <BidForm auction={auction} />

            {/* Tabs: Bids / Info */}
            <div className="card overflow-visible">
              <div className="flex border-b border-brand-gray-800">
                <button
                  onClick={() => setActiveTab('bids')}
                  className={cn(
                    'flex-1 py-3 text-sm font-medium transition-colors',
                    activeTab === 'bids' ? 'text-brand-white border-b-2 border-brand-white -mb-px' : 'text-brand-gray-500'
                  )}
                >
                  出價紀錄
                  {auction.bidCount > 0 && (
                    <span className="ml-1.5 text-xs bg-brand-gray-800 text-brand-gray-400 px-1.5 py-0.5 rounded-full">
                      {auction.bidCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('info')}
                  className={cn(
                    'flex-1 py-3 text-sm font-medium transition-colors md:hidden',
                    activeTab === 'info' ? 'text-brand-white border-b-2 border-brand-white -mb-px' : 'text-brand-gray-500'
                  )}
                >
                  商品資訊
                </button>
              </div>

              <div className="p-4">
                {activeTab === 'bids' && (
                  <BidHistory auctionId={auction.id} highestBidderId={auction.lastBidderId} />
                )}
                {activeTab === 'info' && (
                  <div className="space-y-3">
                    <p className="text-brand-gray-300 text-sm leading-relaxed">{auction.description}</p>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {[
                        { label: '商品狀態', value: auction.condition || '未標示' },
                        ...(auction.ageClass ? [{ label: '品相', value: auction.ageClass }] : []),
                        { label: '起標價', value: formatCurrency(auction.startPrice) },
                        { label: '最低加價', value: formatCurrency(auction.minIncrement) },
                        { label: '運送方式', value: auction.shippingInfo || '面交 / 郵寄' },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-brand-gray-800/60 rounded-lg p-2.5">
                          <p className="text-xs text-brand-gray-500 mb-0.5">{label}</p>
                          <p className="text-sm">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
