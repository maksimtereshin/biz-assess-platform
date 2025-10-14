-- Migration: Add indexes for optimized report generation queries
-- Date: 2025-10-13
-- Task Group 3: Analytics and Data Aggregation - Task 3.2

-- Index for user_telegram_id lookups (used frequently in getUserSessions, getUserCompletedSessionsCount)
CREATE INDEX IF NOT EXISTS idx_survey_sessions_user_telegram_id
ON survey_sessions(user_telegram_id);

-- Index for completed_at filtering (used in completed session queries)
-- Note: completed_at will be added in a future migration if it doesn't exist
-- For now, we use status for completed sessions
CREATE INDEX IF NOT EXISTS idx_survey_sessions_status
ON survey_sessions(status);

-- Composite index for user + completed sessions queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_survey_sessions_user_status
ON survey_sessions(user_telegram_id, status);

-- Index for answers by session_id (optimize relation loading)
CREATE INDEX IF NOT EXISTS idx_answers_session_id
ON answers(session_id);

-- Index for answers composite lookup (session + question optimization)
-- Primary key already covers this, but explicit index for clarity
-- CREATE INDEX IF NOT EXISTS idx_answers_session_question
-- ON answers(session_id, question_id);

-- Index for created_at for ordering sessions
CREATE INDEX IF NOT EXISTS idx_survey_sessions_created_at
ON survey_sessions(created_at DESC);

-- Composite index for user sessions ordered by creation
CREATE INDEX IF NOT EXISTS idx_survey_sessions_user_created
ON survey_sessions(user_telegram_id, created_at DESC);

-- Add comments to document the indexes
COMMENT ON INDEX idx_survey_sessions_user_telegram_id IS 'Optimizes user session lookups for report generation';
COMMENT ON INDEX idx_survey_sessions_status IS 'Optimizes filtering by session completion status';
COMMENT ON INDEX idx_survey_sessions_user_status IS 'Optimizes combined user + status queries';
COMMENT ON INDEX idx_answers_session_id IS 'Optimizes answer loading for report analytics';
COMMENT ON INDEX idx_survey_sessions_created_at IS 'Optimizes session ordering by date';
COMMENT ON INDEX idx_survey_sessions_user_created IS 'Optimizes user session history queries';

-- Analyze tables to update statistics for query planner
ANALYZE survey_sessions;
ANALYZE answers;
