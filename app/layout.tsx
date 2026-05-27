import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Gostei e Comprei - Redirecionador Inteligente de WhatsApp',
  description: 'Sistema para divisão de tráfego e redirecionamento de cliques de forma equilibrada para múltiplos grupos de WhatsApp com estatísticas e alertas integrados.',
  icons: {
    icon: 'http://rsbflow.com.br/wp-content/uploads/2026/05/IMG_0849.png',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${inter.variable}`}>
      <body className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
