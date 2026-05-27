import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // 1. Get configurations & all groups
    const settings = await db.getSettings();
    const groups = await db.getGroups();

    // 2. Select eligible groups
    // Rule:
    // - Considerar apenas grupos com status ativo.
    // - Ordenar os grupos por ordem definida no painel.
    // - Enviar para o primeiro grupo que tenha vagas restantes.
    // - Vagas restantes = limite_base + vagas_extras - cliques_usados.
    const activeGroups = groups.filter(g => g.status === 'active');
    
    let selectedGroup = null;

    for (const group of activeGroups) {
      const limit_total = group.base_limit + group.extra_slots;
      const vagas_restantes = limit_total - group.used_clicks;

      if (vagas_restantes > 0) {
        selectedGroup = group;
        break;
      }
    }

    // Capture visitor metadata
    const userAgent = req.headers.get('user-agent') || 'Desconhecido';
    const referer = req.headers.get('referer') || req.headers.get('referrer') || 'Direto';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // 3. Handling: If no active group with vacancies is found
    if (!selectedGroup) {
      // Create a logs entry with group_id as "None" for debugging & telemetry
      await db.addLog({
        group_id: 'fallback',
        group_name: 'Link Reserva / Sem Vagas',
        user_agent: userAgent,
        ip_address: ipAddress,
        referer: referer
      });

      if (settings.fallback_url && settings.fallback_url.trim()) {
        try {
          return NextResponse.redirect(new URL(settings.fallback_url), 302);
        } catch {
          // If fallback_url is absolute
          return NextResponse.redirect(settings.fallback_url, 302);
        }
      }

      // If no fallback URL, redirect to a clean public "no slots" page
      const baseUrl = req.nextUrl.origin;
      return NextResponse.redirect(`${baseUrl}/sem-vagas`, 302);
    }

    // 4. Update group state (Used Clicks)
    const newUsedClicks = selectedGroup.used_clicks + 1;
    const limit_total = selectedGroup.base_limit + selectedGroup.extra_slots;
    const vagas_restantes_apois = limit_total - newUsedClicks;

    await db.updateGroup(selectedGroup.id, {
      used_clicks: newUsedClicks
    });

    // 5. Add Access Log
    await db.addLog({
      group_id: selectedGroup.id,
      group_name: selectedGroup.name,
      user_agent: userAgent,
      ip_address: ipAddress,
      referer: referer
    });

    // 6. Alert Webhook Logic
    // se vagas_restantes <= alerta_em e alerta_enviado = false, enviar webhook e marcar alerta_enviado = true
    if (vagas_restantes_apois <= selectedGroup.alert_threshold && !selectedGroup.alert_sent && selectedGroup.alert_threshold > 0) {
      // Determine destination webhook URL
      const webhookUrl = settings.use_global_webhook 
        ? settings.global_webhook_url 
        : selectedGroup.alert_webhook_url;

      if (webhookUrl && webhookUrl.trim()) {
        // Build Portuguese message string EXACTLY as instructed in prompt guidelines (Section 14 & 4)
        const formattedMsg = `⚠️ Alerta de grupo quase cheio\n\nO grupo ${selectedGroup.name} está quase atingindo o limite.\n\nCliques usados: ${newUsedClicks}\nLimite atual: ${limit_total}\nFaltam apenas: ${vagas_restantes_apois} acessos\n\nAcesse o painel para liberar mais vagas ou ativar o próximo grupo.`;

        const webhookPayload = {
          evento: 'grupo_quase_cheio',
          grupo_id: selectedGroup.id,
          grupo_nome: selectedGroup.name,
          link_whatsapp: selectedGroup.whatsapp_url,
          limite_base: selectedGroup.base_limit,
          vagas_extras: selectedGroup.extra_slots,
          limite_total: limit_total,
          cliques_usados: newUsedClicks,
          vagas_restantes: vagas_restantes_apois,
          alerta_em: selectedGroup.alert_threshold,
          status: 'quase_cheio',
          mensagem: formattedMsg
        };

        // Fire asynchronous webhook
        fetch(webhookUrl.trim(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        }).then(res => {
          if (!res.ok) {
            console.error(`Webhook Alert Dispatch failed with status ${res.status}`);
          }
        }).catch(err => {
          console.error(`Webhook Dispatch network error:`, err);
        });

        // Set alert_sent to true in DB
        await db.updateGroup(selectedGroup.id, {
          alert_sent: true
        });
      }
    }

    // 7. Render transition page HTML with a 2-second client-side delay for maximum premium visual experience
    const targetUrl = selectedGroup.whatsapp_url;
    const fallbackTitle = settings.public_page_title || "Gostei e Comprei";
    
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fallbackTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse-glow {
      0%, 100% { transform: scale(1); opacity: 0.2; }
      50% { transform: scale(1.15); opacity: 0.4; }
    }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes rotate-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-custom {
      animation: spin 1s linear infinite;
    }
    .animate-pulse-glow {
      animation: pulse-glow 3s ease-in-out infinite;
    }
    .animate-fade-in {
      animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-rotate-slow {
      animation: rotate-slow 15s linear infinite;
    }
  </style>
</head>
<body class="bg-[#0b0f19] text-white min-h-screen flex flex-col justify-between items-center relative overflow-hidden font-sans">
  <!-- Interactive animated light nodes/glows in orange-red-yellow colors -->
  <div class="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse-glow"></div>
  <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse-glow" style="animation-delay: 1.5s;"></div>

  <!-- Empty spacer to push center card down -->
  <div></div>

  <main class="w-full max-w-md px-6 text-center animate-fade-in z-10">
    <div class="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/60 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
      <!-- Glow ring decoration inside card -->
      <div class="absolute -top-24 -left-24 w-48 h-48 bg-gradient-to-tr from-yellow-500/10 to-transparent rounded-full blur-2xl"></div>
      
      <!-- Brand Logo Section -->
      <div class="relative w-32 h-32 md:w-[150px] md:h-[150px] mx-auto mb-6">
        <!-- Colored revolving glow ring -->
        <div class="absolute -inset-1.5 rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-rose-500 animate-rotate-slow opacity-80 blur-[2px]"></div>
        <!-- Black masking ring -->
        <div class="absolute -inset-1 rounded-full bg-[#0b0f19]"></div>
        <!-- Logo Image Container -->
        <div class="relative w-full h-full rounded-full bg-slate-950 flex items-center justify-center p-1 overflow-hidden border border-slate-800">
          <img 
            src="http://rsbflow.com.br/wp-content/uploads/2026/05/IMG_0849.png" 
            alt="Gostei e Comprei" 
            class="w-full h-full object-contain"
          />
        </div>
      </div>

      <!-- Loading/Action State -->
      <h1 class="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
        Preparando seu acesso ao grupo...
      </h1>
      <p class="text-slate-400 text-sm leading-relaxed mb-8">
        Você será redirecionado em instantes para o grupo disponível.
      </p>

      <!-- Advanced Spinner with segmented brand colors -->
      <div class="flex justify-center items-center mb-4">
        <div class="relative w-12 h-12">
          <!-- Spinner track -->
          <div class="absolute inset-0 rounded-full border-4 border-slate-800"></div>
          <!-- Spinner glow segment -->
          <div class="absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-rose-500 animate-spin-custom"></div>
        </div>
      </div>
      
      <span class="text-xs text-amber-500 font-mono tracking-widest uppercase opacity-75">
        Buscando melhor rota
      </span>
    </div>
  </main>

  <!-- Footer Info -->
  <footer class="pb-8 text-center z-10 text-xs text-slate-500">
    <p>Gostei e Comprei © ${new Date().getFullYear()}</p>
    <p class="text-[10px] text-slate-600 mt-1">Conexão criptografada e segura</p>
  </footer>

  <script>
    // Configurable redirect delay (2000ms for premium transition feel)
    setTimeout(function() {
      try {
        window.location.replace("${targetUrl}");
      } catch (err) {
        window.location.href = "${targetUrl}";
      }
    }, 2000);
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });

  } catch (error) {
    console.error('Fatal redirect routine failure:', error);
    // Graceful routing to no-vacancies page instead of breaking
    const baseUrl = req.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/sem-vagas?error=route_fault`, 302);
  }
}
