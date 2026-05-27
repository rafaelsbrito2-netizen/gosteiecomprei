import Link from 'next/link';
import { db } from '@/lib/db';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default async function SemVagasPage() {
  const settings = await db.getSettings();

  const title = "Todos os grupos estão cheios no momento";
  const message = settings.full_groups_message || "Em breve liberaremos novas vagas. Tente novamente mais tarde.";
  
  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-between p-4 font-sans text-slate-150 relative overflow-hidden">
      
      {/* Interactive animated light nodes/glows in orange-red-yellow colors */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />

      {/* Top Brand Indicator */}
      <header className="max-w-md mx-auto w-full pt-8 flex flex-col items-center justify-center z-10">
        <div className="w-32 h-32 md:w-[150px] md:h-[150px] rounded-full overflow-hidden border border-amber-500/30 shadow-xl p-1 bg-gradient-to-tr from-yellow-500 via-orange-500 to-rose-500 mb-4 animate-pulse-slow">
          <div className="w-full h-full rounded-full bg-[#0b0f19] flex items-center justify-center overflow-hidden p-1">
            <img 
              src="http://rsbflow.com.br/wp-content/uploads/2026/05/IMG_0849.png" 
              alt="Gostei e Comprei" 
              className="w-full h-full object-contain" 
            />
          </div>
        </div>
        <span className="font-black tracking-widest text-[#f97316] text-sm uppercase">Gostei e Comprei</span>
      </header>

      {/* Main Container Card */}
      <main className="max-w-md mx-auto w-full flex-grow flex items-center justify-center py-8 z-10">
        <div className="w-full bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/60 p-8 text-center relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          
          {/* Accent decoration line styled after orange/red brand gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-rose-500" id="card_accent" />

          {/* Warning Icon Container with subtle amber glow */}
          <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]" id="icon_container">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>

          {/* Heading with brand font pairings */}
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-4 leading-snug" id="heading_text">
            {title}
          </h1>

          {/* Description */}
          <p className="text-slate-400 leading-relaxed text-sm mb-8 break-words" id="message_text">
            {message}
          </p>

          {/* Dynamic Action Buttons */}
          <div className="space-y-3" id="actions_container">
            {settings.fallback_url && (
              <a
                href={settings.fallback_url}
                className="w-full inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-yellow-500 via-orange-500 to-rose-500 hover:opacity-90 active:opacity-95 rounded-xl transition duration-150 shadow-md shadow-orange-500/10"
                id="fallback_cta"
              >
                Acessar Canal Alternativo
              </a>
            )}

            <Link
              href="/entrar"
              className="w-full inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-slate-300 bg-slate-800/50 hover:bg-slate-800 hover:text-white active:bg-slate-850 border border-slate-800 rounded-xl transition duration-150"
              id="retry_cta"
            >
              <RefreshCw className="w-4 h-4 mr-2 animate-spin-slow" />
              Tentar Novamente
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="max-w-md mx-auto w-full pb-8 text-center z-10" id="footer_branding">
        <p className="text-xs text-slate-500">
          Gostei e Comprei © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
