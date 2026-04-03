'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuction, updateAuction } from '@/lib/firebase/auctions';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Auction } from '@/types';

const CATEGORIES = ['活體', '爬箱', '周邊', '燈具'];
const CONDITIONS = ['全新', '二手'];

export default function EditAuctionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    startPrice: '0',
    minIncrement: '100',
    startTime: '',
    endTime: '',
    shippingInfo: '',
  });

  useEffect(() => {
    if (!id) return;
    getAuction(id).then((data) => {
      if (!data) { toast.error('商品不存在'); router.push('/admin'); return; }
      setAuction(data);
      setForm({
        title: data.title,
        description: data.description || '',
        category: data.category || '其他',
        condition: data.condition || '全新',
        startPrice: String(data.startPrice),
        minIncrement: String(data.minIncrement),
        startTime: new Date(data.startTime).toISOString().slice(0, 16),
        endTime: new Date(data.endTime).toISOString().slice(0, 16),
        shippingInfo: data.shippingInfo || '',
      });
      setLoading(false);
    });
  }, [id, router]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auction) return;

    setSaving(true);
    try {
      await updateAuction(id, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        condition: form.condition,
        startPrice: parseInt(form.startPrice) || 0,
        minIncrement: parseInt(form.minIncrement) || 100,
        startTime: new Date(form.startTime).getTime(),
        endTime: new Date(form.endTime).getTime(),
        shippingInfo: form.shippingInfo,
      });
      toast.success('已更新');
      router.push('/admin');
    } catch {
      toast.error('更新失敗');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-brand-gray-500 text-sm">載入中...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">編輯商品</h1>
          <p className="text-brand-gray-500 text-sm truncate max-w-xs">{auction?.title}</p>
        </div>
      </div>

      {auction?.status === 'active' && (
        <div className="flex items-center gap-2 bg-amber-900/30 border border-amber-800 text-amber-400 rounded-lg px-4 py-3 text-sm mb-6">
          <Info className="w-4 h-4 shrink-0" />
          <span>競標進行中，修改部分欄位可能影響現有出價。建議僅調整結標時間或說明。</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card p-5 space-y-4">
          <div>
            <label className="text-xs text-brand-gray-500 mb-1.5 block">商品名稱</label>
            <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} className="input" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">分類</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">商品狀態</label>
              <select value={form.condition} onChange={(e) => set('condition', e.target.value)} className="input">
                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-gray-500 mb-1.5 block">商品描述</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="input min-h-[100px] resize-y" />
          </div>

          <div>
            <label className="text-xs text-brand-gray-500 mb-1.5 block">運送方式</label>
            <input type="text" value={form.shippingInfo} onChange={(e) => set('shippingInfo', e.target.value)} className="input" />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-medium text-brand-gray-300">競標設定</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">起標價</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-500 text-sm">$</span>
                <input type="number" value={form.startPrice} onChange={(e) => set('startPrice', e.target.value)} className="input pl-7" min="0" />
              </div>
            </div>
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">最低加價幅度</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-500 text-sm">$</span>
                <input type="number" value={form.minIncrement} onChange={(e) => set('minIncrement', e.target.value)} className="input pl-7" min="1" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">開始時間</label>
              <input type="datetime-local" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">結標時間</label>
              <input type="datetime-local" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} className="input" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/admin" className="btn-secondary flex-1 justify-center">取消</Link>
          <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
            <Save className="w-4 h-4" />
            {saving ? '儲存中...' : '儲存變更'}
          </button>
        </div>
      </form>
    </div>
  );
}
