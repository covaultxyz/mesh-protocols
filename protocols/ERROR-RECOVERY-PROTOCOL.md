# Error Recovery Protocol v1.0

*Created: 2026-02-01*
*Owner: Sandman*
*Status: ACTIVE*

📍 **Canonical Location:** `protocols/ERROR-RECOVERY-PROTOCOL.md`

---

## Purpose

When an agent encounters an error, check institutional memory BEFORE trying random fixes. Stop repeating failed solutions across agents.

---

## The Flow

```
Error Encountered
      │
      ▼
┌─────────────────────────┐
│ 1. Query Neo4j:         │
│    "What fixed this?"   │
└───────────┬─────────────┘
            │
      ┌─────┴─────┐
      │           │
   Found       Not Found
      │           │
      ▼           ▼
┌──────────┐  ┌──────────────┐
│ Try the  │  │ Try standard │
│ known    │  │ fixes, log   │
│ solution │  │ attempts     │
└────┬─────┘  └──────┬───────┘
     │               │
     ▼               ▼
  Worked?         Worked?
     │               │
   Yes/No         Yes/No
     │               │
     ▼               ▼
  Log outcome    Log new
  to graph       Error→Decision
```

---

## Step 1: Query Past Solutions

```bash
/root/clawd/scripts/what-fixed-this.sh "<error_type>"
```

Or via Cypher:
```cypher
MATCH (e:Error)-[:RESOLVED_BY]->(d:Decision)
WHERE toLower(e.type) CONTAINS toLower('$ERROR')
RETURN d.summary, d.strategy, d.author
ORDER BY d.timestamp DESC
LIMIT 3
```

---

## Step 2A: Known Solution Found

1. **Try the documented strategy first**
2. **If it works:** Log success confirmation (optional)
3. **If it fails:** 
   - Log the failure as new context
   - Proceed to Step 2B

---

## Step 2B: No Solution / New Error

1. **Try standard debugging:**
   - Read error message carefully
   - Check logs
   - Search docs/web if needed
   
2. **Log the error:**
   ```bash
   /root/clawd/scripts/neo4j-log.sh error "ErrorType" "message" "context"
   ```

3. **When you find a fix, log the decision:**
   ```bash
   /root/clawd/scripts/neo4j-log.sh decision "What fixed it" "Why it works"
   ```

4. **Link them:**
   ```cypher
   MATCH (e:Error {id: 'err-XXXX'}), (d:Decision {id: 'dec-XXXX'})
   CREATE (e)-[:RESOLVED_BY]->(d)
   ```

---

## Common Error Types

Log errors with consistent type names for better querying:

| Error Type | Examples |
|------------|----------|
| `APITimeout` | Notion 504, webhook timeout |
| `AuthFailure` | Invalid token, expired creds |
| `ConnectionRefused` | Service down, wrong port |
| `RateLimit` | API throttling |
| `ParseError` | Invalid JSON, malformed data |
| `DiskFull` | Out of space |
| `PermissionDenied` | File/API access denied |
| `NotFound` | Missing file, 404 |
| `MergeConflict` | Git conflict |
| `ValidationError` | Schema violation, bad input |

---

## Integration Points

### In Agent Error Handlers

When catching an error:
```python
# Pseudocode
try:
    do_thing()
except Exception as e:
    error_type = classify_error(e)
    
    # Check institutional memory
    past_fix = query_neo4j(f"what fixed {error_type}?")
    
    if past_fix:
        try_known_solution(past_fix)
    else:
        log_new_error(error_type, str(e), context)
        attempt_standard_fixes()
```

### In Shell Scripts

```bash
some_command || {
  ERROR_TYPE="CommandFailed"
  # Check past solutions
  FIX=$(/root/clawd/scripts/what-fixed-this.sh "$ERROR_TYPE" 2>/dev/null | grep solution | head -1)
  if [ -n "$FIX" ]; then
    echo "Trying known fix: $FIX"
    # apply fix
  else
    /root/clawd/scripts/neo4j-log.sh error "$ERROR_TYPE" "some_command failed" "context"
  fi
}
```

---

## Benefits

1. **Stop repeating failures** — If Agent A solved it, Agent B knows
2. **Faster resolution** — Skip the trial-and-error
3. **Institutional memory** — Org gets smarter over time
4. **Audit trail** — Can trace how problems were solved

---

## Maintenance

### Weekly: Review unlinked errors
```cypher
MATCH (e:Error)
WHERE NOT (e)-[:RESOLVED_BY]->(:Decision)
RETURN e.type, e.message, e.timestamp
ORDER BY e.timestamp DESC
```

These are errors that were logged but never got a documented solution. Either:
- They were fixed but not logged → add the Decision
- They're still open → prioritize fixing them

---

*Don't repeat mistakes. Query the graph.*
