/**
 * idGenerator — CRM 各表 ID 生成
 */

export function generateCustomerId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CUS-${date}-${rand}`;
}

export function generateBidId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BID-${date}-${rand}`;
}

export function generateOrderId(auctionId?: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = auctionId ? auctionId.slice(-4).toUpperCase() : Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${date}-${suffix}`;
}

export function generateTaskId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TASK-${date}-${rand}`;
}

/** 計算到期日（今天 + N 天）*/
export function dueDateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
