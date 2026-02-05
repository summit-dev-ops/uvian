import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          role: 'user' | 'assistant' | 'system';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          role: 'user' | 'assistant' | 'system';
        };
      };
      conversation_members: {
        Row: {
          profile_id: string;
          conversation_id: string;
          role: any;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          conversation_id: string;
          role: any;
        };
      };
      jobs: {
        Row: {
          id: string;
          type: string;
          status: string;
          input: any;
          output: any;
          created_at: string;
          updated_at: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          type: 'human' | 'agent' | 'system' | 'admin';
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          agent_config: any;
          public_fields: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          type?: 'human' | 'agent' | 'system' | 'admin';
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          agent_config?: any;
          public_fields?: any;
          is_active?: boolean;
        };
      };
      profile_settings: {
        Row: {
          profile_id: string;
          settings: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          settings?: any;
        };
      };
    };
  };
};
