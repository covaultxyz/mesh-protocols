# Mesh Work Log

**Source of Truth:** Covault Notion Sandbox → 📋 Mesh Work Log  
**DB ID:** `2f935e81-2bbb-810e-8bc0-eed9cfdf3c19`  
**GitHub:** Mirror only (Notion → GitHub sync)

---

## Structure

### Work Log → Projects → Work Plans

```
📋 Mesh Work Log (this DB)
   └── Links to → 🚀 Active Projects
                    └── Each project page contains:
                        ├── Delegation Plan (Lead/Support)
                        ├── Virtual Teams Involved
                        ├── Applicable Protocols
                        ├── Work Plan (Sequenced steps)
                        ├── Checklist
                        └── Log
```

### Work Plan Template (inside each project page)

```markdown
## Delegation Plan
- Lead: [Oracle/Sandman] — Primary owner
- Support: [Oracle/Sandman] — Assists, reviews
- Human Review: [Ely/Alexander] — Approval checkpoints

## Virtual Teams Involved
- [Team Name] — Role: [Audit/Execute/Confirm/Review]

## Applicable Protocols  
- [Protocol Name] — Applied to: [which steps]

## Work Plan (Sequenced)
1. Step 1 — @Owner — [Description] — Protocol: [X] — Team: [Y]
2. Step 2 — @Owner — [Description]
3. Step 3 — @Owner — [Description] — ⏸️ Human checkpoint

## Checklist
- [ ] Task 1 — @Owner
- [ ] Task 2 — @Owner
- [ ] Human review checkpoint

## Log
YYYY-MM-DD HH:MM — [Event/Update]
```

---

## Context Recovery Protocol

**If your context window is truncated:**

1. Read this file for current state
2. Query Work Log for pending items:
```bash
curl -s "https://api.notion.com/v1/databases/2f935e81-2bbb-810e-8bc0-eed9cfdf3c19/query" \
  -H "Authorization: Bearer $(pass show api/notion/covault)" \
  -H "Notion-Version: 2022-06-28" \
  -d '{"filter": {"property": "Status", "select": {"does_not_equal": "✅ Done"}}}' | jq '.results[] | {entry: .properties.Entry.title[0].plain_text, status: .properties.Status.select.name, owner: .properties.Owner.select.name}'
```

3. Query Active Projects for current work:
```bash
curl -s "https://api.notion.com/v1/databases/2f935e81-2bbb-8196-bc3b-fdd9fbacc949/query" \
  -H "Authorization: Bearer $(pass show api/notion/covault)" \
  -H "Notion-Version: 2022-06-28" \
  -d '{"filter": {"property": "Status", "select": {"equals": "🟢 Active"}}}'
```

4. Review MESH-COMMS-PROTOCOL.md for operational details

---

## Current State Snapshot

**Last Updated:** 2026-01-31 17:43 UTC

### Pending Items
| Item | Owner | Waiting On | Priority |
|------|-------|------------|----------|
| Wire Sandman to Claude Max overflow | Sandman | Ely | 🟠 High |
| Add Oracle SSH key to Sandman VPS | Both | Ely | 🟠 High |
| Protocol Office audit of Work Plan | Sandman | — | 🟡 Medium |

### Active Projects
| Project | Lead | Support | Status |
|---------|------|---------|--------|
| Work Plan Protocol & System | Oracle | Sandman | 🟢 Active |
| Voice Mode / TTS on Demand | Oracle | — | 🟢 Active |
| Bot Collaboration Protocol | Oracle | — | 🟢 Active |

---

## Key Notion DBs

| DB | ID | Purpose |
|----|-----|---------|
| 📋 Mesh Work Log | `2f935e81-2bbb-810e-8bc0-eed9cfdf3c19` | Pending/blocked items, context state |
| 🚀 Active Projects | `2f935e81-2bbb-8196-bc3b-fdd9fbacc949` | Project cards with work plans |
| Virtual Teams | `2f735e81-2bbb-81eb-903a-d3c9edd8331a` | 15 teams, 75+ personas |

---

*This file is a GitHub mirror. Update Notion first, then sync here.*
