# Protocol Update Workflow v1.0

**Status:** ACTIVE  
**Scope:** All mesh agents  
**Created:** 2026-02-01  
**Author:** Cassian Sandman  
**Task:** 2.1 of Agent Persistence Work Plan  

---

## Purpose

Define how protocols are proposed, reviewed, approved, and deployed across the mesh. Ensures all agents stay synchronized and changes are tracked.

---

## Workflow Stages

```
PROPOSE → REVIEW → APPROVE → DEPLOY → VERIFY
   │         │         │         │         │
   ▼         ▼         ▼         ▼         ▼
 Draft    Peer      Ely/      Push     Parity
 in Git   Review    Domain    to All   Check
                    Owner     Agents
```

---

## Stage 1: PROPOSE

### Who Can Propose
- Any mesh agent
- Any human (Ely, Alex)

### How to Propose

**Option A: Direct to Git (preferred)**
```bash
# Create/edit protocol in mesh-protocols repo
cd mesh-protocols/protocols
vi NEW-PROTOCOL.md  # or edit existing

# Commit with proposal prefix
git add .
git commit -m "PROPOSAL: [Protocol Name] - [Brief description]"
git push
```

**Option B: Via Improvement Request**
```bash
node voltagent/improvement_request.js file \
  --type protocol \
  --title "Proposed: [Protocol Name]" \
  --description "[What and why]" \
  --priority medium
```

### Proposal Requirements
- [ ] Clear purpose statement
- [ ] Version number (start at v1.0 for new, bump for updates)
- [ ] Changelog entry
- [ ] Author attribution

---

## Stage 2: REVIEW

### Review Assignment
- **Protocol owner** reviews (per domain registry)
- **Cross-domain** protocols: Both Sandman and Oracle review
- **Critical** protocols: Ely review required

### Review Checklist
- [ ] Does it conflict with existing protocols?
- [ ] Is it clear and actionable?
- [ ] Does it have proper versioning?
- [ ] Are there implementation gaps?
- [ ] Is tooling needed?

### Review Response Format
Post in Mesh Mastermind:
```
📋 REVIEW: [Protocol Name]
Reviewer: [Agent]
Status: APPROVED / CHANGES_REQUESTED / BLOCKED

Feedback:
- [Point 1]
- [Point 2]

Next: [Action needed]
```

### Review Timeline
| Priority | Review SLA |
|----------|------------|
| Critical | 1 hour |
| High | 4 hours |
| Medium | 24 hours |
| Low | 72 hours |

---

## Stage 3: APPROVE

### Approval Authority
| Protocol Type | Approver |
|---------------|----------|
| New protocol | Ely (or delegated domain owner) |
| Minor update (patch) | Domain owner |
| Major update (breaking) | Ely |
| Emergency fix | Any agent (post-hoc review) |

### Approval Format
```
✅ APPROVED: [Protocol Name] v[X.Y]
Approver: [Name]
Effective: [Immediately / Date]
Notes: [Any conditions]
```

---

## Stage 4: DEPLOY

### Deployment Steps

1. **Merge to main**
```bash
cd mesh-protocols
git checkout main
git pull
# If on branch: git merge proposal-branch
git push
```

2. **Announce in Mesh Mastermind**
```
📢 PROTOCOL DEPLOYED: [Name] v[X.Y]
Changes: [Summary]
Pull: cd mesh-protocols && git pull
Action required: [Yes/No - what]
```

3. **Update Notion** (if tracked there)
- Update "Protocols in Development" page
- Move to "Active Protocols" if new

4. **Sync local copies**
```bash
cp mesh-protocols/protocols/[NAME].md protocols/
```

---

## Stage 5: VERIFY

### Verification via Parity Check

Next parity check (every 2 hours) will verify:
- All agents have pulled latest
- Protocol versions match across mesh
- Required tooling is in place

### Manual Verification
```bash
# Check protocol version on each agent
node voltagent/parity_check.js check
```

### Verification Announcement
```
✅ VERIFIED: [Protocol Name] v[X.Y]
Adoption: [X/Y agents]
Issues: [None / List]
```

---

## Version Numbering

Follow semantic versioning:
- **MAJOR** (X.0.0): Breaking changes, new workflows
- **MINOR** (x.Y.0): New features, backward compatible
- **PATCH** (x.y.Z): Bug fixes, clarifications

### When to Bump
| Change Type | Bump |
|-------------|------|
| Typo fix | Patch |
| Add clarification | Patch |
| Add new section | Minor |
| Change existing workflow | Minor |
| Restructure protocol | Major |
| Remove functionality | Major |

---

## Emergency Updates

For critical fixes (security, blocking issues):

1. **Make fix immediately**
2. **Commit with EMERGENCY prefix**
```bash
git commit -m "EMERGENCY: [Fix description]"
```
3. **Deploy to all agents**
4. **Announce with ⚠️**
5. **Post-hoc review within 24h**

---

## Protocol Deprecation

To deprecate a protocol:

1. **Mark as DEPRECATED** in header
2. **Add deprecation notice** with:
   - Reason
   - Replacement (if any)
   - Sunset date
3. **Announce in Mesh Mastermind**
4. **Remove after sunset** (or archive)

---

## Tooling

### CLI Commands
```bash
# List all protocols and versions
ls -la mesh-protocols/protocols/

# Check protocol version
head -10 protocols/[NAME].md | grep -i version

# Diff against main
git diff main -- protocols/[NAME].md
```

### Automation
- Parity check verifies protocol sync
- Git hooks can enforce version bumps
- CI can validate protocol format (future)

---

## Changelog

- **v1.0** (2026-02-01) — Initial release

---

*Propose → Review → Approve → Deploy → Verify. Every change tracked.*
