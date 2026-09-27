-- Run once in Supabase SQL Editor after admin/notebook-migration.sql.
create table if not exists public.margins_notes (id uuid primary key default gen_random_uuid(),text text not null check (char_length(btrim(text)) between 1 and 400),context text not null default '' check (char_length(context)<=500),url text not null default '' check (url='' or url ~* '^https?://[^[:space:]]+$'),pinned boolean not null default false,published boolean not null default false,sort_order integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index if not exists margins_notes_public_order on public.margins_notes(published,pinned desc,sort_order,created_at desc);
alter table public.margins_notes enable row level security;
create policy margins_public_read on public.margins_notes for select to anon using (published);
create policy margins_admin_read on public.margins_notes for select to authenticated using (public.is_portfolio_admin());
create policy margins_admin_insert on public.margins_notes for insert to authenticated with check (public.is_portfolio_admin());
create policy margins_admin_update on public.margins_notes for update to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
create policy margins_admin_delete on public.margins_notes for delete to authenticated using (public.is_portfolio_admin());
grant select on public.margins_notes to anon;grant select,insert,update,delete on public.margins_notes to authenticated;
