import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = req.cookies.get('whatsapp_redirector_admin_session');

  if (session && session.value === 'session_active_token_9938a1') {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
