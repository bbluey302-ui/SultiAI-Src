#!/bin/bash
# Helper script to create a confirmed user in Supabase (development only).
#
# Usage:
#   SUPABASE_SERVICE_ROLE_KEY=... ./scripts/supabase-confirm-user.sh email password "Full Name"
#
# The service-role key is deliberately NOT stored in this file. Read it from
# your local .env or export it in the shell for the duration of the command.
# Never commit the key, and never prefix it with EXPO_PUBLIC_ or VITE_.

set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:-https://pptanwtuybivlqeyntwh.supabase.co}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "SUPABASE_SERVICE_ROLE_KEY is not set." >&2
  echo "Export it for this command only, for example:" >&2
  echo "  SUPABASE_SERVICE_ROLE_KEY=... $0 email password \"Full Name\"" >&2
  exit 1
fi

EMAIL="${1:-}"
PASSWORD="${2:-}"
FULL_NAME="${3:-}"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ] || [ -z "$FULL_NAME" ]; then
  echo "Usage: $0 email password \"Full Name\"" >&2
  exit 1
fi

if [ "${#PASSWORD}" -lt 8 ]; then
  echo "Password must be at least 8 characters (Supabase project policy)." >&2
  exit 1
fi

echo "Creating confirmed user: $EMAIL"

RESULT=$(curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"$FULL_NAME\"}}")

if echo "$RESULT" | grep -q '"id"'; then
  USER_ID=$(echo "$RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "✅ User created and confirmed!"
  echo "   Email: $EMAIL"
  echo "   User ID: $USER_ID"
  echo ""
  echo "You can now sign in with these credentials in the app."
else
  echo "❌ Failed to create user:"
  echo "$RESULT"
  exit 1
fi
