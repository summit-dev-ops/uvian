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
      secrets: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          value_type: 'text' | 'json';
          encrypted_value: string;
          metadata: unknown;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          value_type: 'text' | 'json';
          encrypted_value: string;
          metadata?: unknown;
          is_active?: boolean;
        };
      };
    };
  };
  core_automation: {
    Tables: {
      jobs: {
        Row: {
          id: string;
          type: string;
          status: string;
          input: unknown;
          output: unknown;
          error_message: string | null;
          thread_id: string | null;
          agent_id: string | null;
          input_type: string;
          created_at: string;
          updated_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          type: string;
          status?: string;
          input?: unknown;
          output?: unknown;
          agent_id?: string | null;
          input_type?: string;
          thread_id?: string | null;
        };
      };
      scheduled_tasks: {
        Row: {
          id: string;
          user_id: string;
          agent_id: string;
          description: string;
          schedule_type: 'one_time' | 'recurring';
          scheduled_for: string;
          cron_expression: string | null;
          status: 'pending' | 'queued' | 'completed' | 'cancelled' | 'failed';
          retry_count: number;
          max_retries: number;
          job_id: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_id: string;
          description: string;
          schedule_type: 'one_time' | 'recurring';
          scheduled_for: string;
          cron_expression?: string | null;
          status?: 'pending' | 'queued' | 'completed' | 'cancelled' | 'failed';
          retry_count?: number;
          max_retries?: number;
          job_id?: string | null;
          last_error?: string | null;
        };
      };
    };
  };
};
