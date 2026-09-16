-- ============================================================
-- iChat Beta Signup — Supabase setup (fresh install)
-- Run this once in the Supabase dashboard → SQL Editor.
-- 20-seat cap, Plus-plan-only beta. The API routes use the
-- service-role key, so RLS is enabled with no public policies.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Table 1: confirmed beta signups (one row per reserved seat)
-- ------------------------------------------------------------
create table if not exists public.ichat_beta_signups (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  full_name          text not null,
  company_name       text not null,
  email              text not null,           -- account/contact email
  phone              text not null,
  main_email         text not null,           -- the ONE email iChat sends/receives from
  email_platform     text not null,           -- gmail | yahoo | outlook | icloud | custom-domain | other
  uses_custom_domain boolean not null default false,
  domain             text,                    -- e.g. acme.com (custom-domain only)
  domain_provider    text,                    -- e.g. GoDaddy, Cloudflare (custom-domain only)
  delegation_ok      boolean not null default false,  -- agreed to delegate domain access
  plan_confirmed     boolean not null default false,  -- attested they're on the Plus plan
  seat_number        integer not null check (seat_number >= 1),
  status             text not null default 'confirmed' check (status in ('confirmed', 'cancelled'))
);

-- One confirmed seat per sending email, and no two confirmed rows share a seat.
create unique index if not exists ichat_beta_signups_main_email_confirmed
  on public.ichat_beta_signups (lower(main_email)) where status = 'confirmed';
create unique index if not exists ichat_beta_signups_seat_confirmed
  on public.ichat_beta_signups (seat_number) where status = 'confirmed';

-- ------------------------------------------------------------
-- Table 2: encrypted app passwords (AES-256-GCM, encrypted in
-- the API route before it ever reaches the database; only
-- present for Gmail/Yahoo/Outlook/iCloud/other platforms)
-- ------------------------------------------------------------
create table if not exists public.ichat_beta_app_passwords (
  id         uuid primary key default gen_random_uuid(),
  signup_id  uuid not null unique references public.ichat_beta_signups(id) on delete cascade,
  ciphertext text not null,  -- base64
  iv         text not null,  -- base64, 12 bytes
  auth_tag   text not null,  -- base64, 16 bytes
  created_at timestamptz not null default now()
);

-- Lock both tables down: service-role access only.
alter table public.ichat_beta_signups enable row level security;
alter table public.ichat_beta_app_passwords enable row level security;

-- ------------------------------------------------------------
-- RPC: reserve_ichat_seat — atomically reserves one of the 20
-- beta seats. Raises BETA_FULL when all seats are taken and
-- ALREADY_SIGNED_UP when the sending email already holds one.
-- ------------------------------------------------------------
drop function if exists public.reserve_ichat_seat(text, text, text);
drop function if exists public.reserve_ichat_seat(jsonb);

create function public.reserve_ichat_seat(p_data jsonb)
returns table (signup_id uuid, seat_number integer, seats_remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_confirmed integer;
  v_seat      integer;
  v_id        uuid;
begin
  -- Serialize concurrent reservations for the duration of this transaction.
  perform pg_advisory_xact_lock(hashtext('ichat_beta_seats'));

  select count(*) into v_confirmed
    from ichat_beta_signups where status = 'confirmed';

  if v_confirmed >= 20 then
    raise exception 'BETA_FULL';
  end if;

  if exists (
    select 1 from ichat_beta_signups
     where lower(main_email) = lower(p_data->>'main_email') and status = 'confirmed'
  ) then
    raise exception 'ALREADY_SIGNED_UP';
  end if;

  select coalesce(max(s.seat_number), 0) + 1 into v_seat
    from ichat_beta_signups s;

  insert into ichat_beta_signups (
    full_name, company_name, email, phone, main_email, email_platform,
    uses_custom_domain, domain, domain_provider, delegation_ok,
    plan_confirmed, seat_number
  )
  values (
    p_data->>'full_name',
    p_data->>'company_name',
    p_data->>'email',
    p_data->>'phone',
    p_data->>'main_email',
    p_data->>'email_platform',
    coalesce((p_data->>'uses_custom_domain')::boolean, false),
    nullif(p_data->>'domain', ''),
    nullif(p_data->>'domain_provider', ''),
    coalesce((p_data->>'delegation_ok')::boolean, false),
    coalesce((p_data->>'plan_confirmed')::boolean, false),
    v_seat
  )
  returning id into v_id;

  return query select v_id, v_seat, 20 - (v_confirmed + 1);
end;
$$;

revoke execute on function public.reserve_ichat_seat(jsonb) from anon, authenticated;
