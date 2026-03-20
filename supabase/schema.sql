-- =============================================
-- Labunknown HQ - Supabase Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. PROFILES (owner vs guest)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'User',
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'guest')),
  city TEXT NOT NULL DEFAULT 'Toronto',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SCHEDULE
CREATE TABLE IF NOT EXISTS schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TASKS (today's work / project tasks)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  project TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'deferred')),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USER PROJECTS
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  url TEXT,
  tech_stack TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

-- Profiles: own row only
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Schedule: own rows only
CREATE POLICY "Users can manage own schedule"
  ON schedule FOR ALL USING (auth.uid() = user_id);

-- Tasks: own rows only
CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL USING (auth.uid() = user_id);

-- User Projects: own rows only
CREATE POLICY "Users can manage own projects"
  ON user_projects FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- DEMO DATA FOR GUEST ACCOUNT
-- (Run AFTER creating the guest user in Auth)
-- Replace GUEST_USER_ID with actual UUID from Auth
-- =============================================

-- INSERT INTO schedule (user_id, text, date, time) VALUES
--   ('GUEST_USER_ID', 'Design Review with Team', '2026-03-20', '10:00'),
--   ('GUEST_USER_ID', 'Client Presentation', '2026-03-21', '14:00'),
--   ('GUEST_USER_ID', 'UX Research Session', '2026-03-25', '11:00');

-- INSERT INTO tasks (user_id, title, project, status) VALUES
--   ('GUEST_USER_ID', 'Redesign landing page hero section', 'Portfolio Site', 'active'),
--   ('GUEST_USER_ID', 'Mobile navigation menu', 'E-commerce Site', 'active'),
--   ('GUEST_USER_ID', 'Update case study thumbnails', 'Portfolio Site', 'deferred');

-- INSERT INTO user_projects (user_id, name, description, status, url) VALUES
--   ('GUEST_USER_ID', 'Portfolio Site', 'Personal design portfolio with case studies', 'active', 'https://example.com'),
--   ('GUEST_USER_ID', 'E-commerce Redesign', 'Full UX overhaul for online store', 'active', null),
--   ('GUEST_USER_ID', 'Mobile App UI', 'iOS app design for local transit', 'paused', null);
