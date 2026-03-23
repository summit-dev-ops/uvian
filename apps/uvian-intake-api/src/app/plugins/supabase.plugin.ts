import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    supabase: SupabaseClient;
  }
}

async function supabasePlugin(fastify: FastifyInstance) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  fastify.decorate('supabase', supabase);
}

export default fp(supabasePlugin);
