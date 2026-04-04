import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
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
 * GET /api/auth/line/callback
 * LINE OAuth callback — 取得 profile → 建立 Firebase Custom Token → 導回前端
 *
 * 刻意不做 Firebase DB 讀寫（交給 client-side AuthContext syncUserToDb 處理）
 * 以避免 Vercel Hobby plan 10 秒 timeout。
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

  // 驗證 HMAC state
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
  // 手機切換 app 可能較久，給 30 分鐘
  const isExpired = Date.now() - parseInt(timestamp) > 30 * 60 * 1000;

  if (!isValidHmac || isExpired) {
    return NextResponse.redirect(new URL('/login?error=state_mismatch', req.url));
  }

  try {
    // ── Step 1: 換取 Access Token ──
    // callback 的 req.url 就是 LINE 重導向的 URL（= LINE Console 登記的 URL）
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

    // ── Step 3: 從 id_token 取 email（若有授權）──
    let email = '';
    try {
      const payload = JSON.parse(
        Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString()
      );
      email = payload.email || '';
    } catch {}

    // ── Step 4: 建立 Firebase Custom Token ──
    // DB 讀寫交給 client-side syncUserToDb，避免 Vercel timeout
    const uid = `line:${profile.userId}`;
    const isAdmin = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
      .split(',')
      .map((s) => s.trim())
      .includes(uid);

    const customToken = await adminAuth().createCustomToken(uid, {
      lineUserId: profile.userId,
      lineName: profile.displayName,
      lineAvatar: profile.pictureUrl || '',
      lineEmail: email,
      isAdmin,
    });

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
