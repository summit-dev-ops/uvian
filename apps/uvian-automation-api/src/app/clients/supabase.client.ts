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
    Views: {
      get_jobs_for_current_user: {
        Row: Record<string, unknown>;
      };
      get_job_details: {
        Row: Record<string, unknown>;
      };
      get_tickets_for_current_user: {
        Row: Record<string, unknown>;
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
          input: any;
          output: any;
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
          input?: any;
          output?: any;
          agent_id?: string | null;
          input_type?: string;
          thread_id?: string | null;
        };
      };
      tickets: {
        Row: {
          id: string;
          thread_id: string | null;
          requester_job_id: string | null;
          status: string;
          priority: string;
          title: string;
          description: string | null;
          resolution_payload: any | null;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          thread_id?: string | null;
          requester_job_id?: string | null;
          status?: string;
          priority?: string;
          title: string;
          description?: string | null;
          resolution_payload?: any | null;
          assigned_to?: string | null;
        };
      };
      secrets: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          secret_type: string;
          encrypted_value: string;
          metadata: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          secret_type: string;
          encrypted_value: string;
          metadata?: any;
          is_active?: boolean;
        };
      };
      process_threads: {
        Row: {
          id: string;
          user_id: string;
          current_status: string;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_status?: string;
          metadata?: any;
        };
      };
      agent_checkpoints: {
        Row: {
          id: string;
          thread_id: string;
          checkpoint_id: string;
          checkpoint_data: any;
          metadata: any;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          checkpoint_id: string;
          checkpoint_data: any;
          metadata?: any;
          parent_id?: string | null;
        };
      };
      llms: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          type: string;
          provider: string;
          model_name: string;
          base_url: string | null;
          temperature: number;
          max_tokens: number;
          config: any;
          is_active: boolean;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          type: string;
          provider: string;
          model_name: string;
          base_url?: string | null;
          temperature?: number;
          max_tokens?: number;
          config?: any;
          is_active?: boolean;
          is_default?: boolean;
        };
      };
      mcps: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          type: string;
          url: string | null;
          auth_method: string;
          config: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          type: string;
          url?: string | null;
          auth_method: string;
          config?: any;
          is_active?: boolean;
        };
      };
      agents: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          system_prompt: string | null;
          max_conversation_history: number;
          skills: any;
          config: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          system_prompt?: string | null;
          max_conversation_history?: number;
          skills?: any;
          config?: any;
          is_active?: boolean;
        };
      };
      agent_llms: {
        Row: {
          agent_id: string;
          llm_id: string;
          secret_id: string | null;
          config: any;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          agent_id: string;
          llm_id: string;
          secret_id?: string | null;
          config?: any;
          is_default?: boolean;
        };
      };
      agent_mcps: {
        Row: {
          agent_id: string;
          mcp_id: string;
          secret_id: string | null;
          config: any;
          created_at: string;
        };
        Insert: {
          agent_id: string;
          mcp_id: string;
          secret_id?: string | null;
          config?: any;
        };
      };
    };
  };
};
