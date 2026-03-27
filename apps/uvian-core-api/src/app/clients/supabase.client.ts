import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

export function createAnonClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

export const createUserClient = (token: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          name: string | null;
          settings: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          settings?: unknown;
        };
      };
      account_members: {
        Row: {
          id: string;
          account_id: string;
          user_id: string;
          role: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          user_id: string;
          role?: unknown;
        };
      };
      automaton_providers: {
        Row: {
          id: string;
          account_id: string;
          owner_user_id: string;
          name: string;
          type: string;
          url: string | null;
          auth_method: string | null;
          auth_config: Record<string, unknown> | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          account_id: string;
          owner_user_id: string;
          name: string;
          type?: string;
          url?: string | null;
          auth_method?: string | null;
          auth_config?: Record<string, unknown> | null;
          is_active?: boolean | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          resource_type: string;
          resource_id: string;
          provider_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource_type: string;
          resource_id: string;
          provider_id: string;
        };
      };
      user_identities: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          provider_user_id: string;
          metadata: Record<string, unknown> | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider?: string;
          provider_user_id: string;
          metadata?: Record<string, unknown> | null;
        };
      };
      user_automation_providers: {
        Row: {
          id: string;
          user_id: string;
          automation_provider_id: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          automation_provider_id: string;
        };
      };
      agent_api_keys: {
        Row: {
          id: string;
          user_id: string;
          api_key_hash: string;
          api_key_prefix: string;
          is_active: boolean;
          service: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          api_key_hash: string;
          api_key_prefix: string;
          is_active?: boolean;
          service: string;
        };
      };
    };
  };
};
