-- Migration: 0058_create_get_users_view.sql
-- Purpose: Expose auth.users columns via a public view for PostgREST access
-- Used by: users service (searchUsers, getUserById), accounts service

CREATE OR REPLACE VIEW public.get_users AS
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users;

-- Grant read access to service_role (used by admin Supabase client)
GRANT SELECT ON public.get_users TO service_role;

-- Also grant to authenticated for consistency with other views
GRANT SELECT ON public.get_users TO authenticated;
