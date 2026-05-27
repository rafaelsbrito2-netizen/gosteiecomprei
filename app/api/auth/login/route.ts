import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    
    // Retrieve password from environment secret or fallback to default
    const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === correctPassword) {
      // Setup response with successful token setting
      const response = NextResponse.json({ success: true, message: 'Autenticado com sucesso' });
      
      // Set encrypted / secure HTTP-Only cookie valid for 7 days
      response.cookies.set('whatsapp_redirector_admin_session', 'session_active_token_9938a1', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      return response;
    }

    return NextResponse.json({ success: false, error: 'Senha incorreta' }, { status: 401 });
  } catch (error) {
    console.error('Login routing error:', error);
    return NextResponse.json({ success: false, error: 'Erro no servidor' }, { status: 500 });
  }
}
