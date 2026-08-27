#!/bin/bash
cd /home/z/my-project
unset DATABASE_URL DIRECT_URL NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY

# Hard-set the correct env vars (must match .env)
export DATABASE_URL="postgresql://postgres.refvbywkcscqtbhdzzdd:ouV88hsukRbS0lgo@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
export DIRECT_URL="postgresql://postgres.refvbywkcscqtbhdzzdd:ouV88hsukRbS0lgo@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
export NEXT_PUBLIC_SUPABASE_URL="https://refvbywkcscqtbhdzzdd.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZnZieXdrY3NjcXRiaGR6emRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NTMwMjQsImV4cCI6MjEwMzQyOTAyNH0.7aIN5DV93Rb_Uq7OM_H8MbDirnR8WsCVQ1u7HUN2LMA"
export SUPABASE_SERVICE_ROLE_KEY="ouV88hsukRbS0lgo"

exec bun run dev
