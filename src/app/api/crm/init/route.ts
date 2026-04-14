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
    '客戶編號', '平台用戶ID', 'LINE用戶ID', '姓名', '電子郵件',
    '頭像', '註冊方式', '累計出價次數', '累計得標次數',
    '累計成交次數', '累計消費金額', '最近商品', '最近出價時間',
    '互動分數', '客戶等級', '客戶類型', '標籤1', '標籤2', '首次接觸時間',
  ],
  bids: [
    '出價編號', '事件ID', '客戶編號', '平台用戶ID', '競標ID',
    '商品名稱', '商品分類', '出價金額', '本場出價次數', '是否領先',
    '是否得標', '最終成交價', '出價時間', '來源管道',
  ],
  orders: [
    '訂單編號', '事件ID', '客戶編號', '平台用戶ID', '競標ID',
    '商品名稱', '金額', '付款狀態', '付款方式', '付款時間',
    '出貨狀態', '追蹤號碼', '物流商', '售後服務狀態',
    '回購標記', '建立時間', '處理人員',
  ],
  interactions: [
    '互動編號', '事件ID', '客戶編號', '平台用戶ID', '互動類型',
    '競標ID', '商品名稱', '商品分類', '互動時間',
  ],
  tasks: [
    '任務編號', '事件ID', '客戶編號', '平台用戶ID', '任務原因',
    '競標ID', '商品名稱', '任務備註', '狀態', '截止日期',
    '建立時間', '完成時間',
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
