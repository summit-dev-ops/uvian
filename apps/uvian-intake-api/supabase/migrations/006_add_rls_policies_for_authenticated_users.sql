-- Migration: 006_add_rls_policies_for_authenticated_users.sql
-- Add RLS policies for authenticated users on core_intake schema

-- Policy: Users can read their own intakes (created_by is text, cast to uuid for comparison)
CREATE POLICY "Users can read own intakes"
ON core_intake.intakes FOR SELECT
USING (created_by::uuid = auth.uid());

-- Policy: Users can create intakes (created_by matches auth.uid())
CREATE POLICY "Users can create intakes"
ON core_intake.intakes FOR INSERT
WITH CHECK (created_by::uuid = auth.uid());

-- Policy: Users can update their own intakes
CREATE POLICY "Users can update own intakes"
ON core_intake.intakes FOR UPDATE
USING (created_by::uuid = auth.uid());

-- Policy: Users can read submissions for intakes they created
CREATE POLICY "Users can read own submissions"
ON core_intake.submissions FOR SELECT
USING (
    intake_id IN (
        SELECT id FROM core_intake.intakes 
        WHERE created_by::uuid = auth.uid()
    )
);

-- Policy: Users can insert submissions for valid intakes
CREATE POLICY "Users can create submissions"
ON core_intake.submissions FOR INSERT
WITH CHECK (
    intake_id IN (
        SELECT id FROM core_intake.intakes 
        WHERE status = 'pending'
    )
);

-- Grant schema usage to authenticated users
GRANT USAGE ON SCHEMA core_intake TO authenticated;
GRANT SELECT, INSERT ON core_intake.intakes TO authenticated;
GRANT SELECT, INSERT ON core_intake.submissions TO authenticated;
