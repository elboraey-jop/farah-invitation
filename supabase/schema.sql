create extension if not exists pgcrypto;

create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null default 'farah-karim',
  bride_name text not null default 'Farah',
  groom_name text not null default 'Karim',
  wedding_at timestamptz not null default '2026-10-17 20:00:00+03',
  venue_name text not null default 'Qasr Hall',
  venue_url text not null default 'https://maps.app.goo.gl/teZFMRcaYmbSkw8d9',
  created_at timestamptz not null default now()
);

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations(id) on delete cascade,
  display_name text not null,
  access_token text unique not null default encode(gen_random_bytes(18), 'hex'),
  created_at timestamptz not null default now()
);

create table if not exists wishes (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null,
  message text not null,
  guest_token text,
  status text not null default 'unread' check (status in ('unread', 'read', 'archived')),
  created_at timestamptz not null default now()
);

alter table invitations enable row level security;
alter table guests enable row level security;
alter table wishes enable row level security;

drop policy if exists "public can submit wishes" on wishes;
create policy "public can submit wishes" on wishes for insert to anon, authenticated with check (true);
