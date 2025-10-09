-- Migration: Add requires_payment column to survey_sessions table
-- Date: 2025-10-09
-- Task Group 6: Free/Paid Survey Logic Updates

-- Add requires_payment column with default false
ALTER TABLE survey_sessions
ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN NOT NULL DEFAULT false;

-- Add comment to document the column
COMMENT ON COLUMN survey_sessions.requires_payment IS 'Indicates if this survey session requires payment. First survey (any type) is free, all subsequent surveys require payment.';

-- Update existing completed sessions to reflect historical payment status
-- All existing sessions will be marked as requires_payment = false (they were free/legacy)
-- This maintains backward compatibility
UPDATE survey_sessions
SET requires_payment = false
WHERE requires_payment IS NULL;
