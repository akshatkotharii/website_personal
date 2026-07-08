-- ============================================================
-- FULL SCHEMA — run in Supabase SQL Editor
-- Safe to re-run (drops and recreates)
-- ============================================================

-- ── POSTS ──────────────────────────────────────────────────
drop table if exists public.comments cascade;
drop table if exists public.likes cascade;
drop table if exists public.posts cascade;

create table public.posts (
  id          bigserial primary key,
  title       text not null,
  slug        text not null unique,
  category    text default 'personal',
  excerpt     text default '',
  content     text default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.posts enable row level security;
create policy "public_read_posts"   on public.posts for select using (true);
create policy "auth_insert_posts"   on public.posts for insert with check (auth.role() = 'authenticated');
create policy "auth_update_posts"   on public.posts for update using (auth.role() = 'authenticated');
create policy "auth_delete_posts"   on public.posts for delete using (auth.role() = 'authenticated');

-- ── LIKES ──────────────────────────────────────────────────
-- Anonymous likes tracked by fingerprint (no login needed)
create table public.likes (
  id           bigserial primary key,
  post_id      bigint references public.posts(id) on delete cascade,
  fingerprint  text not null,              -- browser fingerprint, no PII
  created_at   timestamptz default now(),
  unique(post_id, fingerprint)             -- one like per person per post
);

alter table public.likes enable row level security;
create policy "public_read_likes"   on public.likes for select using (true);
create policy "public_insert_likes" on public.likes for insert with check (true);
create policy "public_delete_likes" on public.likes for delete using (true); -- for unlike

-- ── COMMENTS ───────────────────────────────────────────────
create table public.comments (
  id          bigserial primary key,
  post_id     bigint references public.posts(id) on delete cascade,
  name        text not null,
  message     text not null,
  approved    boolean default false,       -- admin must approve before showing
  created_at  timestamptz default now()
);

alter table public.comments enable row level security;
-- Public can read APPROVED comments only
create policy "public_read_approved_comments"
  on public.comments for select using (approved = true);
-- Anyone can submit a comment
create policy "public_insert_comments"
  on public.comments for insert with check (true);
-- Only auth (admin) can approve/delete
create policy "auth_update_comments"
  on public.comments for update using (auth.role() = 'authenticated');
create policy "auth_delete_comments"
  on public.comments for delete using (auth.role() = 'authenticated');

-- ── HELPFUL VIEWS ──────────────────────────────────────────
-- Post stats view (likes count + comment count per post)
create or replace view public.post_stats as
  select
    p.id,
    p.slug,
    p.title,
    p.category,
    p.created_at,
    count(distinct l.id)::int as like_count,
    count(distinct c.id) filter (where c.approved = true)::int as comment_count,
    count(distinct c.id) filter (where c.approved = false)::int as pending_count
  from public.posts p
  left join public.likes    l on l.post_id = p.id
  left join public.comments c on c.post_id = p.id
  group by p.id, p.slug, p.title, p.category, p.created_at;

-- ── SAMPLE POSTS ───────────────────────────────────────────
insert into public.posts (title, slug, category, excerpt, content, created_at) values
(
  'Why I started this site',
  'why-i-started-this-site',
  'personal',
  'I''ve been wanting a place to document everything. Not just projects — thoughts, failures, what I''m learning and unlearning.',
  '<p>I''ve been putting this off for a while. Not because I didn''t want to, but because I kept waiting until I had something <em>worth</em> showing.</p><p>That''s exactly the wrong way to think about it.</p><p>The best portfolios I''ve seen aren''t polished highlight reels. They''re <strong>living documents</strong> — messy in places, full of ideas that didn''t work out, updated regularly. They show a person thinking, not just a person who figured things out.</p><h2>What this site is for</h2><p>I''m building this to document two parallel tracks: the technical work I''m doing — research at IVCCE, IoT projects, learning ML — and the personal side of being a second-year engineering student trying to figure out what kind of builder I want to be.</p><p>The blog will be honest. I''ll write about things that failed. I''ll write about ideas I''m not sure about yet. I''ll write about what I read, what I noticed, what I''m trying to understand.</p><p>If you''re reading this as a recruiter or collaborator — hello. The best way to understand what I can do is to watch me do it in real time. That''s what this site is.</p><p>More soon.</p>',
  '2025-06-16T10:00:00Z'
),
(
  'What I learned building my first IoT project',
  'first-iot-project-lessons',
  'project',
  'The laundry scheduler taught me more about systems thinking than any textbook. Here''s what went sideways and why I''m glad it did.',
  '<p>Nobody tells you that IoT projects spend 80% of their time not working. The device is unresponsive. The API returns nothing. The socket drops out every 12 minutes for no reason anyone can explain.</p><h2>What actually happened</h2><p>Week 1: I underestimated how much of the work is just getting devices to talk to each other reliably.</p><p>Week 3: I stripped everything back. One endpoint. One sensor read. One display. Got that working first, then built outward.</p><h2>The real lesson</h2><p><strong>Systems thinking over feature building.</strong> I kept wanting to add things before the foundation was solid. Once I stopped doing that, the project moved fast.</p>',
  '2025-06-10T09:00:00Z'
),
(
  'Energy nudges: can data actually change behaviour?',
  'energy-nudges-research-notes',
  'research',
  'Early notes from my IVCCE research. The gap between what people say they''ll do about energy and what they actually do is enormous.',
  '<p>The project I''m working on at IVCCE is trying to answer a deceptively simple question: if you show people their energy usage in real time, will they change their behaviour?</p><p>Spoiler: kind of, but not in the way you''d expect.</p><h2>What the literature says</h2><p>There''s a well-documented gap between intention and action in energy consumption. But when you give a specific, timely, contextual nudge — <strong>"your usage right now is 40% higher than usual"</strong> — something shifts.</p><p>Still early days. Will update as the research develops.</p>',
  '2025-06-03T08:30:00Z'
)
on conflict (slug) do nothing;
