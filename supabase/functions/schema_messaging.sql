-- Messaging platform schema for MotorMinds
-- Tables: connected_pages, direct_messages
-- NOTE: run via Supabase migration

-- 1. connected_pages -------------------------------------------------------
create table if not exists public.connected_pages (
    id                 bigserial primary key,
    shop_id            uuid not null references public.shops (id) on delete cascade,
    page_id            text not null,
    ig_id              text,
    access_token       text not null,
    platform           text not null check (platform in ('facebook', 'instagram')),
    connected_at       timestamptz not null default now(),
    updated_at         timestamptz not null default now()
);

create unique index if not exists connected_pages_shop_platform_idx
    on public.connected_pages (shop_id, platform);

-- 2. direct_messages --------------------------------------------------------------
create table if not exists public.direct_messages (
    id              bigserial primary key,
    shop_id         uuid not null references public.shops (id) on delete cascade,
    platform        text not null check (platform in ('facebook', 'instagram')),
    sender_id       text not null,
    thread_id       text not null,
    message         text not null,
    direction       text not null check (direction in ('inbound','outbound')),
    timestamp       timestamptz not null,
    priority_flag   boolean not null default false,
    tags            text[] default '{}',
    archived        boolean not null default false
);

create index if not exists direct_messages_shop_thread_idx on public.direct_messages(shop_id, thread_id);
create index if not exists direct_messages_shop_timestamp_idx on public.direct_messages(shop_id, timestamp desc);

-- 3. Row Level Security ----------------------------------------------------
-- Enable RLS on both tables
alter table public.connected_pages enable row level security;
alter table public.direct_messages enable row level security;

-- Policy: each authenticated user can access rows for their shop_id
-- Assumes auth.uid() returns user id and public.get_shop_id(uid uuid) returns shop id
-- Replace WITH your own mapping if different.

create or replace function public.current_shop_id() returns uuid
    language sql stable as $$
    select shop_id from public.users where id = auth.uid();
$$;

drop policy if exists "select_connected_pages" on public.connected_pages;
create policy "select_connected_pages" on public.connected_pages
    for select using (shop_id = public.current_shop_id());

drop policy if exists "modify_connected_pages" on public.connected_pages;
create policy "modify_connected_pages" on public.connected_pages
    for all using (shop_id = public.current_shop_id());

drop policy if exists "select_direct_messages" on public.direct_messages;
create policy "select_direct_messages" on public.direct_messages
    for select using (shop_id = public.current_shop_id());

drop policy if exists "insert_direct_messages" on public.direct_messages;
create policy "insert_direct_messages" on public.direct_messages
    for insert with check (shop_id = public.current_shop_id());

-- ------------------------------------------------------------------------- 