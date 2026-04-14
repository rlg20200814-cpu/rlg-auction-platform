/**
 * POST /api/auth/sync
 * Google / Email 登入後，從 client 呼叫，寫入 CRM
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dispatchCRM } from '@/lib/crm/handlers';
import { buildEvent } from '@/lib/eventService';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let decoded: { uid: string };
  try {
    decoded = await adminAuth().verifyIdToken(authHeader.slice(7));
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { name, email, avatar, isNewUser, loginMethod } = await req.json();

  try {
    if (isNewUser) {
      await dispatchCRM(buildEvent({
        event_type: 'user_registered',
        source_channel: 'web',
        platform_user_id: decoded.uid,
        name: name || '',
        email: email || '',
        avatar: avatar || '',
        register_method: loginMethod || 'google',
      } as Parameters<typeof buildEvent>[0]));
    } else {
      await dispatchCRM(buildEvent({
        event_type: 'user_logged_in',
        source_channel: 'web',
        platform_user_id: decoded.uid,
        login_method: loginMethod || 'google',
        name: name || '',
        email: email || '',
      } as Parameters<typeof buildEvent>[0]));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[auth/sync] CRM error:', err);
    return NextResponse.json({ ok: false });
  }
}
