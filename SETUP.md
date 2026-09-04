# Open Notebook setup

The site runs as a static GitHub Pages site with Supabase. Existing posts and subscribers are preserved.

## Database

1. Open `admin/notebook-migration.sql`.
2. Replace `YOUR_ADMIN_EMAIL` with your existing Supabase admin login email.
3. Run the whole file in Supabase SQL Editor. It is transactional and adds tables and security policies without deleting existing content.
4. Refresh `/admin`. Notebook controls will appear after successful database setup.

The migration limits editing to the account added to `portfolio_admins`. Disable public email signups in Supabase Auth if you do not need additional accounts. Other signed-in users are not administrators.

Do not run old copies of `admin/schema.sql`: earlier versions contained destructive resets. The new file points to the migration instead.

## Editing

- **On my desk:** up to five pinned chapters with planned, building, or shipped status.
- **Shipped:** completed/live projects remain discoverable here even when unpinned.
- **On the shelf:** paused or dropped projects, including their history.
- **All chapters:** every retained project.
- Deleting a chapter permanently deletes its updates. Pausing or dropping preserves them.
- The ML sprint starts planned on 5 September 2026 with 0 completed days. Change status and completed-day count yourself; the calendar never fabricates progress.
- Updates may be drafts or public. Weekly recaps include only public updates from the selected seven-day window, using India time.
- Generate a recap, edit it, and move it to the blog editor. Review and publish normally. Publishing does not automatically send email.

## Newsletter delivery

Set these **secrets in Supabase → Edge Functions → Secrets**:

- `RESEND_API_KEY`: your Resend API key.
- `RESEND_FROM_EMAIL`: a sender on your verified Resend domain.

Deploy `supabase/functions/notebook-mail/index.ts` as an Edge Function named `notebook-mail`, with gateway JWT verification disabled because the function validates admin sessions itself. `SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided by Supabase automatically. Existing admin-only Resend settings are supported as a fallback; secrets are preferred.

No service-role key is needed. The function validates the administrator's session and uses database policies. The envelope button sends a link and excerpt from an already-published post. Each recipient receives a separate email and an unsubscribe link. Successful sends are recorded and skipped on retries; provider idempotency protects a retry after a transient logging failure within its retention window. Review failed sends before retrying after that window.

If a Resend key was previously entered into the old browser-based settings panel, rotate it in Resend after moving to server settings, and after verifying Edge Function secrets, remove its obsolete `resend_api_key` row from `settings` through Supabase. No email is sent automatically by this release.

## Limits and verification

The public page can show seed cards if the notebook database is unavailable. Admin never pretends a failed save succeeded. A successful empty database response stays empty; deleted chapters do not reappear as seed content.

Anonymous comments, subscriptions, and likes still need infrastructure-level abuse protection for high traffic. The migration blocks self-approved comments and hides visitor tokens and subscriber details. Add a server-verified challenge/rate limit if abuse appears. No automated scan can establish that every possible security issue is absent.

Deploy requires the database migration for new admin operations and likes. Email additionally requires server configuration and a verified sender. Real credentialed saves and delivery must be verified against the deployed environment.

GitHub Pages does not apply `netlify.toml` or run Netlify functions. Security policy and referrer policy are included in page metadata; response-only controls such as frame-ancestors require a host/proxy with configurable headers. The old Netlify configuration has been removed to avoid implying those headers are active.
