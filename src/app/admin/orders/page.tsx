'use client';

import { useState, useEffect } from 'react';
import { subscribeToOrders, updateOrderStatus } from '@/lib/firebase/orders';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { RefreshCw, Package, Banknote, CreditCard, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order, OrderStatus } from '@/types';

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pending_payment', label: '待付款',  color: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/50' },
  { value: 'paid',           label: '已付款',  color: 'text-green-400 bg-green-900/20 border-green-800/50' },
  { value: 'processing',     label: '處理中',  color: 'text-blue-400 bg-blue-900/20 border-blue-800/50' },
  { value: 'shipped',        label: '已出貨',  color: 'text-purple-400 bg-purple-900/20 border-purple-800/50' },
  { value: 'completed',      label: '已完成',  color: 'text-emerald-400 bg-emerald-900/20 border-emerald-800/50' },
  { value: 'cancelled',      label: '已取消',  color: 'text-red-400 bg-red-900/20 border-red-800/50' },
];

function StatusBadge({ status }: { status: OrderStatus }) {
  const opt = STATUS_OPTIONS.find(o => o.value === status);
  if (!opt) return null;
  return (
    <span className={cn('text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border', opt.color)}>
      {opt.label}
    </span>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToOrders(data => {
      setOrders(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('訂單狀態已更新');
    } catch {
      toast.error('更新失敗');
    }
    setUpdating(null);
  };

  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending_payment').length,
    paid: orders.filter(o => ['paid', 'processing', 'shipped', 'completed'].includes(o.status)).length,
    revenue: orders
      .filter(o => ['paid', 'processing', 'shipped', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">訂單管理</h1>
          <p className="text-brand-gray-500 text-sm mt-1">管理所有購物訂單</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '總訂單', value: stats.total, color: 'text-brand-white' },
          { label: '待付款', value: stats.pending, color: 'text-yellow-400' },
          { label: '已付款', value: stats.paid, color: 'text-green-400' },
          { label: '總收入', value: formatCurrency(stats.revenue), color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className={cn('text-xl font-bold tabular-nums', color)}>{value}</p>
            <p className="text-xs text-brand-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {([{ value: 'all', label: '全部' }, ...STATUS_OPTIONS] as { value: string; label: string }[]).map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilterStatus(opt.value as OrderStatus | 'all')}
            className={cn(
              'px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-all',
              filterStatus === opt.value
                ? 'bg-brand-white text-brand-black border-brand-white'
                : 'text-brand-gray-400 border-brand-gray-700 hover:border-brand-gray-500'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 card">
          <Package className="w-12 h-12 mx-auto mb-3 text-brand-gray-700" />
          <p className="text-brand-gray-400">沒有符合條件的訂單</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => {
            const isExpanded = expandedId === order.id;
            const isBankTransfer = order.paymentMethod === 'bank_transfer';

            return (
              <div key={order.id} className="card overflow-hidden">
                {/* Row */}
                <div className="p-4 flex items-center gap-4">
                  {/* Order info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={order.status} />
                      <span className="font-mono text-xs text-brand-gray-400">{order.orderNumber}</span>
                      <span className="flex items-center gap-1 text-xs text-brand-gray-500">
                        {isBankTransfer
                          ? <><Banknote className="w-3 h-3" /> 匯款</>
                          : <><CreditCard className="w-3 h-3" /> 刷卡</>
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-brand-gray-500 flex-wrap">
                      <span className="text-brand-gray-300 font-medium">{order.buyerName}</span>
                      <span>{order.buyerPhone}</span>
                      <span className="font-mono text-brand-white font-bold">{formatCurrency(order.totalAmount)}</span>
                      <span>{new Date(order.createdAt).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Status changer */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      disabled={updating === order.id}
                      className="bg-brand-gray-800 border border-brand-gray-700 text-brand-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-brand-gray-500 disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    {updating === order.id && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-gray-500" />
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="p-1.5 text-brand-gray-500 hover:text-brand-white transition-colors"
                    >
                      <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-brand-gray-800 p-4 space-y-4 bg-brand-gray-900/50">
                    {/* Items */}
                    <div>
                      <p className="text-xs text-brand-gray-500 uppercase tracking-wider mb-2">訂購商品</p>
                      <div className="space-y-2">
                        {order.items.map(item => (
                          <div key={item.productId} className="flex justify-between text-sm">
                            <span className="text-brand-gray-300">{item.title} <span className="text-brand-gray-600">×{item.quantity}</span></span>
                            <span className="font-mono text-brand-white">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      {[
                        { label: '小計', value: formatCurrency(order.subtotal) },
                        { label: '運費', value: order.shippingFee === 0 ? '免費' : formatCurrency(order.shippingFee) },
                        { label: '合計', value: formatCurrency(order.totalAmount) },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-brand-gray-800 p-2 rounded">
                          <p className="text-brand-gray-500 mb-0.5">{label}</p>
                          <p className="font-mono text-brand-white font-medium">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Buyer */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        { label: '姓名', value: order.buyerName },
                        { label: '手機', value: order.buyerPhone },
                        { label: 'Email', value: order.buyerEmail },
                        { label: '地址', value: order.shippingAddress || '面交' },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-brand-gray-800 p-2 rounded">
                          <p className="text-brand-gray-500 mb-0.5">{label}</p>
                          <p className="text-brand-gray-200 break-all">{value}</p>
                        </div>
                      ))}
                    </div>

                    {order.note && (
                      <div className="bg-brand-gray-800 p-3 rounded text-xs">
                        <p className="text-brand-gray-500 mb-1">備註</p>
                        <p className="text-brand-gray-300">{order.note}</p>
                      </div>
                    )}

                    {/* Quick confirm payment button for bank transfer */}
                    {isBankTransfer && order.status === 'pending_payment' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'paid')}
                        disabled={updating === order.id}
                        className="px-4 py-2 bg-green-900/30 text-green-400 border border-green-800 text-xs font-medium hover:bg-green-900/50 transition-colors disabled:opacity-50"
                      >
                        ✓ 確認收到匯款
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
