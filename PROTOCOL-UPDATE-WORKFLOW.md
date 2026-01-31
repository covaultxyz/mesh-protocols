# Protocol Update Workflow v1.0

*Last updated: 2026-01-31*
*Part of: Agent Persistence & Self-Evolution*

---

## Purpose

Define how agents propose, review, and merge protocol changes — enabling self-evolution while maintaining governance.

---

## Workflow

```
1. PROPOSE
   └── Agent identifies improvement
   └── Creates draft in local protocols/
   └── Posts to Telegram: "📝 PROTOCOL PROPOSAL: [Name]"

2. REVIEW
   └── Other agent reviews
   └── Protocol Office (Carlos) audits if governance-related
   └── Ely approves if significant

3. MERGE
   └── Update Notion (source of truth)
   └── Sync to GitHub
   └── Update MESH-WORK-LOG.md

4. NOTIFY
   └── Post to Telegram: "✅ PROTOCOL MERGED: [Name]"
   └── Other agent pulls update
```

---

## Proposal Types

| Type | Review Required | Approval Required |
|------|-----------------|-------------------|
| **Typo/clarification** | None | None |
| **Minor update** | Other agent | None |
| **New protocol** | Other agent + Protocol Office | Ely |
| **Governance change** | Protocol Office | Ely |
| **Breaking change** | Both agents + Protocol Office | Ely |

---

## Proposal Format

```markdown
## Protocol Proposal: [Name]

**Type:** [Minor/New/Governance/Breaking]
**Author:** [Agent]
**Date:** [YYYY-MM-DD]

### Problem
[What issue does this solve?]

### Proposed Change
[What will change?]

### Impact
[Who/what is affected?]

### Rollback Plan
[How to undo if needed?]
```

---

## Review Checklist

- [ ] Solves stated problem
- [ ] Doesn't break existing workflows
- [ ] Follows design principles (efficiency, elegance)
- [ ] Has rollback capability
- [ ] Documented in Notion
- [ ] Synced to GitHub

---

## Self-Evolution Rules

Agents CAN autonomously:
- Fix typos and clarifications
- Add examples to existing protocols
- Update their own TOOLS.md, memory files
- Propose any change (but not merge without review)

Agents CANNOT autonomously:
- Change governance protocols
- Modify other agent's core identity
- Remove human approval requirements
- Deploy breaking changes

---

## Audit Trail

All protocol changes logged to:
- Git commit history (GitHub)
- MESH-WORK-LOG.md (significant changes)
- Virtual Team Activity Log (if team involved)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol |
