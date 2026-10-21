-- =========================================================================
-- 0004_wiring.sql: Wiring enhancements, System Flags, and Rate Limits
-- Aligned with ANTIGRAVITY-BACKEND-EXECUTION.md 3.2
-- =========================================================================

-- 1. JOBS: email source, kind, and role keys (B11)
alter table public.jobs
  add column if not exists email_kind text check (email_kind in ('recruiting','general','job_posting')),
  add column if not exists email_source_url text,
  add column if not exists email_checked_at timestamptz,
  add column if not exists company_website text,
  add column if not exists role_keys text[] default '{}';

create unique index if not exists uq_jobs_company_email 
  on public.jobs(lower(company), lower(apply_email)) 
  where apply_email is not null;

-- 2. APPLICATIONS: attachment path and audit trail
alter table public.applications
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists unsubscribe_token uuid default gen_random_uuid(),
  add column if not exists send_attempts int not null default 0,
  add column if not exists send_mode text check (send_mode in ('live','dry_run','capture')),
  add column if not exists replied_at timestamptz;

-- 3. SYSTEM FLAGS: global sending controls & auto-pause
create table if not exists public.system_flags (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into public.system_flags(key, value) values
  ('blast_paused', '{"paused":false}'),
  ('global_daily_cap', '{"cap":150}'),
  ('recipient_allowlist', '{"enabled":true,"emails":[]}')
on conflict (key) do nothing;

-- 4. REAL RATE LIMITS (replaces in-memory Map - B4)
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits int not null default 0
);

-- 5. WIB DAY START HELPER FUNCTION (B8)
create or replace function public.wib_day_start() returns timestamptz language sql stable as $$
  select (date_trunc('day', now() at time zone 'Asia/Jakarta')) at time zone 'Asia/Jakarta';
$$;

-- 6. STRICT RLS FOR NEW TABLES
alter table public.system_flags enable row level security;
alter table public.rate_limits enable row level security;

-- Client cannot query or mutate system_flags/rate_limits directly (Service Role only)
drop policy if exists "system_flags service role only" on public.system_flags;
create policy "system_flags service role only" on public.system_flags for all using (false);

drop policy if exists "rate_limits service role only" on public.rate_limits;
create policy "rate_limits service role only" on public.rate_limits for all using (false);

-- 7. CLEANUP OLD TABLES (Legacy)
drop table if exists public.users cascade;
drop table if exists public.transactions cascade;
drop table if exists public.blast_logs cascade;
