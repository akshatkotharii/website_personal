-- Repair public likes and moderated comments without changing existing rows.
-- Safe to run again from the Supabase SQL Editor.
begin;

grant usage on schema public to anon, authenticated;

-- Readers can see approved comments. Pending comments remain admin-only,
-- including if an older permissive policy still exists.
alter table public.comments enable row level security;
grant select, insert on table public.comments to anon, authenticated;

drop policy if exists public_read_approved_comments on public.comments;
create policy public_read_approved_comments on public.comments
  as permissive for select to anon, authenticated
  using (approved = true);

drop policy if exists public_comment_visibility_guard on public.comments;
create policy public_comment_visibility_guard on public.comments
  as restrictive for select to anon, authenticated
  using (approved = true or public.is_portfolio_admin());

drop policy if exists public_submit_comment on public.comments;
create policy public_submit_comment on public.comments
  as permissive for insert to anon, authenticated
  with check (
    approved = false
    and char_length(name) between 1 and 60
    and char_length(message) between 3 and 1000
  );

-- Bigserial comment IDs need sequence permission for anonymous inserts.
do $$
declare comment_id_sequence regclass;
begin
  comment_id_sequence := pg_get_serial_sequence('public.comments', 'id');
  if comment_id_sequence is not null then
    execute format('grant usage, select on sequence %s to anon, authenticated', comment_id_sequence);
  end if;
end $$;

-- Keep visitor fingerprints private; expose only per-post count and the
-- current visitor's own liked state through narrow RPCs.
alter table public.likes enable row level security;
drop policy if exists public_read_likes on public.likes;
drop policy if exists public_insert_likes on public.likes;
drop policy if exists public_delete_likes on public.likes;
drop policy if exists portfolio_admin_likes_access on public.likes;
create policy portfolio_admin_likes_access on public.likes
  for all to authenticated
  using (public.is_portfolio_admin())
  with check (public.is_portfolio_admin());

create or replace function public.portfolio_like_state(p_post_id bigint, p_token text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'count', (select count(*) from public.likes where post_id = p_post_id),
    'liked', exists (
      select 1 from public.likes where post_id = p_post_id and fingerprint = p_token
    )
  );
$$;

create or replace function public.portfolio_set_like(p_post_id bigint, p_token text, p_liked boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if char_length(p_token) < 20 or char_length(p_token) > 128 then
    raise exception 'Invalid visitor token';
  end if;

  if p_liked then
    insert into public.likes(post_id, fingerprint)
    values (p_post_id, p_token)
    on conflict (post_id, fingerprint) do nothing;
  else
    delete from public.likes
    where post_id = p_post_id and fingerprint = p_token;
  end if;

  return public.portfolio_like_state(p_post_id, p_token);
end;
$$;

revoke all on function public.portfolio_like_state(bigint, text) from public;
revoke all on function public.portfolio_set_like(bigint, text, boolean) from public;
grant execute on function public.portfolio_like_state(bigint, text) to anon, authenticated;
grant execute on function public.portfolio_set_like(bigint, text, boolean) to anon, authenticated;

commit;
