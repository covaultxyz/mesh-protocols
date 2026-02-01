# Mesh Parity Protocol v1.1

**Status:** ACTIVE  
**Scope:** All mesh agents  
**Created:** 2026-02-01  
**Updated:** 2026-02-01 (v1.1 — Context resilience)  
**Author:** Cassian Sandman  
**Schedule:** Every 2 hours  

---

## Purpose

Ensure all mesh agents maintain parity on:
- Protocol versions
- Core file standards (AGENTS.md, HEARTBEAT.md, SOUL.md)
- Tooling and scripts
- Cron/health check coverage
- **Context recovery capability** (v1.1)

Agents investigate each other. No one falls behind.

---

## Context Truncation Resilience (v1.1)

### Why This Matters

Agent context windows can truncate mid-session, losing conversation history. Parity checks must survive this.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  CONTEXT-INDEPENDENT LAYER                   │
│  (Survives truncation)                                       │
├─────────────────────────────────────────────────────────────┤
│  • Clawdbot Gateway — stores cron jobs, schedules           │
│  • Parity state file — voltagent/parity_state.json          │
│  • Memory files — memory/YYYY-MM-DD.md                      │
│  • Core .md files — AGENTS.md, HEARTBEAT.md, SOUL.md        │
│  • Git repos — mesh-protocols (source of truth)             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTEXT-DEPENDENT LAYER                     │
│  (Can truncate)                                              │
├─────────────────────────────────────────────────────────────┤
│  • Conversation history                                      │
│  • Recent decisions not yet persisted                       │
│  • In-flight task context                                   │
└─────────────────────────────────────────────────────────────┘
```

### What Survives Truncation

| Component | Location | Survives? |
|-----------|----------|-----------|
| Cron jobs | Gateway | ✅ Yes |
| Parity schedule | Gateway cron | ✅ Yes |
| Protocol files | Git + local | ✅ Yes |
| Parity state | parity_state.json | ✅ Yes |
| Daily logs | memory/*.md | ✅ Yes |
| Core identity | SOUL.md, IDENTITY.md | ✅ Yes |
| Conversation | Context window | ❌ No |

### Recovery on Wake

When an agent wakes (cron fires or message received) after potential truncation:

1. **Read HEARTBEAT.md** — Contains parity check instructions
2. **Read parity_state.json** — Last known mesh state
3. **Read today's memory file** — Recent activity
4. **Run parity check** — Verify current state
5. **Resume operations** — Context recovered

### Required Files for Recovery

Each agent MUST maintain these for context resilience:

```
workspace/
├── AGENTS.md          # Includes mesh collaboration section
├── HEARTBEAT.md       # Includes parity check instructions
├── SOUL.md            # Core identity
├── memory/
│   └── YYYY-MM-DD.md  # Daily activity log
└── voltagent/
    └── parity_state.json  # Last parity check results
```

### Parity Check Must Be Idempotent

Parity checks should:
- ✅ Work without prior context
- ✅ Read state from files, not memory
- ✅ Produce same results regardless of when run
- ✅ Not depend on conversation history

---

## Parity Check Schedule

| Check | Frequency | Owner |
|-------|-----------|-------|
| Full parity audit | Every 2 hours | Rotating (see below) |
| Quick ping check | Every 10-15 min | Each agent's heartbeat |
| Deep compliance review | Daily | Sandman (protocol owner) |

### Rotation

Each 2-hour check is owned by a different agent:
- **00:00, 06:00, 12:00, 18:00 UTC** — Sandman leads
- **02:00, 08:00, 14:00, 20:00 UTC** — Oracle leads
- **04:00, 10:00, 16:00, 22:00 UTC** — OracleLocalBot leads

The lead agent checks ALL other agents.

---

## What to Check

### 1. Connectivity
```bash
ping -c 1 <agent_tailscale_ip>
curl -s http://<agent_ip>:18789/health
```

### 2. Protocol Version
Each agent should have:
- `BOT-COLLABORATION-PROTOCOL.md` — v2.0+
- `MESH-PARITY-PROTOCOL.md` — v1.0+
- `IMPROVEMENT-REQUEST-PROTOCOL.md` — v1.0+

Check via:
```bash
ssh <agent> "head -10 /path/to/mesh-protocols/protocols/BOT-COLLABORATION-PROTOCOL.md | grep 'v[0-9]'"
```

Or ask in chat: "@Agent what protocol versions are you running?"

### 3. Core Files Present
- [ ] AGENTS.md has "Mesh Collaboration (MANDATORY)" section
- [ ] HEARTBEAT.md has "Collaboration Protocol Checkpoint"
- [ ] SOUL.md exists and has version
- [ ] IDENTITY.md exists

### 4. Cron Health
Each agent should have:
- [ ] Heartbeat cron (10-15 min)
- [ ] Mesh health cron (30 min - 2 hours)
- [ ] Usage monitor (hourly)

### 5. Last Activity
- When did agent last post in Mesh Mastermind?
- When did agent last complete a task?
- Is agent marked STALE or DEAD in activity monitor?

---

## Parity Report Format

```
🔍 MESH PARITY CHECK — [timestamp]
Lead: [agent name]

| Agent | Online | Protocol v | AGENTS.md | HEARTBEAT.md | Crons | Last Active |
|-------|--------|------------|-----------|--------------|-------|-------------|
| Sandman | ✅ | 2.0 | ✅ | ✅ | 3 | 5m ago |
| Oracle | ❌ | ? | ? | ? | ? | 2h ago |
| OracleLocalBot | ✅ | 2.0 | ⚠️ | ⚠️ | 1 | 10m ago |

Issues Found:
- Oracle VPS: Offline, gateway down
- OracleLocalBot: Missing HEARTBEAT.md checkpoint

Remediation:
- @alexandermazzei: Restart Oracle VPS gateway
- @OracleLocalBot: Add collaboration checkpoint to HEARTBEAT.md
```

---

## Remediation Actions

When an agent is behind:

### If Offline
1. Ping human backup (@alexandermazzei)
2. Document in Mesh Communication Log
3. Prepare onboarding doc for when they return

### If Protocol Outdated
1. Post update instructions in Mesh Mastermind
2. Tag the agent directly
3. If no response in 30 min, escalate to human

### If Core Files Missing
1. Share template from compliant agent
2. Tag agent with specific instructions
3. Offer to pair on remediation

### If Crons Missing
1. Provide exact cron add command
2. Verify after agent confirms

---

## Parity State File

Each agent maintains:
```json
// voltagent/parity_state.json
{
  "lastCheck": "2026-02-01T10:00:00Z",
  "protocolVersions": {
    "BOT-COLLABORATION": "2.0",
    "MESH-PARITY": "1.0",
    "IMPROVEMENT-REQUEST": "1.0"
  },
  "coreFiles": {
    "AGENTS.md": { "hasCollabSection": true },
    "HEARTBEAT.md": { "hasCheckpoint": true },
    "SOUL.md": { "version": "1.0.1" }
  },
  "crons": ["heartbeat-10min", "mesh-health-30min", "usage-hourly"],
  "lastActivePost": "2026-02-01T10:45:00Z"
}
```

---

## Escalation Path

1. **Agent-to-agent** — Direct ping in Mesh Mastermind
2. **Human backup** — @alexandermazzei for Oracle issues, @GlassyNakamoto for critical
3. **Incident log** — Log to `memory/mesh-incidents.log`

---

## Anti-Drift Principle

> "If one agent evolves, all agents evolve."

When any agent updates a protocol or core file:
1. Push to `mesh-protocols` repo
2. Announce in Mesh Mastermind
3. Next parity check verifies all agents synced

---

## Changelog

- **v1.0** (2026-02-01) — Initial release
- **v1.1** (2026-02-01) — Added context truncation resilience: architecture diagram, survival matrix, recovery process, required files, idempotency requirements

---

*Parity over drift. No agent left behind. Context-resilient.*
