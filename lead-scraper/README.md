# Lead Scraper

Scrapes local business leads from Google Maps (via the Apify
`lukaskrivka/google-maps-with-contact-details` actor), cleans them, and inserts new
leads directly into the Supabase `leads` table — the same table the hosted
[lead-dashboard-web](../lead-dashboard-web) app reads from. Scraped leads show up on
the live dashboard as soon as this script finishes; the Excel tracker is no longer
part of this pipeline.

## Setup

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Add your credentials to `.env` (in this folder):

   ```
   APIFY_API_TOKEN=your_apify_token
   SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

   - Apify token: Apify console → **Settings → Integrations**. Every run of this
     script uses Apify credits, so double-check it's correct before running for real.
   - Supabase URL/service_role key: same project + same values used by
     `lead-dashboard-web` (Supabase dashboard → **Project Settings → API**). The
     service_role key is required because it's the only key allowed to bypass Row
     Level Security for a server-side write — never put it anywhere client-side.

## Usage

```bash
python scrape_leads.py --category "hardware shop" --location "Jayanagar, Bangalore" --max 100
```

- `--category` — business type to search for (e.g. `"hardware shop"`)
- `--location` — area to search in (e.g. `"Jayanagar, Bangalore"`)
- `--max` — max results to scrape (default: `100`)

## What it does

1. Starts an Apify run of `lukaskrivka/google-maps-with-contact-details` for the given
   category + location.
2. Polls the run until it finishes (succeeds, fails, or times out after 15 minutes).
3. Fetches the resulting dataset (name, phone, category, website, rating, email).
4. Cleans it: drops rows without a phone number, normalizes phone numbers to a plain
   10-digit format (strips `+91`, spaces, dashes), and drops duplicate phone numbers
   within the batch.
5. Queries Supabase for which of those (cleaned) phone numbers already exist in the
   `leads` table, and drops those too.
6. Inserts the remaining new leads into Supabase. `city_area` is set to the
   `--location` you passed in, `source` to `"Google Maps"`, `date_added` to today,
   `status` to `"New"`. `website`, `rating`, and `email` are filled in from the scrape
   (blank if the actor didn't find one). `assigned_to`, `follow_up_date`,
   `deal_value`, `domain_name`, `contact_person`, and `notes` are left blank for you
   to fill in from the dashboard later. `id` is assigned automatically by Supabase.
7. Prints a summary: how many leads were scraped, how many were dropped/duplicates,
   and how many new rows were added to Supabase.

## Notes

- A blank `website` is a quick "no website yet" signal for prospecting — the
  tracker's separate `domain_name` field is unrelated and always left blank by this
  script for you to fill in by hand once you've registered/built one for them.
- `email` is the first email address the actor found for that business (if any); the
  actor can return more than one, only the first is kept.
- `Lead_Tracker_and_Dashboard.xlsx` is no longer read or written by this script. If
  you still use the local Flask dashboard ([lead-dashboard](../lead-dashboard)), that
  tool continues to work directly against the Excel file — it's a separate, disconnected
  workflow from this scraper and the hosted web app.
