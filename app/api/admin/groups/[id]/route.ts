import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function isAuthorized(req: NextRequest): boolean {
  const session = req.cookies.get('whatsapp_redirector_admin_session');
  return !!(session && session.value === 'session_active_token_9938a1');
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // Fetch existing group to compare changes if needed
    const existingGroup = await db.getGroup(id);
    if (!existingGroup) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    // Capture fields
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.whatsapp_url !== undefined) updates.whatsapp_url = body.whatsapp_url.trim();
    if (body.base_limit !== undefined) updates.base_limit = Number(body.base_limit);
    if (body.alert_threshold !== undefined) updates.alert_threshold = Number(body.alert_threshold);
    if (body.alert_webhook_url !== undefined) updates.alert_webhook_url = body.alert_webhook_url.trim();
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);
    if (body.status !== undefined) updates.status = body.status === 'paused' ? 'paused' : 'active';
    if (body.used_clicks !== undefined) updates.used_clicks = Number(body.used_clicks);
    
    // Core requirements check:
    // If releasing manual extra slots
    if (body.extra_slots !== undefined) {
      const parsedExtraSlots = Number(body.extra_slots);
      updates.extra_slots = parsedExtraSlots;

      // Rule: "Sempre que eu adicionar novas vagas extras, o sistema deve atualizar o cálculo de vagas restantes (handled on screen and route).
      // Também deve resetar o controle de alerta, permitindo que um novo alerta seja enviado quando o grupo estiver novamente perto do limite."
      // Let's reset the alert_sent to false when extra_slots is updated manually!
      updates.alert_sent = false;
    }

    if (body.alert_sent !== undefined) {
      updates.alert_sent = !!body.alert_sent;
    }

    const updatedGroup = await db.updateGroup(id, updates);
    return NextResponse.json({ success: true, group: updatedGroup });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro no servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const success = await db.deleteGroup(id);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Grupo excluído com sucesso' });
    } else {
      return NextResponse.json({ error: 'Grupo não encontrado para exclusão' }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro no servidor' }, { status: 500 });
  }
}
