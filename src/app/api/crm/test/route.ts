/**
 * GET /api/crm/test?secret=...
 * 直接測試寫入 customers 一列，驗證完整寫入流程
 */
import { NextRequest, NextResponse } from 'next/server';
import { dispatchCRM } from '@/lib/crm/handlers';

export async function GET(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (secret !== process.env.CRM_INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await dispatchCRM({
      event_id: `test-${Date.now()}`,
      event_type: 'user_registered',
      event_time: new Date().toISOString(),
      platform: 'bidnow',
      source_channel: 'line',
      platform_user_id: 'test-uid-001',
      line_user_id: 'Utest001',
      name: '測試用戶',
      email: '',
      avatar: '',
      register_method: 'line',
    });
    return NextResponse.json({ ok: true, message: '寫入成功，請看 customers 分頁' });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
