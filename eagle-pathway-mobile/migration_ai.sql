-- PHASE 9: AI INFRASTRUCTURE

-- 1. Enhance User Profile for AI Context
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS academic_summary TEXT,
ADD COLUMN IF NOT EXISTS career_goals TEXT,
ADD COLUMN IF NOT EXISTS interested_subjects TEXT[] DEFAULT '{}';

-- 2. Store AI Feedback on Applications
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS ai_feedback JSONB DEFAULT '{
  "score": 0,
  "feedback": "No AI audit performed yet.",
  "suggestions": [],
  "last_reviewed_at": null
}';

-- 3. Migration complete
COMMENT ON COLUMN public.users.academic_summary IS 'Detailed academic background for AI scholarship matching';
COMMENT ON COLUMN public.users.career_goals IS 'Long-term career aspirations for AI scholarship matching';
