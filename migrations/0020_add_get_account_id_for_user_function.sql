-- =============================================================================
-- Migration: 0020_add_get_account_id_for_user_function.sql
-- Purpose: Add function that accepts user_id parameter for use with admin client
-- =============================================================================

-- Function to get account_id for a specific user (used by admin client)
CREATE OR REPLACE FUNCTION public.get_account_id_for_user(target_user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT account_id
    FROM account_members
    WHERE user_id = target_user_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
