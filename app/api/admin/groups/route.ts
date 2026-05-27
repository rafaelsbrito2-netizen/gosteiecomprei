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
    const groups = await db.getGroups();
    return NextResponse.json({
      success: true,
      groups,
      dbMode: db.getDbMode(),
      isSupabase: db.isSupabase()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro no servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Check basic parameters
    const { name, whatsapp_url, base_limit, alert_threshold, alert_webhook_url, sort_order, status } = body;
    if (!name || !whatsapp_url) {
      return NextResponse.json({ error: 'Nome e Link do WhatsApp são obrigatórios' }, { status: 400 });
    }

    const group = await db.createGroup({
      name: name.trim(),
      whatsapp_url: whatsapp_url.trim(),
      base_limit: Number(base_limit) || 1000,
      alert_threshold: Number(alert_threshold) || 100,
      alert_webhook_url: (alert_webhook_url || '').trim(),
      sort_order: Number(sort_order) || 0,
      status: status === 'paused' ? 'paused' : 'active'
    });

    return NextResponse.json({ success: true, group });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro no servidor' }, { status: 500 });
  }
}
