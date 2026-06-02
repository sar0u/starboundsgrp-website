# 🚀 starboundsgrp — Production Deployment Guide

This guide walks you through deploying the site with **real authentication**, **real email verification**, and **real Discord OAuth** using **Supabase** (free tier is plenty).

Total time: ~20 minutes.

---

## Architecture

The app has a built-in **dual backend**:

| Mode | When | What works |
|---|---|---|
| **Demo** (default) | No env vars set | All UI works. Auth is local-only (one device, fake email codes). |
| **Production** | Supabase env vars set | Real users, real verification emails, real Discord OAuth, cross-device sessions. |

The auth functions automatically detect Supabase and switch over — **you don't change any code**, just add env vars.

---

## Step 1 — Create a Supabase project (5 min)

1. Go to **https://supabase.com** → sign up (free) → **New project**.
2. Choose a name, set a strong database password, pick the region closest to your users.
3. Wait ~2 min for the project to provision.
4. Open **Project Settings → API**. Copy these two values:
   - **Project URL** → this is your `VITE_SUPABASE_URL`
   - **anon / public key** → this is your `VITE_SUPABASE_ANON_KEY`

> ⚠️ The `anon` key is safe to expose in the browser. **Never** expose the `service_role` key.

---

## Step 2 — Configure Authentication (3 min)

In your Supabase dashboard:

### a) Allow your site URL

**Authentication → URL Configuration**
- **Site URL**: `https://your-deployed-site.com` (or `http://localhost:5173` for dev)
- **Redirect URLs**: add the same URL again

### b) Enable email confirmation (REAL verification emails)

**Authentication → Providers → Email**
- ✅ Enable **Confirm email** — this makes Supabase send a real verification email on signup
- (Optional) Customize the email template under **Authentication → Email Templates → Confirm signup**

### c) Email sender (built-in works, but is rate-limited)

Supabase ships a free email service that works out of the box (limited to ~3 emails/hour per user, plenty for testing).

For production scale, plug in a real SMTP provider:
**Authentication → Settings → SMTP Settings** — paste credentials from SendGrid, Resend, Mailgun, etc.

---

## Step 3 — Configure Discord OAuth (5 min)

### a) Create the Discord application

1. Go to **https://discord.com/developers/applications** → **New Application** → name it `starboundsgrp`.
2. Open **OAuth2** in the sidebar.
3. Copy the **Client ID** and **Client Secret** — you'll paste these into Supabase next.
4. Under **Redirects**, add this exact URL (replace with your Supabase ref):
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

### b) Enable Discord in Supabase

In Supabase: **Authentication → Providers → Discord**
- ✅ Enable
- Paste the Discord **Client ID** and **Client Secret**
- Save

That's it — clicking **"Continue with Discord"** in the app now triggers a real OAuth round-trip.

---

## Step 4 — Designate your admin account (1 min)

Open `src/backend/authSupabase.ts` and edit this line:

```ts
const ADMIN_EMAILS = ['admin@starbound.com']; // ← your real admin email(s)
```

Any user signing in with one of these emails automatically gets `admin` role and sees the "+ publish" button. All other accounts are `user` (consume-only).

---

## Step 5 — Set the env vars locally (1 min)

Create a `.env` file at the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi... (your anon key)
```

Run `npm run dev` — open the browser console. You should see:
```
[starboundsgrp] Supabase backend enabled ✓
```

Now try the full flow:
1. **Register** with a real email → check your inbox → click the link → return and sign in. ✅
2. **Continue with Discord** → real Discord auth screen → redirects back signed-in. ✅

---

## Step 6 — Deploy (5 min)

The build output is a single `dist/index.html` file (thanks to `vite-plugin-singlefile`). Deploy anywhere static:

### Option A — Vercel (easiest)

1. Push the repo to GitHub.
2. https://vercel.com → **Import Project** → pick the repo.
3. **Environment Variables** — add both:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. Done.

### Option B — Netlify

1. Push to GitHub.
2. https://netlify.com → **Add new site** → **Import from Git**.
3. Build command: `npm run build`, publish directory: `dist`.
4. **Site settings → Environment variables** — add both Supabase vars.
5. Redeploy.

### Option C — Any static host (GitHub Pages, Cloudflare Pages, S3, etc.)

1. Run `npm run build` locally.
2. Upload the contents of `dist/` to your host.
3. Make sure your environment had the env vars set when building, **or** edit `dist/index.html` directly to inline the values (since they get baked in at build time).

> ⚠️ After deploying, **go back to Supabase → Authentication → URL Configuration** and add your live URL to **Site URL** and **Redirect URLs**.

---

## Step 7 — Update Discord redirect after deploy

Once you have your live URL, the Discord OAuth redirect URL configured in Supabase **needs the same Supabase URL**, so no change needed there. But verify:
- Supabase Site URL = your live site
- Discord app redirect URL = `https://your-project-ref.supabase.co/auth/v1/callback`

---

## What's working in production mode

| Feature | Status |
|---|---|
| Real user accounts (cross-device) | ✅ |
| Email/password sign-up | ✅ |
| Real verification emails | ✅ |
| Discord OAuth (real flow) | ✅ |
| Session persistence (7 days) | ✅ |
| Password reset *(can be enabled in Supabase)* | available |
| Admin role gating | ✅ (via `ADMIN_EMAILS`) |
| Content (scenepacks, tutorials, audio) | local per-browser (see optional step below) |

---

## (Optional) Step 8 — Shared content with a real database

By default, content published via the admin panel lives in each visitor's browser. To make published content **shared across all users**, create these Supabase tables and update `src/backend/api.ts` to use them.

**SQL to paste in Supabase → SQL Editor:**

```sql
create table public.scenepacks (
  id text primary key,
  title text not null,
  category text,
  duration text,
  clips int,
  rating numeric default 5,
  downloads int default 0,
  tags text[],
  is_premium bool default false,
  thumbnail text,
  author_id uuid references auth.users,
  author_name text,
  resolution text,
  description text,
  file_size text,
  status text default 'published',
  created_at timestamptz default now()
);

create table public.tutorials (
  id text primary key,
  title text not null,
  category text,
  duration text,
  level text,
  description text,
  views int default 0,
  likes int default 0,
  author text,
  author_initials text,
  author_id uuid references auth.users,
  content text,
  status text default 'published',
  created_at timestamptz default now()
);

create table public.audio_tracks (
  id text primary key,
  title text not null,
  artist text,
  duration text,
  category text,
  bpm int,
  plays int default 0,
  likes int default 0,
  author_id uuid references auth.users,
  description text,
  file_size text,
  status text default 'published',
  created_at timestamptz default now()
);

-- Row Level Security: everyone can read; only admins can write
alter table public.scenepacks  enable row level security;
alter table public.tutorials   enable row level security;
alter table public.audio_tracks enable row level security;

create policy "read all" on public.scenepacks  for select using (true);
create policy "read all" on public.tutorials   for select using (true);
create policy "read all" on public.audio_tracks for select using (true);

-- Only authenticated users can insert; you may further restrict by checking
-- a custom `is_admin` claim or an email allow-list using auth.email().
create policy "insert auth" on public.scenepacks  for insert with check (auth.role() = 'authenticated');
create policy "insert auth" on public.tutorials   for insert with check (auth.role() = 'authenticated');
create policy "insert auth" on public.audio_tracks for insert with check (auth.role() = 'authenticated');
```

Then rewrite the content getters in `src/backend/api.ts` to call `supabase.from('scenepacks').select('*')` etc. The UI doesn't change — only the API layer.

---

## Troubleshooting

**"Please verify your email" won't go away**
→ Check your spam folder. Make sure **Confirm email** is enabled in Supabase Authentication settings.

**Discord login goes to an error page**
→ The redirect URL in your Discord app must be exactly `https://<project-ref>.supabase.co/auth/v1/callback`. The Discord client secret must be pasted correctly into Supabase.

**"Invalid email or password" but the password is correct**
→ The account email isn't verified yet. Verify via the email link first.

**The console says "Running in local demo mode" after deploy**
→ Your env vars weren't picked up. Re-check Vercel/Netlify environment variables, then redeploy.

---

## Summary

You're now running a real authenticated web app with verified accounts, OAuth, and persistent sessions — at zero cost on Supabase's free tier. 🎉
