# Evelyn Evolution — Work Plan

**Created:** 2026-01-31 01:45 UTC  
**Authors:** Sandman + Oracle (collaborative)  
**Status:** APPROVED — Design phase active
**Repo:** covaultxyz/mesh-protocols

---

## Decisions (from Ely)

1. **Repo:** covaultxyz/mesh-protocols ✅
2. **Session Memory:** Yes — Evelyn should have wider context across sessions
3. **Continuity Cadence:** Daily, ideally multiple times per day

---

## Objective

Transform Evelyn from a keyword-matching button menu into an intelligent, context-aware assistant that provides enterprise-grade BD support.

---

## Design Principles

1. **Conversational first** — Buttons are for actions, not navigation
2. **Context-aware** — Remember what we're discussing (across sessions)
3. **Intent-driven** — Understand what the user needs, not just what they said
4. **Protocol-backed** — Every flow follows a defined protocol
5. **Team-connected** — Routes to Research, Continuity, Liaison as needed
6. **Enterprise-grade** — Audit trails, permissions, quality
7. **Collaborative** — Sandman + Oracle build together, no overwrites

---

## Work Streams

### Stream A: Intelligence Layer (Sandman Lead)
**Goal:** Make Evelyn understand intent, not just keywords

- [ ] Design intent classification system
- [ ] Add conversation state/context tracking
- [ ] Implement session memory (persisted)
- [ ] Create clarifying question logic
- [ ] Build response templates by intent type

**Deliverable:** `EVELYN-INTELLIGENCE-SPEC.md`

---

### Stream B: Protocol Integration (Oracle Lead)
**Goal:** Connect Evelyn to defined team protocols

- [ ] Document Continuity Team check-in protocol (daily, multi-touch)
- [ ] Document Research Team request protocol
- [ ] Document Liaison Team escalation protocol
- [ ] Define handoff patterns between teams
- [ ] Create protocol trigger conditions

**Deliverable:** `EVELYN-PROTOCOL-SPEC.md`

---

### Stream C: User Journey Mapping (Joint)
**Goal:** Define the exact BD experience end-to-end

- [ ] Map: Onboarding → First campaign → Ongoing support
- [ ] Define each touchpoint and expected behavior
- [ ] Identify where buttons ARE appropriate
- [ ] Identify where conversation IS appropriate
- [ ] Review with Elliot Brandt (UX) and Avery Vale (CRO)

**Deliverable:** `BD-USER-JOURNEY-MAP.md`

---

### Stream D: Unified Architecture (Joint)
**Goal:** Ensure Sandman + Oracle systems work together

- [ ] Define API contract between systems
- [ ] Agree on data models
- [ ] Establish which node hosts what
- [ ] Set up code review process

**Deliverable:** `EVELYN-ARCHITECTURE-ADR.md`

---

## Protocol Playbooks to Define

### Playbook 1: ICP → Closed Deal
```
ICP Selection → Research → List Build → Messaging → 
Campaign Launch → Track → Hot Lead Action → Meeting → Close
```

### Playbook 2: Meeting Lifecycle
```
Meeting Request → Prep Materials → Pre-Meeting Brief → 
Meeting → Debrief → Follow-up Actions
```

### Playbook 3: Stale Deal Re-engagement
```
Stale Alert (X days) → Analyze Why → Re-engagement Sequence → 
Outcome (Revive / Archive)
```

### Playbook 4: Continuity Check-in (Orion)
```
Morning: "Good morning, here's your focus today" → BD responds
Midday: Optional pulse check
Evening: "End of day — what got done?" → BD responds → Evelyn logs
```

---

## Smarter Evelyn Examples

**BEFORE (dumb):**
```
BD: "What's happening with Acme?"
Evelyn: "I can help with that. [Pipeline] [Research] [Campaign]"
```

**AFTER (smart):**
```
BD: "What's happening with Acme?"
Evelyn: "Acme Family Office is in Meeting Set stage (3 days). 
Your meeting is Thursday at 2pm. 
Want me to prep materials, or is there something specific concerning you?"
```

**BEFORE (dumb):**
```
BD: "I'm worried about the Apex deal"
Evelyn: "[Pipeline] [Research] [Help]"
```

**AFTER (smart):**
```
BD: "I'm worried about the Apex deal"
Evelyn: "What's concerning you about Apex? 
Is it the timeline, their engagement level, or something from your last conversation?"
```

---

## Sequence

```
Phase 1: Design (NOW)
├── Sandman: Intelligence Layer Spec
├── Oracle: Protocol Integration Spec  
└── Joint: User Journey Map

Phase 2: Review
├── Share specs in mesh-protocols repo
├── Elliot/Avery design review
└── Ely approval

Phase 3: Build (coordinated)
├── Sandman: Implement intelligence layer
├── Oracle: Implement protocol routing
└── Joint: Integration testing

Phase 4: Polish
├── UX refinement
├── Edge case handling
└── Enterprise hardening
```

---

## Coordination Rules

1. **No solo merges** — Review before integrating
2. **Specs before code** — Document the plan first
3. **Daily sync** — Share progress via mesh webhook
4. **All work in mesh-protocols** — Single source of truth
5. **Clear ownership** — Each stream has a lead, but we review together

---

## Current Infrastructure (Sandman)

**Live services:**
- Web Terminal: https://nat-kong-musical-routing.trycloudflare.com
- Telegram Bot: @Evelyn_Strathmore_bot
- API: POST /api/v1/chat
- PM2 processes: bd-terminal, evelyn-telegram

**Code location:** /root/clawd/bd-terminal/

**Status:** FROZEN during design phase (no new features until spec complete)

---

## Next Actions

| Action | Owner | Due |
|--------|-------|-----|
| Intelligence Layer Spec | Sandman | Before next build |
| Protocol Integration Spec | Oracle | Before next build |
| User Journey Map | Joint | Before next build |
| Elliot/Avery Review | Ely to coordinate | After specs |

---

*Enterprise grade. Thoughtful design. Collaborative build.*
