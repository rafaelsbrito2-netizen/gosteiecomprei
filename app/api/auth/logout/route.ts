import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Sessão encerrada' });
  
  // Clear the cookie immediately
  response.cookies.set('whatsapp_redirector_admin_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 0 // Expire instantly
  });

  return response;
}
