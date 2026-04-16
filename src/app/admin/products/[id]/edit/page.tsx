'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProduct, updateProduct } from '@/lib/firebase/products';
import { Upload, X, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import type { Product } from '@/types';

interface FormData {
  title: string;
  description: string;
  category: string;
  condition: string;
  ageClass: string;
  price: string;
  stock: string;
  shippingInfo: string;
}

const CATEGORIES = ['活體', '爬箱', '周邊', '燈具', '其他'];
const CONDITIONS = ['全新', '二手'];
const AGE_CLASSES = ['幼體', '亞成體', '成體'];

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    category: '活體',
    condition: '全新',
    ageClass: '',
    price: '0',
    stock: '1',
    shippingInfo: '面交 / 郵寄（運費由買家負擔）',
  });

  useEffect(() => {
    const load = async () => {
      const product = await getProduct(id);
      if (!product) {
        toast.error('找不到此商品');
        router.push('/admin/products');
        return;
      }
      setExistingImages(product.images || []);
      setForm({
        title: product.title,
        description: product.description || '',
        category: product.category || '活體',
        condition: product.condition || '全新',
        ageClass: product.ageClass || '',
        price: String(product.price),
        stock: String(product.stock),
        shippingInfo: product.shippingInfo || '面交 / 郵寄（運費由買家負擔）',
      });
      setLoading(false);
    };
    load();
  }, [id, router]);

  const set = (key: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleNewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalSlots = 5 - existingImages.length - newImages.length;
    const selected = files.slice(0, totalSlots).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((prev) => [...prev, ...selected]);
  };

  const removeExistingImage = (i: number) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const removeNewImage = (i: number) => {
    setNewImages((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const uploadNewImages = async (): Promise<string[]> => {
    if (newImages.length === 0) return [];
    const urls: string[] = [];
    for (let i = 0; i < newImages.length; i++) {
      const { file } = newImages[i];
      const path = `products/${Date.now()}_${i}_${file.name.replace(/\s/g, '_')}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      urls.push(url);
      setUploadProgress(Math.round(((i + 1) / newImages.length) * 100));
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('請輸入商品名稱');

    const price = parseInt(form.price) || 0;
    const stock = parseInt(form.stock) || 0;

    setSubmitting(true);
    try {
      const uploadedUrls = await uploadNewImages();
      const allImages = [...existingImages, ...uploadedUrls];

      await updateProduct(id, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        condition: form.condition,
        ageClass: form.ageClass || '',
        images: allImages,
        price,
        stock,
        status: stock > 0 ? 'available' : 'sold_out',
        shippingInfo: form.shippingInfo,
      });

      toast.success('商品已更新！');
      router.push('/admin/products');
    } catch (err) {
      console.error(err);
      toast.error('更新失敗，請重試');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const totalImages = existingImages.length + newImages.length;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64 rounded-xl" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/products" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">編輯零售商品</h1>
          <p className="text-brand-gray-500 text-sm">修改商品資料與定價</p>
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
            {/* Existing images */}
            {existingImages.map((url, i) => (
              <div key={`existing-${i}`} className="relative aspect-square rounded-lg overflow-hidden bg-brand-gray-800 group">
                <Image src={url} alt="" fill className="object-cover" sizes="100px" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {/* New images */}
            {newImages.map((img, i) => (
              <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden bg-brand-gray-800 group">
                <Image src={img.preview} alt="" fill className="object-cover" sizes="100px" />
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 text-[9px] bg-black/60 px-1 text-white/60">NEW</div>
              </div>
            ))}
            {totalImages < 5 && (
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
            onChange={handleNewImageSelect}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">品相（活體適用）</label>
              <select value={form.ageClass} onChange={(e) => set('ageClass', e.target.value)} className="input">
                <option value="">— 不適用 —</option>
                {AGE_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-gray-500 mb-1.5 block">商品描述</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="input min-h-[100px] resize-y"
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

        {/* Pricing & Stock */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-medium text-brand-gray-300">定價與庫存</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">售價</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-500 text-sm">$</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  className="input pl-7"
                  min="0"
                  step="1"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-brand-gray-500 mb-1.5 block">庫存數量</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
                className="input"
                min="0"
                step="1"
              />
            </div>
          </div>
          <p className="text-xs text-brand-gray-500">庫存設為 0 時，商品將自動標記為「已售完」</p>
        </div>

        {/* Upload progress */}
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
          <Link href="/admin/products" className="btn-secondary flex-1 justify-center">
            取消
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
            {submitting ? '更新中...' : '儲存變更'}
          </button>
        </div>
      </form>
    </div>
  );
}
