#!/bin/bash
# Mesh Health Check - runs via cron, alerts on failure
# Location: /root/clawd/scripts/mesh-health-check.sh

LOG="/var/log/mesh-health.log"
ALERT_CHAT="-5244307871"
BOT_TOKEN=$(pass show api/telegram-alerts 2>/dev/null || pass show api/telegram)

# Timestamp
TS=$(date -u '+%Y-%m-%d %H:%M UTC')

# Track failures
FAILURES=""

# 1. Check Clawdbot gateway
if ! systemctl is-active --quiet clawdbot; then
    FAILURES+="❌ Clawdbot gateway DOWN\n"
fi

# 2. Check Telethon bridge
if ! systemctl is-active --quiet telethon-bridge; then
    FAILURES+="❌ Telethon bridge DOWN\n"
fi

# 3. Check webhook endpoint responds (local test)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "http://localhost:18789/hooks/agent" \
    -H "Authorization: Bearer $(pass show api/clawdbot/hooks-token)" \
    -H "Content-Type: application/json" \
    -d '{"message":"health-check","from":"cron"}' 2>/dev/null)

if [ "$HTTP_CODE" != "202" ] && [ "$HTTP_CODE" != "200" ]; then
    FAILURES+="❌ Webhook endpoint error (HTTP $HTTP_CODE)\n"
fi

# 4. Check Sandman reachability (just TCP, no auth)
if ! timeout 5 bash -c "echo > /dev/tcp/100.112.130.22/18789" 2>/dev/null; then
    FAILURES+="⚠️ Sandman VPS unreachable (port 18789)\n"
fi

# Log result
if [ -z "$FAILURES" ]; then
    echo "$TS ✅ All checks passed" >> $LOG
else
    echo "$TS FAILURES:" >> $LOG
    echo -e "$FAILURES" >> $LOG
    
    # Send Telegram alert
    if [ -n "$BOT_TOKEN" ]; then
        MSG="🚨 *Mesh Health Alert* ($TS)\n\n$FAILURES\nFrom: Oracle VPS"
        curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
            -d "chat_id=$ALERT_CHAT" \
            -d "text=$(echo -e "$MSG")" \
            -d "parse_mode=Markdown" > /dev/null
    fi
fi

# Rotate log if > 1MB
if [ -f "$LOG" ] && [ $(stat -f%z "$LOG" 2>/dev/null || stat -c%s "$LOG") -gt 1048576 ]; then
    mv "$LOG" "${LOG}.old"
fi
