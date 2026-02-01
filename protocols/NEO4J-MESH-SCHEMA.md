# Neo4j Mesh Schema v1.0

*Created: 2026-02-01*
*Owner: Sandman*
*Status: ACTIVE*

📍 **Canonical Location:** `protocols/NEO4J-MESH-SCHEMA.md`

---

## Purpose

Graph database schema for mesh agent memory — decision lineage, error tracking, institutional knowledge.

**Key query:** "What fixed this before?"

---

## Connection Details

| Item | Value |
|------|-------|
| HTTP | `http://100.112.130.22:7475` |
| Bolt | `bolt://100.112.130.22:7688` |
| Auth | `neo4j` / `mesh-covault-2026` |
| Container | `neo4j-mesh` on Sandman node |

---

## Node Types

### :Agent
Mesh participants (bots and humans).

```cypher
CREATE (a:Agent {
  id: 'sandman',           // unique identifier
  name: 'Cassian Sandman', // display name
  role: 'CIO',             // function
  node: '100.112.130.22'   // Tailscale IP
})
```

### :Task
Work items from Notion Tasks DB or ad-hoc.

```cypher
CREATE (t:Task {
  id: 'task-20260201-001',
  title: 'Set up Neo4j mesh instance',
  status: 'completed',
  priority: 58,
  created: datetime(),
  completed: datetime()
})
```

### :Decision
Architectural or operational decisions with rationale.

```cypher
CREATE (d:Decision {
  id: 'dec-20260201-neo4j-mesh',
  summary: 'Created dedicated Neo4j mesh instance',
  rationale: 'Separate from Luvbuds, local-first, low latency',
  timestamp: datetime(),
  author: 'sandman'
})
```

### :Error
Problems encountered with context.

```cypher
CREATE (e:Error {
  id: 'err-20260201-001',
  type: 'ConnectionRefused',
  message: 'Could not connect to Notion API',
  context: 'During task sync',
  timestamp: datetime()
})
```

### :Outcome
Results of applying a decision to an error.

```cypher
CREATE (o:Outcome {
  id: 'out-20260201-001',
  strategy: 'Rotated API key',
  result: 'success',
  timestamp: datetime()
})
```

---

## Relationships

| Relationship | From | To | Meaning |
|--------------|------|-----|---------|
| `:MADE` | Agent | Decision | Agent made this decision |
| `:CLAIMED` | Agent | Task | Agent claimed this task |
| `:COMPLETED` | Agent | Task | Agent completed this task |
| `:ENCOUNTERED` | Agent | Error | Agent hit this error |
| `:RESOLVED_BY` | Error | Decision | This decision fixed this error |
| `:RESULTED_IN` | Decision | Outcome | Decision led to this outcome |
| `:DEPENDS_ON` | Task | Task | Task dependency |
| `:HANDED_OFF` | Agent | Agent | Work handoff (via Task) |

---

## Common Queries

### What fixed this error type before?
```cypher
MATCH (e:Error {type: 'ConnectionRefused'})<-[:RESOLVED_BY]-(d:Decision)
RETURN d.summary, d.strategy, d.timestamp
ORDER BY d.timestamp DESC
LIMIT 5
```

### What has this agent worked on?
```cypher
MATCH (a:Agent {id: 'sandman'})-[:COMPLETED]->(t:Task)
RETURN t.title, t.completed
ORDER BY t.completed DESC
```

### Decision lineage for a task
```cypher
MATCH (t:Task {id: 'task-123'})<-[:CLAIMED]-(a:Agent)-[:MADE]->(d:Decision)
RETURN a.name, d.summary, d.timestamp
```

### Find collaboration patterns
```cypher
MATCH (a1:Agent)-[:HANDED_OFF]->(a2:Agent)
RETURN a1.name, a2.name, count(*) AS handoffs
ORDER BY handoffs DESC
```

---

## Logging Conventions

### Decision IDs
Format: `dec-YYYYMMDD-{slug}`
Example: `dec-20260201-neo4j-mesh`

### Error IDs
Format: `err-YYYYMMDD-{seq}`
Example: `err-20260201-001`

### Task IDs
Mirror Notion task ID or: `task-YYYYMMDD-{seq}`

---

## Maintenance

### Prune old errors (keep 90 days)
```cypher
MATCH (e:Error)
WHERE e.timestamp < datetime() - duration('P90D')
DETACH DELETE e
```

### Export for backup
```bash
docker exec neo4j-mesh neo4j-admin database dump neo4j --to-path=/data/backup/
```

---

## Integration Points

| System | Sync Pattern |
|--------|--------------|
| Notion Tasks DB | On task claim/complete → create/update :Task node |
| Daily logs | On error → create :Error node |
| Points Ledger | On decision → create :Decision node |
| Mesh comms | On handoff → create :HANDED_OFF edge |

---

*Institutional memory starts here.*
