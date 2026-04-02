# Fincra Command Matrix — Deployment Guide

## What you're deploying
A personal CEO task matrix that persists across all your devices.
Password-protected. AI-powered. Yours permanently.

---

## Step 1 — Supabase (database, ~5 mins)

1. Go to https://supabase.com and create a free account
2. Click "New project" — name it "fincra-matrix", choose any region, set a database password
3. Wait ~2 minutes for it to provision
4. Go to **SQL Editor** → **New query**
5. Paste the entire contents of `supabase-schema.sql` and click **Run**
6. Go to **Project Settings** → **API**
7. Copy:
   - **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2 — Anthropic API Key (~2 mins)

1. Go to https://console.anthropic.com
2. Click **API Keys** → **Create Key**
3. Copy the key → this is your `ANTHROPIC_API_KEY`

---

## Step 3 — Deploy to Vercel (~5 mins)

### Option A — GitHub (recommended)
1. Push this folder to a private GitHub repo
2. Go to https://vercel.com → **Add New Project** → import your repo
3. In the **Environment Variables** section, add:
   - `ANTHROPIC_API_KEY` = your key
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - `APP_PASSWORD` = a password you'll use to log in (e.g. your name + a number)
4. Click **Deploy**
5. Vercel gives you a URL like `fincra-matrix.vercel.app`

### Option B — Vercel CLI
```bash
npm install -g vercel
cd command-matrix
npm install
vercel
# Follow prompts, then add env vars in Vercel dashboard
```

---

## Step 4 — Use it

1. Open your Vercel URL on any device
2. Enter your password
3. Paste tasks → Classify
4. Everything persists — tasks, done states, session history

### Bookmark it
- iPhone: Safari → Share → Add to Home Screen (works like an app)
- Chrome: bookmark to desktop

---

## Custom domain (optional)
In Vercel dashboard → **Domains** → add your own domain (e.g. matrix.fincra.com)
Requires DNS access to your domain — your tech team can do this in 5 minutes.

---

## Updating the app context
As your workstreams change, update `lib/constants.js` and redeploy.
Push to GitHub → Vercel auto-redeploys in ~60 seconds.
