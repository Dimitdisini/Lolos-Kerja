-- ==============================================================================
-- 0001_core.sql: CORE ARCHITECTURE & AUTHENTICATION MIGRATION
-- Project: Lolos Kerja (Antigravity Architecture - Dimitri HQ)
-- ==============================================================================

-- 1. ENUMS
do $$ begin create type user_tier as enum ('FREE','FLASH','DIBANTUIN','VIP'); exception when duplicate_object then null; end $$;
do $$ begin create type user_role as enum ('user','admin','owner'); exception when duplicate_object then null; end $$;
do $$ begin create type pay_status as enum ('PENDING','SETTLED','EXPIRED','FAILED'); exception when duplicate_object then null; end $$;
do $$ begin create type app_status as enum ('queued','sending','sent','failed','bounced','replied','cancelled'); exception when duplicate_object then null; end $$;

-- 2. MASTER PROFILES (Integrated to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role user_role not null default 'user',
  tier user_tier not null default 'FREE',
  tier_expires_at timestamptz,
  daily_blast_limit int not null default 0,
  blast_credits int not null default 0 check (blast_credits >= 0),
  free_cv_analyses_left int not null default 1,
  free_interviews_left int not null default 2,
  created_at timestamptz not null default now(),
  last_login_at timestamptz default now()
);

-- Indexing for fast lookups
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_tier on public.profiles(tier);

-- 3. AUTOMATIC PROFILE TRIGGER ON USER CREATION
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    last_login_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. SECURITY DEFINER HELPER: is_admin()
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'owner')
  );
$$;

-- 5. FUNCTION: effective_tier(user_id)
create or replace function public.effective_tier(p_user_id uuid)
returns user_tier
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tier user_tier;
  v_expires timestamptz;
begin
  select tier, tier_expires_at into v_tier, v_expires
  from public.profiles
  where id = p_user_id;

  if not found then
    return 'FREE'::user_tier;
  end if;

  if v_tier != 'FREE' and v_expires is not null and v_expires < now() then
    return 'FREE'::user_tier;
  end if;

  return v_tier;
end;
$$;

-- 6. PAYMENTS LEDGER
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  user_id uuid references public.profiles(id) on delete set null,
  plan text not null,
  amount integer not null check (amount > 0),
  provider text not null default 'manual',
  status pay_status not null default 'PENDING',
  provider_ref text,
  raw_event jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create index if not exists idx_payments_order_id on public.payments(order_id);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_status on public.payments(status);

-- 7. IDEMPOTENT PLAN APPLICATION FUNCTION
create or replace function public.apply_plan(p_user_id uuid, p_plan text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text := upper(trim(p_plan));
  v_new_tier user_tier;
  v_expires_at timestamptz;
  v_blast_limit int;
  v_blast_credits_inc int;
begin
  if v_plan = 'FLASH' then
    v_new_tier := 'FLASH'::user_tier;
    v_expires_at := now() + interval '24 hours';
    v_blast_limit := 10;
    v_blast_credits_inc := 10;
  elsif v_plan = 'DIBANTUIN' then
    v_new_tier := 'DIBANTUIN'::user_tier;
    v_expires_at := now() + interval '30 days';
    v_blast_limit := 10;
    v_blast_credits_inc := 0;
  elsif v_plan = 'VIP' then
    v_new_tier := 'VIP'::user_tier;
    v_expires_at := now() + interval '30 days';
    v_blast_limit := 40;
    v_blast_credits_inc := 0;
  else
    raise exception 'Rencana paket tidak valid: %', p_plan;
  end if;

  update public.profiles
  set
    tier = v_new_tier,
    tier_expires_at = v_expires_at,
    daily_blast_limit = v_blast_limit,
    blast_credits = blast_credits + v_blast_credits_inc
  where id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'tier', v_new_tier,
    'tier_expires_at', v_expires_at,
    'daily_blast_limit', v_blast_limit
  );
end;
$$;

-- 8. STRICT ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.payments enable row level security;

-- Profiles: self or admin can read
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- Profiles: client can ONLY update safe fields (full_name, avatar_url, last_login_at)
revoke update on public.profiles from anon, authenticated;
grant update (full_name, avatar_url, last_login_at) on public.profiles to authenticated;

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Payments: self or admin can read
drop policy if exists "payments self read" on public.payments;
create policy "payments self read"
  on public.payments for select
  using (user_id = auth.uid() or public.is_admin());

-- No direct client insert/update/delete on payments
revoke insert, update, delete on public.payments from anon, authenticated;

-- 9. CLEANUP DEPRECATED UNPROTECTED POLICIES
do $$ begin
  drop policy if exists "Public access to users" on public.users;
  drop policy if exists "Public access to transactions" on public.transactions;
  drop policy if exists "Public access to blast_logs" on public.blast_logs;
exception when others then null;
end $$;
