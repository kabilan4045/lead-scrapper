-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query)
-- to create the leads table used by the dashboard app.

create table if not exists leads (
  id                bigint generated always as identity primary key,
  business_name     text not null,
  contact_person    text,
  phone_number      text not null,
  city_area         text,
  category          text,
  source            text,
  date_added        date not null default current_date,
  assigned_to       text check (assigned_to is null or assigned_to in ('Me', 'Friend 1', 'Friend 2')),
  status            text not null default 'New' check (
                      status in ('New', 'Contacted', 'Follow-up', 'Interested', 'Not Interested', 'Closed-Won', 'Closed-Lost')
                    ),
  follow_up_date    date,
  deal_value        numeric(12, 2),
  domain_name       text,
  payment_received  boolean not null default false,
  site_delivered    boolean not null default false,
  notes             text,
  website           text,
  rating            numeric(2, 1) check (rating is null or (rating >= 0 and rating <= 5)),
  email             text,
  created_at        timestamptz not null default now()
);

-- One row per phone number, mirroring the dedup rule the original Excel
-- scraper used ("drop any scraped row whose phone number already exists").
-- Remove this if you'd rather allow duplicate phone numbers.
create unique index if not exists leads_phone_number_key on leads (phone_number);

create index if not exists leads_status_idx on leads (status);
create index if not exists leads_assigned_to_idx on leads (assigned_to);
create index if not exists leads_city_area_idx on leads (city_area);

-- Row Level Security is enabled with NO policies attached, on purpose:
-- the Next.js app only ever talks to Supabase from server-side Route
-- Handlers using the service_role key, which bypasses RLS entirely. The
-- anon/public key is never used by this app, so there is nothing for a
-- public policy to grant access to.
alter table leads enable row level security;
