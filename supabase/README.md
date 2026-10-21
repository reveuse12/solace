# Solace Supabase setup

The migration in `migrations/001_solace_schema.sql` creates the application data model for profiles, intentions, reflections, listening progress, favorites, and reminders.

Clerk remains the identity provider. Before using the browser Supabase client for user-owned reads and writes, configure Clerk as a Supabase third-party JWT provider and issue a Clerk JWT template for Supabase. Until that is configured, server routes must verify the Clerk session first and pass the verified `sub` when writing data.

Apply the migration from this app directory after linking the intended Supabase project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```
