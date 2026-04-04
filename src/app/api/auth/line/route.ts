import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GET /api/auth/line
 * 將用戶重導向到 LINE OAuth 授權頁面
 */
export async function GET(req: NextRequest) {
  const channelId = process.env.LINE_CHANNEL_ID;
  const callbackUrl = process.env.LINE_CALLBACK_URL;

  if (!channelId || !callbackUrl) {
    return NextResponse.json(
      { error: 'LINE Login 未設定，請檢查環境變數' },
      { status: 500 }
    );
  }

  // CSRF 防護 state token
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: channelId,
    redirect_uri: callbackUrl,
    state,
    scope: 'profile openid email',
    bot_prompt: 'aggressive', // 自動邀請加入官方帳號為好友
  });

  const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?${params}`;

  // 將 state 存入 cookie（HttpOnly）以便 callback 驗證
  const response = NextResponse.redirect(lineAuthUrl);
  response.cookies.set('line_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 600, // 10 分鐘
    path: '/',
  });

  return response;
}
