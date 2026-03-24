-- Migration: 005_add_requires_auth_and_submitted_by.sql
-- Add requires_auth column to intakes and submitted_by to submissions

-- Add requires_auth to intakes table
ALTER TABLE core_intake.intakes 
ADD COLUMN requires_auth boolean DEFAULT false;

-- Add submitted_by to submissions table
ALTER TABLE core_intake.submissions 
ADD COLUMN submitted_by uuid REFERENCES auth.users(id);

-- Indexes for new columns
CREATE INDEX idx_intakes_requires_auth ON core_intake.intakes(requires_auth);
CREATE INDEX idx_submissions_submitted_by ON core_intake.submissions(submitted_by);
