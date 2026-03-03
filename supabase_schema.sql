-- Supabase Schema for AI-Queryable Portfolio

-- 1. candidate_profile table
CREATE TABLE IF NOT EXISTS candidate_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT,
    title TEXT,
    target_titles TEXT[],
    target_company_stages TEXT[],
    elevator_pitch TEXT,
    career_narrative TEXT,
    looking_for TEXT,
    not_looking_for TEXT,
    management_style TEXT,
    work_style TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    availability_status TEXT,
    availability_date DATE,
    location TEXT,
    remote_preference TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT
);

-- 2. experiences table
CREATE TABLE IF NOT EXISTS experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidate_profile(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    company_name TEXT NOT NULL,
    title TEXT NOT NULL,
    title_progression TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    bullet_points TEXT[],
    why_joined TEXT,
    why_left TEXT,
    actual_contributions TEXT,
    proudest_achievement TEXT,
    would_do_differently TEXT,
    challenges_faced TEXT,
    lessons_learned TEXT,
    manager_would_say TEXT,
    reports_would_say TEXT,
    quantified_impact JSONB,
    display_order INTEGER DEFAULT 0
);

-- 3. skills table
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidate_profile(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    skill_name TEXT NOT NULL,
    category TEXT CHECK (category IN ('strong', 'moderate', 'gap')),
    self_rating INTEGER CHECK (self_rating >= 1 AND self_rating <= 5),
    evidence TEXT,
    honest_notes TEXT,
    years_experience NUMERIC,
    last_used DATE
);

-- 4. gaps_weaknesses table
CREATE TABLE IF NOT EXISTS gaps_weaknesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidate_profile(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    gap_type TEXT CHECK (gap_type IN ('skill', 'experience', 'environment', 'role_type')),
    description TEXT,
    why_its_a_gap TEXT,
    interest_in_learning BOOLEAN DEFAULT FALSE
);

-- 5. values_culture table
CREATE TABLE IF NOT EXISTS values_culture (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidate_profile(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    must_haves TEXT[],
    dealbreakers TEXT[],
    management_style_preferences TEXT,
    team_size_preferences TEXT,
    how_handle_conflict TEXT,
    how_handle_ambiguity TEXT,
    how_handle_failure TEXT
);

-- 6. faq_responses table
CREATE TABLE IF NOT EXISTS faq_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidate_profile(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_common_question BOOLEAN DEFAULT FALSE
);

-- 7. ai_instructions table
CREATE TABLE IF NOT EXISTS ai_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidate_profile(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    instruction_type TEXT CHECK (instruction_type IN ('honesty', 'tone', 'boundaries')),
    instruction TEXT NOT NULL,
    priority INTEGER DEFAULT 0
);

-- Enable Row Level Security (RLS)
ALTER TABLE candidate_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaps_weaknesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE values_culture ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_instructions ENABLE ROW LEVEL SECURITY;

-- Create Policies for Authenticated Admin
DROP POLICY IF EXISTS "Admin full access for candidate_profile" ON candidate_profile;
CREATE POLICY "Admin full access for candidate_profile" ON candidate_profile FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access for experiences" ON experiences;
CREATE POLICY "Admin full access for experiences" ON experiences FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access for skills" ON skills;
CREATE POLICY "Admin full access for skills" ON skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access for gaps_weaknesses" ON gaps_weaknesses;
CREATE POLICY "Admin full access for gaps_weaknesses" ON gaps_weaknesses FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access for values_culture" ON values_culture;
CREATE POLICY "Admin full access for values_culture" ON values_culture FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access for faq_responses" ON faq_responses;
CREATE POLICY "Admin full access for faq_responses" ON faq_responses FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access for ai_instructions" ON ai_instructions;
CREATE POLICY "Admin full access for ai_instructions" ON ai_instructions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create Policies for Public Read Access (so views work for anon users)
DROP POLICY IF EXISTS "Public read access for candidate_profile" ON candidate_profile;
CREATE POLICY "Public read access for candidate_profile" ON candidate_profile FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public read access for experiences" ON experiences;
CREATE POLICY "Public read access for experiences" ON experiences FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public read access for skills" ON skills;
CREATE POLICY "Public read access for skills" ON skills FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public read access for gaps_weaknesses" ON gaps_weaknesses;
CREATE POLICY "Public read access for gaps_weaknesses" ON gaps_weaknesses FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public read access for values_culture" ON values_culture;
CREATE POLICY "Public read access for values_culture" ON values_culture FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public read access for faq_responses" ON faq_responses;
CREATE POLICY "Public read access for faq_responses" ON faq_responses FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public read access for ai_instructions" ON ai_instructions;
CREATE POLICY "Public read access for ai_instructions" ON ai_instructions FOR SELECT TO anon USING (true);

-- Create Public Views for non-sensitive data
DROP VIEW IF EXISTS candidate_profile_public CASCADE;
CREATE OR REPLACE VIEW candidate_profile_public AS
SELECT 
    id,
    name, 
    title, 
    target_titles,
    target_company_stages,
    elevator_pitch, 
    career_narrative, 
    looking_for, 
    location, 
    remote_preference, 
    linkedin_url, 
    github_url, 
    twitter_url,
    updated_at
FROM candidate_profile;

DROP VIEW IF EXISTS skills_public CASCADE;
CREATE OR REPLACE VIEW skills_public AS
SELECT 
    candidate_id,
    skill_name, 
    category, 
    self_rating,
    evidence,
    years_experience
FROM skills;

DROP VIEW IF EXISTS experiences_public CASCADE;
CREATE OR REPLACE VIEW experiences_public AS
SELECT 
    candidate_id,
    company_name, 
    title, 
    title_progression, 
    start_date, 
    end_date, 
    is_current, 
    bullet_points, 
    why_joined,
    why_left,
    actual_contributions,
    proudest_achievement,
    challenges_faced,
    lessons_learned,
    display_order
FROM experiences;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for candidate_profile
DROP TRIGGER IF EXISTS update_candidate_profile_updated_at ON candidate_profile;
CREATE TRIGGER update_candidate_profile_updated_at
    BEFORE UPDATE ON candidate_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant SELECT on views to anon and authenticated
GRANT SELECT ON candidate_profile_public TO anon, authenticated;
GRANT SELECT ON skills_public TO anon, authenticated;
GRANT SELECT ON experiences_public TO anon, authenticated;
