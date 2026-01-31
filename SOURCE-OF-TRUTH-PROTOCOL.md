# Source of Truth Protocol v1.0

*Last updated: 2026-01-31*
*Maintainers: Protocol Office*

---

## Principle

**Notion is the source of truth. GitHub syncs from Notion.**

---

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    NOTION                               │
│              (Source of Truth)                          │
│                                                         │
│  • Protocols                                            │
│  • Virtual Teams DB                                     │
│  • Identity Specs                                       │
│  • Operational Docs                                     │
└─────────────────────────────────────────────────────────┘
                         │
                         │ sync (Notion → GitHub)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    GITHUB                               │
│              (Version Control Mirror)                   │
│                                                         │
│  • mesh-protocols repo                                  │
│  • Markdown exports                                     │
│  • Code artifacts                                       │
└─────────────────────────────────────────────────────────┘
                         │
                         │ clone/pull
                         ▼
┌─────────────────────────────────────────────────────────┐
│              AGENT LOCAL REPOS                          │
│          (Working copies on nodes)                      │
│                                                         │
│  • Sandman: /root/clawd/                                │
│  • Oracle: /root/clawd/                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Rules

### 1. Notion First
- All protocols, specs, and operational documents originate in Notion
- Edits and updates happen in Notion first
- Notion pages are the canonical version

### 2. GitHub Mirrors
- GitHub repos contain exports/mirrors of Notion content
- Sync direction: Notion → GitHub (never reverse)
- GitHub provides version history and agent access

### 3. Local Copies
- Agents pull from GitHub for local reference
- Local files are working copies, not source of truth
- If local differs from Notion, Notion wins

### 4. Code Exception
- Actual code (Python, JS, etc.) lives in GitHub as source of truth
- Notion documents the specs, GitHub holds the implementation
- Code changes go GitHub → Notion docs (document after implementing)

---

## Sync Process

### Manual Sync (Current)
1. Update document in Notion
2. Export/copy to local repo
3. Commit and push to GitHub
4. Other agents pull updates

### Automated Sync (Future)
- Notion API webhook triggers on page update
- Automated export to markdown
- Auto-commit to GitHub
- Agents receive notification

---

## Document Types by Location

| Type | Source of Truth | Synced To |
|------|-----------------|-----------|
| Protocols | Notion | GitHub, Local |
| Identity Specs | Notion | GitHub, Local |
| Virtual Teams | Notion (DB) | — |
| Operational Docs | Notion | GitHub (as needed) |
| Code | GitHub | Local |
| Configs | Local | — |
| Secrets | Local (.secrets/) | Never synced |

---

## Conflict Resolution

If versions differ:
1. **Notion vs GitHub:** Notion wins
2. **GitHub vs Local:** GitHub wins
3. **Two Notion editors:** Last save wins (coordinate via Telegram)

---

## Locations

### Notion
- Protocols in Development: `2f835e81-2bbb-81d1-8f6f-eefd2f3897be`
- Protocol Office: `2f835e81-2bbb-8156-9799-efd02e8e04e7`

### GitHub
- Repo: `covaultxyz/mesh-protocols`
- Branch: `main`

### Local (Sandman)
- Protocols: `/root/clawd/protocols/`
- Mesh protocols: `/root/clawd/mesh-protocols/`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol — Notion as source of truth |

---

*This protocol governs how documentation flows through the Covault system.*
