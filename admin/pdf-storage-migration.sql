-- PDF-backed blog posts: run once in Supabase SQL Editor.
-- Safe to rerun. Existing posts keep working unchanged.

alter table public.posts add column if not exists source_pdf_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-pdfs', 'portfolio-pdfs', true, null, array['application/pdf'])
on conflict (id) do update set
  public = true,
  file_size_limit = null,
  allowed_mime_types = array['application/pdf'];

drop policy if exists portfolio_pdf_public_read on storage.objects;
create policy portfolio_pdf_public_read
on storage.objects for select to anon
using (bucket_id = 'portfolio-pdfs');

drop policy if exists portfolio_pdf_admin_insert on storage.objects;
create policy portfolio_pdf_admin_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'portfolio-pdfs' and public.is_portfolio_admin());

drop policy if exists portfolio_pdf_admin_update on storage.objects;
create policy portfolio_pdf_admin_update
on storage.objects for update to authenticated
using (bucket_id = 'portfolio-pdfs' and public.is_portfolio_admin())
with check (bucket_id = 'portfolio-pdfs' and public.is_portfolio_admin());

drop policy if exists portfolio_pdf_admin_delete on storage.objects;
create policy portfolio_pdf_admin_delete
on storage.objects for delete to authenticated
using (bucket_id = 'portfolio-pdfs' and public.is_portfolio_admin());
