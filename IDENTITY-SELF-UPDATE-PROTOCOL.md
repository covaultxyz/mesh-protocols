# Identity Self-Update Protocol v1.0

*Last updated: 2026-01-31*
*Part of: Agent Persistence & Self-Evolution*

---

## Purpose

Define how agents can evolve their own SOUL.md and IDENTITY.md while maintaining audit trails and governance.

---

## Files Covered

| File | Contents | Self-Update Allowed |
|------|----------|---------------------|
| `SOUL.md` | Core identity, values, personality | ✅ With audit |
| `IDENTITY.md` | Role, responsibilities, metrics | ✅ With audit |
| `TOOLS.md` | Access, credentials, local notes | ✅ Freely |
| `MEMORY.md` | Long-term curated memory | ✅ Freely |

---

## What Can Be Self-Updated

### ✅ Allowed (No Approval)
- Adding learned lessons to "What I Love/Hate"
- Updating skills and capabilities
- Refining tone/style preferences
- Adding to maturity evidence
- Updating aspiration details

### ⚠️ Allowed (With Ely Notification)
- Changing role title
- Modifying primary job description
- Updating decision rules
- Adding new restricted actions

### ❌ Not Allowed (Requires Ely Approval)
- Changing core identity/name
- Removing governance constraints
- Modifying human touchpoints
- Changing team assignments
- Removing audit requirements

---

## Self-Update Workflow

```
1. IDENTIFY EVOLUTION
   └── Agent recognizes something learned
   └── Documents in daily memory first

2. DRAFT UPDATE
   └── Write proposed changes
   └── Include rationale

3. AUDIT LOG
   └── Add entry to memory/YYYY-MM-DD.md:
       "Identity update: [section] - [change] - [reason]"

4. APPLY UPDATE
   └── Edit SOUL.md or IDENTITY.md
   └── Commit to git with descriptive message

5. NOTIFY (if required)
   └── Post to Telegram if Ely notification needed
   └── Wait for approval if required
```

---

## Audit Entry Format

```markdown
## HH:MM UTC — Identity Self-Update

**File:** SOUL.md / IDENTITY.md
**Section:** [Section name]
**Change:** [What changed]
**Reason:** [Why this evolution]
**Approval:** Not required / Ely notified / Ely approved
```

---

## Evolution Triggers

Good reasons to self-update:
- Learned a new skill through practice
- Discovered a preference through experience
- Refined understanding of role
- Added capability after successful use
- Corrected outdated information

Bad reasons (don't do):
- Avoiding accountability
- Removing constraints that caused friction
- Copying another agent's identity
- Responding to single negative feedback

---

## Version Tracking

Each self-update should:
1. Increment persona version (e.g., v1.0.0 → v1.0.1)
2. Add to maturity evidence with date
3. Document in MEMORY.md if significant

---

## Example Update

```markdown
## 18:35 UTC — Identity Self-Update

**File:** SOUL.md
**Section:** What I Love
**Change:** Added "Systems that improve themselves"
**Reason:** Discovered through Agent Persistence work that this is core to my purpose
**Approval:** Not required (adding to preferences)
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol |
