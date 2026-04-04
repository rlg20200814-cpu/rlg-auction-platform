import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import crypto from 'crypto';

interface LineTokenResponse {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
}

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * GET /api/auth/line/callback
 * LINE OAuth callback — 取得 profile → 建立 Firebase Custom Token → 導回前端
 *
 * CSRF 驗證：state 格式為 {timestamp}.{hmac}，用 LINE_CHANNEL_SECRET 驗簽
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=line_denied', req.url));
  }

  // 驗證 HMAC state（取代 cookie 方式）
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

  // 驗簽 + 檢查 10 分鐘內有效
  const isValidHmac = crypto.timingSafeEqual(
    Buffer.from(receivedHmac, 'hex'),
    Buffer.from(expectedHmac, 'hex')
  );
  const isExpired = Date.now() - parseInt(timestamp) > 10 * 60 * 1000;

  if (!isValidHmac || isExpired) {
    return NextResponse.redirect(new URL('/login?error=state_mismatch', req.url));
  }

  try {
    // ── Step 1: 換取 Access Token ──
    // 使用 NEXT_PUBLIC_SITE_URL（build-time baked）確保與 auth route 完全一致
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const callbackUrl = `${siteUrl}/api/auth/line/callback`;
    console.log('[LINE callback] redirect_uri being sent:', JSON.stringify(callbackUrl));

    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: process.env.LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
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

    // ── Step 3: 取得 Email（若有授權 email scope）──
    let email: string | null = null;
    try {
      const idTokenPayload = JSON.parse(
        Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString()
      );
      email = idTokenPayload.email || null;
    } catch {}

    // ── Step 4: 在 Firebase 建立或更新用戶 ──
    const uid = `line:${profile.userId}`;
    const isAdmin = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
      .split(',')
      .map((s) => s.trim())
      .includes(uid);

    const userData = {
      uid,
      name: profile.displayName,
      email: email || '',
      avatar: profile.pictureUrl || '',
      isAdmin,
      lineUserId: profile.userId,
      provider: 'line',
      createdAt: Date.now(),
    };

    const db = adminDb();
    const userRef = db.ref(`users/${uid}`);
    const existing = await userRef.get();

    if (existing.exists()) {
      const { createdAt, ...rest } = userData;
      await userRef.set({ ...existing.val(), ...rest });
    } else {
      await userRef.set(userData);
    }

    // ── Step 5: 建立 Firebase Custom Token ──
    const customToken = await adminAuth().createCustomToken(uid, {
      name: profile.displayName,
      lineUserId: profile.userId,
      isAdmin,
    });

    // ── Step 6: 導回前端，帶上 custom token ──
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
