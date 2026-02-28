-- =============================================================================
-- PHASE 2: CLEAR DATABASE
-- Migration: 0001_clear_database.sql
-- Purpose: Drop all existing tables to prepare for new schema
-- =============================================================================

-- Drop all tables in correct order (respecting FK dependencies)

DROP TABLE IF EXISTS feed_items CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS agent_checkpoints CASCADE;
DROP TABLE IF EXISTS process_threads CASCADE;
DROP TABLE IF EXISTS resource_scopes CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS conversation_members CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS space_members CASCADE;
DROP TABLE IF EXISTS spaces CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS profile_type CASCADE;

-- Drop triggers and functions related to old schema
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_settings ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user;
DROP FUNCTION IF EXISTS handle_settings_creation;
