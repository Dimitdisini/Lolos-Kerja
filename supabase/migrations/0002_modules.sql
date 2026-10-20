-- ==============================================================================
-- 0002_modules.sql: PRODUCT MODULES, JOBS, INTERVIEWS & BLAST ENGINE
-- Project: Lolos Kerja (Antigravity Architecture - Dimitri HQ)
-- ==============================================================================

-- 1. CV DOCUMENTS & ATS REPOSITORIES
create table if not exists public.cv_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'CV Utama',
  source_file_path text,           -- Supabase Storage path (private cv-files bucket)
  raw_text text,
  master_profile jsonb,            -- Canonical candidate profile JSON
  ats_score int check (ats_score >= 0 and ats_score <= 100),
  ats_report jsonb,
  content_hash text,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cv_documents_user_id on public.cv_documents(user_id);
create index if not exists idx_cv_documents_content_hash on public.cv_documents(content_hash);

-- 2. CV VARIANTS (Role-targeted adapted versions)
create table if not exists public.cv_variants (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.cv_documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_role text not null,
  content jsonb not null,          -- Star-rewritten verified variant
  pdf_path text,                   -- Supabase Storage (private cv-pdf bucket)
  created_at timestamptz not null default now()
);

create index if not exists idx_cv_variants_user_id on public.cv_variants(user_id);
create index if not exists idx_cv_variants_cv_id on public.cv_variants(cv_id);

-- 3. CURATED JOB REPOSITORY
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'manual',
  external_id text,
  hash text unique not null,       -- sha1(lower(title|company|location))
  title text not null,
  company text not null,
  location text,
  level text default 'Fresh Graduate',
  category text,
  majors text[] default '{}',
  skills text[] default '{}',
  description text,
  apply_email text,
  apply_url text,
  apply_via text check (apply_via in ('email','portal')),
  email_valid boolean not null default false,
  posted_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 days'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_jobs_category on public.jobs(category);
create index if not exists idx_jobs_apply_via on public.jobs(apply_via);
create index if not exists idx_jobs_is_active on public.jobs(is_active);
create index if not exists idx_jobs_hash on public.jobs(hash);

-- 4. PROFILE-JOB COMPATIBILITY MATCHES
create table if not exists public.job_matches (
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  score int not null check (score >= 0 and score <= 100),
  reasons jsonb,
  skill_gap jsonb,
  computed_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create index if not exists idx_job_matches_user_score on public.job_matches(user_id, score desc);

-- 5. APPLICATION SUBMISSIONS & BLAST DISPATCH
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  company text not null,
  position text not null,
  to_email text not null,
  subject text,
  body text,
  cv_variant_id uuid references public.cv_variants(id) on delete set null,
  status app_status not null default 'queued',
  scheduled_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  error text,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create index if not exists idx_applications_user_status on public.applications(user_id, status);
create index if not exists idx_applications_tick_queue on public.applications(approved, status, scheduled_at)
  where approved = true and status = 'queued';

-- 6. EMAIL AUDIT TRAIL & DELIVERY EVENTS
create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  type text not null, -- queued, sending, delivered, opened, bounced, complained, replied
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_events_application_id on public.email_events(application_id);

-- 7. REPUTATION PROTECTION: EMAIL BLOCKLIST
create table if not exists public.email_blocklist (
  email text primary key,
  reason text,
  created_at timestamptz not null default now()
);

-- 8. INTERVIEW SIMULATOR SESSIONS
create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  lang text not null default 'id',
  items jsonb not null default '[]'::jsonb, -- [{question, transcript, duration_s, scores, feedback}]
  summary jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_interview_sessions_user_id on public.interview_sessions(user_id);

-- 9. USER SCRAPE & POSITION REQUESTS
create table if not exists public.scrape_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  role text not null,
  location text,
  notes text,
  status text not null default 'ANTREAN',
  created_at timestamptz not null default now()
);

create index if not exists idx_scrape_requests_status on public.scrape_requests(status);

-- ==============================================================================
-- 10. ATOMIC QUOTA CONSUMPTION FUNCTIONS (SECURITY DEFINER)
-- ==============================================================================

-- 10.1 consume_blast_credit(user_id)
create or replace function public.consume_blast_credit(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits int;
begin
  select blast_credits into v_credits
  from public.profiles
  where id = p_user_id
  for update;

  if not found or v_credits <= 0 then
    return false;
  end if;

  update public.profiles
  set blast_credits = blast_credits - 1
  where id = p_user_id;

  return true;
end;
$$;

-- 10.2 consume_daily_slot(user_id)
-- Checks whether user has exceeded daily limit calculated in Asia/Jakarta timezone
create or replace function public.consume_daily_slot(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier user_tier;
  v_daily_limit int;
  v_sent_today int;
  v_now_wib timestamptz := now() at time zone 'Asia/Jakarta';
  v_start_of_day_wib timestamptz := date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
begin
  -- Resolve effective tier and daily limit
  select public.effective_tier(id), daily_blast_limit
  into v_tier, v_daily_limit
  from public.profiles
  where id = p_user_id;

  if not found or v_tier = 'FREE'::user_tier or v_daily_limit <= 0 then
    return false;
  end if;

  -- Count emails sent by user today (WIB)
  select count(*) into v_sent_today
  from public.applications
  where user_id = p_user_id
    and status = 'sent'
    and sent_at >= v_start_of_day_wib;

  if v_sent_today >= v_daily_limit then
    return false;
  end if;

  return true;
end;
$$;

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.cv_documents enable row level security;
alter table public.cv_variants enable row level security;
alter table public.jobs enable row level security;
alter table public.job_matches enable row level security;
alter table public.applications enable row level security;
alter table public.email_events enable row level security;
alter table public.email_blocklist enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.scrape_requests enable row level security;

-- CV Documents: Owner and admin
drop policy if exists "cv_docs owner select" on public.cv_documents;
create policy "cv_docs owner select" on public.cv_documents
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "cv_docs owner insert" on public.cv_documents;
create policy "cv_docs owner insert" on public.cv_documents
  for insert with check (user_id = auth.uid());

drop policy if exists "cv_docs owner update" on public.cv_documents;
create policy "cv_docs owner update" on public.cv_documents
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "cv_docs owner delete" on public.cv_documents;
create policy "cv_docs owner delete" on public.cv_documents
  for delete using (user_id = auth.uid());

-- CV Variants: Owner and admin
drop policy if exists "cv_variants owner select" on public.cv_variants;
create policy "cv_variants owner select" on public.cv_variants
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "cv_variants owner modify" on public.cv_variants;
create policy "cv_variants owner modify" on public.cv_variants
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Jobs: Public read for active and unexpired jobs, modifications by admin/service role only
drop policy if exists "jobs public read" on public.jobs;
create policy "jobs public read" on public.jobs
  for select using (is_active = true and expires_at > now());

drop policy if exists "jobs admin modify" on public.jobs;
create policy "jobs admin modify" on public.jobs
  for all using (public.is_admin());

-- Job Matches: Owner only
drop policy if exists "job_matches owner read" on public.job_matches;
create policy "job_matches owner read" on public.job_matches
  for select using (user_id = auth.uid() or public.is_admin());

-- Applications: Owner only
drop policy if exists "applications owner read" on public.applications;
create policy "applications owner read" on public.applications
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "applications owner insert" on public.applications;
create policy "applications owner insert" on public.applications
  for insert with check (user_id = auth.uid());

drop policy if exists "applications owner update" on public.applications;
create policy "applications owner update" on public.applications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Email Events: Owner can read their application events
drop policy if exists "email_events read" on public.email_events;
create policy "email_events read" on public.email_events
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = email_events.application_id
        and (a.user_id = auth.uid() or public.is_admin())
    )
  );

-- Email Blocklist: Admin read only
drop policy if exists "email_blocklist admin read" on public.email_blocklist;
create policy "email_blocklist admin read" on public.email_blocklist
  for select using (public.is_admin());

-- Interview Sessions: Owner only
drop policy if exists "interview_sessions owner all" on public.interview_sessions;
create policy "interview_sessions owner all" on public.interview_sessions
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Scrape Requests: Owner can view/create own requests, Admin can view all
drop policy if exists "scrape_requests owner select" on public.scrape_requests;
create policy "scrape_requests owner select" on public.scrape_requests
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "scrape_requests owner insert" on public.scrape_requests;
create policy "scrape_requests owner insert" on public.scrape_requests
  for insert with check (user_id = auth.uid());
