# Lead Dashboard (Web)

A hosted, multi-user replacement for the Excel lead tracker. Next.js (App
Router) + Supabase (Postgres) + Tailwind, deployed on Vercel behind a shared
passcode.

- **Data**: lives in a Supabase Postgres table (`leads`), not in a file — so
  you, Chetan, and Nandhu can view/edit at the same time from anywhere
  without emailing a spreadsheet around.
- **Access**: a single shared passcode (env var `APP_PASSCODE`), entered once,
  remembered via an httpOnly cookie for ~6 months. No individual accounts.
- **Security model**: the browser never talks to Supabase directly. All reads
  and writes go through Next.js Route Handlers running on the server, which
  use the Supabase **service_role** key (kept server-side only). Row Level
  Security is enabled on the table with no public policies — the only thing
  that can touch it is your server, gated by the passcode.

## 1. Create the Supabase project (manual — needs your account)

1. Go to [supabase.com](https://supabase.com) and create a new project (or
   use an existing one). Pick any region; a lead tracker for 3 people is well
   within the free tier.
2. Once the project is ready, open **SQL Editor -> New query**, paste in the
   contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it.
   This creates the `leads` table with the right columns, the `status`/
   `assigned_to` constraints, a unique index on `phone_number` (so the same
   business can't be added twice), and enables Row Level Security.
3. Go to **Project Settings -> API** and copy two values:
   - **Project URL** -> this is `SUPABASE_URL`
   - **service_role** key (under "Project API keys" — **not** the `anon`
     key) -> this is `SUPABASE_SERVICE_ROLE_KEY`

   The service_role key bypasses Row Level Security, so treat it like a
   database password: it only ever goes into server-side env vars
   (`.env.local` locally, Vercel's Environment Variables for deployment),
   never into any file that ships to the browser.

## 2. Local development

```bash
cp .env.local.example .env.local
# then fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and pick an APP_PASSCODE

npm install
npm run dev
```

Open **http://localhost:3000** — you'll be redirected to `/login` until you
enter `APP_PASSCODE`.

## 3. Migrate existing leads from Excel (one-time)

`scripts/migrate_excel_to_supabase.py` reads the "Leads" tab of
`Lead_Tracker_and_Dashboard.xlsx` and inserts every row into Supabase,
matched on phone number. Safe to re-run: a phone number already in Supabase
is left untouched (not overwritten), so re-running this after editing a
lead in the dashboard won't clobber that edit.

```bash
cd scripts
python3 migrate_excel_to_supabase.py --excel-path "/path/to/Lead_Tracker_and_Dashboard.xlsx" --dry-run
# check the output looks right, then run for real:
python3 migrate_excel_to_supabase.py --excel-path "/path/to/Lead_Tracker_and_Dashboard.xlsx"
```

It reads `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` from `../.env.local`
(same file as the app), so set that up first. Rows missing a business name or
a valid 10-digit phone number are skipped and listed in the output — nothing
is silently dropped.

**Status/Assigned To fallback**: any Excel `Status` value that isn't one of
this app's seven statuses (e.g. the old Excel Dashboard's `Converted`/`Lost`
placeholders) is imported as `New` rather than rejected. Any `Assigned To`
value other than `Me` / `Chetan` / `Nandhu` imports as unassigned (this
script doesn't auto-assign — only new leads from the scraper or the Add Lead
form do).

## 4. Deploy to Vercel

1. Push this folder to a GitHub repo (Vercel deploys from Git):
   ```bash
   git add -A
   git commit -m "Initial lead dashboard web app"
   git remote add origin <your-new-github-repo-url>
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new), import that GitHub repo.
3. When prompted for the project's **Root Directory**, set it to
   `lead-dashboard-web` if this repo contains other folders (e.g. if you
   pushed the whole `lead-scrapper` project) — otherwise leave it as the repo
   root.
4. Under **Environment Variables**, add:
   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | from Supabase Project Settings -> API |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Supabase Project Settings -> API (service_role, secret) |
   | `APP_PASSCODE` | the passcode you want your team to use |
5. Click **Deploy**. Vercel will build and give you a public URL like
   `https://lead-dashboard-web-yourname.vercel.app`.
6. Share that URL + the passcode with your two friends. That's it — no
   further per-person setup.

To change the passcode later: update `APP_PASSCODE` in Vercel's Environment
Variables and redeploy (Vercel -> Project -> Settings -> Environment
Variables -> Redeploy). Existing sessions with the old cookie will be signed
out automatically, since the cookie is validated against the current
`APP_PASSCODE` on every request.

## Features

- **Table**: Business Name, Phone Number, City/Area, Category, Assigned To,
  Status, Payment Received, Follow-up Date, Deal Value, Website, Notes.
  Click a column header to sort. A blank Website shows a "No website" badge.
- **Search**: by business name or phone, as you type.
- **Filters**: Status, Assigned To, City/Area (city list is built from
  whatever's actually in the data).
- **Inline editing**: Status, Assigned To, Follow-up Date, and Notes edit
  directly and save immediately. **Payment Received** is different: checking
  it opens a confirmation dialog ("mark as Closed-Won with payment
  received?") — only on confirming does it set `payment_received = true`
  *and* `status = "Closed-Won"` together, in one deliberate action, so a
  lead can't end up marked paid without also being marked won. Unchecking it
  (correcting a mistake) doesn't need confirmation.
- **Add Lead**: a form for manual entries (leads that come in outside the
  scraper) — business name and phone are required. `Assigned To` is
  pre-filled with a random pick of Me/Chetan/Nandhu (override it if you want
  a specific person instead).
- **Random assignment**: both the scraper and the Add Lead form assign new
  leads to Me/Chetan/Nandhu at random rather than defaulting to unassigned,
  so lead volume spreads across the team automatically. You can still
  reassign any lead manually via the Assigned To dropdown in the table.
- **Summary strip**: Total Leads, a count per status, Conversion Rate
  (Closed-Won ÷ Total), Total Deal Value **from Closed-Won leads only**, and
  a per-person table (total leads, deals closed, revenue) for Me / Chetan /
  Nandhu.

## Status and Assigned To values

Defined in [`lib/constants.ts`](./lib/constants.ts) and enforced both by the
Supabase `check` constraints and by the API routes:

- Status: `New`, `Contacted`, `Follow-up`, `Interested`, `Not Interested`,
  `Closed-Won`, `Closed-Lost`
- Assigned To: `Me`, `Chetan`, `Nandhu`

If you rename any of these again, update both `lib/constants.ts` **and** the
`check` constraint on `assigned_to` in Supabase (`alter table leads drop
constraint ...` then re-add it with the new values) — the two need to stay
in sync.

## Project structure

```
app/
  page.tsx              main dashboard (client component)
  login/page.tsx         passcode entry
  api/login/route.ts       sets the session cookie
  api/logout/route.ts      clears it
  api/leads/route.ts        GET (list) / POST (create)
  api/leads/[id]/route.ts    PATCH (inline edits)
components/               SummaryStrip, FilterBar, LeadsTable, AddLeadForm
lib/                       Supabase admin client, passcode/session helpers, shared types
proxy.ts                  passcode gate (Next.js 16's replacement for middleware.ts)
supabase/schema.sql        run once in the Supabase SQL Editor
scripts/migrate_excel_to_supabase.py
```
