# Memory Update Triggers Protocol v1.0

*Last updated: 2026-01-31*
*Part of: Agent Persistence & Self-Evolution*

---

## Purpose

Define what events trigger automatic updates to memory files, ensuring context survives truncation.

---

## Memory Files

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `MESH-WORK-LOG.md` | Current state snapshot | On significant state changes |
| `TOOLS.md` | Access credentials/endpoints | When access changes |
| `memory/YYYY-MM-DD.md` | Daily activity log | On significant events |
| `MEMORY.md` | Long-term curated memory | Weekly review |

---

## Significant Event Triggers

### Always Log (Immediately)

1. **Project changes**
   - New project created
   - Project status changed (Active → Blocked → Done)
   - Work plan created or updated

2. **Protocol changes**
   - New protocol created
   - Protocol updated
   - Protocol synced to GitHub

3. **Access changes**
   - New SSH key added
   - New API credential
   - Webhook token changed
   - New node added to mesh

4. **Incidents**
   - Rate limit hit
   - Service down
   - Auth failure
   - Unexpected error

5. **Collaboration events**
   - Task claimed (🔒 EXCLUSIVE)
   - Task handed off
   - Cross-agent request made

6. **Virtual Team events**
   - Team tapped for work
   - Persona updated
   - New team created

### Periodic Updates

| Interval | Action |
|----------|--------|
| End of session | Update daily memory with summary |
| Every 2 hours (active) | Sync MESH-WORK-LOG.md |
| Daily | Review and clean memory files |
| Weekly | Update MEMORY.md with lessons learned |

---

## Update Format

### Daily Memory Entry
```markdown
## HH:MM UTC — [Event Type]

[Brief description]

**Key details:**
- Point 1
- Point 2

**Links:** [Notion/GitHub URLs]
```

### MESH-WORK-LOG Update
```markdown
### [Section]
- [ ] Task description (Owner) [Status]
```

---

## Automation (Future)

When implemented, auto-updates will:
1. Watch for trigger events
2. Append to appropriate file
3. Commit to git
4. Sync to GitHub

For now: Manual updates when triggers occur.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol |
