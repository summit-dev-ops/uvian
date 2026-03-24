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
    };
  };
  core_hub: {
    Tables: {
      settings: {
        Row: {
          user_id: string;
          settings: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          settings?: unknown;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          title: string | null;
          space_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          space_id?: string | null;
          created_by?: string | null;
        };
      };
      conversation_members: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: unknown;
          joined_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role?: unknown;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string | null;
          content: string | null;
          role: string;
          metadata: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id?: string | null;
          content?: string | null;
          role?: string;
          metadata?: unknown;
        };
      };
      spaces: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          avatar_url: string | null;
          created_by: string | null;
          settings: unknown;
          is_private: boolean;
          created_at: string;
          updated_at: string;
          cover_url: string | null;
          cover_image_url: string | null;
          main_image_url: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          avatar_url?: string | null;
          created_by?: string | null;
          settings?: unknown;
          is_private?: boolean;
          cover_url?: string | null;
          cover_image_url?: string | null;
          main_image_url?: string | null;
        };
      };
      space_members: {
        Row: {
          id: string;
          space_id: string;
          user_id: string;
          role: unknown;
          joined_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          user_id: string;
          role?: unknown;
        };
      };
      posts: {
        Row: {
          id: string;
          space_id: string;
          author_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          author_id?: string | null;
        };
      };
      post_contents: {
        Row: {
          id: string;
          post_id: string;
          content_type: string;
          note_id: string | null;
          asset_id: string | null;
          url: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          content_type: string;
          note_id?: string | null;
          asset_id?: string | null;
          url?: string | null;
          position?: number;
        };
      };
      notes: {
        Row: {
          id: string;
          space_id: string;
          owner_user_id: string | null;
          title: string;
          body: string | null;
          attachments: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          owner_user_id?: string | null;
          title: string;
          body?: string | null;
          attachments?: unknown;
        };
      };
      assets: {
        Row: {
          id: string;
          account_id: string;
          uploader_user_id: string | null;
          type: string;
          url: string;
          filename: string | null;
          mime_type: string | null;
          file_size_bytes: number | null;
          storage_type: string;
          metadata: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          uploader_user_id?: string | null;
          type: string;
          url: string;
          filename?: string | null;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          storage_type?: string;
          metadata?: unknown;
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
          auth_config: unknown;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          owner_user_id: string;
          name: string;
          type?: string;
          url?: string | null;
          auth_method?: string | null;
          auth_config?: unknown;
          is_active?: boolean;
        };
      };
      agent_configs: {
        Row: {
          id: string;
          agent_user_id: string;
          account_id: string;
          automation_provider_id: string;
          name: string;
          description: string | null;
          subscribed_events: unknown;
          config: unknown;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_user_id: string;
          account_id: string;
          automation_provider_id: string;
          name: string;
          description?: string | null;
          subscribed_events?: unknown;
          config?: unknown;
          is_active?: boolean;
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
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          resource_type: string;
          resource_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource_type: string;
          resource_id: string;
        };
      };
    };
  };
};
