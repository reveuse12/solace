-- Incremental migration for account privacy consent.
-- Safe to run after 001_solace_schema.sql.
alter table public.profiles add column if not exists privacy_consent_at timestamptz;
alter table public.profiles add column if not exists privacy_consent_version text;
