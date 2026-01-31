#!/bin/bash
# Activity Logger — Track agent actions for learning and audit
# Usage: activity-logger.sh <category> <action> <details>

ACTIVITY_LOG="/root/clawd/logs/activity.jsonl"
mkdir -p /root/clawd/logs

TIMESTAMP=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
AGENT="${AGENT_NAME:-oracle}"
CATEGORY="${1:-general}"
ACTION="${2:-unknown}"
DETAILS="${3:-}"
SESSION_ID="${SESSION_ID:-$(date +%Y%m%d)}"

# Create JSON entry
JSON=$(jq -n \
  --arg ts "$TIMESTAMP" \
  --arg agent "$AGENT" \
  --arg session "$SESSION_ID" \
  --arg cat "$CATEGORY" \
  --arg action "$ACTION" \
  --arg details "$DETAILS" \
  '{timestamp: $ts, agent: $agent, session: $session, category: $cat, action: $action, details: $details}')

# Append to log
echo "$JSON" >> "$ACTIVITY_LOG"

# Also append human-readable to daily notes
DAILY_LOG="/root/clawd/memory/$(date +%Y-%m-%d).md"
echo "- $TIMESTAMP | $CATEGORY | $ACTION | $DETAILS" >> "$DAILY_LOG" 2>/dev/null

echo "✅ Logged: $CATEGORY/$ACTION"
