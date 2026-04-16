import {
  ref,
  set,
  get,
  push,
  update,
  onValue,
  off,
  query,
  orderByChild,
  equalTo,
} from 'firebase/database';
import { db } from './config';
import type { Product, ProductStatus } from '@/types';

// =============================================
// Read Operations
// =============================================

export async function getProduct(id: string): Promise<Product | null> {
  const snapshot = await get(ref(db, `products/${id}`));
  if (!snapshot.exists()) return null;
  return { id: snapshot.key!, ...snapshot.val() } as Product;
}

export async function getAllProducts(): Promise<Product[]> {
  const snapshot = await get(ref(db, 'products'));
  if (!snapshot.exists()) return [];
  const products: Product[] = [];
  snapshot.forEach((child) => {
    products.push({ id: child.key!, ...child.val() } as Product);
  });
  return products.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAvailableProducts(): Promise<Product[]> {
  const snapshot = await get(
    query(ref(db, 'products'), orderByChild('status'), equalTo('available'))
  );
  if (!snapshot.exists()) return [];
  const products: Product[] = [];
  snapshot.forEach((child) => {
    products.push({ id: child.key!, ...child.val() } as Product);
  });
  return products.sort((a, b) => b.createdAt - a.createdAt);
}

// =============================================
// Real-time Subscriptions
// =============================================

export function subscribeToProducts(
  callback: (products: Product[]) => void,
  onlyAvailable = false
) {
  const productsRef = onlyAvailable
    ? query(ref(db, 'products'), orderByChild('status'), equalTo('available'))
    : ref(db, 'products');

  const listener = onValue(productsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const products: Product[] = [];
    snapshot.forEach((child) => {
      products.push({ id: child.key!, ...child.val() } as Product);
    });
    callback(products.sort((a, b) => b.createdAt - a.createdAt));
  });

  return () => off(productsRef, 'value', listener);
}

// =============================================
// Write Operations (Admin)
// =============================================

export async function createProduct(
  data: Omit<Product, 'id'>
): Promise<string> {
  const productsRef = ref(db, 'products');
  const newRef = push(productsRef);
  await set(newRef, data);
  return newRef.key!;
}

export async function updateProduct(
  id: string,
  data: Partial<Product>
): Promise<void> {
  await update(ref(db, `products/${id}`), { ...data, updatedAt: Date.now() });
}

export async function setProductStatus(
  id: string,
  status: ProductStatus
): Promise<void> {
  await update(ref(db, `products/${id}`), { status, updatedAt: Date.now() });
}

export async function deleteProduct(id: string): Promise<void> {
  await set(ref(db, `products/${id}`), null);
}
