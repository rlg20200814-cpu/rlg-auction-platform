import { ref, set, get, push, update, onValue, off, query, orderByChild } from 'firebase/database';
import { db } from './config';
import type { Order, OrderStatus } from '@/types';

// =============================================
// Read
// =============================================

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await get(ref(db, `orders/${id}`));
  if (!snap.exists()) return null;
  return { id: snap.key!, ...snap.val() } as Order;
}

export async function getAllOrders(): Promise<Order[]> {
  const snap = await get(ref(db, 'orders'));
  if (!snap.exists()) return [];
  const orders: Order[] = [];
  snap.forEach(child => orders.push({ id: child.key!, ...child.val() } as Order));
  return orders.sort((a, b) => b.createdAt - a.createdAt);
}

export function subscribeToOrders(callback: (orders: Order[]) => void) {
  const ordersRef = ref(db, 'orders');
  const listener = onValue(ordersRef, snap => {
    if (!snap.exists()) { callback([]); return; }
    const orders: Order[] = [];
    snap.forEach(child => orders.push({ id: child.key!, ...child.val() } as Order));
    callback(orders.sort((a, b) => b.createdAt - a.createdAt));
  });
  return () => off(ordersRef, 'value', listener);
}

// =============================================
// Write
// =============================================

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  extra?: Partial<Order>
): Promise<void> {
  await update(ref(db, `orders/${id}`), { status, ...extra, updatedAt: Date.now() });
}
