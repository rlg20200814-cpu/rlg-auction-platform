/**
 * GET /api/crm/init
 * 一次性初始化 Google Sheets 所有分頁表頭
 * 只有管理員可呼叫（帶 ?secret=CRM_INTERNAL_SECRET）
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

function getSheets() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

const HEADERS: Record<string, string[]> = {
  customers: [
    'customer_id', 'platform_user_id', 'line_user_id', 'name', 'email',
    'avatar', 'register_method', 'total_bid_count', 'total_win_count',
    'total_order_count', 'total_spend', 'last_product', 'last_bid_at',
    'score', 'level', 'customer_type', 'tag_1', 'tag_2', 'created_at',
  ],
  bids: [
    'bid_id', 'event_id', 'customer_id', 'platform_user_id', 'auction_id',
    'product_name', 'category', 'bid_amount', 'bid_count', 'is_winning',
    'is_final_winner', 'final_price', 'bid_time', 'source_channel',
  ],
  orders: [
    'order_id', 'event_id', 'customer_id', 'platform_user_id', 'auction_id',
    'product_name', 'amount', 'payment_status', 'payment_method', 'paid_at',
    'shipping_status', 'tracking_number', 'carrier', 'after_service_status',
    'rebuy_flag', 'created_at', 'operator',
  ],
  interactions: [
    'interaction_id', 'event_id', 'customer_id', 'platform_user_id', 'type',
    'auction_id', 'product_name', 'category', 'created_at',
  ],
  tasks: [
    'task_id', 'event_id', 'customer_id', 'platform_user_id', 'task_reason',
    'auction_id', 'product_name', 'task_note', 'status', 'due_date',
    'created_at', 'done_at',
  ],
};

export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (secret !== process.env.CRM_INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    return NextResponse.json({ error: 'GOOGLE_SHEETS_SPREADSHEET_ID not set' }, { status: 500 });
  }

  const sheets = getSheets();
  const results: Record<string, string> = {};

  for (const [sheetName, headers] of Object.entries(HEADERS)) {
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
      results[sheetName] = 'ok';
    } catch (err) {
      results[sheetName] = `error: ${String(err)}`;
    }
  }

  return NextResponse.json({ done: true, results });
}
