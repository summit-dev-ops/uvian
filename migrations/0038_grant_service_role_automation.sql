-- Grant service_role access to the core_automation schema
-- service_role is the role used by SUPABASE_SECRET_KEY across automation apps

GRANT USAGE ON SCHEMA core_automation TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA core_automation TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA core_automation TO service_role;
