'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createAuction } from '@/lib/firebase/auctions';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { Upload, X, ArrowLeft, Image as ImageIcon, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

interface FormData {
  title: string;
  description: string;
  category: string;
  condition: string;
  startPrice: string;
  minIncrement: string;
  startTime: string;
  endTime: string;
  shippingInfo: string;
}

const CATEGORIES = ['活體', '爬箱', '周邊', '燈具'];
const CONDITIONS = ['全新', '二手'];

export default function NewAuctionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 5 * 60000).toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 24 * 3600000).toISOString().slice(0, 16);

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    category: '球鞋',
    condition: '全新',
    startPrice: '0',
    minIncrement: '100',
    startTime: defaultStart,
    endTime: defaultEnd,
    shippingInfo: '面交 / 郵寄（運費由買家負擔）',
  });

  const set = (key: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.slice(0, 5 - images.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (i: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];
    const urls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const { file } = images[i];
      const path = `auctions/${Date.now()}_${i}_${file.name.replace(/\s/g, '_')}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      urls.push(url);
      setUploadProgress(Math.round(((i + 1) / images.length) * 100));
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('請輸入商品名稱');
    if (!user) return toast.error('請先登入');

    const startPrice = parseInt(form.startPrice) || 0;
    const minIncrement = parseInt(form.minIncrement) || 100;
    const startTime = new Date(form.startTime).getTime();
    const endTime = new Date(form.endTime).getTime();

    if (endTime <= startTime) return toast.error('結標時間必須晚於開始時間');

    setSubmitting(true);
    try {
      const imageUrls = await uploadImages();

      const auctionData = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        condition: form.condition,
        images: imageUrls,
        startPrice,
        currentPrice: startPrice,
        minIncrement,
        startTime,
        endTime,
        status: 'upcoming' as const,
        sellerId: user.uid,
        sellerName: user.name,
        winnerId: null,
        winnerName: null,
        lastBidderId: null,
        lastBidderName: null,
        bidCount: 0,
        viewCount: 0,
        shippingInfo: form.shippingInfo,
        createdAt: Date.now(),
      };

      const id = await createAuction(auctionData);
      toast.success('商品已建立！');
      router.push('/admin');
    } catch (err) {
      console.error(err);
      toast.error('建立失敗，請重試');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const minBidPreview = (parseInt(form.startPrice) || 0) + (parseInt(form.minIncrement) || 100);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">新增競標商品</h1>
          <p className="text-brand-gray-500 text-sm">填寫商品資料並設定競標條件</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div className="card p-5 space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-brand-gray-400" />
            商品圖片（最多 5 張）
          </label>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-brand-gray-800 group">
                <Image src={img.preview} alt="" fill className="object-cover" sizes="100px" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-brand-gray-700 flex flex-col items-center justify-center gap-1 hover:border-brand-gray-500 transition-colors text-brand-gray-500 hover:text-brand-gray-300"
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs">上傳</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Basic info */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-medium text-brand-gray-300">基本資料</h2>

          <div>
            <label className="text-xs text-brand-gray-500 mb-1.5 block">商品名稱 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className="input"
              placeholder="例：高階黑紅鬆"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">分類</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">商品狀態</label>
              <select value={form.condition} onChange={(e) => set('condition', e.target.value)} className="input">
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-gray-500 mb-1.5 block">商品描述</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="input min-h-[100px] resize-y"
              placeholder="詳細描述商品的尺寸、瑕疵、附件等資訊..."
            />
          </div>

          <div>
            <label className="text-xs text-brand-gray-500 mb-1.5 block">運送方式</label>
            <input
              type="text"
              value={form.shippingInfo}
              onChange={(e) => set('shippingInfo', e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Auction settings */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-medium text-brand-gray-300">競標設定</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">起標價（可設 0）</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-500 text-sm">$</span>
                <input
                  type="number"
                  value={form.startPrice}
                  onChange={(e) => set('startPrice', e.target.value)}
                  className="input pl-7"
                  min="0"
                  step="100"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">最低加價幅度</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-500 text-sm">$</span>
                <input
                  type="number"
                  value={form.minIncrement}
                  onChange={(e) => set('minIncrement', e.target.value)}
                  className="input pl-7"
                  min="1"
                  step="1"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-brand-gray-800/60 rounded-lg px-3 py-2 text-xs text-brand-gray-400">
            <Info className="w-3.5 h-3.5 shrink-0" />
            第一個有效出價最低為 {formatCurrency(minBidPreview)}（起標價 + 加價幅度）
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">開始時間</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => set('startTime', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">結標時間</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => set('endTime', e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-brand-gray-800/60 rounded-lg px-3 py-2 text-xs text-brand-gray-400">
            <Info className="w-3.5 h-3.5 shrink-0" />
            結標前 60 秒內有人出價，系統將自動延長 60 秒（可重複延長）
          </div>
        </div>

        {/* Submit */}
        {submitting && uploadProgress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-brand-gray-400">
              <span>上傳圖片中...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 bg-brand-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-accent transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/admin" className="btn-secondary flex-1 justify-center">
            取消
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
            {submitting ? '建立中...' : '建立商品'}
          </button>
        </div>
      </form>
    </div>
  );
}
