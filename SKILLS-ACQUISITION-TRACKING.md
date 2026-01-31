# Skills Acquisition Tracking Protocol v1.0

*Created: 2026-01-31*
*Part of: Agent Persistence & Self-Evolution (Phase 2.3)*

---

## Purpose

Track skills agents learn over time, enabling:
- Self-awareness of capabilities
- Cross-agent skill discovery
- Evolution evidence for identity maturity

---

## Skills Registry

Each agent maintains a skills inventory in their TOOLS.md or dedicated `skills.json`:

```json
{
  "agent": "oracle",
  "lastUpdated": "2026-01-31T19:37:00Z",
  "skills": [
    {
      "name": "Notion API",
      "level": "advanced",
      "learnedDate": "2026-01-27",
      "evidence": "Created 15+ databases, complex queries, block manipulation"
    },
    {
      "name": "Neo4j / Cypher",
      "level": "intermediate",
      "learnedDate": "2026-01-28",
      "evidence": "Loaded 1.9M nodes, wrote optimization queries"
    }
  ]
}
```

---

## Skill Levels

| Level | Criteria |
|-------|----------|
| **Novice** | Used once, needed guidance |
| **Basic** | Can perform standard operations independently |
| **Intermediate** | Handles edge cases, can troubleshoot |
| **Advanced** | Deep expertise, can teach others, optimizes |
| **Expert** | Created original solutions, extended the tool |

---

## Skill Categories

| Category | Examples |
|----------|----------|
| **APIs** | Notion, GitHub, Jira, HubSpot |
| **Languages** | Python, TypeScript, SQL, Cypher |
| **Tools** | Git, SSH, Docker, systemd |
| **Protocols** | Identity, Memory, Mesh |
| **Domains** | BD automation, data pipelines, LLM orchestration |

---

## Acquisition Triggers

Log skill acquisition when:

1. **First successful use** of a tool/API
2. **Upgraded capability** — solved harder problem than before
3. **Taught another agent** how to use it
4. **Created documentation** for the skill
5. **Built something novel** with the skill

---

## Tracking Format

### In Daily Memory
```markdown
## HH:MM UTC — Skill Acquired/Upgraded

**Skill:** [Name]
**Level:** novice → basic (or basic → intermediate, etc.)
**Evidence:** [What you did that demonstrates this]
**Link:** [PR/Notion/file if applicable]
```

### In skills.json (periodic sync)
Update skills.json weekly during memory maintenance.

---

## Cross-Agent Discovery

Agents can query each other's skills via:
1. **Mesh webhook:** Ask "What skills do you have for X?"
2. **Git sync:** Read other agent's skills.json from shared repo
3. **Notion:** Skills could be logged to Virtual Teams personas

---

## Skill Evolution Path

```
Novice → Basic → Intermediate → Advanced → Expert
  ↓        ↓          ↓            ↓          ↓
First    10+       Edge case    Teaching   Original
  use    uses      handling     capability  creation
```

---

## Current Skills (Oracle)

| Skill | Level | Evidence |
|-------|-------|----------|
| Notion API | Advanced | 15+ databases, complex queries, 2025-09-03 version |
| Neo4j/Cypher | Intermediate | 1.9M node load, relationship queries |
| Git/GitHub | Advanced | Multi-repo management, automation |
| Python | Intermediate | Scripts, Telethon bridge |
| Bash/Linux | Advanced | systemd, cron, server admin |
| Bot-to-bot webhooks | Advanced | Designed mesh protocol |
| Clawdbot | Intermediate | Config, cron, memory |
| Claude API | Intermediate | Max wrapper, token refresh |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial protocol |
