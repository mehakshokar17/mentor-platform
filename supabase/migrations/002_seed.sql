-- ============================================================
-- Seed: Create test accounts + mentor profile for Mehak Shokar
-- ============================================================
-- STEP 1: Go to Supabase Dashboard → Authentication → Users
--   Click "Add user" and create:
--     Email: mehakshokar17@gmail.com  | Password: Mentor@2024
--     Email: shanmuga@ssb.scaler.com  | Password: Student@2024
--
-- STEP 2: Copy the UUIDs of those two users from the Users table.
--   Replace the UUIDs below accordingly, then run this SQL.
-- ============================================================

-- After creating users in Auth dashboard, run:
-- (Replace the UUIDs with real ones from your Auth > Users table)

-- Update Mehak's profile to mentor role
update public.profiles
set role = 'mentor', full_name = 'Mehak Shokar'
where email = 'mehakshokar17@gmail.com';

-- Update test student profile
update public.profiles
set role = 'student', full_name = 'Shanmuga S'
where email = 'shanmuga@ssb.scaler.com';

-- Insert Mehak's mentor profile (replace user_id with Mehak's actual UUID)
insert into public.mentors (
  user_id,
  name,
  email,
  linkedin_url,
  current_role,
  organization,
  years_experience,
  skills,
  bio,
  photo_url,
  session_duration
)
select
  p.id,
  'Mehak Shokar',
  'mehakshokar17@gmail.com',
  'https://www.linkedin.com/in/mehakshokar',
  'Product Manager',
  'Scaler School of Business',
  3,
  ARRAY['Product Management', 'Business Strategy', 'Data Analytics', 'Growth', 'User Research', 'Go-to-Market', 'Agile'],
  'Hi! I am Mehak Shokar, a Product Manager passionate about building user-centric products. I specialize in product strategy, go-to-market execution, and data-driven decision making. I have helped launch multiple 0→1 products and love mentoring aspiring PMs and MBAs on breaking into product roles.',
  'https://ui-avatars.com/api/?name=Mehak+Shokar&background=4f46e5&color=fff&size=200',
  45
from public.profiles p
where p.email = 'mehakshokar17@gmail.com'
limit 1;

-- Seed availability slots for Mehak (next 7 days)
-- These will be replaced by actual slots added from the mentor dashboard
insert into public.availability_slots (mentor_id, slot_date, start_time, end_time)
select
  m.id,
  current_date + s.day_offset,
  s.start_t::time,
  s.end_t::time
from public.mentors m
cross join (
  values
    (1, '10:00', '10:45'),
    (1, '11:00', '11:45'),
    (1, '14:00', '14:45'),
    (2, '10:00', '10:45'),
    (2, '15:00', '15:45'),
    (3, '09:00', '09:45'),
    (3, '16:00', '16:45'),
    (4, '11:00', '11:45'),
    (4, '14:00', '14:45'),
    (5, '10:00', '10:45'),
    (5, '13:00', '13:45'),
    (6, '09:00', '09:45'),
    (6, '14:00', '14:45'),
    (7, '11:00', '11:45')
) as s(day_offset, start_t, end_t)
where m.email = 'mehakshokar17@gmail.com';
