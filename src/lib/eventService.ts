/**
 * eventService — Server-side Only
 *
 * 所有事件統一從這裡發出到 n8n webhook。
 * - HMAC-SHA256 簽名驗證，n8n 端可驗證來源合法性
 * - fire-and-forget，不阻塞主流程
 * - N8N_WEBHOOK_URL / N8N_WEBHOOK_SECRET 只存在 server 端（無 NEXT_PUBLIC_）
 *
 * 未來擴充：換成 Supabase / Postgres 只需改這一個檔案
 */

import crypto from 'crypto';
import type { AnyEvent } from '@/types/events';

function buildSignature(body: string, secret: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * 發送事件到 n8n webhook（fire-and-forget）
 * 呼叫方不需要 await，錯誤只記 console.error 不拋出
 */
export async function sendEvent(event: AnyEvent): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl) return; // 未設定則靜默略過

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
      console.error(`[eventService] n8n responded ${res.status} for event ${event.event_type}`);
    }
  } catch (err) {
    console.error('[eventService] Failed to send event:', event.event_type, err);
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
