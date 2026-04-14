/**
 * LINE Messaging API — 主動推播工具
 * 只能推播曾加入 LINE OA 好友的用戶
 */

const LINE_API = 'https://api.line.me/v2/bot/message/push';

function getToken(): string {
  const token = process.env.LINE_MESSAGING_ACCESS_TOKEN;
  if (!token) throw new Error('LINE_MESSAGING_ACCESS_TOKEN not set');
  return token;
}

/** 推播文字訊息給單一用戶 */
export async function pushMessage(lineUserId: string, text: string): Promise<void> {
  const res = await fetch(LINE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[LINE push] failed for ${lineUserId}: ${res.status} ${body}`);
  }
}

/** 批次推播給多個用戶（每次最多 500 人，自動分批）*/
export async function multicast(lineUserIds: string[], text: string): Promise<void> {
  const BATCH = 500;
  for (let i = 0; i < lineUserIds.length; i += BATCH) {
    const batch = lineUserIds.slice(i, i + BATCH);
    const res = await fetch('https://api.line.me/v2/bot/message/multicast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        to: batch,
        messages: [{ type: 'text', text }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[LINE multicast] batch ${i} failed: ${res.status} ${body}`);
    }
  }
}

/** 從 Firebase UID 提取 LINE userId（"line:Uxxxxx" → "Uxxxxx"）*/
export function extractLineUserId(uid: string): string | null {
  if (uid.startsWith('line:')) return uid.slice(5);
  return null;
}
