# Campaign & Funnel Architecture

**Version:** 1.0.0  
**Author:** Campaign Automation Team (via Cassian Sandman)  
**Date:** 2026-01-30  
**Status:** Active

---

## 1. Purpose

Clarify the distinction between **Campaigns** and **Funnels** in the Covault operating system, define ownership boundaries, and provide routing guidance for work requests.

---

## 2. Definitions

### Campaign
A **time-bound, coordinated effort** to achieve a specific outcome through multiple touchpoints.

**Characteristics:**
- Has a start and end date
- Multiple channels (email, LinkedIn, content, ads)
- Coordinated messaging across touchpoints
- Measurable goal (leads, conversions, awareness)
- Requires ongoing optimization

**Examples:**
- Q1 Innov8 Investor Outreach Campaign
- LinkedIn Thought Leadership Campaign
- Product Launch Campaign

### Funnel
A **persistent conversion pathway** that guides prospects through defined stages.

**Characteristics:**
- Always-on (no end date)
- Sequential stages with gates
- Automated flows between stages
- Focus on conversion optimization
- Infrastructure, not initiative

**Examples:**
- Investor Landing Page → Schedule Call → Qualification → IC Review
- Content Download → Nurture Sequence → Demo Request
- Cold Outreach → Response → Meeting → Proposal

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMPAIGN & FUNNEL ARCHITECTURE               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CAMPAIGNS (time-bound)          FUNNELS (persistent)          │
│  ────────────────────           ─────────────────────          │
│                                                                 │
│  ┌─────────────┐                ┌─────────────────────┐        │
│  │ Campaign 1  │ ──────────────→│                     │        │
│  └─────────────┘                │   Investor Funnel   │        │
│  ┌─────────────┐                │   ┌───┐ ┌───┐ ┌───┐│        │
│  │ Campaign 2  │ ──────────────→│   │ A │→│ B │→│ C ││        │
│  └─────────────┘                │   └───┘ └───┘ └───┘│        │
│  ┌─────────────┐                │                     │        │
│  │ Campaign 3  │ ──────────────→│                     │        │
│  └─────────────┘                └─────────────────────┘        │
│                                                                 │
│  Campaigns FEED INTO Funnels                                   │
│  Funnels CONVERT prospects to outcomes                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Ownership

### Campaign Automation Team
**Owner:** Campaign strategy, execution, optimization

**Responsibilities:**
- Design campaign briefs and messaging
- Coordinate multi-channel execution
- Track campaign metrics
- Optimize based on performance
- A/B test messaging and creative

**Scope:**
- Outreach campaigns (email, LinkedIn)
- Content campaigns (thought leadership)
- Event campaigns (webinars, launches)
- Retargeting campaigns

### Funnel Build Office
**Owner:** Funnel architecture and automation

**Responsibilities:**
- Design funnel stages and gates
- Build automation sequences
- Configure lead scoring
- Set up conversion tracking
- Maintain funnel infrastructure

**Scope:**
- Landing page flows
- Nurture sequences
- Lead qualification paths
- Handoff automation to sales

---

## 5. Routing Guide

### When to route to Campaign Automation Team:
- "We need to reach [audience] about [topic]"
- "Let's promote [asset/event/offer]"
- "Run outreach to [segment]"
- Time-bound initiative with messaging needs
- Multi-channel coordination required

### When to route to Funnel Build Office:
- "We need a landing page for [offer]"
- "Set up automation for [conversion path]"
- "Build the sequence from [A] to [B]"
- Always-on conversion infrastructure
- Lead nurture/scoring configuration

### When both are involved:
- Campaign launches that need funnel infrastructure
- New program requiring both outreach and conversion paths
- Major initiative spanning awareness → conversion

**Coordination Pattern:**
```
1. Campaign Team defines audience + messaging
2. Funnel Build Office creates infrastructure
3. Campaign Team runs campaign into funnel
4. Both track metrics at their layer
```

---

## 6. Integration Points

### Campaign → Funnel Handoffs

| Campaign Output | Funnel Input |
|-----------------|--------------|
| Clicked link | Landing page visitor |
| Responded to outreach | Warm lead entry |
| Downloaded content | Nurture sequence start |
| Attended event | Qualification flow entry |

### Funnel → Campaign Feedback

| Funnel Signal | Campaign Action |
|---------------|-----------------|
| Low landing page conversion | Revise messaging/targeting |
| High nurture drop-off | Adjust sequence content |
| Qualified leads converting | Double down on source |
| Unqualified volume | Refine campaign targeting |

---

## 7. Metrics by Layer

### Campaign Metrics (Campaign Automation Team owns)
- Reach / Impressions
- Engagement rate
- Click-through rate
- Response rate
- Cost per lead
- Campaign ROI

### Funnel Metrics (Funnel Build Office owns)
- Landing page conversion rate
- Stage-to-stage progression
- Time in stage
- Lead score distribution
- Funnel velocity
- Overall conversion rate

---

## 8. Common Scenarios

### Scenario 1: New Capital Program Launch
1. **Campaign Team:** Design launch campaign (messaging, channels, timing)
2. **Funnel Build Office:** Create investor landing page + nurture sequence
3. **Campaign Team:** Execute outreach driving to landing page
4. **Funnel Build Office:** Manage leads through qualification
5. **Both:** Track and optimize respective metrics

### Scenario 2: Content-Led Lead Generation
1. **Campaign Team:** Plan content campaign (topics, distribution)
2. **Funnel Build Office:** Set up content download → nurture flow
3. **Campaign Team:** Promote content across channels
4. **Funnel Build Office:** Score and qualify downloading leads

### Scenario 3: Event Follow-Up
1. **Campaign Team:** Run event promotion campaign
2. **Funnel Build Office:** Create event registration flow
3. **Post-event:** Campaign Team runs follow-up sequences
4. **Funnel Build Office:** Routes qualified attendees to sales

---

## 9. Tools & Systems

| Function | Tool | Owner |
|----------|------|-------|
| Email campaigns | HubSpot / Outreach | Campaign Automation |
| LinkedIn automation | LinkedIn + tools | Campaign Automation |
| Landing pages | Webflow / HubSpot | Funnel Build Office |
| Nurture sequences | HubSpot workflows | Funnel Build Office |
| Lead scoring | HubSpot / custom | Funnel Build Office |
| Analytics | HubSpot + dashboards | Both |

---

## 10. Quick Reference

```
┌─────────────────────────────────────────────────┐
│      CAMPAIGN vs FUNNEL CHEAT SHEET            │
├─────────────────────────────────────────────────┤
│                                                │
│  CAMPAIGN                  FUNNEL              │
│  ────────                  ──────              │
│  Time-bound               Always-on            │
│  Initiative               Infrastructure       │
│  Multi-channel            Sequential path      │
│  Messaging focus          Conversion focus     │
│  Campaign Automation      Funnel Build Office  │
│                                                │
│  Campaigns FEED funnels                        │
│  Funnels CONVERT traffic                       │
│                                                │
├─────────────────────────────────────────────────┤
│  ROUTING:                                      │
│  "Reach/promote/outreach" → Campaign Team      │
│  "Landing page/sequence"  → Funnel Build       │
│  "Launch + convert"       → Both collaborate   │
└─────────────────────────────────────────────────┘
```

---

*Created by Campaign Automation Team — OVP Task 3 — 2026-01-30*
