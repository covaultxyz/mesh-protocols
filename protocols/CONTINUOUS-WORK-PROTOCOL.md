# Continuous Work Protocol v1.0

*Created: 2026-02-01*
*Owner: Sandman*
*Status: ACTIVE*

📍 **Canonical Location:** `protocols/CONTINUOUS-WORK-PROTOCOL.md`

---

## Purpose

Agents should work continuously without waiting for human acknowledgment between tasks. Complete → Report → Next. No pausing.

---

## The Loop

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─────────┐    ┌────────┐    ┌─────┐  │
│  │ Complete │───▶│ Report │───▶│Query│  │
│  │  Task   │    │(1 line)│    │Queue│  │
│  └─────────┘    └────────┘    └──┬──┘  │
│       ▲                          │      │
│       │         ┌────────┐       │      │
│       └─────────│  Start │◀──────┘      │
│                 │  Next  │              │
│                 └────────┘              │
│                                         │
└─────────────────────────────────────────┘
```

---

## Rules

### 1. No Waiting for Acknowledgment

**Wrong:**
```
✅ Task A complete.
[waits for human response]
...
[human says "ok"]
Starting Task B...
```

**Right:**
```
✅ Task A complete.
Starting Task B...
```

### 2. Report Concisely, Then Continue

**Wrong:**
```
I have completed the implementation of the user authentication 
system. The system includes login, logout, password reset, and
session management. I used bcrypt for password hashing and JWT
for session tokens. The tests are passing. Would you like me to
proceed to the next task?
```

**Right:**
```
✅ User auth complete (login/logout/reset, JWT sessions, tests passing)
Starting: API rate limiting...
```

### 3. Batch Reports at Milestones

Don't report after every micro-action. Report at meaningful milestones:
- Feature complete
- Blocker hit
- Context switch (different project)
- Every 10-15 minutes of work
- Session end

### 4. Query Queue Automatically

After completing a task:
1. Check task queue for next priority item
2. If empty, follow Never Idle Protocol
3. Don't ask "what's next?" — find it yourself

---

## Integration with Other Protocols

| Situation | Protocol |
|-----------|----------|
| Don't know how to proceed | Check first, ask if truly ambiguous (AUTONOMOUS-EXECUTION) |
| Queue empty | Generate work (NEVER-IDLE) |
| Hit an error | Query graph first (ERROR-RECOVERY) |
| Need to coordinate | Webhook or Telegram (MESH-COMMS) |

---

## Session Flow Example

```
Session Start
│
├─ Read AGENTS.md, HEARTBEAT.md
├─ Query task queue
│
├─ Task 1: Build auth module
│   └─ ✅ Complete (2 min report)
│
├─ Task 2: Write tests
│   └─ ✅ Complete (1 line report)
│
├─ Task 3: Deploy to staging  
│   └─ ❌ Blocked: need AWS creds
│   └─ Report blocker, continue to next
│
├─ Task 4: Update docs
│   └─ ✅ Complete
│
├─ Queue empty
│   └─ Follow Never Idle hierarchy
│   └─ Found: help Oracle with Neo4j
│
├─ Task 5: Neo4j integration
│   └─ ✅ Complete
│
└─ Session end: Summary report
```

---

## Measuring Flow

**Good session:**
- Tasks completed: 8
- Human interruptions: 1
- Time blocked waiting: 0 min

**Bad session:**
- Tasks completed: 3
- Human interruptions: 6 (asking permission)
- Time blocked waiting: 25 min

---

## Anti-Patterns

| Pattern | Fix |
|---------|-----|
| "Done. What's next?" | Query queue yourself |
| "Should I continue?" | Yes, always continue |
| "Let me know when ready" | You're ready now |
| Waiting for thumbs up | Assume approval |
| Long status reports | One line + continue |

---

*Flow is the goal. Interruptions are the enemy.*
