-- Remove the old five-pinned-project limit. Safe to run more than once.
begin;

create or replace function public.notebook_project_guard() returns trigger
language plpgsql set search_path=public as $$
begin
  perform pg_advisory_xact_lock(814510);
  if new.status in ('paused','dropped') then new.pinned=false; end if;
  new.updated_at=now();
  return new;
end $$;

commit;
