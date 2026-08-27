#!/bin/bash
# Wrapper that unsets stale env vars before starting dev
unset DATABASE_URL
unset DIRECT_URL
unset NEXT_PUBLIC_SUPABASE_URL
unset NEXT_PUBLIC_SUPABASE_ANON_KEY
unset SUPABASE_SERVICE_ROLE_KEY
cd /home/z/my-project
exec bun run dev
