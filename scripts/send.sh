#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/send.sh <issue-slug>"
  echo ""
  echo "Example: ./scripts/send.sh 2026-03-03-welcome"
  exit 1
fi

SLUG="$1"
API_URL="${SITE_URL:-http://localhost:3000}"
API_KEY="${SEND_API_KEY}"

if [ -z "$API_KEY" ]; then
  echo "Error: SEND_API_KEY environment variable is not set"
  exit 1
fi

echo "Sending issue: $SLUG"
echo "API URL: $API_URL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/send" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{\"slug\": \"$SLUG\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "Success: $BODY"
else
  echo "Error ($HTTP_CODE): $BODY"
  exit 1
fi
