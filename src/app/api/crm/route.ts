/**
 * POST /api/crm
 *
 * 統一 CRM 事件入口，接收競標平台各種事件，寫入 Google Sheets。
 * 內部呼叫（server-side），不對外公開。
 *
 * 驗證：Internal-Secret header 必須匹配 CRM_INTERNAL_SECRET 環境變數
 */

import { NextRequest, NextResponse } from 'next/server';
import type { AnyEvent } from '@/types/events';
import {
  onUserRegistered,
  onUserLoggedIn,
  onBidPlaced,
  onBidWon,
  onOrderCreated,
  onInterestMarked,
  onTaskCreated,
} from '@/lib/crm/handlers';

const SPREADSHEET_CONFIGURED = !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

export async function POST(req: NextRequest) {
  // ── 未設定 Spreadsheet ID 則直接跳過（靜默，不影響競標功能）──────────
  if (!SPREADSHEET_CONFIGURED) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // ── 驗證 Internal-Secret（防止外部直接呼叫）──────────────────────────
  const secret = req.headers.get('X-CRM-Secret');
  const expectedSecret = process.env.CRM_INTERNAL_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let event: AnyEvent;
  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // ── 冪等性：event_id 相同的事件只處理一次（簡易版，靠 handler 自行判斷）
  // 完整防重複可在 Google Sheets 裡查 event_id 欄位

  try {
    switch (event.event_type) {
      case 'user_registered':
        await onUserRegistered(event);
        break;
      case 'user_logged_in':
        await onUserLoggedIn(event);
        break;
      case 'bid_placed':
        await onBidPlaced(event);
        break;
      case 'bid_won':
        await onBidWon(event);
        break;
      case 'order_created':
        await onOrderCreated(event);
        break;
      case 'interest_marked':
        await onInterestMarked(event);
        break;
      case 'task_created':
        await onTaskCreated(event);
        break;
      default:
        // 不認識的事件直接忽略，不拋錯
        break;
    }

    return NextResponse.json({ ok: true, event_type: event.event_type, event_id: event.event_id });
  } catch (err) {
    console.error('[CRM] handler error:', event.event_type, err);
    // 不讓 CRM 失敗影響主流程，回傳 200 避免重試風暴
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
