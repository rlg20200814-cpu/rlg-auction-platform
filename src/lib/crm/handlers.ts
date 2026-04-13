/**
 * handlers — 各事件對應的 CRM 寫入邏輯
 */

import { appendRow } from './sheetsClient';
import { findCustomerByUid, createCustomer, updateCustomerOnBid, updateCustomerOnWin } from './customerService';
import { generateBidId, generateTaskId, dueDateFromNow } from './idGenerator';
import type { AnyEvent } from '@/types/events';

/** 統一 dispatch 入口（直接從 eventService 呼叫）*/
export async function dispatchCRM(event: AnyEvent): Promise<void> {
  switch (event.event_type) {
    case 'user_registered':   await onUserRegistered(event); break;
    case 'user_logged_in':    await onUserLoggedIn(event); break;
    case 'bid_placed':        await onBidPlaced(event); break;
    case 'bid_won':           await onBidWon(event); break;
    case 'order_created':     await onOrderCreated(event); break;
    case 'interest_marked':   await onInterestMarked(event); break;
    case 'task_created':      await onTaskCreated(event); break;
    default: break;
  }
}

// ── user_registered ───────────────────────────────────────────────────────

export async function onUserRegistered(event: Extract<AnyEvent, { event_type: 'user_registered' }>) {
  const existing = await findCustomerByUid(event.platform_user_id);
  if (existing) return; // 已存在，不重複建立

  await createCustomer({
    platform_user_id: event.platform_user_id,
    line_user_id: event.line_user_id,
    name: event.name,
    email: event.email,
    avatar: event.avatar,
    register_method: event.register_method,
  });
}

// ── user_logged_in ────────────────────────────────────────────────────────

export async function onUserLoggedIn(event: Extract<AnyEvent, { event_type: 'user_logged_in' }>) {
  const existing = await findCustomerByUid(event.platform_user_id);
  if (!existing) {
    await createCustomer({
      platform_user_id: event.platform_user_id,
      line_user_id: event.line_user_id,
      name: event.name,
      email: event.email,
      register_method: event.login_method,
    });
  }
}

// ── bid_placed ────────────────────────────────────────────────────────────

export async function onBidPlaced(event: Extract<AnyEvent, { event_type: 'bid_placed' }>) {
  let customer = await findCustomerByUid(event.platform_user_id);
  if (!customer) {
    customer = await createCustomer({
      platform_user_id: event.platform_user_id,
      line_user_id: event.line_user_id,
      name: '',
      register_method: 'line',
    });
  }

  await appendRow('bids', [
    generateBidId(),
    event.event_id,
    customer.customer_id,
    event.platform_user_id,
    event.auction_id,
    event.product_name,
    event.category,
    event.bid_amount,
    event.bid_count_in_auction,
    'TRUE',
    'FALSE',
    '',
    event.event_time,
    event.source_channel,
  ]);

  await updateCustomerOnBid({
    platform_user_id: event.platform_user_id,
    product_name: event.product_name,
    bid_time: event.event_time,
  });
}

// ── bid_won ───────────────────────────────────────────────────────────────

export async function onBidWon(event: Extract<AnyEvent, { event_type: 'bid_won' }>) {
  await updateCustomerOnWin({
    platform_user_id: event.platform_user_id,
    final_price: event.final_price,
    product_name: event.product_name,
  });
}

// ── order_created ─────────────────────────────────────────────────────────

export async function onOrderCreated(event: Extract<AnyEvent, { event_type: 'order_created' }>) {
  const customer = await findCustomerByUid(event.platform_user_id);
  const customerId = customer?.customer_id || '';

  await appendRow('orders', [
    event.order_id,
    event.event_id,
    customerId,
    event.platform_user_id,
    event.auction_id,
    event.product_name,
    event.amount,
    event.payment_status,
    '',
    '',
    event.shipping_status,
    '',
    '',
    'none',
    'FALSE',
    event.event_time,
    event.operator || '',
  ]);
}

// ── interest_marked ───────────────────────────────────────────────────────

export async function onInterestMarked(event: Extract<AnyEvent, { event_type: 'interest_marked' }>) {
  const customer = await findCustomerByUid(event.platform_user_id);
  if (!customer) return;

  await appendRow('interactions', [
    `INT-${Date.now()}`,
    event.event_id,
    customer.customer_id,
    event.platform_user_id,
    'interest',
    event.auction_id,
    event.product_name,
    event.category,
    event.event_time,
  ]);
}

// ── task_created ──────────────────────────────────────────────────────────

export async function onTaskCreated(event: Extract<AnyEvent, { event_type: 'task_created' }>) {
  const customer = await findCustomerByUid(event.platform_user_id);
  const customerId = customer?.customer_id || '';

  await appendRow('tasks', [
    generateTaskId(),
    event.event_id,
    customerId,
    event.platform_user_id,
    event.task_reason,
    event.auction_id || '',
    event.product_name || '',
    event.task_note,
    'open',
    event.due_date || dueDateFromNow(3),
    event.event_time,
    '',
  ]);
}
