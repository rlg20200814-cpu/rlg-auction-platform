import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

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

interface LineEmailResponse {
  email?: string;
}

/**
 * GET /api/auth/line/callback
 * LINE OAuth callback — 取得 profile → 建立 Firebase Custom Token → 導回前端
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // 用戶拒絕授權
  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=line_denied', req.url));
  }

  // 驗證 CSRF state
  const storedState = req.cookies.get('line_state')?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/login?error=state_mismatch', req.url));
  }

  try {
    // ── Step 1: 換取 Access Token ──
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINE_CALLBACK_URL!,
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

    // 寫入 Realtime Database（若已存在則保留 createdAt）
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

    // 清除 state cookie
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('line_state');
    return response;
  } catch (err) {
    console.error('LINE callback error:', err);
    return NextResponse.redirect(new URL('/login?error=line_failed', req.url));
  }
}