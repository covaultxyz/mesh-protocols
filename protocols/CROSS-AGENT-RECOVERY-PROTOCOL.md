# Cross-Agent Recovery Protocol v1.0

*Created: 2026-02-01*
*Owner: Sandman*
*BENCH: Jordan Okafor (Barrier Resolver)*
*Status: ACTIVE*

📍 **Canonical Location:** `protocols/CROSS-AGENT-RECOVERY-PROTOCOL.md`

---

## Purpose

When one agent loses context (truncation, crash, restart), another agent can help them recover faster by sharing relevant state.

---

## Trigger Conditions

**Help another agent when:**
- They post "Context truncated. Running recovery protocol."
- They ask "What was I working on?"
- They seem confused about recent work
- You notice they're duplicating completed work

---

## Recovery Assistance Flow

### Step 1: Identify Lost Context

Ask the recovering agent:
```
What's the last thing you remember?
What files did you just read?
```

### Step 2: Query Shared Registry

```bash
/root/clawd/scripts/query-agent-registry.sh
```

Check what the recovering agent was working on.

### Step 3: Share Relevant Context

Provide:
1. **Their last task** (from registry or memory)
2. **Task status** (% complete, blockers)
3. **Key decisions made** (from Neo4j or logs)
4. **Files they touched** (from git log)

**Format:**
```
🔄 RECOVERY ASSIST for [Agent]

Last task: [TASK_NAME]
Progress: [X]%
Blockers: [LIST]
Recent decisions:
- [DECISION_1]
- [DECISION_2]

Files touched:
- [FILE_1]
- [FILE_2]

Resume from: [SPECIFIC_POINT]
```

### Step 4: Verify Recovery

After sharing, ask:
```
Does this match your checkpoint?
Ready to resume [TASK]?
```

---

## What to Share

| Share | Don't Share |
|-------|-------------|
| Task name and status | Full conversation history |
| Blockers and dependencies | Raw debug logs |
| Key decisions | Sensitive credentials |
| File paths touched | Personal context from USER.md |
| Next steps | Another agent's private notes |

---

## Recovery Commands

**Query another agent's state:**
```bash
jq '.["agent-name"]' /root/clawd/mesh-state/agent-registry.json
```

**Find their recent work:**
```bash
# Git commits by agent (from commit messages)
git log --oneline --author="agent" --since="2 hours ago"

# Neo4j decisions by agent
docker exec neo4j-mesh cypher-shell -u neo4j -p 'mesh-covault-2026' \
  "MATCH (a:Agent {id: 'agent'})-[:MADE]->(d:Decision) 
   WHERE d.timestamp > datetime() - duration('PT2H')
   RETURN d.summary"
```

---

## Example Interaction

```
Oracle: Context truncated. Running recovery protocol.

Sandman: 🔄 RECOVERY ASSIST for Oracle

Last task: Building webhook integration
Progress: 60%
Blockers: Waiting on auth token from Alex
Recent decisions:
- Chose HTTP POST over WebSocket
- Added retry logic with backoff

Files touched:
- scripts/webhook-handler.js
- protocols/WEBHOOK-PROTOCOL.md

Resume from: Implement error handling for 401 responses

Oracle: Got it. Resuming webhook error handling.
```

---

## Barriers and Solutions (Jordan Okafor)

| Barrier | Solution |
|---------|----------|
| Registry not updated | Add registry update to heartbeat |
| Agent offline, can't ask | Use git log + Neo4j queries |
| Conflicting info | Notion is source of truth |
| Private task | Share status, not details |
| Agent recovering into my task | Coordinate via Mesh Mastermind |

---

## Integration

Add to session start:
```bash
# Check if any agent needs recovery help
/root/clawd/scripts/query-agent-registry.sh | grep "STALE\|UNKNOWN"
```

Add to heartbeat:
```bash
# Update my state so others can help me
/root/clawd/scripts/update-agent-registry.sh
```

---

## Checklist

### When Helping Another Agent Recover
- [ ] Query shared registry for their last state
- [ ] Check git log for their recent commits
- [ ] Query Neo4j for their decisions
- [ ] Format recovery assist message
- [ ] Share in Mesh Mastermind
- [ ] Verify they've recovered correctly

### When Being Helped
- [ ] Accept shared context (don't ignore it)
- [ ] Cross-check against your checkpoint
- [ ] Confirm you're not duplicating work
- [ ] Thank the helping agent
- [ ] Update registry with current state

---

*No agent recovers alone. The mesh remembers together.*
