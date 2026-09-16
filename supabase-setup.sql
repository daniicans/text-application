-- ============================================================
-- iChat Beta Signup — Supabase setup
-- Run this once in the Supabase dashboard → SQL Editor.
-- Creates two tables and the atomic seat-reservation RPC.
-- The API routes use the service-role key, so RLS is enabled
-- with no public policies (nothing is readable from the browser).
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Table 1: confirmed beta signups (one row per reserved seat)
-- ------------------------------------------------------------
create table if not exists public.ichat_beta_signups (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  full_name   text not null,
  email       text not null,
  phone       text,
  seat_number integer not null check (seat_number between 1 and 10),
  status      text not null default 'confirmed' check (status in ('confirmed', 'cancelled'))
);

-- One confirmed seat per email, and no two confirmed rows share a seat.
create unique index if not exists ichat_beta_signups_email_confirmed
  on public.ichat_beta_signups (lower(email)) where status = 'confirmed';
create unique index if not exists ichat_beta_signups_seat_confirmed
  on public.ichat_beta_signups (seat_number) where status = 'confirmed';

-- ------------------------------------------------------------
-- Table 2: encrypted app passwords (AES-256-GCM, encrypted in
-- the API route before it ever reaches the database)
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
-- RPC: reserve_ichat_seat — atomically reserves one of the 10
-- beta seats. Raises BETA_FULL when all seats are taken and
-- ALREADY_SIGNED_UP when the email already holds a seat.
-- ------------------------------------------------------------
create or replace function public.reserve_ichat_seat(
  p_full_name text,
  p_email     text,
  p_phone     text default null
)
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

  if v_confirmed >= 10 then
    raise exception 'BETA_FULL';
  end if;

  if exists (
    select 1 from ichat_beta_signups
     where lower(email) = lower(p_email) and status = 'confirmed'
  ) then
    raise exception 'ALREADY_SIGNED_UP';
  end if;

  -- Smallest free seat number (cancelled seats are reused).
  select min(n) into v_seat
    from generate_series(1, 10) as n
   where n not in (
     select s.seat_number from ichat_beta_signups s where s.status = 'confirmed'
   );

  insert into ichat_beta_signups (full_name, email, phone, seat_number)
  values (p_full_name, p_email, nullif(p_phone, ''), v_seat)
  returning id into v_id;

  return query select v_id, v_seat, 10 - (v_confirmed + 1);
end;
$$;

revoke execute on function public.reserve_ichat_seat(text, text, text) from anon, authenticated;
