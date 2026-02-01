# Coherence Screening Protocol — Data Rooms

*Version: 1.0.0*
*Author: Cassian Sandman*
*Date: 2026-02-01*

---

## Purpose

Systematic verification that data room materials are internally consistent, complete, and support claimed investment thesis before IC review.

---

## 1. Coherence Criteria

### 1.1 Numerical Consistency

All numbers that appear in multiple places must match.

| Check | Description | Severity |
|-------|-------------|----------|
| **Revenue Consistency** | Revenue figures in deck match financials | CRITICAL |
| **Valuation Math** | Pre/post money, cap table, dilution add up | CRITICAL |
| **Timeline Consistency** | Dates in financials match project timeline | HIGH |
| **Unit Economics** | CAC, LTV, margins consistent across docs | HIGH |
| **Headcount/Burn** | Team size × avg salary ≈ payroll in P&L | MEDIUM |
| **Historical vs Projected** | Growth rates don't have unrealistic jumps | MEDIUM |

### 1.2 Claim-Evidence Alignment

Every major claim must have supporting evidence.

| Check | Description | Severity |
|-------|-------------|----------|
| **Market Size** | TAM/SAM/SOM claims have cited source | HIGH |
| **Competitive Advantage** | Moat claims backed by IP/contracts/data | HIGH |
| **Revenue** | Revenue claims match audited financials | CRITICAL |
| **Partnerships** | Partnership claims have LOIs/contracts | HIGH |
| **Team Credentials** | Team bios verifiable via LinkedIn/public | MEDIUM |
| **Regulatory Status** | Compliance claims have legal opinion | HIGH |

### 1.3 Logical Consistency

Narrative must be internally coherent.

| Check | Description | Severity |
|-------|-------------|----------|
| **Problem-Solution Fit** | Problem described matches solution offered | HIGH |
| **Strategy-Financials Fit** | Go-to-market strategy reflected in cost structure | MEDIUM |
| **Use of Funds** | Planned spend aligns with stated priorities | HIGH |
| **Risk Acknowledgment** | Material risks disclosed, not hidden | CRITICAL |
| **Competitive Response** | Competitive claims realistic vs known players | MEDIUM |

---

## 2. Completeness Checklist

### 2.1 Required Documents (All Program Types)

| Document | Required | Description |
|----------|----------|-------------|
| Executive Summary / Pitch Deck | ✅ | Overview of opportunity |
| Financial Model | ✅ | 3-5 year projections |
| Historical Financials | ✅ (if operating) | Audited or management accounts |
| Cap Table | ✅ | Current ownership structure |
| Legal Formation Docs | ✅ | Articles, operating agreement |
| Management Bios | ✅ | Team background |

### 2.2 Program-Specific Requirements

#### SPV

| Document | Required | Description |
|----------|----------|-------------|
| Asset Purchase Agreement | ✅ | Underlying asset terms |
| Asset Valuation | ✅ | Independent appraisal |
| Escrow Instructions | ✅ | Funds flow |
| Distribution Waterfall | ✅ | Return of capital terms |

#### Fund

| Document | Required | Description |
|----------|----------|-------------|
| PPM (Private Placement Memo) | ✅ | Fund terms disclosure |
| Limited Partnership Agreement | ✅ | LP rights/obligations |
| Investment Policy | ✅ | Strategy and constraints |
| Fee Schedule | ✅ | Management + performance fees |

#### Tokenization

| Document | Required | Description |
|----------|----------|-------------|
| Token Economics | ✅ | Supply, distribution, utility |
| Smart Contract Audit | ✅ | Security review |
| Legal Opinion | ✅ | Securities law compliance |
| Custody Arrangement | ✅ | Asset backing verification |

#### Infrastructure

| Document | Required | Description |
|----------|----------|-------------|
| Engineering Report | ✅ | Technical assessment |
| Environmental Assessment | ✅ | Compliance review |
| Permits/Approvals | ✅ | Regulatory status |
| Construction Timeline | ✅ | Milestone schedule |
| Off-take Agreements | Conditional | Revenue contracts |

#### Energy

| Document | Required | Description |
|----------|----------|-------------|
| Resource Assessment | ✅ | Generation capacity |
| PPA (Power Purchase Agreement) | ✅ | Revenue certainty |
| Interconnection Agreement | ✅ | Grid connection |
| Environmental Permits | ✅ | Regulatory compliance |

#### Real Estate

| Document | Required | Description |
|----------|----------|-------------|
| Appraisal | ✅ | Independent valuation |
| Title Report | ✅ | Clear ownership |
| Lease Rolls | Conditional | Tenant information |
| Property Condition Report | ✅ | Physical assessment |
| Zoning Confirmation | ✅ | Permitted use |

---

## 3. Cross-Reference Points

Key numbers that must reconcile across documents:

### 3.1 Financial Cross-References

```
Pitch Deck Revenue → Financial Model Revenue → Historical Financials
Cap Table % → PPM Ownership → Legal Docs Membership
Valuation → Financial Model Assumptions → Comparable Analysis
Headcount Plan → Org Chart → Burn Rate Calculation
```

### 3.2 Timeline Cross-References

```
Milestone Dates (Deck) → Project Schedule (Model) → Contract Dates
Historical Revenue Dates → Financial Statements → Tax Returns
Funding Rounds → Cap Table Updates → Legal Amendments
```

### 3.3 Legal Cross-References

```
Entity Name → All Documents Consistent
Jurisdiction → Formation Docs → Regulatory Filings
Parties Named → Signature Blocks → Cap Table Entries
```

---

## 4. Severity Levels

### CRITICAL
- **Definition:** Finding that would materially change investment decision
- **Response:** Must resolve before IC review
- **Examples:** Revenue mismatch, undisclosed material risk, math error in valuation

### HIGH
- **Definition:** Significant concern requiring explanation
- **Response:** Must address in IC memo, flag for discussion
- **Examples:** Missing required document, unsubstantiated claim, logical inconsistency

### MEDIUM
- **Definition:** Minor issue or documentation gap
- **Response:** Note in screening report, may condition close
- **Examples:** Formatting inconsistency, minor date mismatch, unclear disclosure

### ADVISORY
- **Definition:** Observation for improvement, not blocking
- **Response:** Include in feedback to sponsor
- **Examples:** Best practice suggestion, clarification request

---

## 5. Screening Workflow

```
1. INTAKE
   └─ Data room access confirmed
   └─ Document inventory created
   └─ Completeness check initiated

2. ANALYSIS
   └─ Coherence checks run (numerical, claim-evidence, logical)
   └─ Cross-references validated
   └─ Findings logged with severity

3. REPORT
   └─ Findings summarized
   └─ Severity distribution calculated
   └─ Recommendations drafted

4. REVIEW
   └─ Screening lead reviews report
   └─ IC Committee receives for decision
   └─ Feedback loop to sponsor if needed
```

---

## 6. Persona Roles

| Role | Persona | Responsibility |
|------|---------|----------------|
| Screening Lead | COHERENCE_ANALYST | Run checks, compile report |
| Financial Review | FINANCE_TEAM | Validate financials |
| Legal Review | LEGAL_TEAM | Validate legal docs |
| Technical Review | DOMAIN_SPECIALIST | Program-specific checks |
| Final Sign-off | DEAL_DIRECTOR | Approve for IC |

---

## 7. Report Template

```markdown
# Coherence Screening Report

**Project:** [Name]
**Program Type:** [SPV/Fund/Tokenization/Infrastructure/Energy/Real Estate]
**Screening Date:** [Date]
**Screening Lead:** [Persona]

## Executive Summary
- Documents Reviewed: X
- Findings: X Critical, Y High, Z Medium
- Recommendation: [Proceed/Hold/Reject]

## Completeness Check
[✅/❌ for each required document]

## Coherence Findings

### Critical
1. [Finding description]
   - Location: [Document, page/section]
   - Issue: [What's wrong]
   - Resolution: [What's needed]

### High
...

### Medium
...

## Cross-Reference Results
[Table of cross-ref checks and outcomes]

## Recommendation
[Detailed recommendation with conditions if applicable]

---
Screening completed: [Date/Time]
Report version: [X.X]
```

---

## 8. Implementation Status

- [x] Coherence criteria defined
- [x] Completeness checklist by program type
- [x] Cross-reference points mapped
- [x] Severity levels defined
- [x] Screening workflow documented
- [x] Persona roles assigned
- [x] Report template created
- [ ] Screening scripts built
- [ ] Pilot data room tested
- [ ] IC Committee review
- [ ] Integration with IC Decision Protocol

---

*Protocol maintained by Intelligence Architecture (CASSIAN_SANDMAN)*
