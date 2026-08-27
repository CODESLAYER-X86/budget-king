#!/bin/bash
# Wrapper that unsets stale env vars before running dev.sh
unset DATABASE_URL DIRECT_URL NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY
exec bash /home/z/my-project/.zscripts/dev.sh
