'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllProducts, setProductStatus, deleteProduct } from '@/lib/firebase/products';
import { formatCurrency, getImagePlaceholder } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Plus, Edit, Trash2, RefreshCw, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product, ProductStatus } from '@/types';

const STATUS_LABELS: Record<ProductStatus, string> = {
  available: '販售中',
  sold_out: '已售完',
  hidden: '已隱藏',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await getAllProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id: string, status: ProductStatus) => {
    setActionLoading(id + '_status');
    await setProductStatus(id, status);
    const label = STATUS_LABELS[status];
    toast.success(`商品已更新為「${label}」`);
    await load();
    setActionLoading(null);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`確定要刪除「${title}」？此操作無法復原`)) return;
    setActionLoading(id + '_delete');
    await deleteProduct(id);
    toast.success('商品已刪除');
    await load();
    setActionLoading(null);
  };

  const stats = {
    total: products.length,
    available: products.filter((p) => p.status === 'available').length,
    sold_out: products.filter((p) => p.status === 'sold_out').length,
    hidden: products.filter((p) => p.status === 'hidden').length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">零售商品管理</h1>
          <p className="text-brand-gray-500 text-sm mt-1">管理所有零售商品</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost" disabled={loading}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <Link href="/admin/products/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            新增商品
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '總商品數', value: stats.total, color: 'text-brand-white' },
          { label: '販售中', value: stats.available, color: 'text-green-400' },
          { label: '已售完', value: stats.sold_out, color: 'text-amber-400' },
          { label: '已隱藏', value: stats.hidden, color: 'text-brand-gray-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <ShoppingBag className={cn('w-4 h-4 mb-2', color)} />
            <p className={cn('text-xl font-bold tabular-nums', color)}>{value}</p>
            <p className="text-xs text-brand-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Products table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 card">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-brand-gray-700" />
          <p className="text-brand-gray-400 mb-4">還沒有任何零售商品</p>
          <Link href="/admin/products/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            新增第一個商品
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const image = product.images?.[0] || getImagePlaceholder(product.title);
            return (
              <div key={product.id} className="card p-4 flex items-center gap-4">
                {/* Image */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-brand-gray-800">
                  <Image src={image} alt={product.title} fill className="object-cover" sizes="64px" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      'badge text-xs',
                      product.status === 'available' && 'badge-active',
                      product.status === 'sold_out' && 'badge-ended',
                      product.status === 'hidden' && 'badge-upcoming',
                    )}>
                      {STATUS_LABELS[product.status]}
                    </span>
                    <h3 className="font-medium text-sm truncate">{product.title}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-brand-gray-500 flex-wrap">
                    <span className="font-mono text-brand-gray-300">{formatCurrency(product.price)}</span>
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" />
                      庫存 {product.stock}
                    </span>
                    <span className="text-brand-gray-600">{product.category}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="btn-ghost p-2"
                    aria-label="編輯"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  {product.status === 'available' && (
                    <button
                      onClick={() => handleStatusChange(product.id, 'sold_out')}
                      disabled={actionLoading === product.id + '_status'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/30 text-amber-400 border border-amber-800 text-xs font-medium hover:bg-amber-900/50 transition-colors disabled:opacity-50"
                    >
                      標為售完
                    </button>
                  )}

                  {product.status === 'sold_out' && (
                    <button
                      onClick={() => handleStatusChange(product.id, 'available')}
                      disabled={actionLoading === product.id + '_status'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-900/30 text-green-400 border border-green-800 text-xs font-medium hover:bg-green-900/50 transition-colors disabled:opacity-50"
                    >
                      恢復販售
                    </button>
                  )}

                  {product.status !== 'hidden' ? (
                    <button
                      onClick={() => handleStatusChange(product.id, 'hidden')}
                      disabled={actionLoading === product.id + '_status'}
                      className="btn-ghost p-2"
                      aria-label="隱藏"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(product.id, 'available')}
                      disabled={actionLoading === product.id + '_status'}
                      className="btn-ghost p-2"
                      aria-label="顯示"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(product.id, product.title)}
                    disabled={actionLoading === product.id + '_delete'}
                    className="btn-ghost p-2 text-red-400 hover:text-red-300"
                    aria-label="刪除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
