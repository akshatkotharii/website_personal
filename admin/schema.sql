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
  featured    boolean default false,   -- ★ starred on index page (max 6)
  parent_post_id bigint references public.posts(id) on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index posts_parent_post_id_idx on public.posts(parent_post_id);

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

-- ── EXPERIENCE ─────────────────────────────────────────────
drop table if exists public.experience cascade;

create table public.experience (
  id          bigserial primary key,
  date_range  text not null,          -- e.g. "2025 – Present"
  role        text not null,
  org         text not null,
  description text default '',
  sort_order  int  default 0,         -- lower = shown first in timeline
  created_at  timestamptz default now()
);

alter table public.experience enable row level security;
create policy "public_read_experience"  on public.experience for select using (true);
create policy "auth_insert_experience"  on public.experience for insert with check (auth.role() = 'authenticated');
create policy "auth_update_experience"  on public.experience for update using (auth.role() = 'authenticated');
create policy "auth_delete_experience"  on public.experience for delete using (auth.role() = 'authenticated');

-- ── SUBSCRIBERS & SETTINGS ─────────────────────────────────
drop table if exists public.subscribers cascade;
create table public.subscribers (
  id          bigserial primary key,
  email       text not null unique,
  created_at  timestamptz default now()
);

alter table public.subscribers enable row level security;
create policy "public_insert_subscribers" on public.subscribers for insert with check (true);
create policy "auth_select_subscribers" on public.subscribers for select using (auth.role() = 'authenticated');
create policy "auth_delete_subscribers" on public.subscribers for delete using (auth.role() = 'authenticated');

drop table if exists public.settings cascade;
create table public.settings (
  key         text primary key,
  value       text not null
);

alter table public.settings enable row level security;
create policy "auth_all_settings" on public.settings using (auth.role() = 'authenticated');


-- ── HELPFUL VIEWS ──────────────────────────────────────────
-- Post stats view (likes count + comment count per post)
create or replace view public.post_stats as
  select
    p.id,
    p.slug,
    p.title,
    p.category,
    p.featured,
    p.created_at,
    count(distinct l.id)::int as like_count,
    count(distinct c.id) filter (where c.approved = true)::int as comment_count,
    count(distinct c.id) filter (where c.approved = false)::int as pending_count
  from public.posts p
  left join public.likes    l on l.post_id = p.id
  left join public.comments c on c.post_id = p.id
  group by p.id, p.slug, p.title, p.category, p.featured, p.created_at;

-- ── SAMPLE POSTS ───────────────────────────────────────────
insert into public.posts (title, slug, category, excerpt, content, featured, created_at) values
(
  'Why I started this site',
  'why-i-started-this-site',
  'personal',
  'I''ve been wanting a place to document everything. Not just projects — thoughts, failures, what I''m learning and unlearning.',
  '<p>I''ve been putting this off for a while. Not because I didn''t want to, but because I kept waiting until I had something <em>worth</em> showing.</p><p>That''s exactly the wrong way to think about it.</p><p>The best portfolios I''ve seen aren''t polished highlight reels. They''re <strong>living documents</strong> — messy in places, full of ideas that didn''t work out, updated regularly. They show a person thinking, not just a person who figured things out.</p><h2>What this site is for</h2><p>I''m building this to document two parallel tracks: the technical work I''m doing — research at IVCCE, IoT projects, learning ML — and the personal side of being a second-year engineering student trying to figure out what kind of builder I want to be.</p><p>The blog will be honest. I''ll write about things that failed. I''ll write about ideas I''m not sure about yet. I''ll write about what I read, what I noticed, what I''m trying to understand.</p><p>If you''re reading this as a recruiter or collaborator — hello. The best way to understand what I can do is to watch me do it in real time. That''s what this site is.</p><p>More soon.</p>',
  true,
  '2025-06-16T10:00:00Z'
),
(
  'What I learned building my first IoT project',
  'first-iot-project-lessons',
  'project',
  'The laundry scheduler taught me more about systems thinking than any textbook. Here''s what went sideways and why I''m glad it did.',
  '<p>Nobody tells you that IoT projects spend 80% of their time not working. The device is unresponsive. The API returns nothing. The socket drops out every 12 minutes for no reason anyone can explain.</p><h2>What actually happened</h2><p>Week 1: I underestimated how much of the work is just getting devices to talk to each other reliably.</p><p>Week 3: I stripped everything back. One endpoint. One sensor read. One display. Got that working first, then built outward.</p><h2>The real lesson</h2><p><strong>Systems thinking over feature building.</strong> I kept wanting to add things before the foundation was solid. Once I stopped doing that, the project moved fast.</p>',
  true,
  '2025-06-10T09:00:00Z'
),
(
  'Energy nudges: can data actually change behaviour?',
  'energy-nudges-research-notes',
  'research',
  'Early notes from my IVCCE research. The gap between what people say they''ll do about energy and what they actually do is enormous.',
  '<p>The project I''m working on at IVCCE is trying to answer a deceptively simple question: if you show people their energy usage in real time, will they change their behaviour?</p><p>Spoiler: kind of, but not in the way you''d expect.</p><h2>What the literature says</h2><p>There''s a well-documented gap between intention and action in energy consumption. But when you give a specific, timely, contextual nudge — <strong>"your usage right now is 40% higher than usual"</strong> — something shifts.</p><p>Still early days. Will update as the research develops.</p>',
  true,
  '2025-06-03T08:30:00Z'
)
on conflict (slug) do nothing;

-- ── SEED EXPERIENCE ────────────────────────────────────────
insert into public.experience (date_range, role, org, description, sort_order) values
(
  '2025 – Present',
  'Research Intern',
  'IVCCE — Indorama Ventures Center for Clean Energy, Plaksha',
  'Working on a smart nudging system to reduce household energy consumption. Researching how data-driven behavioural interventions can create measurable impact at scale — without requiring users to change habits by willpower alone. Also led outreach for the IVCCE Energy Conference, building sponsor and participant pipelines across student, academic, and industry networks.',
  0
),
(
  '2024 – 2025',
  'Outreach & Events Leadership',
  'Plaksha University · Fitoor, Eklavya & IVCCE Energy Conference',
  'Drove outreach for Fitoor, Eklavya, and the IVCCE Energy Conference, serving as Outreach Head for Eklavya and the Energy Conference. Across the three events, our teams reached 1,500+ people and brought in 800+ participants — experience that sharpened my communication, stakeholder mapping, follow-up discipline, and ability to turn interest into attendance.',
  1
),
(
  '2025',
  'Management Fellow — YTS Program',
  'Plaksha University',
  'Worked as a management fellow for the Young Technology Scholar program at Plaksha. Helped coordinate and run the program, developing skills in team management, communication, and institutional operations alongside technical studies.',
  2
),
(
  '2024 – Present',
  'B.Tech Engineering Student',
  'Plaksha University, Chandigarh',
  'Second-year engineering student focused on applying CS and AI to real-world systems. Building IoT projects, learning ML algorithms independently, and seeking every opportunity to apply theory to practice.',
  3
)
on conflict do nothing;

-- ── MIGRATION NOTE ─────────────────────────────────────────
-- If posts table already exists and you DON'T want to drop/recreate,
-- run only this in SQL editor:
-- ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS featured boolean default false;
-- ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS parent_post_id bigint REFERENCES public.posts(id) ON DELETE CASCADE;
-- CREATE INDEX IF NOT EXISTS posts_parent_post_id_idx ON public.posts(parent_post_id);
