/**
 * email.ts — Resend 寄信工具（Server-side Only）
 */

import { Resend } from 'resend';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not set');
  return new Resend(key);
}

function getFrom() {
  return process.env.RESEND_FROM || 'RLG REPTILE <onboarding@resend.dev>';
}

/** 得標通知 Email */
export async function sendWinnerEmail(params: {
  to: string;
  name: string;
  productName: string;
  finalPrice: number;
  auctionId: string;
}): Promise<void> {
  const resend = getResend();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rlg-auction-platform.vercel.app';

  await resend.emails.send({
    from: getFrom(),
    to: params.to,
    subject: `🏆 恭喜得標！${params.productName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:sans-serif;color:#fafafa;">
  <div style="max-width:520px;margin:40px auto;background:#111;border:1px solid #222;border-radius:12px;overflow:hidden;">
    <!-- Header -->
    <div style="background:#000;padding:24px 32px;border-bottom:1px solid #222;">
      <p style="margin:0;font-size:13px;letter-spacing:3px;color:#888;text-transform:uppercase;">RLG REPTILE</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;">🏆 恭喜得標！</h1>
      <p style="margin:0 0 24px;color:#888;font-size:14px;">Hi ${params.name}，你已成功得標以下商品</p>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">商品</p>
        <p style="margin:0 0 16px;font-size:18px;font-weight:600;">${params.productName}</p>
        <p style="margin:0 0 6px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">得標金額</p>
        <p style="margin:0;font-size:28px;font-weight:700;color:#fff;">NT$ ${params.finalPrice.toLocaleString()}</p>
      </div>

      <p style="margin:0 0 24px;font-size:14px;color:#aaa;line-height:1.7;">
        賣家將於近期與您聯繫確認付款方式及出貨資訊。<br>
        如有任何疑問，請透過 LINE 官方帳號與我們聯繫。
      </p>

      <a href="${siteUrl}/auction/${params.auctionId}"
         style="display:inline-block;background:#fff;color:#000;font-weight:700;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none;">
        查看競標頁面
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #1a1a1a;">
      <p style="margin:0;font-size:12px;color:#444;">RLG REPTILE 即時競標平台</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });
}
