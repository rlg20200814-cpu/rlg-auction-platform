import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GET /api/auth/line
 * 將用戶重導向到 LINE OAuth 授權頁面
 *
 * CSRF 防護：改用 HMAC 簽名 state，不依賴 cookie
 * 格式：{timestamp}.{hmac}
 */
export async function GET() {
  const channelId = process.env.LINE_CHANNEL_ID;
  const secret = process.env.LINE_CHANNEL_SECRET;

  if (!channelId || !secret) {
    return NextResponse.json(
      { error: 'LINE Login 未設定，請檢查環境變數' },
      { status: 500 }
    );
  }

  const callbackUrl = process.env.LINE_CALLBACK_URL;
  if (!callbackUrl) {
    return NextResponse.json({ error: 'LINE_CALLBACK_URL 未設定' }, { status: 500 });
  }

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
