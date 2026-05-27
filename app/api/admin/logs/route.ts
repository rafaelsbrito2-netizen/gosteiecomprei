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
    const logs = await db.getLogs(500); // pull last 500 records
    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro no servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    await db.clearLogs();
    return NextResponse.json({ success: true, message: 'Logs excluídos com sucesso' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro no servidor' }, { status: 500 });
  }
}
