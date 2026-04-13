/**
 * eventService — Server-side Only
 *
 * 所有事件統一從這裡發出：
 * 1. Google Sheets CRM（直接寫入，via /api/crm）
 * 2. n8n webhook（選填，有設定才送）
 *
 * - HMAC-SHA256 簽名驗證（n8n 用）
 * - fire-and-forget，不阻塞主流程
 */

import crypto from 'crypto';
import type { AnyEvent } from '@/types/events';

function buildSignature(body: string, secret: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * 發送事件（fire-and-forget）
 * 同時送 CRM 和 n8n（如有設定）
 */
export async function sendEvent(event: AnyEvent): Promise<void> {
  await Promise.allSettled([
    sendToCRM(event),
    sendToN8n(event),
  ]);
}

/** 送事件到 Google Sheets CRM（直接呼叫，不走 HTTP）*/
async function sendToCRM(event: AnyEvent): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) return; // 未設定則跳過

  try {
    const { dispatchCRM } = await import('./crm/handlers');
    await dispatchCRM(event);
  } catch (err) {
    console.error('[eventService] CRM dispatch failed:', event.event_type, err);
  }
}

/** 送事件到 n8n webhook（選填）*/
async function sendToN8n(event: AnyEvent): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl) return;

  const body = JSON.stringify(event);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Platform': 'bidnow',
    'X-Event-Type': event.event_type,
    'X-Event-Id': event.event_id,
  };

  if (webhookSecret) {
    headers['X-Webhook-Signature'] = buildSignature(body, webhookSecret);
  }

  try {
    const res = await fetch(webhookUrl, { method: 'POST', headers, body });
    if (!res.ok) {
      console.error(`[eventService] n8n responded ${res.status} for ${event.event_type}`);
    }
  } catch (err) {
    console.error('[eventService] n8n send failed:', event.event_type, err);
  }
}

/**
 * 建立帶 base 欄位的事件物件（server 端用）
 */
export function buildEvent<T extends AnyEvent>(
  partial: Omit<T, 'event_id' | 'event_time' | 'platform'>
): T {
  return {
    event_id: crypto.randomUUID(),
    event_time: new Date().toISOString(),
    platform: 'bidnow',
    ...partial,
  } as T;
}
