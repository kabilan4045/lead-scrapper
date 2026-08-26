# Lead Dashboard

A local web front-end for `Lead_Tracker_and_Dashboard.xlsx`. It reads the "Leads"
tab and writes edits straight back into the same file — there's no separate
database, so the spreadsheet is always the source of truth. The "Dashboard" tab
(and its formulas/formatting) is never opened for writing by this app.

## Setup

Already done once, but for reference:

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
```

`.env` points at the tracker file:

```
EXCEL_FILE_PATH=/Users/kabilan/Desktop/Projects/lead-scrapper/Lead_Tracker_and_Dashboard.xlsx
```

Change this if you ever move the spreadsheet.

## Running it

```bash
cd lead-dashboard
./venv/bin/python app.py
```

Then open **http://localhost:5001** in a browser.

To let your two friends reach it from their own devices on the same wifi, find
this machine's local IP (shown in the terminal when the server starts, e.g.
`Running on http://192.168.1.2:5001`) and have them open
`http://<that-ip>:5001` instead. Close the terminal (or Ctrl+C) to stop the
server.

**Important:** if the Excel file is open in Excel/Numbers at the same time
someone edits a lead in the dashboard, the save may fail (the app will show an
error toast rather than corrupt anything) — close the file in Excel first, or
only edit from one place at a time.

## What it does

- **Table** — Business Name, Phone Number, City/Area, Category, Assigned To,
  Status, Follow-up Date, Deal Value, Website, Notes. Click any column header
  to sort by it. A blank Website is flagged with a "No website" badge, since
  that's a quick prospecting signal.
- **Search** — filters by Business Name or Phone Number as you type.
- **Filters** — Status, Assigned To, and City/Area (City/Area options are
  built from whatever values are actually in your data).
- **Inline editing** — Status, Assigned To, and Follow-up Date are dropdowns/
  date pickers; Notes is a text field. Any change is written to the matching
  row in the Leads tab immediately (same Lead ID, same row). Business Name,
  Phone, City/Area, Category, Deal Value, and Website are read-only here —
  edit those in Excel directly if needed.
- **Summary strip** — Total Leads, a count per status, Conversion Rate
  (Closed-Won ÷ Total), and Total Deal Value, computed from every row in the
  Leads tab (not just what's currently filtered). These are computed
  independently in the browser from the same data the table shows — the app
  never reads the Dashboard tab's cached formula results (which may not exist
  if the file hasn't been opened in real Excel yet).
- **Refresh button** — re-reads the Excel file, in case it changed outside the
  app (e.g. the lead scraper appended new rows while the dashboard was open).

### Status and Assigned To values

Fixed dropdown options, defined at the top of `excel_io.py`:

- Status: `New`, `Contacted`, `Follow-up`, `Interested`, `Closed-Won`, `Closed-Lost`
- Assigned To: `Me`, `Friend 1`, `Friend 2`

Edit `STATUS_OPTIONS` / `ASSIGNED_TO_OPTIONS` in `excel_io.py` if these ever
need to change — they're also what the Dashboard tab's status formulas were
updated to match, so keep both in sync if you rename a status.

## Testing

`test_excel_io.py` and `test_app.py` exercise all the read/write/error-handling
logic against a scratch copy of `backups/Lead_Tracker_and_Dashboard_backup_2026-08-26.xlsx`
— they never touch the real file or even that backup directly. Run them after
changing `excel_io.py` or `app.py`:

```bash
./venv/bin/python test_excel_io.py
./venv/bin/python test_app.py
```

## Notes on the Excel file

- A one-time backup was made at
  `backups/Lead_Tracker_and_Dashboard_backup_2026-08-26.xlsx` before any
  read/write logic was wired up to the real file.
- The Dashboard tab's status-breakdown formulas were updated to match this
  app's actual status list (New / Contacted / Follow-up / Interested /
  Closed-Won / Closed-Lost) — the old formulas used a different placeholder
  set (New / Contacted / Converted / Lost) that no lead would ever actually
  match. A "Conversion Rate" row was added too. Nothing else on the Dashboard
  tab changed, and the Leads tab's columns/data were untouched.
