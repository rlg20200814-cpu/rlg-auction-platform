import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GET /api/auth/line
 * 將用戶重導向到 LINE OAuth 授權頁面
 *
 * CSRF 防護：改用 HMAC 簽名 state，不依賴 cookie
 * 格式：{timestamp}.{hmac}
 */
export async function GET(req: NextRequest) {
  const channelId = process.env.LINE_CHANNEL_ID;
  const secret = process.env.LINE_CHANNEL_SECRET;

  if (!channelId || !secret) {
    return NextResponse.json(
      { error: 'LINE Login 未設定，請檢查環境變數' },
      { status: 500 }
    );
  }

  // 使用 NEXT_PUBLIC_SITE_URL（build-time baked）確保與 LINE Console 登記的 URL 完全一致
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const callbackUrl = `${siteUrl}/api/auth/line/callback`;

  // 用 timestamp + HMAC 簽名取代 cookie-based state
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
  const state = `${timestamp}.${hmac}`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: channelId,
    redirect_uri: callbackUrl,
    state,
    scope: 'profile openid email',
    bot_prompt: 'aggressive',
  });

  const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?${params}`;
  return NextResponse.redirect(lineAuthUrl);
}
