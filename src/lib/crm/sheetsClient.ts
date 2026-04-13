/**
 * sheetsClient — Server-side Only
 * Google Sheets API 底層讀寫封裝
 */

import { google } from 'googleapis';

function getAuth() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Sheets credentials not configured');
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID not configured');
  return id;
}

// ── 讀取整個 sheet（含 header row）──────────────────────────────────────────

export async function readSheet(sheetName: string): Promise<string[][]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: sheetName,
  });
  return (res.data.values as string[][]) || [];
}

// ── 在最後新增一列 ────────────────────────────────────────────────────────

export async function appendRow(sheetName: string, values: (string | number | boolean)[]): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

// ── 更新指定列（row 從 1 開始，含 header 所以資料從 row 2 起）────────────

export async function updateRow(
  sheetName: string,
  rowNumber: number,
  values: (string | number | boolean)[]
): Promise<void> {
  const sheets = getSheets();
  const colEnd = columnLetter(values.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A${rowNumber}:${colEnd}${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

// ── 更新單一儲存格 ────────────────────────────────────────────────────────

export async function updateCell(
  sheetName: string,
  col: string,
  rowNumber: number,
  value: string | number | boolean
): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!${col}${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  });
}

// ── 工具：數字轉欄位字母（1→A, 26→Z, 27→AA）────────────────────────────

function columnLetter(n: number): string {
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}
