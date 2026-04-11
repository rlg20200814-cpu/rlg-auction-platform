import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const b64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64 || '';
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';

  let b64Status = 'NOT SET';
  let b64KeyValid = false;
  let rawStatus = 'NOT SET';

  if (b64) {
    try {
      const decoded = Buffer.from(b64, 'base64').toString('utf-8');
      const firstLine = decoded.split('\n')[0];
      const lastLine = decoded.trim().split('\n').at(-1);
      b64Status = `SET (${b64.length} chars) → decoded first: "${firstLine}", last: "${lastLine}"`;

      // Test if key can sign
      const sign = crypto.createSign('RSA-SHA256');
      sign.update('test');
      sign.sign(decoded);
      b64KeyValid = true;
    } catch (e: unknown) {
      b64Status = `SET but ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  if (rawKey) {
    const cleaned = rawKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    rawStatus = `SET (${rawKey.length} chars) → starts with: "${rawKey.slice(0, 30)}"`;
    try {
      const sign = crypto.createSign('RSA-SHA256');
      sign.update('test');
      sign.sign(cleaned);
      rawStatus += ' [SIGNABLE]';
    } catch {
      rawStatus += ' [NOT SIGNABLE]';
    }
  }

  return NextResponse.json({
    FIREBASE_ADMIN_PRIVATE_KEY_BASE64: b64Status,
    b64_key_valid: b64KeyValid,
    FIREBASE_ADMIN_PRIVATE_KEY: rawStatus,
    FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID || 'NOT SET',
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'NOT SET',
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET ? `SET (${process.env.LINE_CHANNEL_SECRET.length} chars)` : 'NOT SET',
    LINE_CHANNEL_ID: process.env.LINE_CHANNEL_ID || 'NOT SET',
  });
}
