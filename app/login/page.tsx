'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Por favor, insira a senha de acesso.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Senha inválida. Entre em contato com o suporte.');
      }
    } catch (err) {
      setError('Erro de rede. Verifique seu servidor e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center pt-8 pb-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Branding header */}
        <div className="flex justify-center items-center mb-8">
          <div className="relative w-[110px] h-[110px] md:w-[140px] md:h-[140px] rounded-full p-1 bg-gradient-to-tr from-yellow-500 via-orange-500 to-rose-500 border border-amber-500/30 shadow-lg animate-pulse-slow">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden p-1 shadow-inner">
              <img 
                src="http://rsbflow.com.br/wp-content/uploads/2026/05/IMG_0849.png" 
                alt="Gostei e Comprei" 
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
          </div>
        </div>

        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Painel Administrativo
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Gerenciador Inteligente de Redirecionamentos
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-100 sm:px-10 relative overflow-hidden">
          
          {/* Top colored indicator */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-rose-500" id="login_accent" />

          <form className="space-y-6" onSubmit={handleLogin} id="login_form">
            
            {/* Error banner */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start space-x-3 text-red-700 text-sm animate-shake" id="login_error_banner">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Senha Administrativa
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 h-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  id="toggle_password_btn"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                id="submit_button"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Entrar no Painel'
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
