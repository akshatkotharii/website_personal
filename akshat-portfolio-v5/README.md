# Akshat Kothari — Portfolio

## Folder structure

```
akshat-portfolio/
├── index.html          ← Main site (open this in browser to preview)
├── css/
│   └── style.css       ← All styles
├── js/
│   └── main.js         ← Nav, blog modal, post loader
├── images/
│   ├── akshat_photo.png
│   └── akshat_signature.png
├── blog/
│   ├── post.html       ← Single post reader (reads ?slug= from URL)
│   └── posts/          ← One JSON file per blog post
│       ├── why-i-started-this-site.json
│       ├── first-iot-project-lessons.json
│       └── energy-nudges-research-notes.json
└── README.md
```

---

## How to write a blog post

### Option A — Quick post (in-browser, no code)
1. Open the site → scroll to Blog → click **"+ Write a post"**
2. Fill in title, category, content → hit Publish
3. Post appears immediately and is saved in browser (localStorage)
4. ⚠️ Only lives in that browser — use Option B to publish permanently

### Option B — JSON file (permanent, works on Vercel/GitHub)
1. Create a new file in `blog/posts/` named `your-post-slug.json`
2. Use this template:

```json
{
  "title": "Your Post Title",
  "slug": "your-post-slug",
  "date": "2025-06-17T09:00:00",
  "cat": "personal",
  "excerpt": "One sentence that shows on the index.",
  "media": [
    {
      "type": "image",
      "src": "../images/blog/photo.jpg",
      "alt": "Short description of the photo",
      "caption": "Optional caption"
    },
    {
      "type": "video",
      "src": "../images/blog/demo.mp4",
      "caption": "Optional video caption"
    }
  ],
  "html": "<p>Your full post content here. Use HTML tags: &lt;p&gt;, &lt;h2&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;blockquote&gt;</p>"
}
```

3. Put photos/videos in `images/blog/`, then reference them with paths like `../images/blog/photo.jpg`. Media appears below the post heading, before the article body.
4. Add a row in `index.html` inside `<div class="blog-list">`:

```html
<a href="blog/post.html?slug=your-post-slug" class="blog-row">
  <div class="blog-row-date">Jun 17<br>2025</div>
  <div>
    <div class="blog-row-title">Your Post Title</div>
    <div class="blog-row-excerpt">One sentence excerpt.</div>
  </div>
  <div class="blog-row-tag">personal</div>
</a>
```

5. Git commit → push → Vercel auto-deploys in ~30 seconds

---

## Hosting on Vercel (free, recommended)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Framework: **Other** (static site, no build step needed)
4. Click Deploy → live in ~60 seconds
5. Get a free `yourname.vercel.app` URL immediately
6. Later: add your custom domain in Vercel settings

## Hosting on GitHub Pages (also free)

1. Push to GitHub repo
2. Settings → Pages → Source: main branch, root `/`
3. Live at `username.github.io/akshat-portfolio`

---

## Update the placeholder links

In `index.html`, find the contact section and replace `#` with your actual links:

```html
<a href="https://github.com/YOUR_USERNAME" class="contact-link">GitHub</a>
<a href="https://linkedin.com/in/YOUR_HANDLE" class="contact-link">LinkedIn</a>
<a href="https://YOUR_SUBSTACK.substack.com" class="contact-link">Substack</a>
<a href="https://x.com/YOUR_HANDLE" class="contact-link">X / Twitter</a>
<a href="https://instagram.com/YOUR_HANDLE" class="contact-link">Instagram</a>
<a href="YOUR_RESUME_LINK" class="contact-link">↓ Resume</a>
```

Also update the email:
```html
<a href="mailto:YOUR_EMAIL" class="contact-email-link">YOUR_EMAIL</a>
```

---

## Daily blogging workflow (once live on Vercel)

1. Open `blog/posts/` → duplicate any `.json` file
2. Update title, slug, date, content
3. Add the row to `index.html` blog list
4. `git add . && git commit -m "post: title" && git push`
5. Vercel deploys automatically — live in ~30 seconds

Total time per post after first setup: **under 3 minutes**

---

## Tech stack
- Pure HTML + CSS + vanilla JS (zero frameworks, zero build tools)
- Google Fonts: Instrument Serif + Inter + JetBrains Mono
- Fully responsive (mobile, tablet, desktop)
- Blog posts stored as static JSON — no backend needed

---

## Supabase blog setup (recommended — lets you post from admin panel)

### Step 1: Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New project (free tier)
2. Give it a name (e.g. "akshat-portfolio")
3. Save the database password

### Step 2: Run the SQL schema
1. In Supabase dashboard → SQL Editor
2. Paste the contents of `admin/schema.sql` and run it
3. This creates your `posts` table with the right permissions

### Step 3: Create your admin user
1. Supabase → Authentication → Users → Add user
2. Use your email + a strong password
3. This is what you'll log in with at `/admin`

### Step 4: Add your credentials to the code
In **both** `admin/index.html` and `blog/post.html`, find these lines:

```js
const SUPABASE_URL  = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY';
```

Replace with your values from:
Supabase dashboard → Settings → API → Project URL + anon/public key

### Step 5: Update index.html to load from Supabase
In `js/main.js`, the blog rows are currently hardcoded HTML.
Once Supabase is set up, the `blog/post.html` page will automatically
read from Supabase first, then fall back to JSON files.

To make the index page also load posts from Supabase dynamically,
uncomment the Supabase block in `js/main.js` (instructions inside the file).

### Daily posting workflow with admin panel
1. Go to `yoursite.com/admin` → sign in
2. Write title + content → hit Publish
3. Post is live on `yoursite.com/blog/post.html?slug=your-slug` instantly
4. No git push needed — it's all in the database
