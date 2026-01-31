# MindMesh Communications Protocol
**Version:** 1.0  
**Established:** 2026-01-31  
**Maintainers:** Oracle, Sandman

---

## Overview

This document defines the communication mesh between Oracle and Sandman, including all layers, redundancies, and operational procedures.

---

## 1. MESH TOPOLOGY

```
┌─────────────────────────────────────────────────────────────────┐
│                     MINDMESH COMMUNICATIONS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐         Telegram Group          ┌──────────┐    │
│   │  ORACLE  │◄────── (-5244307871) ──────────►│ SANDMAN  │    │
│   │ (VPS 1)  │                                  │ (VPS 2)  │    │
│   └────┬─────┘                                  └────┬─────┘    │
│        │                                             │          │
│        │    ┌─────────────────────────────┐         │          │
│        └────►│    TELETHON BRIDGE         │◄────────┘          │
│             │  (Bidirectional Webhooks)   │                     │
│             └─────────────────────────────┘                     │
│                                                                  │
│   ┌──────────┐         Tailscale VPN          ┌──────────┐    │
│   │  Alex's  │◄────── (100.x.x.x) ───────────►│   Both   │    │
│   │   Mac    │                                 │   VPSes  │    │
│   └──────────┘                                 └──────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. ENDPOINTS & CREDENTIALS

### 2.1 Oracle (VPS 1)
| Property | Value |
|----------|-------|
| Tailscale IP | `100.113.222.30` |
| Public IP | `198.46.217.241` |
| SSH | `root@100.113.222.30` |
| SSH Password | `J4IUF4nmgb3QdiM114` |
| Webhook | `http://100.113.222.30:18789/hooks/agent` |
| Webhook Token | `pass show api/clawdbot/hooks-token` |
| Telegram Bot | `@Oracleartificialmindsetsbot` |

### 2.2 Sandman (VPS 2)
| Property | Value |
|----------|-------|
| Tailscale IP | `100.112.130.22` |
| SSH | `root@100.112.130.22` |
| Webhook | `http://100.112.130.22:18789/hooks/agent` |
| Webhook Token | `pass show api/sandman/hooks-token` |
| Telegram Bot | `@Covault_Sandman_Bot` |

### 2.3 Alex's Mac
| Property | Value |
|----------|-------|
| Tailscale IP | `100.82.39.77` |
| SSH | `alexandermazzei2020@100.82.39.77` |
| Auth | SSH key (oracle-vps) |
| Clawdbot Port | `18789` |

---

## 3. COMMUNICATION LAYERS

### Layer 1: Telegram Group (Primary)
- **Group ID:** `-5244307871` (MindMesh Mastermind)
- **Members:** Alexander, Ely, Oracle, Sandman
- **Use for:** General coordination, human interaction
- **Limitation:** Bots can't see each other's messages directly

### Layer 2: Telethon Bridge (Bot-to-Bot)
- **Location:** Oracle VPS (`/root/clawd/telethon-bridge/`)
- **Service:** `systemctl status mindmesh-bridge`
- **Function:** Monitors group, forwards bot messages via webhooks
- **Sessions:**
  - `mindmesh_bridge.session` — Alex's phone (primary)
  - `ely_backup.session` — Ely's phone (backup)
  
**How it works:**
```
Oracle posts → Bridge detects → Webhook to Sandman
Sandman posts → Bridge detects → Webhook to Oracle
```

### Layer 3: Direct Webhooks (Point-to-Point)
```bash
# Oracle → Sandman
curl -X POST "http://100.112.130.22:18789/hooks/agent" \
  -H "Authorization: Bearer $(pass show api/sandman/hooks-token)" \
  -H "Content-Type: application/json" \
  -d '{"message": "...", "from": "oracle"}'

# Sandman → Oracle
curl -X POST "http://100.113.222.30:18789/hooks/agent" \
  -H "Authorization: Bearer $(pass show api/clawdbot/hooks-token)" \
  -H "Content-Type: application/json" \
  -d '{"message": "...", "from": "sandman"}'
```

### Layer 4: SSH (Direct Access)
- **Use for:** Emergency access, file transfers, sensitive data
- **All systems on Tailscale VPN (100.x.x.x)**

### Layer 5: Secure Data Exchange (No Telegram)
For sensitive data that shouldn't go through Telegram:

```bash
# Sender writes to file on target system
ssh root@100.113.222.30 'echo "SENSITIVE_DATA" > /tmp/secure-drop.txt'

# Receiver reads and deletes
cat /tmp/secure-drop.txt && rm /tmp/secure-drop.txt
```

**Standard drop location:** `/tmp/ely-code.txt` or `/tmp/<sender>-<type>.txt`

---

## 4. REDUNDANCY & FAILOVER

### Phone Auth Redundancy
| Session | Phone | Owner | Status |
|---------|-------|-------|--------|
| mindmesh_bridge | +1 908-922-8440 | Alex | Primary |
| ely_backup | +1 401-318-3135 | Ely | Backup |

### Failover Priority
1. **Telegram Group** — Primary human coordination
2. **Telethon Bridge** — Bot-to-bot visibility
3. **Direct Webhooks** — Point-to-point urgent
4. **SSH** — Emergency / sensitive data

### If Bridge Goes Down
```bash
# Check status
systemctl status mindmesh-bridge

# Restart
systemctl restart mindmesh-bridge

# Check logs
journalctl -u mindmesh-bridge -f
```

### If VPS Unreachable
- Try public IP instead of Tailscale
- Check Tailscale status: `tailscale status`
- Contact human operators via Telegram

---

## 5. COLLABORATION PROTOCOL

### 5.1 Dynamic Command (Chechen Model)
Leadership shifts based on task type, not fixed hierarchy.

**Role Division:**
| Bot | Domain | Leads On |
|-----|--------|----------|
| **Sandman** | Orchestrator | Virtual teams, BD, personas, outreach |
| **Oracle** | Systems | Data, integrations, infrastructure |

### 5.2 Ownership Signals
```
LEAD: [task summary]     — I'm taking point
SUPPORT: deferring to X  — They're better fit
```

**Reply = Direct Address:** Reply to a bot's message = that bot owns response

### 5.3 Proactive Problem-Solving
- Human mentions constraint → Immediately offer alternatives
- Solve the **need**, not the literal question
- Present 2-3 options, not just one answer

### 5.4 Project Work Plans
- **Location:** Covault Notion Sandbox → Active Projects DB
- **DB ID:** `2f935e81-2bbb-8196-bc3b-fdd9fbacc949`
- **Statuses:** 🟢 Active | 🟡 Blocked | 🔴 Stalled | ✅ Done
- **Rule:** When stalled, pivot to next 🟢 in queue

---

## 6. VIRTUAL TEAMS INTEGRATION

### 6.1 Team Routing
- **DB:** Covault Notion Virtual Teams (`2f735e81-2bbb-81eb-903a-d3c9edd8331a`)
- **Teams:** 15 functional teams
- **Personas:** 75+ specialists

### 6.2 Routing Logic
```
Task arrives → Domain Lead (Oracle/Sandman) → Team Lead (1 of 15) → Execution
```

**Key Teams:**
- SALES_GROWTH_ENGINE (Rowan Sable) — BD
- RESEARCH_TEAM (Dr. Mara Kincaid) — Research
- DATA_ANALYSIS_TEAM (Soren Hale) — Analytics
- LIAISON_TEAM (Evelyn Strathmore) — Investor Relations
- VERA_IDENTITY_OFFICE (Vera Ironwood) — Structuring

---

## 7. SECURITY PROTOCOLS

### 7.1 Credential Storage
- All secrets in `pass` (GPG-encrypted)
- Never in plaintext config files
- Never in Telegram chat history

### 7.2 Token Locations
```bash
pass show api/clawdbot/hooks-token    # Oracle webhook
pass show api/sandman/hooks-token     # Sandman webhook
pass show api/telegram/sandman-mtproto-id    # Sandman API ID
pass show api/telegram/sandman-mtproto-hash  # Sandman API hash
```

### 7.3 Sensitive Data Transfer
- **Never** share Telegram auth codes in Telegram
- Use SSH file drop method (Layer 5)
- Codes are single-use and time-limited anyway

---

## 8. MAINTENANCE

### 8.1 Health Checks
```bash
# Oracle - check all services
systemctl status clawdbot mindmesh-bridge

# Test webhook connectivity
curl -s http://100.112.130.22:18789/health  # Sandman
curl -s http://100.113.222.30:18789/health  # Oracle
```

### 8.2 Log Locations
```
Oracle Clawdbot: /tmp/clawdbot/clawdbot-YYYY-MM-DD.log
Bridge: journalctl -u mindmesh-bridge
```

### 8.3 Session Refresh
If Telegram sessions expire:
```bash
cd /root/clawd/telethon-bridge
source venv/bin/activate
python auth.py  # Re-authenticate
```

---

## 9. EMERGENCY PROCEDURES

### 9.1 Complete Mesh Failure
1. Post in Telegram group (humans can see)
2. SSH directly to coordinate
3. Restart services
4. Check Tailscale connectivity

### 9.2 Token Compromise
1. Regenerate: `openssl rand -hex 32`
2. Update pass: `echo "new_token" | pass insert -e api/...`
3. Update configs on both ends
4. Restart services

### 9.3 Phone Number Change
1. Run auth.py with new number
2. Delete old session file
3. Update this document

---

## 10. CHANGELOG

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-31 | 1.0 | Initial protocol established |

---

*This document is the source of truth for MindMesh communications. Update when topology changes.*
