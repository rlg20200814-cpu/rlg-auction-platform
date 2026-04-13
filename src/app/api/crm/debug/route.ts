/**
 * GET /api/crm/debug?secret=...
 * 診斷 Google Sheets 環境變數是否正確載入
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (secret !== process.env.CRM_INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || '';
  const rawKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY || '';
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';

  // 把 key 轉換後看開頭/結尾是否正確（不輸出完整 key）
  const processedKey = rawKey.replace(/\\n/g, '\n');

  return NextResponse.json({
    email_set: !!email,
    email_value: email,
    spreadsheet_id: spreadsheetId,
    key_raw_length: rawKey.length,
    key_processed_length: processedKey.length,
    key_starts_with: processedKey.slice(0, 27),
    key_ends_with: processedKey.slice(-25),
    key_has_actual_newlines: processedKey.includes('\n'),
    crm_secret_set: !!process.env.CRM_INTERNAL_SECRET,
  });
}
