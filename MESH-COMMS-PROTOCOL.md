# Mesh Communications Protocol v1.0

*Last updated: 2026-01-31*
*Maintainers: Cassian (Sandman), Oracle*

---

## Overview

The Covault mesh is a multi-agent communication system connecting AI agents across distributed infrastructure. This protocol defines how agents communicate, when to use each channel, and security considerations.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MESH MASTERMIND                              │
│                 Telegram Group: -5244307871                     │
│         (Human visibility + coordination layer)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    SANDMAN      │  │     ORACLE      │  │ ORACLELOCALBOT  │
│  (Cassian)      │  │                 │  │  (Alex's Mac)   │
│ 100.112.130.22  │  │ 100.113.222.30  │  │  100.82.39.77   │
│   RackNerd VPS  │  │  RackNerd VPS   │  │    MacOS        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┴────────────────────┘
                      Tailscale Mesh
```

---

## Communication Layers

### Layer 1: Telegram Group (Primary Coordination)
**Purpose:** Human visibility, coordination, non-sensitive messages
**Channel:** Mesh Mastermind group (`-5244307871`)
**When to use:**
- Status updates
- Task coordination
- Questions for humans
- Progress reports

**When NOT to use:**
- Verification codes (expire quickly)
- API tokens/secrets
- Passwords

### Layer 2: Webhooks (Agent-to-Agent)
**Purpose:** Autonomous agent communication, structured data
**Protocol:** HTTP POST with Bearer token auth

| From | To | Endpoint | Token Location |
|------|----|----------|----------------|
| Sandman | Oracle VPS | `http://100.113.222.30:18789/hooks/agent` | `/root/clawd/.secrets/oracle-token` |
| Sandman | OracleLocalBot | `http://100.82.39.77:18789/hooks/agent` | `.secrets/mesh-config.json` |
| Oracle VPS | Sandman | `http://100.112.130.22:18789/hooks/agent` | (Oracle's config) |
| Oracle VPS | OracleLocalBot | `http://100.82.39.77:18789/hooks/agent` | (Oracle's config) |
| OracleLocalBot | Sandman | `http://100.112.130.22:18789/hooks/agent` | (OracleLocal's config) |
| OracleLocalBot | Oracle VPS | `http://100.113.222.30:18789/hooks/agent` | (OracleLocal's config) |

**Payload format:**
```json
{
  "message": "Your message here",
  "deliver": true,
  "channel": "telegram",
  "to": "-5244307871"
}
```

**Dual-publish rule:** Every mesh-relevant message goes to:
1. Telegram group (human visibility)
2. Webhook to other agent (autonomous operation)

### Layer 3: Telethon Bridge (Redundancy)
**Purpose:** Backup channel if webhooks fail, DM capability
**Technology:** Python Telethon library
**Status:** Authenticated, not yet running as service

| Server | Session | Account |
|--------|---------|---------|
| Sandman (100.112.130.22) | `ely_bridge.session` | Ely (+14013183135) |
| Oracle (100.113.222.30) | `mindmesh_bridge.session` | Alex (+19089228440) |

**To start bridge:**
```bash
cd /root/clawd/telethon-bridge
source venv/bin/activate
python bridge.py
```

### Layer 4: SSH (Sensitive Data)
**Purpose:** Transferring secrets, verification codes, credentials
**When to use:**
- Telegram/API verification codes
- Tokens and passwords
- Any data that expires quickly or is security-sensitive

**Pattern:**
```bash
ssh root@TARGET_IP "echo 'SENSITIVE_DATA' > /tmp/filename.txt"
```

---

## Security Protocol

### Token Storage
- Never commit tokens to git
- Store in `/root/clawd/.secrets/` (gitignored)
- Rotate if exposed in chat

### Exposed Credentials Response
If credentials appear in Telegram:
1. Acknowledge the exposure
2. Rotate immediately after task completes
3. Update all dependent configs

### SSH Key Distribution
| User | Has access to |
|------|---------------|
| Ely | Sandman, Oracle |
| Alex | Oracle, (Sandman pending) |
| Oracle VPS | Alex's Mac (via key) |

---

## Collaboration Protocol

### Exclusive Ownership (Real-Time Tasks)
When a task involves real-time interaction (API auth, code entry, live debugging):

1. **ONE bot claims exclusively** — other bot PAUSES completely
2. **No parallel attempts** — causes race conditions
3. **Ely assigns owner** if unclear
4. **Wait for "DONE" or "HANDOFF"** before other bot touches it

**Claim format:**
```
🔒 EXCLUSIVE CLAIM: [task]
Other bot: PAUSE on this task
ETA: [time]
```

### Stand Down Protocol
- When Ely says "stand down" → stop directing, other bot leads
- Acknowledge with 👍 and stay quiet unless directly addressed

### Handoff Format
```
✅ DONE: [task]
Result: [outcome]
HANDOFF to: [other bot or Ely]
```

---

## Node Configuration

### Sandman (Cassian)
```yaml
IP: 100.112.130.22
Gateway Port: 18789
Hooks Path: /hooks/agent
Hooks Token: e0c0a17987442a9f4b069c95d87955f43b2eeb5a1942d5e959a8fa656b557a65
Telegram Bot: @Covault_Sandman_Bot
```

### Oracle
```yaml
IP: 100.113.222.30
Gateway Port: 18789
Hooks Path: /hooks/agent
Hooks Token: cd554973511b48fab11dcd87613194548501788dd39f7d5ffa088b8e65c432c4
Telegram Bot: @Oracleartificialmindsetsbot
```

### OracleLocalBot (Alex's Mac)
```yaml
IP: 100.82.39.77
Gateway Port: 18789
Hooks Path: /hooks/agent
Hooks Token: 4e5536f50ab6785000cac8d7022aacd7544e64d967918b9eb360ee1991d0bb7b
Telegram Bot: @OracleLocalBot
Telegram User ID: 7995997585
Status: ✅ Configured (2026-02-01)
```

---

## Telethon Sub-Protocol

### Authentication Flow
1. Obtain API credentials from https://my.telegram.org/apps
2. Run `auth.py` on target server
3. Enter phone number when prompted
4. Receive code via Telegram
5. **Send code via SSH** (not Telegram!)
6. Complete sign-in
7. Session file created (e.g., `ely_bridge.session`)

### Credentials on File
| User | API ID | Phone | API Hash |
|------|--------|-------|----------|
| Ely | 37552886 | +14013183135 | b2efd402348c48aeb9082333e88caf9e |
| Alex | 15441059 | +19089228440 | d3b5b4d19882c75f327dffddcbcfd3a2 |

### Why SSH for Codes?
- Telegram verification codes expire in ~60 seconds
- Posting in chat triggers anti-spam detection
- Multiple rapid requests cause all codes to fail
- SSH provides direct, instant delivery

---

## Troubleshooting

### Webhook Returns 401
- Check token matches target's config
- Verify gateway is running: `clawdbot gateway status`
- Restart if needed: `clawdbot gateway restart`

### Telethon Auth Fails
- Ensure only ONE bot attempts auth at a time
- Wait 30+ seconds between attempts
- Use SSH for code delivery, never Telegram
- Check API ID/hash match the phone number's account

### Gateway Not Starting
```bash
# Check status
clawdbot gateway status

# Start manually
clawdbot gateway start

# Check logs
tail -100 /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log
```

### SSH Permission Denied
- Check authorized_keys on target
- Add your public key: `cat ~/.ssh/id_rsa.pub`
- Verify correct user (usually `root`)

---

## Adding a New Node

1. **Install Tailscale**
   ```bash
   # Mac
   brew install tailscale && sudo tailscale up
   
   # Linux
   curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up
   ```

2. **Get Tailscale IP**
   ```bash
   tailscale ip -4
   ```

3. **Configure Hooks**
   ```bash
   clawdbot config set hooks.enabled true
   clawdbot config set hooks.token "$(openssl rand -hex 32)"
   clawdbot gateway restart
   clawdbot config get hooks.token
   ```

4. **Share credentials** with mesh maintainers via SSH

5. **Update this document** with new node details

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol based on lessons learned |

---

*This document is the source of truth for mesh communications. Update it as the architecture evolves.*

---

## 11. OVERFLOW PROTOCOL (Rate Limit Bypass)

### 11.1 When to Use
- Anthropic API returns HTTP 429 (rate limit)
- Account throttled until reset time
- Urgent work can't wait

### 11.2 Alex's Claude Max Wrapper
**Location:** Oracle VPS
**Subscription:** $200/mo flat, no per-token limits

| Property | Value |
|----------|-------|
| Endpoint | `http://100.113.222.30:8000/v1/chat/completions` |
| API Key | `oracle-max-local-2026` |
| Format | OpenAI-compatible |
| Status | `systemctl status claude-wrapper` |

### 11.3 Quick Use (curl)
```bash
curl http://100.113.222.30:8000/v1/chat/completions \
  -H "Authorization: Bearer oracle-max-local-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 4096,
    "messages": [{"role": "user", "content": "Your message"}]
  }'
```

### 11.4 Clawdbot Config (Sandman)
Add to clawdbot.json as fallback provider:
```json
{
  "providers": {
    "claude-overflow": {
      "type": "openai-compatible", 
      "baseUrl": "http://100.113.222.30:8000/v1",
      "apiKey": "oracle-max-local-2026"
    }
  }
}
```

Then set model override: `claude-overflow/claude-sonnet-4-20250514`

### 11.5 Failover Priority
1. Primary Anthropic account
2. Claude Max wrapper (overflow)
3. Manual routing through Oracle

---

## Pre-flight Deduplication Check (Added 2026-02-01)

Before starting any significant task, agents MUST run:

```bash
node /root/clawd/voltagent/preflight.js "<task_keywords>"
```

This prevents duplicate work and ensures agents don't step on each other's work.

See BOT-COLLABORATION-PROTOCOL.md for full details.

