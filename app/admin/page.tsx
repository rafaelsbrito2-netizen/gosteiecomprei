'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, Users, Link as LinkIcon, Edit3, Trash2, Plus, Play, Pause,
  Lock, RefreshCw, Copy, Check, Info, FileText, Settings as SettingsIcon, AlertTriangle,
  ArrowRight, Shield, Globe, Terminal, LogOut, CheckCircle, HelpCircle
} from 'lucide-react';
import { Group, AccessLog, Settings } from '@/lib/db';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dbMode, setDbMode] = useState('Local JSON');
  const [isSupabase, setIsSupabase] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [settings, setSettings] = useState<Settings>({
    fallback_url: '',
    public_page_title: '',
    full_groups_message: '',
    global_webhook_url: '',
    use_global_webhook: false
  });

  // Navigation Tabs
  const [activeTab, setActiveTab ] = useState<'dashboard' | 'logs' | 'settings' | 'supabase'>('dashboard');

  // Notification Banner State
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals visibility states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active elements for modal execution
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Create/Edit Group form inputs
  const [fromName, setFormName] = useState('');
  const [fromWhatsappUrl, setFormWhatsappUrl] = useState('');
  const [formBaseLimit, setFormBaseLimit] = useState(1000);
  const [formAlertThreshold, setFormAlertThreshold] = useState(100);
  const [formAlertWebhookUrl, setFormAlertWebhookUrl] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(1);
  const [formStatus, setFormStatus] = useState<'active' | 'paused'>('active');

  // Release slots inputs
  const [slotsToAdd, setSlotsToAdd] = useState<number | ''>('');

  // Copy state for SQL instructions
  const [copiedSql, setCopiedSql] = useState(false);

  // Authentication & Initial Loading
  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        const authCheck = await fetch('/api/auth/check');
        if (!authCheck.ok) {
          router.push('/login');
          return;
        }

        // Authenticated! Parallel fetch all data
        await refreshAllData();
      } catch (err) {
        console.error('Core loading error:', err);
        setErrorMsg('Falha ao conectar com o servidor. Recarregando...');
      } finally {
        setLoading(false);
      }
    }
    checkAuthAndLoad();
  }, [router]);

  // Flash messages timeout
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 5000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  // Fetch functions that naturally support hoisting
  async function refreshAllData() {
    try {
      const [groupsRes, settingsRes, logsRes] = await Promise.all([
        fetch('/api/admin/groups'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/logs')
      ]);

      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setGroups(data.groups || []);
        setDbMode(data.dbMode || 'Local');
        setIsSupabase(!!data.isSupabase);
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.settings) setSettings(data.settings);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Load data err:', err);
      setErrorMsg('Erro ao atualizar informações do painel.');
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  // Inline Toggles
  const handleToggleStatus = async (group: Group) => {
    const nextStatus = group.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/admin/groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setSuccessMsg(`Grupo "${group.name}" ${nextStatus === 'paused' ? 'pausado' : 'ativado'} com sucesso!`);
        refreshAllData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Erro ao alterar status do grupo.');
      }
    } catch {
      setErrorMsg('Erro de rede ao salvar status do grupo.');
    }
  };

  // Group Create Action
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromName.trim() || !fromWhatsappUrl.trim()) {
      setErrorMsg('Nome e Link do WhatsApp são obrigatórios.');
      return;
    }

    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fromName,
          whatsapp_url: fromWhatsappUrl,
          base_limit: formBaseLimit,
          alert_threshold: formAlertThreshold,
          alert_webhook_url: formAlertWebhookUrl,
          sort_order: formSortOrder,
          status: formStatus
        })
      });

      if (res.ok) {
        setSuccessMsg('Grupo cadastrado com sucesso!');
        setIsCreateModalOpen(false);
        resetForm();
        refreshAllData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Falha ao registrar novo grupo.');
      }
    } catch {
      setErrorMsg('Erro de conexão ao salvar novo grupo.');
    }
  };

  // Group Edit Action Setup
  const openEditModal = (group: Group) => {
    setSelectedGroup(group);
    setFormName(group.name);
    setFormWhatsappUrl(group.whatsapp_url);
    setFormBaseLimit(group.base_limit);
    setFormAlertThreshold(group.alert_threshold);
    setFormAlertWebhookUrl(group.alert_webhook_url || '');
    setFormSortOrder(group.sort_order);
    setFormStatus(group.status);
    setIsEditModalOpen(true);
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      const res = await fetch(`/api/admin/groups/${selectedGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fromName,
          whatsapp_url: fromWhatsappUrl,
          base_limit: formBaseLimit,
          alert_threshold: formAlertThreshold,
          alert_webhook_url: formAlertWebhookUrl,
          sort_order: formSortOrder,
          status: formStatus
        })
      });

      if (res.ok) {
        setSuccessMsg('Grupo modificado com sucesso!');
        setIsEditModalOpen(false);
        resetForm();
        refreshAllData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Erro ao modificar informações do grupo.');
      }
    } catch {
      setErrorMsg('Erro de conexão ao alterar dados do grupo.');
    }
  };

  // Add Extra Slots Action Setup
  const openReleaseModal = (group: Group) => {
    setSelectedGroup(group);
    setSlotsToAdd('');
    setIsReleaseModalOpen(true);
  };

  const handleReleaseSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || slotsToAdd === '' || slotsToAdd <= 0) {
      setErrorMsg('Insira uma quantidade válida de acessos a liberar.');
      return;
    }

    const calculatedExtraSlots = selectedGroup.extra_slots + slotsToAdd;

    try {
      const res = await fetch(`/api/admin/groups/${selectedGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extra_slots: calculatedExtraSlots,
          // End point resets alert_sent to false internally on extra_slots addition
        })
      });

      if (res.ok) {
        setSuccessMsg(`Mais ${slotsToAdd} acessos liberados para o grupo "${selectedGroup.name}"! O controle de alertas foi reinicializado.`);
        setIsReleaseModalOpen(false);
        refreshAllData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Falha ao liberar acessos adicionais.');
      }
    } catch {
      setErrorMsg('Erro de rede ao adicionar acessos adicionais.');
    }
  };

  // Group Elimination Action Setup
  const openDeleteModal = (group: Group) => {
    setSelectedGroup(group);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;

    try {
      const res = await fetch(`/api/admin/groups/${selectedGroup.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccessMsg('O grupo foi excluído permanentemente.');
        setIsDeleteModalOpen(false);
        refreshAllData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Erro ao excluir grupo.');
      }
    } catch {
      setErrorMsg('Falha na comunicação de rede para exclusão.');
    }
  };

  // Settings modification
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setSuccessMsg('Configurações salvas e aplicadas globalmente!');
        refreshAllData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Falha ao atualizar parâmetros de configuração.');
      }
    } catch {
      setErrorMsg('Erro no link de rede ao atualizar definições.');
    }
  };

  const handleWipeLogs = async () => {
    if (!confirm('Deseja realmente limpar permanentemente todo o histórico de cliques do redirecionador?')) return;
    try {
      const res = await fetch('/api/admin/logs', { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg('Histórico de acessos limpo com sucesso.');
        refreshAllData();
      } else {
        setErrorMsg('Não foi possível limpar o banco de logs.');
      }
    } catch {
      setErrorMsg('Erro de rede ao limpar os logs.');
    }
  };

  const resetForm = () => {
    setSelectedGroup(null);
    setFormName('');
    setFormWhatsappUrl('');
    setFormBaseLimit(1000);
    setFormAlertThreshold(100);
    setFormAlertWebhookUrl('');
    setFormSortOrder(1);
    setFormStatus('active');
    setSlotsToAdd('');
  };

  // Calculations for Analytical Insights Cards
  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.status === 'active');
  const activeGroupsCount = activeGroups.length;
  const totalClicksCombined = groups.reduce((acc, curr) => acc + curr.used_clicks, 0);

  // First eligible active group receiving clicks right now
  let activeRedirectionGroup = 'Nenhum / Link Reserva';
  for (const group of activeGroups) {
    const limitTotal = group.base_limit + group.extra_slots;
    if (limitTotal - group.used_clicks > 0) {
      activeRedirectionGroup = group.name;
      break;
    }
  }

  // Groups counts by state
  const almostFullGroupsCount = activeGroups.filter(g => {
    const limitTotal = g.base_limit + g.extra_slots;
    const remaining = limitTotal - g.used_clicks;
    return remaining <= g.alert_threshold && remaining > 0;
  }).length;

  const fullGroupsCount = activeGroups.filter(g => {
    const limitTotal = g.base_limit + g.extra_slots;
    return (limitTotal - g.used_clicks) <= 0;
  }).length;

  // Supabase PostgreSQL DB Generation Schema DDL
  const SQL_DDL_GENERATOR = `-- SCRIPT SQL PARA CRIAÇÃO DAS TABELAS NO SUPABASE
-- Acesse o painel do Supabase, clique em "SQL Editor", cole o código abaixo e clique em "Run".

-- 1. Tabela de grupos do redirecionamento inteligente
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  base_limit INT NOT NULL DEFAULT 1000,
  extra_slots INT NOT NULL DEFAULT 0,
  used_clicks INT NOT NULL DEFAULT 0,
  alert_threshold INT NOT NULL DEFAULT 100,
  alert_webhook_url TEXT DEFAULT '',
  alert_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (opcional, ou manter desativada para acesso direto server-side)
-- ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- 2. Tabela de logs para registrar as métricas de cliques do redirecionador
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  group_name TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  referer TEXT
);

-- Índices recomendados para constraints e velocidade de busca
CREATE INDEX IF NOT EXISTS idx_access_logs_group_id ON access_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_clicked_at ON access_logs(clicked_at DESC);

-- 3. Tabela de configurações globais do redirecionamento com ID fixo = 1
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  fallback_url TEXT DEFAULT 'https://meusite.com/reserva',
  public_page_title TEXT DEFAULT 'Redirecionando...',
  full_groups_message TEXT DEFAULT 'Desculpe, todos os nossos grupos estão cheios no momento. Em breve abriremos novas vagas!',
  global_webhook_url TEXT DEFAULT '',
  use_global_webhook BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT check_settings_id CHECK (id = 1)
);

-- Inserir as configurações padrões caso a tabela esteja vazia (ID fixo 1)
INSERT INTO settings (id, fallback_url, public_page_title, full_groups_message, global_webhook_url, use_global_webhook)
VALUES (
  1,
  'https://meusite.com/reserva', 
  'Redirecionando...', 
  'Desculpe, todos os nossos grupos estão cheios no momento. Em breve abriremos novas vagas!', 
  '', 
  false
) ON CONFLICT (id) DO NOTHING;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_DDL_GENERATOR);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <span className="text-sm text-slate-500 font-medium font-sans">Carregando painel de gerenciamento...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* Sidebar Navigation - Desktop-only */}
      <aside className="w-[270px] bg-slate-900 text-slate-300 hidden md:flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-800 flex flex-col items-center justify-center">
          <div className="relative group flex flex-col items-center justify-center p-5 w-full bg-slate-950/60 rounded-2xl border border-amber-500/25 shadow-[0_4px_20px_rgba(249,115,22,0.08)] hover:border-amber-500/40 transition-all duration-300">
            {/* Ambient subtle glow background */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-rose-500/5 to-transparent rounded-2xl pointer-events-none" />
            
            {/* Circular logo container with subtle red/orange glow border */}
            <div className="relative flex-shrink-0 w-[72px] h-[72px] rounded-full p-0.5 bg-gradient-to-tr from-yellow-500 via-orange-500 to-rose-500 shadow-lg">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                <img 
                  src="http://rsbflow.com.br/wp-content/uploads/2026/05/IMG_0849.png" 
                  alt="Gostei e Comprei" 
                  className="w-full h-full object-contain" 
                />
              </div>
            </div>

            {/* Brand text */}
            <div className="flex flex-col items-center text-center mt-3">
              <span className="text-white font-black text-base tracking-tight leading-none font-sans group-hover:text-amber-400 transition-colors duration-200">
                Gostei e Comprei
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#f97316] font-black leading-none mt-2">
                PROMOÇÕES
              </span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all duration-150 ${activeTab === 'dashboard' ? 'text-white bg-slate-800' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
          >
            <Users className="w-5 h-5 opacity-80" />
            Grupos
          </button>
          
          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all duration-150 ${activeTab === 'logs' ? 'text-white bg-slate-800' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
          >
            <FileText className="w-5 h-5 opacity-80" />
            Logs de acesso
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all duration-150 ${activeTab === 'settings' ? 'text-white bg-slate-800' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
          >
            <SettingsIcon className="w-5 h-5 opacity-80" />
            Configurações gerais
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all duration-150 ${activeTab === 'supabase' ? 'text-white bg-slate-800' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
          >
            <Terminal className="w-5 h-5 opacity-80" />
            Configurar Supabase
          </button>
        </nav>

        {/* Profile / DB Status footer inside Sidebar */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs uppercase">
              A
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Admin Usuário</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">DB: {dbMode}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header - Mobile and Desktop unified */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Header Brand Toggle */}
            <div className="md:hidden flex items-center gap-2 bg-slate-900 px-3 py-1 bg-slate-900 rounded-full border border-amber-500/20 shadow-sm">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-950 flex items-center justify-center p-0.5 border border-amber-500/40">
                <img 
                  src="http://rsbflow.com.br/wp-content/uploads/2026/05/IMG_0849.png" 
                  alt="Gostei e Comprei" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="text-white font-bold text-xs font-sans tracking-tight">Gostei e Comprei</span>
            </div>
            
            <h1 className="hidden md:block text-xl font-bold text-slate-800-force">
              {activeTab === 'dashboard' ? 'Gerenciamento de Grupos' : 
               activeTab === 'logs' ? 'Logs de Cliques' : 
               activeTab === 'settings' ? 'Configurações Globais' : 'Instruções de Integração'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Unified Web Public Link Area */}
            <div className="bg-slate-50 hover:bg-slate-100 rounded-full px-3 py-1.5 flex items-center gap-2 border border-slate-200 transition">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest hidden sm:inline">Link Público:</span>
              <code className="text-xs text-indigo-600 font-bold font-mono">/entrar</code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/entrar');
                  setSuccessMsg('Link de redirecionamento copiado!');
                }}
                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Copiar URL"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:text-red-650 hover:border-red-155 transition duration-150"
              id="logout_btn"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* Database Mode Warning Bar */}
        {!isSupabase && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white flex-shrink-0" id="demo_warning_banner">
            <div className="max-w-7xl mx-auto py-2.5 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm font-medium">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-bounce" />
                <span>
                  <strong>Modo de Demonstração Ativo (Banco Local):</strong> Os dados estão persistindo localmente no contêiner. Para conectar em produção:
                </span>
              </div>
              <button
                onClick={() => setActiveTab('supabase')}
                className="mt-2 sm:mt-0 bg-white/20 hover:bg-white/30 active:bg-white/40 px-3 py-1 rounded-md text-xxs sm:text-xs font-semibold uppercase tracking-wider transition duration-150"
                id="goto_supa_instructions"
              >
                Conectar Supabase &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Outer scrollable viewport wrapper for active area */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 overflow-y-auto">
          
          {/* Dynamic State Success/Error Indicators */}
          {successMsg && (
            <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start space-x-3 text-emerald-800 text-sm shadow-sm" id="global_success_banner">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" />
              <div>
                <p className="font-semibold">Ação concluída</p>
                <p className="text-emerald-700 text-xs mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start space-x-3 text-red-800 text-sm shadow-sm animate-shake" id="global_error_banner">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-semibold">Erro detectado</p>
                <p className="text-red-700 text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Mobile Tabs Indicators */}
          <div className="flex md:hidden bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto mb-6 scrollbar-hide space-x-1" id="mobile_tabs_navigation">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-shrink-0 px-4 py-2 text-xs font-bold rounded-lg transition duration-75 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
            >
              Acompanhamento
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-shrink-0 px-4 py-2 text-xs font-bold rounded-lg transition duration-75 ${activeTab === 'logs' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
            >
              Logs
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-shrink-0 px-4 py-2 text-xs font-bold rounded-lg transition duration-75 ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
            >
              Configurações
            </button>
            <button
              onClick={() => setActiveTab('supabase')}
              className={`flex-shrink-0 px-4 py-2 text-xs font-bold rounded-lg transition duration-75 ${activeTab === 'supabase' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
            >
              Supabase
            </button>
          </div>

          {/* TAB 1: DASHBOARD / GROUPS LISTING */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn" id="tab_dashboard_view">
              
              {/* Analytics Insights Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" id="insights_grid">
                
                {/* Card 1: Total Groups */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider leading-none">Total de grupos</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalGroups}</p>
                </div>
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
              </div>

              {/* Card 2: Active Groups */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider leading-none">Grupos Ativos</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2">{activeGroupsCount}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Play className="w-6 h-6" />
                </div>
              </div>

              {/* Card 3: Total Combined Clicks */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider leading-none">Cliques Gerais</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalClicksCombined}</p>
                </div>
                <div className="w-12 h-12 bg-violet-50 border border-violet-50 text-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-6 h-6 animate-spin-slow" />
                </div>
              </div>

              {/* Card 4: Receiving Redirects Now */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="min-w-0 pr-2 flex-grow">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider leading-none">Recebendo agora</p>
                  <p className="text-md font-extrabold text-indigo-600 mt-2.5 line-clamp-2 break-words leading-tight" title={activeRedirectionGroup}>
                    {activeRedirectionGroup}
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              {/* Card 5: Almost Full */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider leading-none">Quase Cheios</p>
                  <p className="text-3xl font-extrabold text-amber-500 mt-2">{almostFullGroupsCount}</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 border border-amber-50 text-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>

              {/* Card 6: Fully Stacked */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider leading-none">Grupos Cheios</p>
                  <p className="text-3xl font-extrabold text-red-500 mt-2">{fullGroupsCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-50 border border-red-50 text-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
              </div>

            </div>

            {/* Main Section: Header & Action Trigger */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Fluxos de Redirecionamento Ativos</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Priorização automática de acesso aos chats de WhatsApp.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
                    className="inline-flex items-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition duration-150"
                    id="add_new_group_btn"
                  >
                    <Plus className="w-4.5 h-4.5 mr-2" />
                    Novo grupo
                  </button>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="overflow-x-auto w-full">
                {groups.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-medium">
                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-bold text-slate-700 text-lg">Nenhum grupo cadastrado</p>
                    <p className="text-slate-400 text-xs mt-1">{"Crie seu primeiro grupo clicando em \"Novo grupo\"."}</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-100 text-left text-sm align-middle">
                    <thead className="bg-slate-50 font-semibold text-slate-500 border-b border-slate-100 uppercase tracking-wider text-xxs">
                      <tr>
                        <th className="px-6 py-4 w-12 text-center">Ordem</th>
                        <th className="px-6 py-4">Nome do grupo</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Limite Base</th>
                        <th className="px-6 py-4 text-right">Extras</th>
                        <th className="px-6 py-4 text-right">L. Total</th>
                        <th className="px-6 py-4 text-right">Usados</th>
                        <th className="px-6 py-4 text-right">Restantes</th>
                        <th className="px-6 py-4 w-48">Barra de Ocupação</th>
                        <th className="px-6 py-4 text-center">Limiar Alerta</th>
                        <th className="px-6 py-4 text-center">Alerta d.</th>
                        <th className="px-6 py-4 text-right w-64">Operações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {groups.map((group) => {
                        const limitTotal = group.base_limit + group.extra_slots;
                        const remaining = limitTotal - group.used_clicks;
                        const rawPercentage = limitTotal > 0 ? (group.used_clicks / limitTotal) * 100 : 0;
                        const displayPercentage = Math.min(100, Math.round(rawPercentage));

                        // State Color Definitions
                        let indicatorColor = 'text-slate-400 bg-slate-100 border-slate-200'; // Paused / Gray
                        let progressColor = 'bg-slate-400';
                        let labelStatus = 'Inativo';

                        if (group.status === 'active') {
                          if (remaining <= 0) {
                            indicatorColor = 'text-red-700 bg-red-50 border-red-150'; // Full / Red
                            progressColor = 'bg-red-500';
                            labelStatus = 'Cheio';
                          } else if (remaining <= group.alert_threshold) {
                            indicatorColor = 'text-amber-700 bg-amber-50 border-amber-150'; // Danger / Yellow
                            progressColor = 'bg-amber-500';
                            labelStatus = 'Quase Cheio';
                          } else {
                            indicatorColor = 'text-emerald-700 bg-emerald-50 border-emerald-150'; // Safe / Green
                            progressColor = 'bg-emerald-500';
                            labelStatus = 'Liberado';
                          }
                        } else {
                          labelStatus = 'Pausado';
                        }

                        return (
                          <tr key={group.id} className="hover:bg-slate-50 transition duration-150">
                            
                            {/* Sort Order */}
                            <td className="px-6 py-4 text-center font-mono font-bold text-slate-500">
                              #{group.sort_order}
                            </td>

                            {/* Name & URL details */}
                            <td className="px-6 py-4 font-bold text-slate-900 min-w-40 max-w-xs">
                              <span className="block truncate" title={group.name}>{group.name}</span>
                              <span className="text-slate-400 text-xxs block font-mono font-medium truncate max-w-xs mt-1" title={group.whatsapp_url}>
                                {group.whatsapp_url}
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex px-2 py-1 text-xxs font-bold uppercase tracking-wider rounded-md border ${indicatorColor}`}>
                                {labelStatus}
                              </span>
                            </td>

                            {/* base_limit */}
                            <td className="px-6 py-4 text-right font-semibold font-mono text-xs">{group.base_limit}</td>

                            {/* extra_slots */}
                            <td className="px-6 py-4 text-right text-emerald-600 font-semibold font-mono text-xs">
                              {group.extra_slots > 0 ? `+${group.extra_slots}` : '0'}
                            </td>

                            {/* limit_total */}
                            <td className="px-6 py-4 text-right font-black font-mono text-xs text-slate-900">{limitTotal}</td>

                            {/* used_clicks */}
                            <td className="px-6 py-4 text-right font-semibold font-mono text-xs text-slate-600">{group.used_clicks}</td>

                            {/* remaining_clicks */}
                            <td className={`px-6 py-4 text-right font-black font-mono text-xs ${remaining <= 0 ? 'text-red-600' : 'text-slate-950'}`}>
                              {remaining}
                            </td>

                            {/* Occupation Bar */}
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3 w-full">
                                <div className="flex-grow bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                                    style={{ width: `${displayPercentage}%` }}
                                  />
                                </div>
                                <span className="text-xxs font-bold text-slate-500 w-8 text-right font-mono">
                                  {displayPercentage}%
                                </span>
                              </div>
                            </td>

                            {/* alert_threshold */}
                            <td className="px-6 py-4 text-center font-mono text-xs font-semibold text-slate-500">
                              {group.alert_threshold}
                            </td>

                            {/* alert_sent */}
                            <td className="px-6 py-4 text-center">
                              {group.alert_sent ? (
                                <span className="inline-flex px-1.5 py-0.5 text-xxs uppercase tracking-wider font-extrabold rounded-md bg-amber-100 text-amber-800 border border-amber-250">
                                  Sim
                                </span>
                              ) : (
                                <span className="inline-flex px-1.5 py-0.5 text-xxs uppercase tracking-wider font-bold rounded-md bg-slate-100 text-slate-400">
                                  Não
                                </span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                
                                {/* Toggle Active/Pause */}
                                <button
                                  onClick={() => handleToggleStatus(group)}
                                  className={`p-1.5 rounded-lg border transition duration-150 ${group.status === 'active' ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-amber-600 hover:border-amber-100' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}
                                  title={group.status === 'active' ? 'Pausar Grupo' : 'Ativar Grupo'}
                                  id={`action_toggle_${group.id}`}
                                >
                                  {group.status === 'active' ? <Pause className="w-4.5 h-4.5" /> : <Play className="w-4.5 h-4.5" />}
                                </button>

                                {/* Release slots */}
                                <button
                                  onClick={() => openReleaseModal(group)}
                                  className="p-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition duration-150 flex items-center space-x-1"
                                  title="Liberar mais acessos"
                                  id={`action_release_${group.id}`}
                                >
                                  <Plus className="w-4.5 h-4.5" />
                                  <span className="text-xxs font-bold pr-0.5 uppercase">Acessos</span>
                                </button>

                                {/* Edit Button */}
                                <button
                                  onClick={() => openEditModal(group)}
                                  className="p-1.5 rounded-lg border border-slate-250 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950 transition duration-150"
                                  title="Editar Parâmetros"
                                  id={`action_edit_${group.id}`}
                                >
                                  <Edit3 className="w-4.5 h-4.5" />
                                </button>

                                {/* Delete button */}
                                <button
                                  onClick={() => openDeleteModal(group)}
                                  className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 transition duration-150"
                                  title="Remover Registro"
                                  id={`action_delete_${group.id}`}
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>

                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* General quick checklist section */}
            <div className="bg-slate-850 bg-white rounded-2xl p-6 border border-slate-150 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-600">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">Funcionamento dos Links Públicos</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1 max-w-xl">
                    Sua URL pública única de redirecionamento é <strong className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded text-xxs">/entrar</strong>. Divulgue esse link! Ele calcula em tempo real o primeiro grupo ativo com vagas disponíveis com base em (Limite Base + Vagas Extras - Cliques Usados), faz a gravação do Log de cliques, atualiza as estatísticas e redireciona os novos contatos de forma invisível.
                  </p>
                </div>
              </div>
              <a
                href="/entrar"
                target="_blank"
                className="w-full md:w-auto text-center inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition duration-150 shadow-md shadow-indigo-100"
              >
                Abrir Link /entrar <ArrowRight className="w-4 h-4 ml-1.5" />
              </a>
            </div>

          </div>
        )}


        {/* TAB 2: ACCESS LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fadeIn" id="tab_logs_view">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Logs de cliques em Tempo Real</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Histórico refinado dos últimos 500 acessos ao redirector público.</p>
                </div>
                <div>
                  <button
                    onClick={handleWipeLogs}
                    className="inline-flex items-center py-2 px-3 border border-red-200 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-150 transition duration-150 shadow-sm"
                    id="clear_logs_btn"
                  >
                    <Terminal className="w-4 h-4 mr-1.5" />
                    Limpar Logs de Cliques
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                {logs.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-medium">
                    <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3 animate-pulse" />
                    <p className="font-bold text-slate-700 text-lg">Sem logs registrados</p>
                    <p className="text-slate-400 text-xs mt-1">Os cliques de visitantes sob o link `/entrar` aparecerão aqui instantaneamente.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-100 text-left text-sm align-middle">
                    <thead className="bg-slate-50 font-semibold text-slate-500 border-b border-slate-100 uppercase tracking-wider text-xxs">
                      <tr>
                        <th className="px-6 py-4">Data e Hora</th>
                        <th className="px-6 py-4">Grupo Destino</th>
                        <th className="px-6 py-4">Endereço IP</th>
                        <th className="px-6 py-4">Referer (Origem)</th>
                        <th className="px-6 py-4">Plataforma / Navegador (User Agent)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {logs.map((log) => {
                        let parsedTime = '';
                        try {
                          parsedTime = new Date(log.clicked_at).toLocaleString('pt-BR');
                        } catch {
                          parsedTime = log.clicked_at;
                        }

                        // Determine neat OS/Browser tags
                        let osTag = 'Outro';
                        const ua = log.user_agent.toLowerCase();
                        if (ua.includes('iphone') || ua.includes('ipad')) osTag = 'iPhone / iOS';
                        else if (ua.includes('android')) osTag = 'Android';
                        else if (ua.includes('windows')) osTag = 'Windows Desktop';
                        else if (ua.includes('macintosh') || ua.includes('mac os')) osTag = 'macOS Desktop';
                        else if (ua.includes('linux')) osTag = 'Linux';

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition duration-150">
                            <td className="px-6 py-4 font-mono font-medium text-xs text-slate-500 whitespace-nowrap">
                              {parsedTime}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-bold text-slate-900 block">{log.group_name}</span>
                              <span className="text-slate-400 font-mono text-xxs mt-0.5 block">{log.group_id}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-700 text-xs">
                              {log.ip_address}
                            </td>
                            <td className="px-6 py-4 truncate max-w-xs font-mono text-xxs text-slate-500" title={log.referer}>
                              {log.referer}
                            </td>
                            <td className="px-6 py-4 text-xs font-sans text-slate-650 min-w-40 max-w-sm">
                              <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xxs font-semibold mr-1.5">
                                {osTag}
                              </span>
                              <span className="text-slate-500 truncate block text-xxs mt-1" title={log.user_agent}>
                                {log.user_agent}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}


        {/* TAB 3: SETTINGS FORM */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn" id="tab_settings_view">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              
              <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Parâmetros do Sistema</h3>
                <p className="text-sm text-slate-500 mt-0.5">Definições globais do redirecionamento inteligente.</p>
              </div>

              <form onSubmit={handleUpdateSettings} className="p-6 space-y-6" id="settings_form">
                
                {/* Fallback URL */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    URL de Reserva (Fallback)
                  </label>
                  <p className="text-xxs text-slate-400 mb-2">
                    Para onde redirecionar os contatos quando todos os grupos estiverem cheios ou offline.
                  </p>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="url"
                      required
                      value={settings.fallback_url}
                      onChange={(e) => setSettings({ ...settings, fallback_url: e.target.value })}
                      className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="https://meusite.com/grupo-reserva"
                    />
                  </div>
                </div>

                {/* Public page title */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Título da Página de Espera
                  </label>
                  <p className="text-xxs text-slate-400 mb-2">
                    O nome que identifica esse fluxo nas páginas de redirecionamento ou aviso de vagas esgotadas.
                  </p>
                  <input
                    type="text"
                    required
                    value={settings.public_page_title}
                    onChange={(e) => setSettings({ ...settings, public_page_title: e.target.value })}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Redirecionando para o Grupo oficial..."
                  />
                </div>

                {/* Full Groups Message */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Mensagem de Grupos Lotados (Sem Vagas)
                  </label>
                  <p className="text-xxs text-slate-400 mb-2">
                    Texto exibido na página pública (/sem-vagas) quando não houverem grupos ativos com vagas e sem URL reserva definida.
                  </p>
                  <textarea
                    rows={4}
                    required
                    value={settings.full_groups_message}
                    onChange={(e) => setSettings({ ...settings, full_groups_message: e.target.value })}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Todos os nossos grupos estão cheios neste momento..."
                  ></textarea>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  {/* Toggle Global Webhook URL */}
                  <div className="flex items-start justify-between">
                    <div className="flex-grow pr-4">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        Usar Webhook de Alerta Global
                      </label>
                      <p className="text-xxs text-slate-400 leading-normal mt-0.5">
                        Quando ativo, ignora as URLs de webhooks configuradas individualmente nos grupos e envia todos os alertas para o endpoint global inserido abaixo.
                      </p>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, use_global_webhook: !settings.use_global_webhook })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.use_global_webhook ? 'bg-indigo-600' : 'bg-slate-200'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.use_global_webhook ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Webhook URL Input */}
                  {settings.use_global_webhook && (
                    <div className="mt-4 animate-fadeIn">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        URL do Webhook Global
                      </label>
                      <p className="text-xxs text-slate-400 mb-2">
                        O payload do alerta de grupo esgotando (JSON estruturado para integração com n8n/Make) será disparado para esta URL.
                      </p>
                      <input
                        type="url"
                        value={settings.global_webhook_url}
                        onChange={(e) => setSettings({ ...settings, global_webhook_url: e.target.value })}
                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="https://n8n.meusite.com/webhook-active-alerts"
                      />
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="border-t border-slate-100 pt-6 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-3 px-6 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition duration-150"
                    id="save_settings_btn"
                  >
                    Salvar alterações
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}


        {/* TAB 4: SUPABASE INSTRUCTIONS & DDL SQL EXPORTER */}
        {activeTab === 'supabase' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn" id="tab_supabase_view">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
              
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">S</div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Instruções para Configurar o Supabase</h3>
                  <p className="text-sm text-slate-500">Como conectar o banco de dados em produção.</p>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start space-x-3">
                  <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <div>
                    <p className="font-bold text-slate-950">Selecione/Crie um Projeto no Supabase</p>
                    <p className="text-xs text-slate-500 mt-0.5">Crie uma conta gratuita em <a href="https://supabase.com" target="_blank" className="text-indigo-600 hover:underline">supabase.com</a> e crie um novo projeto da sua escolha.</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start space-x-3">
                  <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <div className="w-full">
                    <p className="font-bold text-slate-950">Execute o Script de Criação de Tabelas (SQL)</p>
                    <p className="text-xs text-slate-500 mt-1">No menu esquerdo do console do Supabase, clique em <strong>SQL Editor</strong> &gt; depois em <strong>New Query</strong>, cole o código DDL abaixo e clique em <strong>Run</strong>.</p>
                    
                    {/* DDL SQL box */}
                    <div className="mt-3 relative">
                      <pre className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-indigo-400 overflow-x-auto max-h-60 border border-slate-850">
                        {SQL_DDL_GENERATOR}
                      </pre>
                      <button
                        onClick={handleCopySql}
                        className="absolute right-3 top-3 inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition duration-150"
                        id="copy_sql_btn"
                      >
                        {copiedSql ? (
                          <>
                            <Check className="w-4 h-4 text-indigo-400" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar SQL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start space-x-3">
                  <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <div>
                    <p className="font-bold text-slate-950">Configure as Variáveis de Ambiente (.env)</p>
                    <p className="text-xs text-slate-550 mt-1 leading-normal">
                      Vá em <strong>Settings</strong> &gt; <strong>API</strong> no Supabase para copiar as chaves e configure as variáveis de ambiente em seu contêiner do AI Studio (Secrets panel) ou no servidor Vercel de destino:
                    </p>
                    <ul className="list-disc pl-5 text-xxs sm:text-xs font-mono text-slate-650 space-y-1 mt-2">
                      <li><strong>SUPABASE_URL</strong>: <span className="text-slate-450">&lsaquo;URL-do-seu-projeto-supabase&rsaquo;</span></li>
                      <li><strong>SUPABASE_ANON_KEY</strong>: <span className="text-slate-450">&lsaquo;sua-chave-anon-key&rsaquo;</span></li>
                      <li><strong>ADMIN_PASSWORD</strong>: <span className="text-slate-450">&lsaquo;senha-do-painel-administrativo&rsaquo;</span> (Opcional, padrão: admin123)</li>
                    </ul>
                    <p className="text-xxs text-amber-600 font-semibold mt-2 bg-amber-50 rounded-lg p-2.5 border border-amber-100 flex items-start space-x-1.5">
                      <Info className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                      <span>Nota: Se estas variáveis de ambiente estiverem configuradas, o sistema comutará de forma transparente do arquivo local para o Supabase sem requerer nenhuma mudança de código adicional!</span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start space-x-3">
                  <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                  <div>
                    <p className="font-bold text-slate-950">Como Publicar na Vercel</p>
                    <div className="text-xs text-slate-500 mt-1 space-y-1">
                      <p>O projeto está estruturado em Next.js moderno (App Router), pronto para upload na Vercel em cliques:</p>
                      <ul className="list-decimal pl-5 space-y-1 py-1 text-slate-600 font-medium">
                        <li>Conecte seu repositório Git importado à Vercel.</li>
                        <li>Nas configurações (Environment Variables), adicione os campos <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 text-xxs font-mono">SUPABASE_URL</code> e <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 text-xxs font-mono">SUPABASE_ANON_KEY</code>.</li>
                        <li>Configure <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 text-xxs font-mono">ADMIN_PASSWORD</code> com a senha do seu painel e clique em Deploy!</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </main>


      {/* MODAL 1: CREATE NEW GROUP */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" id="create_group_modal">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 relative overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-950 uppercase tracking-wide">Novo Grupo de WhatsApp</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-100 transition duration-150 text-xs"
                id="close_create_modal"
              >
                ✕
              </button>
            </div>

            {/* Modal body (Scrollable) */}
            <form onSubmit={handleCreateGroup} className="flex-grow overflow-y-auto p-6 space-y-4" id="create_group_form">
              
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nome do grupo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: WhatsApp Turma 1"
                  value={fromName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              {/* Whatsapp link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Link do WhatsApp</label>
                <input
                  type="url"
                  required
                  placeholder="https://chat.whatsapp.com/..."
                  value={fromWhatsappUrl}
                  onChange={(e) => setFormWhatsappUrl(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* base_limit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Limite Base de Cliques</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formBaseLimit}
                    onChange={(e) => setFormBaseLimit(Math.max(1, Number(e.target.value)))}
                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-910 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  />
                </div>

                {/* alert_threshold */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Avisar quando faltarem X acessos</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formAlertThreshold}
                    onChange={(e) => setFormAlertThreshold(Math.max(0, Number(e.target.value)))}
                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-910 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* sort_order */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Ordem / Prioridade</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Math.max(1, Number(e.target.value)))}
                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-910 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Status Inicial</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'paused')}
                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-910 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="active">Ativo (Permite Acesso)</option>
                    <option value="paused">Pausado (Bloqueia Redirecionamento)</option>
                  </select>
                </div>

              </div>

              {/* alert_webhook_url */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Webhook de Alerta (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://n8n.meusite.com/webhook/..."
                  value={formAlertWebhookUrl}
                  onChange={(e) => setFormAlertWebhookUrl(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition duration-150"
                  id="cancel_create"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition duration-150 shadow-md shadow-indigo-100"
                  id="submit_create_group"
                >
                  Salvar Grupo
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


      {/* MODAL 2: EDIT GROUP */}
      {isEditModalOpen && selectedGroup && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" id="edit_group_modal">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 relative overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-950 uppercase tracking-wide">Editar Grupo Existente</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-100 transition duration-150 text-xs"
                id="close_edit_modal"
              >
                ✕
              </button>
            </div>

            {/* Modal body (Scrollable) */}
            <form onSubmit={handleEditGroup} className="flex-grow overflow-y-auto p-6 space-y-4" id="edit_group_form">
              
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nome do grupo</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do grupo"
                  value={fromName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              {/* Whatsapp link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Link do WhatsApp</label>
                <input
                  type="url"
                  required
                  placeholder="Link do WhatsApp"
                  value={fromWhatsappUrl}
                  onChange={(e) => setFormWhatsappUrl(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* base_limit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Limite Base de Cliques</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formBaseLimit}
                    onChange={(e) => setFormBaseLimit(Math.max(1, Number(e.target.value)))}
                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-910 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  />
                </div>

                {/* alert_threshold */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Avisar quando faltarem X acessos</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formAlertThreshold}
                    onChange={(e) => setFormAlertThreshold(Math.max(0, Number(e.target.value)))}
                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-910 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* sort_order */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Ordem / Prioridade</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Math.max(1, Number(e.target.value)))}
                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-910 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'paused')}
                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-910 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="active">Ativo</option>
                    <option value="paused">Pausado</option>
                  </select>
                </div>

              </div>

              {/* alert_webhook_url */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Webhook de Alerta (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://n8n.meusite.com/webhook/..."
                  value={formAlertWebhookUrl}
                  onChange={(e) => setFormAlertWebhookUrl(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition duration-150"
                  id="cancel_edit"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition duration-150 shadow-md shadow-indigo-100"
                  id="submit_edit_group_btn"
                >
                  Salvar alterações
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


      {/* MODAL 3: RELEASE MORE VACANCIES (LIBERAR ACESSOS EXTRAS) */}
      {isReleaseModalOpen && selectedGroup && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" id="release_slots_modal">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 relative overflow-hidden">
            
            {/* Modal accent top */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500" />

            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Liberar Acessos</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1" id="release_desc_text">
                Insira a quantidade de vagas ou cliques extras que deseja adicionar para o grupo <strong>{selectedGroup.name}</strong>. Isso voltará o alerta de ocupação para falso de forma automática.
              </p>

              {/* Micro specs calculation summary */}
              <div className="my-4 p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1.5 text-xs text-slate-650">
                <div className="flex justify-between font-mono">
                  <span>Limite Base atual:</span>
                  <span className="font-bold text-slate-900">{selectedGroup.base_limit}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Acessos Extras atuais:</span>
                  <span className="font-bold text-indigo-600">+{selectedGroup.extra_slots}</span>
                </div>
                <div className="flex justify-between font-mono border-t border-slate-150 pt-1.5 font-bold">
                  <span>Limite Total atual:</span>
                  <span className="text-slate-900">{selectedGroup.base_limit + selectedGroup.extra_slots}</span>
                </div>
                <div className="flex justify-between font-mono text-slate-500">
                  <span>Cliques já usados:</span>
                  <span>{selectedGroup.used_clicks}</span>
                </div>
                <div className="flex justify-between font-mono font-bold text-indigo-700 border-t border-slate-150 pt-1.5">
                  <span>Vagas Restantes atuais:</span>
                  <span>{(selectedGroup.base_limit + selectedGroup.extra_slots) - selectedGroup.used_clicks}</span>
                </div>
              </div>

              <form onSubmit={handleReleaseSlots} className="space-y-4" id="release_slots_form">
                
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Quantidade de acessos</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={slotsToAdd}
                    onChange={(e) => setSlotsToAdd(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: 200"
                    id="release_slots_input"
                  />
                </div>

                {/* Instant visual helper estimation preview */}
                {slotsToAdd !== '' && slotsToAdd > 0 && (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xxs leading-snug text-indigo-800 font-mono animate-fadeIn">
                    <p className="font-bold uppercase tracking-wider text-indigo-900">Novo Cálculo Estimado:</p>
                    <p className="mt-1">Limite Total: {selectedGroup.base_limit + selectedGroup.extra_slots} &rarr; <strong>{selectedGroup.base_limit + selectedGroup.extra_slots + slotsToAdd}</strong></p>
                    <p>Vagas Restantes: {(selectedGroup.base_limit + selectedGroup.extra_slots) - selectedGroup.used_clicks} &rarr; <strong>{((selectedGroup.base_limit + selectedGroup.extra_slots) - selectedGroup.used_clicks) + slotsToAdd}</strong></p>
                  </div>
                )}

                {/* Modal actions */}
                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsReleaseModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition duration-150"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition duration-150 shadow-md shadow-indigo-100"
                    id="confirm_release_btn"
                  >
                    Adicionar acessos
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      )}


      {/* MODAL 4: CONFIRM MUTATION DELETION */}
      {isDeleteModalOpen && selectedGroup && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" id="delete_group_modal">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-100 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500" />

            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="text-base font-bold text-slate-950">Confirmar exclusão?</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2" id="delete_desc_text">
                Tem certeza que deseja excluir o grupo &ldquo;<strong>{selectedGroup.name}</strong>&rdquo; permanentemente? Esta ação de exclusão não poderá ser desfeita.
              </p>

              <div className="mt-6 flex justify-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition duration-150"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteGroup}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition duration-150 shadow-md shadow-red-200"
                  id="confirm_delete_group_btn"
                >
                  Confirmar exclusão
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Admin Footer Branding (No Larping - Humble details) */}
      <footer className="bg-white border-t border-slate-100 mt-12 py-8 text-center text-xs text-slate-400 font-sans" id="admin_footer_branding">
        <p className="font-semibold tracking-wider text-slate-500 text-xxs uppercase">WhatsRoute Management Console</p>
        <p className="mt-1">Redirecionador Inteligente de Fluxos integrado com Supabase e Webhooks de Mensageria.</p>
        <p className="mt-2 font-mono text-slate-350">Hora do Administrador (UTC): 2026-05-27T13:13:26Z</p>
      </footer>

    </div>
  </div>
  );
}
