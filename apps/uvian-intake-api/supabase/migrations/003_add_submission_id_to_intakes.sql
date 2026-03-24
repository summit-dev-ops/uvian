-- Migration: 003_add_submission_id_to_intakes.sql
-- Add submission_id column to intakes table for easier lookup

ALTER TABLE core_intake.intakes 
ADD COLUMN submission_id TEXT UNIQUE;

-- Index for looking up submissions by intake
CREATE INDEX idx_intakes_submission_id ON core_intake.intakes(submission_id);
