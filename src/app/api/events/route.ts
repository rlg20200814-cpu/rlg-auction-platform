/**
 * POST /api/events
 *
 * Client-side 事件統一出口：
 * 1. 驗證 Firebase ID Token（確保是登入用戶）
 * 2. 轉送事件到 n8n（加上 HMAC 簽名）
 *
 * N8N_WEBHOOK_URL / N8N_WEBHOOK_SECRET 只存在 server 端，不暴露給前端
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { sendEvent, buildEvent } from '@/lib/eventService';
import type { AnyEvent, EventType } from '@/types/events';

const ALLOWED_CLIENT_EVENTS: EventType[] = [
  'auction_joined',
  'bid_placed',
  'interest_marked',
];

export async function POST(req: NextRequest) {
  // ── 1. 驗證 Firebase ID Token ──────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idToken = authHeader.slice(7);
  let decodedToken: { uid: string };
  try {
    decodedToken = await adminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // ── 2. 解析並驗證 payload ──────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = body.event_type as EventType;
  if (!ALLOWED_CLIENT_EVENTS.includes(eventType)) {
    return NextResponse.json({ error: 'Event type not allowed from client' }, { status: 403 });
  }

  // ── 3. 確保 platform_user_id 與 token 一致（防止冒用他人 UID）──────────
  if (body.platform_user_id && body.platform_user_id !== decodedToken.uid) {
    return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 });
  }

  // ── 4. 組裝事件並發送（fire-and-forget）─────────────────────────────────
  const event = buildEvent({
    ...body,
    platform_user_id: decodedToken.uid,
    source_channel: 'web',
  } as Omit<AnyEvent, 'event_id' | 'event_time' | 'platform'>);

  sendEvent(event).catch(() => {}); // fire-and-forget

  return NextResponse.json({ ok: true, event_id: event.event_id });
}
