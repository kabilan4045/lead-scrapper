#!/usr/bin/env python3
"""Scrape local business leads from Google Maps (via Apify) and insert new,
deduplicated rows directly into the Supabase "leads" table."""

import argparse
import os
import re
import sys
import time
from datetime import date

import requests
from dotenv import load_dotenv

APIFY_ACTOR_ID = "lukaskrivka~google-maps-with-contact-details"
APIFY_BASE_URL = "https://api.apify.com/v2"
POLL_INTERVAL_SECONDS = 5
MAX_POLL_SECONDS = 900


def parse_args():
    parser = argparse.ArgumentParser(
        description="Scrape Google Maps leads via Apify and insert them into Supabase."
    )
    parser.add_argument("--category", required=True, help='Business category, e.g. "hardware shop"')
    parser.add_argument("--location", required=True, help='Location, e.g. "Jayanagar, Bangalore"')
    parser.add_argument("--max", type=int, default=100, help="Maximum number of results to scrape (default: 100)")
    return parser.parse_args()


def get_config():
    load_dotenv()
    apify_token = os.environ.get("APIFY_API_TOKEN")
    if not apify_token:
        sys.exit(
            "APIFY_API_TOKEN not found. Add it to lead-scraper/.env as APIFY_API_TOKEN=your_token "
            "before running this script."
        )
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        sys.exit(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY not found. Add them to lead-scraper/.env "
            "before running this script."
        )
    return apify_token, supabase_url.rstrip("/"), supabase_key


# --- Apify -------------------------------------------------------------

def start_run(token, category, location, max_results):
    url = f"{APIFY_BASE_URL}/acts/{APIFY_ACTOR_ID}/runs"
    payload = {
        "searchStringsArray": [category],
        "locationQuery": location,
        "maxCrawledPlacesPerSearch": max_results,
        "language": "en",
    }
    resp = requests.post(url, params={"token": token}, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()["data"]
    print(f"Started Apify run {data['id']} (actor {APIFY_ACTOR_ID})")
    return data["id"]


def wait_for_run(token, run_id):
    url = f"{APIFY_BASE_URL}/actor-runs/{run_id}"
    waited = 0
    while waited < MAX_POLL_SECONDS:
        resp = requests.get(url, params={"token": token}, timeout=30)
        resp.raise_for_status()
        data = resp.json()["data"]
        status = data["status"]
        print(f"  run status: {status} ({waited}s elapsed)")
        if status in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
            if status != "SUCCEEDED":
                sys.exit(f"Apify run ended with status {status}, aborting.")
            return data["defaultDatasetId"]
        time.sleep(POLL_INTERVAL_SECONDS)
        waited += POLL_INTERVAL_SECONDS
    sys.exit(f"Apify run did not finish within {MAX_POLL_SECONDS}s, aborting.")


def fetch_dataset_items(token, dataset_id):
    url = f"{APIFY_BASE_URL}/datasets/{dataset_id}/items"
    resp = requests.get(url, params={"token": token, "format": "json"}, timeout=60)
    resp.raise_for_status()
    return resp.json()


# --- Cleaning ------------------------------------------------------------

def normalize_phone(raw):
    """Strip +91 / spaces / dashes and return a plain 10-digit number, or None if invalid."""
    if not raw:
        return None
    digits = re.sub(r"\D", "", str(raw))
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    return digits if len(digits) == 10 else None


def clean_records(raw_items, category):
    """Keep rows with a valid phone number and drop duplicate phones within this batch."""
    seen_phones = set()
    cleaned = []
    for item in raw_items:
        phone = normalize_phone(item.get("phoneUnformatted") or item.get("phone"))
        if not phone or phone in seen_phones:
            continue
        seen_phones.add(phone)
        emails = item.get("emails") or []
        cleaned.append(
            {
                "business_name": item.get("title") or "",
                "phone": phone,
                "category": item.get("categoryName") or category,
                "website": item.get("website") or None,
                "rating": item.get("totalScore"),
                "email": emails[0] if emails else None,
            }
        )
    return cleaned


# --- Supabase ------------------------------------------------------------

def fetch_existing_phones(supabase_url, service_key, phones):
    """Return the subset of `phones` that already exist in the leads table."""
    if not phones:
        return set()
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}
    params = {"select": "phone_number", "phone_number": f"in.({','.join(phones)})"}
    resp = requests.get(f"{supabase_url}/rest/v1/leads", headers=headers, params=params, timeout=30)
    resp.raise_for_status()
    return {row["phone_number"] for row in resp.json()}


def insert_leads(supabase_url, service_key, records, location):
    if not records:
        return 0
    today = date.today().isoformat()
    rows = [
        {
            "business_name": rec["business_name"],
            "phone_number": rec["phone"],
            "city_area": location,
            "category": rec["category"],
            "source": "Google Maps",
            "date_added": today,
            "status": "New",
            "website": rec["website"],
            "rating": rec["rating"],
            "email": rec["email"],
        }
        for rec in records
    ]
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    resp = requests.post(f"{supabase_url}/rest/v1/leads", headers=headers, json=rows, timeout=60)
    resp.raise_for_status()
    return len(resp.json())


# --- Main --------------------------------------------------------------

def main():
    args = parse_args()
    apify_token, supabase_url, supabase_key = get_config()

    print(f'Searching Google Maps for "{args.category}" in "{args.location}" (max {args.max})...')
    run_id = start_run(apify_token, args.category, args.location, args.max)
    dataset_id = wait_for_run(apify_token, run_id)
    raw_items = fetch_dataset_items(apify_token, dataset_id)
    scraped_count = len(raw_items)
    print(f"Scraped {scraped_count} places from Google Maps.")

    cleaned = clean_records(raw_items, args.category)
    dropped_in_batch = scraped_count - len(cleaned)

    known_phones = fetch_existing_phones(supabase_url, supabase_key, [r["phone"] for r in cleaned])
    new_records = [r for r in cleaned if r["phone"] not in known_phones]
    duplicate_existing = len(cleaned) - len(new_records)

    inserted = insert_leads(supabase_url, supabase_key, new_records, args.location)

    print("\nSummary")
    print("-------")
    print(f"Scraped from Google Maps:        {scraped_count}")
    print(f"Dropped (no/duplicate phone):    {dropped_in_batch}")
    print(f"Skipped (already in Supabase):   {duplicate_existing}")
    print(f"New leads added to Supabase:     {inserted}")


if __name__ == "__main__":
    main()
