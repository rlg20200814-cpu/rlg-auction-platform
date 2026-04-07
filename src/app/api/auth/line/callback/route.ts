import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface LineTokenResponse {
  access_token: string;
  id_token: string;
  scope: string;
  token_type: string;
}

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

/**
 * 手動用 Node crypto 建立 Firebase Custom Token（RS256 JWT）
 * 繞過 Firebase Admin SDK createCustomToken 的 OpenSSL 相容問題
 */
function createFirebaseCustomToken(
  uid: string,
  claims: Record<string, unknown>,
  clientEmail: string,
  privateKey: string
): string {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid,
    claims,
  };

  const b64 = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const signingInput = `${b64(header)}.${b64(payload)}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(privateKey, 'base64url');

  return `${signingInput}.${signature}`;
}

/**
 * 取得格式正確的 PEM 私鑰（支援 base64 和 \n 兩種儲存方式）
 */
function getPrivateKey(): string {
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64) {
    return Buffer.from(process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');
  }
  // 移除 Vercel 環境變數可能多帶的首尾引號（從 JSON 複製貼上時常見問題）
  return (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '')
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n');
}

/**
 * GET /api/auth/line/callback
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=line_denied', req.url));
  }

  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!state || !secret) {
    return NextResponse.redirect(new URL('/login?error=state_mismatch', req.url));
  }

  const parts = state.split('.');
  if (parts.length !== 2) {
    return NextResponse.redirect(new URL('/login?error=state_mismatch', req.url));
  }

  const [timestamp, receivedHmac] = parts;
  const expectedHmac = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');

  const isValidHmac = crypto.timingSafeEqual(
    Buffer.from(receivedHmac, 'hex'),
    Buffer.from(expectedHmac, 'hex')
  );
  const isExpired = Date.now() - parseInt(timestamp) > 30 * 60 * 1000;

  if (!isValidHmac || isExpired) {
    return NextResponse.redirect(new URL('/login?error=state_mismatch', req.url));
  }

  try {
    // ── Step 1: 換取 Access Token ──
    const { origin, pathname } = new URL(req.url);
    const callbackUrl = `${origin}${pathname}`;

    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: process.env.LINE_CHANNEL_ID!,
        client_secret: secret,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
    }

    const tokenData: LineTokenResponse = await tokenRes.json();

    // ── Step 2: 取得用戶 Profile ──
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      throw new Error('Failed to fetch LINE profile');
    }

    const profile: LineProfile = await profileRes.json();

    // ── Step 3: 從 id_token 取 email ──
    let email = '';
    try {
      const payload = JSON.parse(
        Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString()
      );
      email = payload.email || '';
    } catch {}

    // ── Step 4: 建立 Firebase Custom Token（手動簽 JWT）──
    const uid = `line:${profile.userId}`;
    const isAdmin = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
      .split(',')
      .map((s) => s.trim())
      .includes(uid);

    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = getPrivateKey();

    if (!clientEmail || !privateKey) {
      throw new Error('Firebase Admin credentials not configured');
    }

    const customToken = createFirebaseCustomToken(
      uid,
      { lineUserId: profile.userId, lineName: profile.displayName, lineAvatar: profile.pictureUrl || '', lineEmail: email, isAdmin },
      clientEmail,
      privateKey
    );

    // ── Step 5: 導回前端 ──
    const redirectUrl = new URL('/auth/line', req.url);
    redirectUrl.searchParams.set('token', customToken);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('LINE callback error:', msg);
    const url = new URL('/login', req.url);
    url.searchParams.set('error', 'line_failed');
    url.searchParams.set('detail', msg.slice(0, 200));
    return NextResponse.redirect(url);
  }
}
