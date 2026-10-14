begin;

alter table public.notebook_projects
  add column if not exists icon text not null default 'spark';

alter table public.notebook_projects
  add column if not exists animation text not null default 'breathe';

create table if not exists public.portfolio_migrations(version text primary key);

do $$
begin
  if not exists (
    select 1 from public.portfolio_migrations where version = 'notebook-art-v1'
  ) then
    update public.notebook_projects set icon='washer', animation='spin' where id='spin-sync';
    update public.notebook_projects set icon='energy', animation='draw' where id='energy-nudging';
    update public.notebook_projects set icon='network', animation='breathe' where id='outreach-brain';
    update public.notebook_projects set icon='brain', animation='breathe' where id='ml-sprint';
    update public.notebook_projects set icon='browser', animation='float' where id='this-site';
    insert into public.portfolio_migrations(version) values ('notebook-art-v1');
  end if;
end $$;

commit;
