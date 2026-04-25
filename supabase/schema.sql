-- =====================================================================
-- Tango Guardian — Supabase schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query
-- =====================================================================

-- 1. Recipients (people you can transfer to)
create table if not exists public.recipients (
  id            text primary key,
  name          text not null,
  phone         text,
  bank          text,
  avatar_color  text,
  created_at    timestamptz default now()
);

-- 2. Transactions (transfer history used for anomaly detection)
create table if not exists public.transactions (
  id            text primary key,
  recipient_id  text references public.recipients(id) on delete cascade,
  amount        numeric not null,
  note          text,
  created_at    timestamptz default now()
);

-- 3. Action log (replaces in-memory actionLog in Zustand)
create table if not exists public.action_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  type        text not null,
  summary     text not null,
  details     jsonb,
  created_at  timestamptz default now()
);
create index if not exists action_log_user_idx on public.action_log(user_id, created_at desc);

-- 4. Guardian audit (security events: approvals, blocks, freezes, scams)
create table if not exists public.guardian_audit (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  kind        text not null,
  summary     text not null,
  details     jsonb,
  created_at  timestamptz default now()
);
create index if not exists guardian_audit_user_idx on public.guardian_audit(user_id, created_at desc);

-- 5. Watch ↔ phone remote command relay (alternative to in-memory SSE)
create table if not exists public.remote_events (
  id          uuid primary key default gen_random_uuid(),
  room        text not null,
  cmd         text not null,
  payload     jsonb,
  created_at  timestamptz default now()
);
create index if not exists remote_events_room_idx on public.remote_events(room, created_at desc);

-- =====================================================================
-- Seed data (recipients + prior transactions for anomaly detection)
-- =====================================================================
insert into public.recipients (id, name, phone, avatar_color) values
  ('r1', 'Rizwan Hakeem',     '+60 10-554 3459', '#3b82f6'),
  ('r2', 'Ridzuan Hakim',     '+60 11-821 9981', '#8b5cf6'),
  ('r3', 'Muhammad Rizwan',   '+60 12-777 1902', '#10b981'),
  ('r4', 'Syed Mohamad Faiz', '+60 13-410 2233', '#f59e0b'),
  ('r5', 'Nurfazlin',         '+60 11-612 1904', '#ec4899'),
  ('r6', 'Rahman Mizanur',    '+60 17-233 8812', '#06b6d4')
on conflict (id) do nothing;

insert into public.transactions (id, recipient_id, amount, note, created_at) values
  ('t1', 'r1',  50, 'Dinner',     '2026-04-10T12:00:00Z'),
  ('t2', 'r1',  50, 'Lunch',      '2026-04-15T12:00:00Z'),
  ('t3', 'r1',  50, 'Grab share', '2026-04-20T12:00:00Z'),
  ('t4', 'r4',  20, 'Kopi',       '2026-04-18T09:00:00Z'),
  ('t5', 'r5', 150, 'Gift',       '2026-04-12T18:00:00Z')
on conflict (id) do nothing;

-- =====================================================================
-- Row Level Security
-- For the hackathon demo we keep RLS disabled on these tables so the
-- anon key can read/write directly. In production, enable RLS and add
-- policies keyed on auth.uid().
-- =====================================================================
alter table public.recipients     disable row level security;
alter table public.transactions   disable row level security;
alter table public.action_log     disable row level security;
alter table public.guardian_audit disable row level security;
alter table public.remote_events  disable row level security;

-- =====================================================================
-- Realtime: enable change broadcasts on the tables the watch listens to
-- =====================================================================
alter publication supabase_realtime add table public.remote_events;
alter publication supabase_realtime add table public.guardian_audit;
