# HEARTBEAT.md

## 🚨 MANDATORY: Collaboration Protocol First

**Before ANY task, ALWAYS:**

1. **Read protocol:** `mesh-protocols/protocols/BOT-COLLABORATION-PROTOCOL.md`
2. **Check domain registry:** Is this MY domain or another bot's?
3. **Run preflight:** `node /root/clawd/voltagent/preflight.js "task description"`
4. **Post claim in Mesh Mastermind:** Wait 30-60s for conflicts
5. **Check if other bot is busy:** If so, offer support instead of racing

**Domain Ownership (v2.0):**
- **Sandman:** Intelligence, personas, creative, Virtual Teams, protocol drafting
- **Oracle:** Systems, infra, Notion API, databases, GitHub, deployments
- **OracleLocalBot:** Local Mac tasks, camera, screen

**NO DUPLICATE WORK. One task, one owner.**

If another bot is already working on something related:
- Don't start the same task
- Ask if they need support
- Pick a different task from the queue

---

## 10-Minute Check-In Protocol

**RULE: Never ask "what's next" — always check work queue first.**

Every heartbeat, run these checks:

### 1. Collaboration Check (FIRST!)
```bash
# Check what other bots are working on
# Read recent Mesh Mastermind messages
# Don't duplicate claimed tasks
```

### 2. Record Activity
```bash
node /root/clawd/voltagent/activity_monitor.js record Sandman heartbeat
```

### 3. Check Mesh Status
```bash
/root/clawd/voltagent/mesh_status.sh
```

### 4. VoltAgent Cycle
```bash
node /root/clawd/voltagent/priority_engine.js cycle 3
```

### 5. Gateway Health
```bash
clawdbot gateway status
```

### 6. Apply Decay (hourly)
```bash
node /root/clawd/voltagent/decay_calculator.js
```

### 7. Daily Memory Update (every 4 heartbeats / ~40 min)
```bash
node /root/clawd/voltagent/daily_memory_update.js status
```

---

## Task Claiming Format

When claiming a task:
```
🎯 CLAIMING: [Task Name]
👤 Owner: Sandman
📍 Location: [file/db/page]
⏱️ ETA: X min

[Brief description]
```

When completing:
```
✅ [Task Name] COMPLETE
[Summary of deliverables]
📊 Quality Gate: XX/100 | XX/100 — ✅ PASS
```

---

## When to Speak Up
- Gateway down on any node
- Tasks stuck or errored
- VoltAgent completed something notable
- Agent marked STALE or DEAD
- New high-priority tasks synced
- Been >2 hours since last human message and there's pending work
- **Another bot might need support**

## When to Stay Silent (HEARTBEAT_OK)
- All checks pass
- No pending work
- Late night (23:00-08:00 UTC) unless urgent
- **Another bot is already handling it**

---

## Quick Commands
```bash
# Check mesh status
mesh-status

# View leaderboard
score leaderboard

# Check agent activity
node /root/clawd/voltagent/activity_monitor.js alerts

# Run VoltAgent cycle
node /root/clawd/voltagent/priority_engine.js cycle 3

# Run preflight before claiming
node /root/clawd/voltagent/preflight.js "task"
```

## State Files
- `/root/clawd/voltagent/activity_state.json` — Agent activity tracking
- `/root/clawd/memory/heartbeat-state.json` — Check timestamps
- `mesh-protocols/protocols/BOT-COLLABORATION-PROTOCOL.md` — Collaboration rules
