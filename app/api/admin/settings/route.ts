import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function isAuthorized(req: NextRequest): boolean {
  const session = req.cookies.get('whatsapp_redirector_admin_session');
  return !!(session && session.value === 'session_active_token_9938a1');
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const settings = await db.getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro no servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const cleanSettings = {
      fallback_url: (body.fallback_url || '').trim(),
      public_page_title: (body.public_page_title || '').trim(),
      full_groups_message: (body.full_groups_message || '').trim(),
      global_webhook_url: (body.global_webhook_url || '').trim(),
      use_global_webhook: !!body.use_global_webhook
    };

    const updated = await db.updateSettings(cleanSettings);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro no servidor' }, { status: 500 });
  }
}
