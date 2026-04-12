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
    console.error('[LINE callback] state format invalid, parts:', parts.length);
    return NextResponse.redirect(new URL('/login?error=state_mismatch', req.url));
  }

  const [timestamp, receivedHmac] = parts;
  const expectedHmac = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');

  let isValidHmac = false;
  try {
    const receivedBuf = Buffer.from(receivedHmac, 'hex');
    const expectedBuf = Buffer.from(expectedHmac, 'hex');
    if (receivedBuf.length === expectedBuf.length) {
      isValidHmac = crypto.timingSafeEqual(receivedBuf, expectedBuf);
    }
  } catch (e) {
    console.error('[LINE callback] timingSafeEqual threw:', e);
  }

  const tsNum = parseInt(timestamp);
  const ageMs = Date.now() - tsNum;
  const isExpired = ageMs > 2 * 60 * 60 * 1000; // 2 小時

  console.log('[LINE callback] state check — isValidHmac:', isValidHmac, 'ageMs:', ageMs, 'isExpired:', isExpired);

  if (!isValidHmac || isExpired) {
    console.error('[LINE callback] state REJECTED. isValidHmac:', isValidHmac, 'isExpired:', isExpired, 'ageMs:', ageMs);
    return NextResponse.redirect(new URL('/login?error=state_mismatch', req.url));
  }
  console.log('[LINE callback] state OK, proceeding with LINE token exchange');

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

    // ── Step 4: 用 Firebase Admin SDK 建立 Custom Token（自動加入 kid）──
    const uid = `line:${profile.userId}`;
    const isAdmin = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
      .split(',')
      .map((s) => s.trim())
      .includes(uid);

    const { adminAuth } = await import('@/lib/firebase/admin');
    const customToken = await adminAuth().createCustomToken(uid, {
      lineUserId: profile.userId,
      lineName: profile.displayName,
      lineAvatar: profile.pictureUrl || '',
      lineEmail: email,
      isAdmin,
    });

    // ── Step 5: 發送 CRM 事件（user_registered 或 user_logged_in）──
    try {
      const { sendEvent, buildEvent } = await import('@/lib/eventService');
      const { adminDb } = await import('@/lib/firebase/admin');
      // 加 3 秒 timeout，避免 DB 連線問題導致 function hang
      const userSnap = await Promise.race([
        adminDb().ref(`users/${uid}`).once('value'),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 3000)),
      ]);
      const isNewUser = !userSnap?.exists();

      if (isNewUser) {
        sendEvent(buildEvent({
          event_type: 'user_registered',
          source_channel: 'line',
          platform_user_id: uid,
          line_user_id: profile.userId,
          name: profile.displayName,
          email,
          avatar: profile.pictureUrl || '',
          register_method: 'line',
        } as Parameters<typeof buildEvent>[0])).catch(() => {});
      } else {
        sendEvent(buildEvent({
          event_type: 'user_logged_in',
          source_channel: 'line',
          platform_user_id: uid,
          line_user_id: profile.userId,
          login_method: 'line',
          name: profile.displayName,
          email,
        } as Parameters<typeof buildEvent>[0])).catch(() => {});
      }
    } catch {
      // CRM 事件失敗不影響登入流程
    }

    // ── Step 6: 導回前端 ──
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
