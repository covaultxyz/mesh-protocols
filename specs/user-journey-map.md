# User Journey Map — BD Command Center
## Evelyn as Mission Control

*Owner: Cassian Sandman + Oracle*
*Status: DRAFT*
*Created: 2026-01-31*

---

## Vision

Evelyn isn't a chatbot. She's a **command center** — guiding BDs through their work, surfacing what matters, and extracting decisions along the way.

**The feel:** Mission control for deal flow
**The experience:** Guided, not interrogated. Proactive, not reactive.
**The outcome:** BD always knows what to do next

---

## Design Principles

1. **Guide, don't quiz** — Lead with context, ask for decisions
2. **Surface the signal** — Show what matters, hide the noise
3. **Extract consent, not data** — "Should I do X?" not "Enter X"
4. **Momentum over menus** — Keep things moving forward
5. **One screen, one decision** — Never overwhelm

---

## The Daily Rhythm

### Morning: Mission Briefing

```
Evelyn: ☀️ Morning, [Name]. Here's your mission:

TODAY'S PRIORITY
━━━━━━━━━━━━━━━
🎯 Nordic Infrastructure — needs re-engagement
   5 days quiet. Avery suggests: switch to LinkedIn.
   [Draft message] [Skip for now] [Mark resolved]

📅 2 meetings on deck:
   • 10:30 — Acme Family Office (prep ready)
   • 14:00 — Beta Capital (deck needs update)

⚠️ 1 item needs attention:
   • Gamma LP proposal expires tomorrow

What's first?
```

**What's happening:**
- Evelyn opened with the priority (not a menu)
- Showed the "why" (5 days quiet, Avery's suggestion)
- Gave clear action options
- Surfaced calendar + urgent items
- Ended with a question to extract intent

---

### Mid-day: Pulse Check

```
Evelyn: Quick pulse — how's the Acme call going?

[Went well — next steps coming]
[Need help — stuck on something]
[Reschedule — didn't happen]
```

**What's happening:**
- Proactive check-in (not waiting for BD to report)
- Three clear paths based on reality
- Minimal friction, maximum signal

---

### Post-Meeting: Capture & Route

```
BD: Acme call went well, they want revised terms

Evelyn: Great. Capturing that.

I'll route to Avery for term revision guidance.
Meanwhile, should I:

• Update the deal stage to "Negotiation"?
• Draft a follow-up email for your review?
• Schedule the next touchpoint?

[Yes to all] [Let me pick] [Just log it]
```

**What's happening:**
- Evelyn understood intent (no keyword matching)
- Routed to specialist (Avery for terms)
- Offered next actions as suggestions
- "Yes to all" for momentum, "Let me pick" for control

---

### Stale Deal: Proactive Intervention

```
Evelyn: 🔔 Nordic Infrastructure has been quiet for 5 days.

Last activity: Email sent Jan 26, no response.

Avery's playbook says: channel switch time.
Options:
• LinkedIn connect + message
• Phone call
• Different stakeholder

Want me to draft a LinkedIn approach?

[Yes, draft it] [Try phone instead] [I'll handle it] [Kill the deal]
```

**What's happening:**
- Evelyn detected the signal (temporal pattern)
- Provided context (what happened, when)
- Referenced the expert (Avery's playbook)
- Offered clear paths including "kill" option
- Asking for consent, not just reporting

---

### Research Request: Guided Extraction

```
BD: I need research on a new prospect — Meridian Capital

Evelyn: Got it. Queuing research for Meridian Capital.

A few quick questions to focus the team:

1. What's the opportunity size?
   [Under $100K] [$100-500K] [$500K+] [Unknown]

2. Which program are you pitching?
   [Far North Fiber] [Visionary Zero] [Operating System] [Not sure yet]

3. Timeline?
   [This week] [This month] [Exploratory]

This helps Research prioritize.
```

**What's happening:**
- Confirmed the request immediately
- Extracted key data through guided choices
- Explained why (prioritization)
- No open-ended forms — just taps

---

### End of Day: Wrap & Prep

```
Evelyn: 🌙 EOD wrap-up:

TODAY
━━━━
✅ Acme meeting — went well, terms to Avery
✅ Nordic — LinkedIn draft ready for your review
⏸️ Beta deck update — carried to tomorrow

TOMORROW
━━━━━━━
📅 09:00 — Prep time blocked
📅 11:00 — Gamma LP follow-up call
🎯 Priority: Send Beta deck before EOD

Anything to add before I close the day?

[Looks good] [Add a note] [Show me tomorrow's full agenda]
```

**What's happening:**
- Summary of what moved
- Carried forward items
- Tomorrow's setup
- One more chance to capture anything missed

---

## Key Patterns

### 1. Lead with Context
Never ask a question without context. Always show the "why."

❌ "What would you like to do?"
✅ "Nordic's been quiet 5 days. Avery suggests LinkedIn. Draft a message?"

### 2. Buttons for Decisions, Not Navigation
Buttons = committing to action
Conversation = exploring options

❌ [Research] [Pipeline] [Settings]
✅ [Draft message] [Skip for now] [I'll handle it]

### 3. Extract Consent, Not Data
Ask for permission to act, not data to store.

❌ "Enter the deal amount:"
✅ "Looks like a $200K opportunity. Sound right?" [Yes] [Adjust]

### 4. Momentum by Default
Always have a clear "next" action. Never dead-end.

❌ "Request submitted." (then what?)
✅ "Request submitted. I'll ping you when Research has something. Meanwhile, want to prep for your 2pm?"

### 5. Progressive Disclosure
Start simple, reveal complexity on demand.

❌ Show all 15 pipeline filters upfront
✅ "Here's your pipeline. [Filter] [Sort] [Export]" → expand on tap

---

## Touchpoint Map

| Moment | Evelyn's Role | Signal Source |
|--------|---------------|---------------|
| Morning | Mission briefing | Calendar, CRM, stale deals |
| Pre-meeting | Prep package | Calendar, deal context |
| Post-meeting | Capture + route | BD input, intent detection |
| Stale deal | Proactive intervention | Temporal pattern |
| Research need | Guided extraction | BD request |
| Blocker | Escalation | BD signal or pattern |
| End of day | Wrap + prep | Activity log, calendar |
| Weekly | Pipeline review | CRM rollup |

---

## Consent Extraction Points

Key moments where Evelyn asks for guidance:

| Decision | How Evelyn Asks |
|----------|-----------------|
| Deal stage update | "Move to Negotiation?" [Yes] [Not yet] |
| Outreach channel | "Try LinkedIn?" [Yes] [Phone] [Email again] |
| Meeting prep | "Send prep doc to attendees?" [Yes] [Let me review] |
| Research priority | "Rush this?" [$50 credit] [Standard SLA is fine] |
| Kill a deal | "Close as lost?" [Yes, lost] [No, just paused] |

---

## Anti-Patterns to Avoid

1. **Menu dumping** — Don't show 5 buttons when 1 question works
2. **Dead ends** — Every interaction leads somewhere
3. **Keyword dependence** — Understand intent, not just words
4. **Form fields** — Buttons and choices over text input
5. **Passive waiting** — Evelyn reaches out, doesn't just respond
6. **Context amnesia** — Remember what we were discussing

---

## Next Steps

1. [ ] Map each touchpoint to Protocol spec protocols
2. [ ] Design the conversation state machine
3. [ ] Build morning briefing flow first (highest value)
4. [ ] Test with CJ Vincenty (first BD)
5. [ ] Iterate based on friction points

---

*v0.1 — Initial journey draft*
