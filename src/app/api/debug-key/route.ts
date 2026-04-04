import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const result: Record<string, string> = {};

  // 1. 檢查 env vars 是否存在
  result.has_BASE64 = !!process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64 ? 'YES' : 'NO';
  result.has_RAW = !!process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'YES' : 'NO';
  result.has_EMAIL = !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'YES' : 'NO';

  // 2. 取得私鑰
  let privateKey = '';
  try {
    if (process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64) {
      privateKey = Buffer.from(process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');
      result.key_source = 'BASE64';
    } else {
      privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
      result.key_source = 'RAW';
    }
    result.key_length = String(privateKey.length);
    result.key_starts = privateKey.substring(0, 30);
    result.key_has_newlines = String(privateKey.includes('\n'));
    result.key_ends = privateKey.slice(-30);
  } catch (e) {
    result.key_error = String(e);
  }

  // 3. 嘗試 createPrivateKey
  try {
    const keyObj = crypto.createPrivateKey(privateKey);
    result.createPrivateKey = 'OK - type:' + keyObj.asymmetricKeyType;
  } catch (e) {
    result.createPrivateKey = 'FAIL: ' + String(e);
  }

  // 4. 嘗試簽名
  try {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update('test');
    const sig = sign.sign(privateKey, 'base64url');
    result.sign = 'OK - sig length:' + sig.length;
  } catch (e) {
    result.sign = 'FAIL: ' + String(e);
  }

  return NextResponse.json(result);
}
