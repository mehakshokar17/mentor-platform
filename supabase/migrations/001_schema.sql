-- ============================================================
-- SSB Mentor Platform – Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── profiles ─────────────────────────────────────────────────
-- Extends Supabase auth.users with role + display name
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null check (role in ('student', 'mentor')) default 'student',
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ── mentors ──────────────────────────────────────────────────
create table public.mentors (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references public.profiles(id) on delete cascade,
  name              text not null,
  email             text not null,
  linkedin_url      text,
  current_role      text not null,
  organization      text not null,
  years_experience  int not null,
  skills            text[] not null default '{}',
  bio               text,
  photo_url         text,
  session_duration  int not null default 30,  -- minutes
  is_active         boolean default true,
  created_at        timestamptz default now()
);

alter table public.mentors enable row level security;
create policy "Anyone can view active mentors" on public.mentors for select using (is_active = true);
create policy "Mentors can update own profile" on public.mentors for update using (auth.uid() = user_id);

-- ── availability_slots ───────────────────────────────────────
create table public.availability_slots (
  id          uuid primary key default uuid_generate_v4(),
  mentor_id   uuid not null references public.mentors(id) on delete cascade,
  slot_date   date not null,
  start_time  time not null,
  end_time    time not null,
  is_booked   boolean default false,
  created_at  timestamptz default now(),
  constraint no_overlap unique (mentor_id, slot_date, start_time)
);

alter table public.availability_slots enable row level security;
create policy "Anyone can view slots" on public.availability_slots for select using (true);
create policy "Mentor owns slots" on public.availability_slots for all using (
  auth.uid() = (select user_id from public.mentors where id = mentor_id)
);

-- ── bookings ─────────────────────────────────────────────────
create table public.bookings (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid not null references public.profiles(id),
  mentor_id       uuid not null references public.mentors(id),
  slot_id         uuid not null references public.availability_slots(id),
  status          text not null check (status in ('confirmed','completed','cancelled')) default 'confirmed',
  meeting_url     text not null,
  session_date    date not null,
  session_time    time not null,
  duration_mins   int not null default 30,
  notes           text,
  created_at      timestamptz default now()
);

alter table public.bookings enable row level security;

create policy "Students see their bookings" on public.bookings for select
  using (auth.uid() = student_id);

create policy "Mentors see bookings for them" on public.bookings for select
  using (auth.uid() = (select user_id from public.mentors where id = mentor_id));

create policy "Students can create bookings" on public.bookings for insert
  with check (auth.uid() = student_id);

create policy "Students/mentors can update their bookings" on public.bookings for update
  using (
    auth.uid() = student_id or
    auth.uid() = (select user_id from public.mentors where id = mentor_id)
  );

-- ── session_feedback ─────────────────────────────────────────
create table public.session_feedback (
  id            uuid primary key default uuid_generate_v4(),
  booking_id    uuid not null references public.bookings(id) on delete cascade,
  submitted_by  text not null check (submitted_by in ('student','mentor')),
  rating        int check (rating between 1 and 5),
  comments      text,
  submitted_at  timestamptz default now(),
  unique(booking_id, submitted_by)
);

alter table public.session_feedback enable row level security;

create policy "Feedback visible to session participants" on public.session_feedback for select
  using (
    auth.uid() = (select student_id from public.bookings where id = booking_id)
    or
    auth.uid() = (select m.user_id from public.bookings b join public.mentors m on m.id = b.mentor_id where b.id = booking_id)
  );

create policy "Participants can submit feedback" on public.session_feedback for insert
  with check (
    auth.uid() = (select student_id from public.bookings where id = booking_id)
    or
    auth.uid() = (select m.user_id from public.bookings b join public.mentors m on m.id = b.mentor_id where b.id = booking_id)
  );

-- ── trigger: auto-create profile on signup ───────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── trigger: mark slot booked when booking created ───────────
create or replace function public.handle_booking_created()
returns trigger language plpgsql security definer as $$
begin
  update public.availability_slots set is_booked = true where id = new.slot_id;
  return new;
end;
$$;

create trigger on_booking_created
  after insert on public.bookings
  for each row execute procedure public.handle_booking_created();

-- ── trigger: free slot when booking cancelled ────────────────
create or replace function public.handle_booking_cancelled()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'cancelled' and old.status != 'cancelled' then
    update public.availability_slots set is_booked = false where id = new.slot_id;
  end if;
  return new;
end;
$$;

create trigger on_booking_cancelled
  after update on public.bookings
  for each row execute procedure public.handle_booking_cancelled();
