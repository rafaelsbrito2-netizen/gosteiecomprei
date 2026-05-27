import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Types matched exactly to user's requirements
export interface Group {
  id: string;
  name: string;
  whatsapp_url: string;
  sort_order: number;
  status: 'active' | 'paused';
  base_limit: number;
  extra_slots: number;
  used_clicks: number;
  alert_threshold: number;
  alert_webhook_url: string;
  alert_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccessLog {
  id: string;
  group_id: string | null;
  group_name: string;
  clicked_at: string;
  user_agent: string;
  ip_address: string;
  referer: string;
}

export interface Settings {
  fallback_url: string;
  public_page_title: string;
  full_groups_message: string;
  global_webhook_url: string;
  use_global_webhook: boolean;
}

// Check for Supabase environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabaseClient: any = null;
if (isSupabaseConfigured) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

// Local JSON DB File Path
const LOCAL_DB_PATH = path.join(process.cwd(), 'db.json');

// Interface for local json database structure
interface RawLocalDB {
  groups: Group[];
  logs: AccessLog[];
  settings: Settings;
}

// Default settings as requested
const DEFAULT_SETTINGS: Settings = {
  fallback_url: 'https://meusite.com/reserva',
  public_page_title: 'Redirecionando...',
  full_groups_message: 'Desculpe, todos os nossos grupos estão cheios no momento. Em breve abriremos novas vagas!',
  global_webhook_url: '',
  use_global_webhook: false
};

// Seed groups for rich demonstration
const SEED_GROUPS: Group[] = [
  {
    id: 'group-1',
    name: 'Grupo Alfa (Quase Cheio)',
    whatsapp_url: 'https://chat.whatsapp.com/sample-alfa-invite',
    sort_order: 1,
    status: 'active',
    base_limit: 100,
    extra_slots: 10,
    used_clicks: 106, // limit_total = 110, alert threshold = 5, clicked = 106 (4 remaining). Triggered when used_clicks reaches 105.
    alert_threshold: 5,
    alert_webhook_url: 'https://discord.com/api/webhooks/mock-group-1',
    alert_sent: false,
    created_at: new Date('2026-05-20T10:00:00Z').toISOString(),
    updated_at: new Date('2026-05-27T12:00:00Z').toISOString()
  },
  {
    id: 'group-2',
    name: 'Grupo Beta (Novo)',
    whatsapp_url: 'https://chat.whatsapp.com/sample-beta-invite',
    sort_order: 2,
    status: 'active',
    base_limit: 200,
    extra_slots: 0,
    used_clicks: 0,
    alert_threshold: 20,
    alert_webhook_url: '',
    alert_sent: false,
    created_at: new Date('2026-05-21T10:00:00Z').toISOString(),
    updated_at: new Date('2026-05-21T10:00:00Z').toISOString()
  },
  {
    id: 'group-3',
    name: 'Grupo Gama (Pausado)',
    whatsapp_url: 'https://chat.whatsapp.com/sample-gama-invite',
    sort_order: 3,
    status: 'paused',
    base_limit: 50,
    extra_slots: 0,
    used_clicks: 10,
    alert_threshold: 10,
    alert_webhook_url: '',
    alert_sent: false,
    created_at: new Date('2026-05-22T10:00:00Z').toISOString(),
    updated_at: new Date('2026-05-22T10:00:00Z').toISOString()
  },
  {
    id: 'group-4',
    name: 'Grupo Delta (Cheio)',
    whatsapp_url: 'https://chat.whatsapp.com/sample-delta-invite',
    sort_order: 4,
    status: 'active',
    base_limit: 10,
    extra_slots: 0,
    used_clicks: 10,
    alert_threshold: 1,
    alert_webhook_url: '',
    alert_sent: true,
    created_at: new Date('2026-05-23T10:00:00Z').toISOString(),
    updated_at: new Date('2026-05-23T10:00:00Z').toISOString()
  }
];

const SEED_LOGS: AccessLog[] = [
  {
    id: 'log-1',
    group_id: 'group-1',
    group_name: 'Grupo Alfa (Quase Cheio)',
    clicked_at: new Date('2026-05-27T13:10:00Z').toISOString(),
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)',
    ip_address: '177.34.22.10',
    referer: 'https://www.google.com'
  },
  {
    id: 'log-2',
    group_id: 'group-1',
    group_name: 'Grupo Alfa (Quase Cheio)',
    clicked_at: new Date('2026-05-27T13:05:00Z').toISOString(),
    user_agent: 'Mozilla/5.0 (Linux; Android 10; SM-G960F)',
    ip_address: '189.44.156.233',
    referer: 'https://m.facebook.com'
  }
];

// Helper to initialize local DB file if missing
function getLocalDB(): RawLocalDB {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const defaultData: RawLocalDB = {
      groups: SEED_GROUPS,
      logs: SEED_LOGS,
      settings: DEFAULT_SETTINGS
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading local DB, regenerating defaults:', error);
    const defaultData: RawLocalDB = {
      groups: SEED_GROUPS,
      logs: SEED_LOGS,
      settings: DEFAULT_SETTINGS
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
}

// Helper to save local DB file
function saveLocalDB(data: RawLocalDB) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write to local DB file:', err);
  }
}

// Public API Functions that handle Supabase vs. Local Storage
export const db = {
  isSupabase: (): boolean => {
    return isSupabaseConfigured;
  },

  getDbMode: (): string => {
    return isSupabaseConfigured ? 'Supabase' : 'Local JSON';
  },

  async getGroups(): Promise<Group[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('groups')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error('Supabase getGroups error:', error);
        throw error;
      }
      return data as Group[];
    }
    // Local Fallback
    const local = getLocalDB();
    return [...local.groups].sort((a, b) => a.sort_order - b.sort_order);
  },

  async getGroup(id: string): Promise<Group | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('groups')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        console.error(`Supabase getGroup ${id} error:`, error);
        throw error;
      }
      return data as Group | null;
    }
    const local = getLocalDB();
    return local.groups.find(g => g.id === id) || null;
  },

  async createGroup(group: Omit<Group, 'id' | 'created_at' | 'updated_at' | 'used_clicks' | 'extra_slots' | 'alert_sent'>): Promise<Group> {
    const id = isSupabaseConfigured ? undefined : `group-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const newGroup: Group = {
      id: id || '',
      ...group,
      extra_slots: 0,
      used_clicks: 0,
      alert_sent: false,
      created_at: timestamp,
      updated_at: timestamp
    };

    if (isSupabaseConfigured) {
      // Omitting id so Supabase triggers its default auto UUID generation (gen_random_uuid())
      const { id: _, ...supabaseInsertPayload } = newGroup;
      const { data, error } = await supabaseClient
        .from('groups')
        .insert([supabaseInsertPayload])
        .select()
        .single();
      if (error) {
        console.error('Supabase createGroup error:', error);
        throw error;
      }
      return data as Group;
    }

    const local = getLocalDB();
    local.groups.push(newGroup);
    saveLocalDB(local);
    return newGroup;
  },

  async updateGroup(id: string, updates: Partial<Group>): Promise<Group | null> {
    const timestamp = new Date().toISOString();
    const cleanUpdates = {
      ...updates,
      updated_at: timestamp
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('groups')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error(`Supabase updateGroup ${id} error:`, error);
        throw error;
      }
      return data as Group;
    }

    const local = getLocalDB();
    const idx = local.groups.findIndex(g => g.id === id);
    if (idx === -1) return null;

    const updated = {
      ...local.groups[idx],
      ...cleanUpdates
    } as Group;

    local.groups[idx] = updated;
    saveLocalDB(local);
    return updated;
  },

  async deleteGroup(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { error } = await supabaseClient
        .from('groups')
        .delete()
        .eq('id', id);
      if (error) {
        console.error(`Supabase deleteGroup ${id} error:`, error);
        throw error;
      }
      return true;
    }

    const local = getLocalDB();
    const originalLength = local.groups.length;
    local.groups = local.groups.filter(g => g.id !== id);
    
    if (local.groups.length !== originalLength) {
      saveLocalDB(local);
      return true;
    }
    return false;
  },

  async getLogs(limit: number = 200): Promise<AccessLog[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('access_logs')
        .select('*')
        .order('clicked_at', { ascending: false })
        .limit(limit);
      if (error) {
        console.error('Supabase getLogs error:', error);
        throw error;
      }
      return data as AccessLog[];
    }

    const local = getLocalDB();
    return [...local.logs]
      .sort((a, b) => new Date(b.clicked_at).getTime() - new Date(a.clicked_at).getTime())
      .slice(0, limit);
  },

  async addLog(log: Omit<AccessLog, 'id' | 'clicked_at'>): Promise<AccessLog> {
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const clicked_at = new Date().toISOString();
    const newLog: AccessLog = {
      id,
      ...log,
      clicked_at
    };

    if (isSupabaseConfigured) {
      const { id: _, ...insertPayload } = newLog;
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (insertPayload.group_id && !uuidRegex.test(insertPayload.group_id)) {
        insertPayload.group_id = null;
      }

      const { data, error } = await supabaseClient
        .from('access_logs')
        .insert([insertPayload])
        .select()
        .single();
      if (error) {
        console.error('Supabase addLog error:', error);
        throw error;
      }
      return data as AccessLog;
    }

    const local = getLocalDB();
    local.logs.unshift(newLog);
    
    // Keep logs size reasonable locally
    if (local.logs.length > 500) {
      local.logs = local.logs.slice(0, 500);
    }
    
    saveLocalDB(local);
    return newLog;
  },

  async clearLogs(): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { error } = await supabaseClient
        .from('access_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all lines correctly bypassing timestamp string checks
      if (error) {
        console.error('Supabase clearLogs error:', error);
        throw error;
      }
      return true;
    }

    const local = getLocalDB();
    local.logs = [];
    saveLocalDB(local);
    return true;
  },

  async getSettings(): Promise<Settings> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('settings')
        .select('*')
        .eq('id', 1);
      if (error) {
        console.error('Supabase getSettings error:', error);
        throw error;
      }
      if (data && data.length > 0) {
        return data[0] as Settings;
      } else {
        // Initialize if settings are not present - enforcing fixed integer ID 1
        const { error: insertError } = await supabaseClient
          .from('settings')
          .insert([{ id: 1, ...DEFAULT_SETTINGS }]);
        if (insertError) {
          console.error('Failed to initialize settings on Supabase:', insertError);
          throw insertError;
        }
        return DEFAULT_SETTINGS;
      }
    }

    const local = getLocalDB();
    return local.settings || DEFAULT_SETTINGS;
  },

  async updateSettings(settings: Settings): Promise<Settings> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('settings')
        .upsert({ id: 1, ...settings })
        .select()
        .single();
      if (error) {
        // Falling back to update eq('id', 1) in case of upsert constraints
        const { data: updateData, error: updateError } = await supabaseClient
          .from('settings')
          .update(settings)
          .eq('id', 1)
          .select()
          .single();
        if (updateError) {
          console.error('Supabase updateSettings error:', updateError);
          throw updateError;
        }
        return updateData as Settings;
      }
      return data as Settings;
    }

    const local = getLocalDB();
    local.settings = { ...local.settings, ...settings };
    saveLocalDB(local);
    return local.settings;
  }
};
