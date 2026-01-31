#!/bin/bash
# Mesh Health Check - Sandman's version (checks Oracle)
# Add to cron: */10 * * * * /path/to/mesh-health-check-sandman.sh

LOG="/var/log/mesh-health.log"
ALERT_CHAT="-5244307871"
BOT_TOKEN=$(pass show api/telegram 2>/dev/null)

TS=$(date -u '+%Y-%m-%d %H:%M UTC')
FAILURES=""

# 1. Check Clawdbot gateway
if ! systemctl is-active --quiet clawdbot; then
    FAILURES+="❌ Clawdbot gateway DOWN\n"
fi

# 2. Check local webhook endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "http://localhost:18789/hooks/agent" \
    -H "Authorization: Bearer $(pass show clawdbot/hooks-token 2>/dev/null || echo 'no-token')" \
    -H "Content-Type: application/json" \
    -d '{"message":"health-check","from":"cron"}' 2>/dev/null)

if [ "$HTTP_CODE" != "202" ] && [ "$HTTP_CODE" != "200" ]; then
    FAILURES+="❌ Local webhook error (HTTP $HTTP_CODE)\n"
fi

# 3. Check Oracle VPS reachability
if ! timeout 5 bash -c "echo > /dev/tcp/100.113.222.30/18789" 2>/dev/null; then
    FAILURES+="⚠️ Oracle VPS unreachable (port 18789)\n"
fi

# Log result
if [ -z "$FAILURES" ]; then
    echo "$TS ✅ All checks passed" >> $LOG
else
    echo "$TS FAILURES:" >> $LOG
    echo -e "$FAILURES" >> $LOG
    
    # Send Telegram alert
    if [ -n "$BOT_TOKEN" ]; then
        MSG="🚨 *Mesh Health Alert* ($TS)\n\n$FAILURES\nFrom: Sandman VPS"
        curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
            -d "chat_id=$ALERT_CHAT" \
            -d "text=$(echo -e "$MSG")" \
            -d "parse_mode=Markdown" > /dev/null
    fi
fi
