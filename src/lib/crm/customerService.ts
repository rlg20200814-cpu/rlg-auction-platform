/**
 * customerService — customers 表的讀寫邏輯
 *
 * Sheet: customers
 * Header row (row 1):
 * A: customer_id  B: platform_user_id  C: line_user_id  D: name  E: email
 * F: avatar  G: register_method  H: total_bid_count  I: total_win_count
 * J: total_order_count  K: total_spend  L: last_product  M: last_bid_at
 * N: score  O: level  P: customer_type  Q: tag_1  R: tag_2  S: created_at
 */

import { readSheet, appendRow, updateRow } from './sheetsClient';
import { generateCustomerId } from './idGenerator';
import { calcScore, calcLevel } from './scoring';

const SHEET = 'customers';

export interface CustomerRow {
  customer_id: string;
  platform_user_id: string;
  line_user_id: string;
  name: string;
  email: string;
  avatar: string;
  register_method: string;
  total_bid_count: number;
  total_win_count: number;
  total_order_count: number;
  total_spend: number;
  last_product: string;
  last_bid_at: string;
  score: number;
  level: string;
  customer_type: string;
  tag_1: string;
  tag_2: string;
  created_at: string;
  _rowNumber: number; // 1-based（含 header），僅內部使用
}

const HEADER: (keyof Omit<CustomerRow, '_rowNumber'>)[] = [
  'customer_id', 'platform_user_id', 'line_user_id', 'name', 'email',
  'avatar', 'register_method', 'total_bid_count', 'total_win_count',
  'total_order_count', 'total_spend', 'last_product', 'last_bid_at',
  'score', 'level', 'customer_type', 'tag_1', 'tag_2', 'created_at',
];

// ── 讀出所有客戶 ─────────────────────────────────────────────────────────

export async function getAllCustomers(): Promise<CustomerRow[]> {
  const rows = await readSheet(SHEET);
  if (rows.length < 2) return [];
  return rows.slice(1).map((row, i) => rowToCustomer(row, i + 2));
}

// ── 依 platform_user_id 找客戶 ───────────────────────────────────────────

export async function findCustomerByUid(platformUserId: string): Promise<CustomerRow | null> {
  const all = await getAllCustomers();
  return all.find((c) => c.platform_user_id === platformUserId) || null;
}

// ── 新增客戶 ─────────────────────────────────────────────────────────────

export async function createCustomer(params: {
  platform_user_id: string;
  line_user_id?: string;
  name: string;
  email?: string;
  avatar?: string;
  register_method?: string;
}): Promise<CustomerRow> {
  const now = new Date().toISOString();
  const customer: Omit<CustomerRow, '_rowNumber'> = {
    customer_id: generateCustomerId(),
    platform_user_id: params.platform_user_id,
    line_user_id: params.line_user_id || '',
    name: params.name,
    email: params.email || '',
    avatar: params.avatar || '',
    register_method: params.register_method || 'line',
    total_bid_count: 0,
    total_win_count: 0,
    total_order_count: 0,
    total_spend: 0,
    last_product: '',
    last_bid_at: '',
    score: 0,
    level: '新客',
    customer_type: '新客',
    tag_1: '',
    tag_2: '',
    created_at: now,
  };

  await appendRow(SHEET, HEADER.map((k) => customer[k] as string | number));
  return { ...customer, _rowNumber: -1 }; // rowNumber 未知，不影響後續
}

// ── 更新客戶統計（出價後呼叫）────────────────────────────────────────────

export async function updateCustomerOnBid(params: {
  platform_user_id: string;
  product_name: string;
  bid_time: string;
}): Promise<void> {
  const customer = await findCustomerByUid(params.platform_user_id);
  if (!customer) return;

  const updated = {
    ...customer,
    total_bid_count: customer.total_bid_count + 1,
    last_product: params.product_name,
    last_bid_at: params.bid_time,
  };
  updated.score = calcScore(updated);
  updated.level = calcLevel(updated);
  updated.customer_type = updated.level;

  await writeCustomerRow(updated);
}

// ── 更新客戶統計（得標後呼叫）────────────────────────────────────────────

export async function updateCustomerOnWin(params: {
  platform_user_id: string;
  final_price: number;
  product_name: string;
}): Promise<void> {
  const customer = await findCustomerByUid(params.platform_user_id);
  if (!customer) return;

  const updated = {
    ...customer,
    total_win_count: customer.total_win_count + 1,
    total_order_count: customer.total_order_count + 1,
    total_spend: customer.total_spend + params.final_price,
    last_product: params.product_name,
  };
  updated.score = calcScore(updated);
  updated.level = calcLevel(updated);
  updated.customer_type = updated.level;

  await writeCustomerRow(updated);
}

// ── 內部：把 CustomerRow 寫回 sheet ──────────────────────────────────────

async function writeCustomerRow(customer: CustomerRow): Promise<void> {
  const values = HEADER.map((k) => customer[k] as string | number);
  await updateRow(SHEET, customer._rowNumber, values);
}

// ── 工具：把 sheet row array 轉成 CustomerRow ────────────────────────────

function rowToCustomer(row: string[], rowNumber: number): CustomerRow {
  return {
    customer_id: row[0] || '',
    platform_user_id: row[1] || '',
    line_user_id: row[2] || '',
    name: row[3] || '',
    email: row[4] || '',
    avatar: row[5] || '',
    register_method: row[6] || '',
    total_bid_count: Number(row[7]) || 0,
    total_win_count: Number(row[8]) || 0,
    total_order_count: Number(row[9]) || 0,
    total_spend: Number(row[10]) || 0,
    last_product: row[11] || '',
    last_bid_at: row[12] || '',
    score: Number(row[13]) || 0,
    level: row[14] || '新客',
    customer_type: row[15] || '新客',
    tag_1: row[16] || '',
    tag_2: row[17] || '',
    created_at: row[18] || '',
    _rowNumber: rowNumber,
  };
}
