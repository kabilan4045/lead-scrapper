# Lead Scraper

Scrapes local business leads from Google Maps (via the Apify
`lukaskrivka/google-maps-with-contact-details` actor), cleans them, and appends new leads
into the `Leads` tab of `Lead_Tracker_and_Dashboard.xlsx`.

## Setup

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Add your Apify API token to `.env` (in this folder):

   ```
   APIFY_API_TOKEN=your_token_here
   ```

   Get a token from the Apify console under **Settings → Integrations**. Every run of
   this script uses Apify credits, so double-check the token is correct before running
   it for real.

3. By default the script looks for the Excel tracker one folder up, at
   `../Lead_Tracker_and_Dashboard.xlsx` (i.e. `Lead_Tracker_and_Dashboard.xlsx` sitting
   next to this `lead-scraper/` folder). Override the location with `--excel-path` or by
   setting `EXCEL_FILE_PATH` in `.env` if you keep it somewhere else. The `Leads` tab
   must already exist with these exact headers, in this order:

   `Lead ID, Business Name, Contact Person, Phone Number, City/Area, Category, Source,
   Date Added, Assigned To, Status, Follow-up Date, Deal Value (INR), Domain Name,
   Payment Received, Site Delivered, Notes, Website, Rating, Email`

## Usage

```bash
python scrape_leads.py --category "hardware shop" --location "Jayanagar, Bangalore" --max 100
```

- `--category` — business type to search for (e.g. `"hardware shop"`)
- `--location` — area to search in (e.g. `"Jayanagar, Bangalore"`)
- `--max` — max results to scrape (default: `100`)
- `--excel-path` — optional override for the tracker file location

## What it does

1. Starts an Apify run of `lukaskrivka/google-maps-with-contact-details` for the given
   category + location.
2. Polls the run until it finishes (succeeds, fails, or times out after 15 minutes).
3. Fetches the resulting dataset (name, phone, address, category, website, rating, email).
4. Cleans it: drops rows without a phone number, normalizes phone numbers to a plain
   10-digit format (strips `+91`, spaces, dashes), and drops duplicate phone numbers
   within the batch.
5. Loads the `Leads` tab and drops any scraped row whose phone number is already there.
6. Appends the remaining new leads, continuing the `Lead ID` sequence from the last row.
   `Source` is set to `"Google Maps"`, `Date Added` to today, `Status` to `"New"`.
   `Website`, `Rating`, and `Email` are filled in from the scrape (blank if the actor
   didn't find one). `Contact Person`, `Assigned To`, `Follow-up Date`,
   `Deal Value (INR)`, `Domain Name`, `Payment Received`, `Site Delivered`, and `Notes`
   are left blank for you to fill in later.
7. Saves the workbook. Only the `Leads` tab is written to — appending rows doesn't touch
   the `Dashboard` tab, so its formulas and formatting are untouched (its formulas
   reference whole `Leads` columns, so they'll pick up the new rows automatically).
8. Prints a summary: how many leads were scraped, how many were dropped/duplicates, and
   how many new rows were added.

## Notes

- `City/Area` on each new row is set to the `--location` you passed in, not the raw
  scraped street address.
- A blank `Website` column is a quick "no website yet" signal for prospecting — the
  tracker's separate `Domain Name` column is unrelated and always left blank by this
  script for you to fill in by hand once you've registered/built one for them.
- `Email` is the first email address the actor found for that business (if any); the
  actor can return more than one, only the first is kept.
