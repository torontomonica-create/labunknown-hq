-- Replace 'GUEST_UUID' with the actual guest user UUID from Supabase Auth > Users
-- Run this after creating the guest user in Supabase Authentication

DO $$
DECLARE
  guest_id UUID := 'GUEST_UUID'; -- REPLACE THIS
BEGIN

-- Schedule items
INSERT INTO schedule (user_id, text, date, time) VALUES
  (guest_id, 'Design Review with Team', CURRENT_DATE, '10:00'),
  (guest_id, 'Client Presentation – E-commerce Redesign', CURRENT_DATE + 1, '14:00'),
  (guest_id, 'UX Research Session', CURRENT_DATE + 5, '11:00'),
  (guest_id, 'Portfolio Review Meeting', CURRENT_DATE + 7, '15:30'),
  (guest_id, 'Sprint Planning', CURRENT_DATE + 14, '09:00');

-- Tasks (today's work)
INSERT INTO tasks (user_id, title, project, status, date) VALUES
  (guest_id, 'Redesign landing page hero section', 'Portfolio Site', 'active', CURRENT_DATE),
  (guest_id, 'Mobile navigation menu animation', 'E-commerce Site', 'active', CURRENT_DATE),
  (guest_id, 'Update case study thumbnail images', 'Portfolio Site', 'deferred', CURRENT_DATE),
  (guest_id, 'Set up Supabase auth flow', 'HQ Dashboard', 'active', CURRENT_DATE),
  (guest_id, 'Product page layout - mobile breakpoints', 'E-commerce Site', 'active', CURRENT_DATE - 1);

-- User projects
INSERT INTO user_projects (user_id, name, description, status, url) VALUES
  (guest_id, 'Portfolio Site', 'Personal design portfolio with AI-generated case studies', 'active', 'https://labunknown.ca'),
  (guest_id, 'E-commerce Redesign', 'Full UX overhaul for an online retail client', 'active', null),
  (guest_id, 'HQ Dashboard', 'AI-assisted personal command center built with React + Supabase', 'active', null),
  (guest_id, 'Melville Walking App', 'Civic tech prototype for City Hall – walking route discovery', 'paused', null);

END $$;
