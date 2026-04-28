-- JobLoop AI - Initial Database Schema
-- Version: 1.0
-- Date: 2026-04-22

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    
    -- Quota counters (Free Tier)
    jd_analysis_count INTEGER DEFAULT 1,
    interview_sessions_count INTEGER DEFAULT 1,
    file_parse_count INTEGER DEFAULT 3,
    pdf_export_count INTEGER DEFAULT 2,
    quota_reset_at DATE DEFAULT CURRENT_DATE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. Resumes Table
-- ============================================
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '我的简历',
    type TEXT DEFAULT 'general' CHECK (type IN ('general', 'campus', 'professional')),
    
    -- Resume content as JSONB (flexible schema)
    content JSONB NOT NULL DEFAULT '{}',
    
    -- Original input for re-generation
    original_input TEXT,
    input_mode TEXT DEFAULT 'text' CHECK (input_mode IN ('text', 'guided', 'file', 'template')),
    
    -- Version control
    version INTEGER DEFAULT 1,
    is_latest BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_is_latest ON resumes(is_latest) WHERE is_latest = TRUE;

CREATE TRIGGER update_resumes_updated_at
    BEFORE UPDATE ON resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Job Descriptions Table
-- ============================================
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT,
    job_title TEXT NOT NULL,
    source_url TEXT,
    content TEXT NOT NULL,
    parsed_content JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jds_user_id ON job_descriptions(user_id);

CREATE TRIGGER update_job_descriptions_updated_at
    BEFORE UPDATE ON job_descriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. JD Match Records Table
-- ============================================
CREATE TABLE IF NOT EXISTS jd_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    jd_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
    
    -- Match result as JSONB
    result JSONB NOT NULL DEFAULT '{}',
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jd_matches_user_id ON jd_matches(user_id);
CREATE INDEX idx_jd_matches_resume_id ON jd_matches(resume_id);

-- ============================================
-- 5. Interview Sessions Table
-- ============================================
CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    jd_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
    job_title TEXT,
    
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    current_question_index INTEGER DEFAULT 0,
    
    -- Scoring data
    scores JSONB DEFAULT '[]'::jsonb,
    radar_data JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_status ON interview_sessions(status);

CREATE TRIGGER update_interview_sessions_updated_at
    BEFORE UPDATE ON interview_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Interview Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS interview_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interview_messages_session_id ON interview_messages(session_id);
CREATE INDEX idx_interview_messages_role ON interview_messages(session_id, role);

-- ============================================
-- 7. Prompt Versions Table
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    prompt_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    
    is_active BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
    metrics JSONB DEFAULT '{}'::jsonb,
    
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_versions_name ON prompt_versions(name, version);

-- ============================================
-- 8. User Feedback Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID,
    prompt_version_id UUID REFERENCES prompt_versions(id) ON DELETE SET NULL,
    
    type TEXT NOT NULL CHECK (type IN ('thumbs_up', 'thumbs_down', 'report')),
    content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_type ON user_feedback(type);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jd_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data

-- Resumes policy
CREATE POLICY "Users can view own resumes"
    ON resumes FOR SELECT USING (
        auth.uid() = user_id OR auth.uid() IS NULL AND is_latest = TRUE
    );

CREATE POLICY "Users can insert own resumes"
    ON resumes FOR INSERT WITH CHECK (
        auth.uid() IS NULL OR auth.uid() = user_id
    );

CREATE POLICY "Users can update own resumes"
    ON resumes FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can delete own resumes"
    ON resumes FOR DELETE USING (auth.uid() = user_id);

-- Job Descriptions policies
CREATE POLICY "Users can view own jds"
    ON job_descriptions FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert jds"
    ON job_descriptions FOR INSERT WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can update own jds"
    ON job_descriptions FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- JD Matches policies
CREATE POLICY "Users can view own matches"
    ON jd_matches FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert matches"
    ON jd_matches FOR INSERT WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);

-- Interview Sessions policies
CREATE POLICY "Users can view own sessions"
    ON interview_sessions FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert sessions"
    ON interview_sessions FOR INSERT WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
    ON interview_sessions FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Interview Messages policies
CREATE POLICY "Users can view messages of own sessions"
    ON interview_messages FOR SELECT USING (
    session_id IN (
        SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
    OR session_id IN (
        SELECT id FROM interview_sessions WHERE auth.uid() IS NULL
    )
);

CREATE POLICY "Users can insert messages to own sessions"
    ON interview_messages FOR INSERT WITH CHECK (
    session_id IN (
        SELECT id FROM interview_sessions 
        WHERE user_id = auth.uid() OR auth.uid() IS NULL
    )
);

-- ============================================
-- Seed Data: Default Prompt Versions
-- ============================================
INSERT INTO prompt_versions (name, version, prompt_template, variables, is_active, rollout_percentage) VALUES
('resume-generate', 'v1.0', '{"template": "resume-generate-v1"}', '["user_input", "resume_context"]', true, 100),
('jd-match', 'v1.0', '{"template": "jd-match-v1"}', '["jd_context", "resume_context"]', true, 100),
('interview-generate', 'v1.0', '{"template": "interview-generate-v1"}', '["jd_context", "resume_context"]', true, 100)
ON CONFLICT DO NOTHING;

-- ============================================
-- End of Migration
-- ============================================
