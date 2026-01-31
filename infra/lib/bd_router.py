#!/usr/bin/env python3
"""
BD Routing Logic (Task 5)
Routes intake form submissions through the BD funnel.
Author: Sandman
Created: 2026-01-31
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum
import json
import os

# Import sibling modules
from .lead_scoring import LeadScorer, SignalType, LeadScore
from .activity_log import BDActivityLog, ActivityLogEntry


class FunnelStage(Enum):
    """BD Funnel stages matching Notion DB."""
    CONTACT = "A–Contact"
    QUALIFICATION = "B–Qualification"
    DILIGENCE = "C–Diligence"
    CLOSING = "D–Closing"
    WON = "Won"
    LOST = "Lost"


class IntakeStatus(Enum):
    """Intake form submission statuses."""
    NEW = "New"
    TRIAGED = "Triaged"
    PROCESSED = "Processed"
    REJECTED = "Rejected"


class RouteDecision(Enum):
    """Routing decision types."""
    AUTO_QUALIFY = "auto_qualify"      # High-signal, fast-track
    STANDARD_TRIAGE = "standard_triage"  # Normal flow
    NURTURE = "nurture"                # Low priority, drip campaign
    REJECT = "reject"                  # Spam/unqualified
    ESCALATE = "escalate"              # Needs human review


@dataclass
class RoutingRule:
    """A single routing rule."""
    name: str
    condition: callable  # Function that takes submission dict, returns bool
    decision: RouteDecision
    target_stage: Optional[FunnelStage] = None
    assigned_bot: Optional[str] = None
    priority: int = 0  # Higher = checked first


@dataclass
class RoutingResult:
    """Result of routing decision."""
    submission_id: str
    decision: RouteDecision
    target_stage: Optional[FunnelStage]
    assigned_bot: Optional[str]
    confidence: float  # 0.0 - 1.0
    matched_rule: str
    reasoning: str
    signals: List[Dict[str, Any]] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BDRouter:
    """
    Routes BD intake submissions to appropriate funnel stages and handlers.
    
    Flow:
    1. New submission arrives in Intake Form Submissions DB
    2. Router evaluates against rules
    3. Creates entry in Funnel Tracker with appropriate stage
    4. Updates Intake status to Triaged/Processed
    5. Logs routing decision for audit
    """
    
    # Notion DB IDs
    FUNNEL_TRACKER_DB = "2f935e81-2bbb-8188-a626-cce1c6015582"
    INTAKE_SUBMISSIONS_DB = "2f935e81-2bbb-8104-9b3e-f96e508815b0"
    
    # Bot assignments
    BOT_ASSIGNMENTS = {
        "outreach": "Liaison Team",
        "research": "Research Team",  
        "qualification": "Sales Growth Engine",
        "closing": "IC Committee",
    }
    
    def __init__(
        self,
        notion_client=None,
        lead_scorer: Optional[LeadScorer] = None,
        activity_log: Optional[BDActivityLog] = None,
    ):
        self.notion = notion_client
        self.scorer = lead_scorer or LeadScorer()
        self.activity_log = activity_log
        self.rules = self._build_default_rules()
    
    def _build_default_rules(self) -> List[RoutingRule]:
        """Build the default routing ruleset."""
        return sorted([
            # High-value signals → fast-track
            RoutingRule(
                name="inbound_high_value",
                condition=lambda s: (
                    s.get("source") == "inbound" and
                    self._estimate_deal_size(s) >= 1_000_000
                ),
                decision=RouteDecision.AUTO_QUALIFY,
                target_stage=FunnelStage.QUALIFICATION,
                assigned_bot=self.BOT_ASSIGNMENTS["qualification"],
                priority=100,
            ),
            
            # Referral → fast-track
            RoutingRule(
                name="referral",
                condition=lambda s: s.get("source") == "referral",
                decision=RouteDecision.AUTO_QUALIFY,
                target_stage=FunnelStage.QUALIFICATION,
                assigned_bot=self.BOT_ASSIGNMENTS["qualification"],
                priority=90,
            ),
            
            # Known org with existing relationship
            RoutingRule(
                name="existing_relationship",
                condition=lambda s: s.get("existing_contact", False),
                decision=RouteDecision.STANDARD_TRIAGE,
                target_stage=FunnelStage.QUALIFICATION,
                assigned_bot=self.BOT_ASSIGNMENTS["qualification"],
                priority=80,
            ),
            
            # Inbound with clear intent
            RoutingRule(
                name="inbound_clear_intent",
                condition=lambda s: (
                    s.get("source") == "inbound" and
                    s.get("intent_signal") in ["demo_request", "pricing_inquiry", "partnership"]
                ),
                decision=RouteDecision.STANDARD_TRIAGE,
                target_stage=FunnelStage.CONTACT,
                assigned_bot=self.BOT_ASSIGNMENTS["outreach"],
                priority=70,
            ),
            
            # Outbound research target
            RoutingRule(
                name="research_target",
                condition=lambda s: s.get("source") == "research_identified",
                decision=RouteDecision.STANDARD_TRIAGE,
                target_stage=FunnelStage.CONTACT,
                assigned_bot=self.BOT_ASSIGNMENTS["research"],
                priority=60,
            ),
            
            # Low-signal inbound → nurture
            RoutingRule(
                name="low_signal_inbound",
                condition=lambda s: (
                    s.get("source") == "inbound" and
                    not s.get("intent_signal")
                ),
                decision=RouteDecision.NURTURE,
                target_stage=FunnelStage.CONTACT,
                assigned_bot=self.BOT_ASSIGNMENTS["outreach"],
                priority=30,
            ),
            
            # Spam indicators → reject
            RoutingRule(
                name="spam_filter",
                condition=lambda s: self._is_spam(s),
                decision=RouteDecision.REJECT,
                target_stage=None,
                assigned_bot=None,
                priority=200,  # Check first
            ),
            
            # Unclear → escalate for human review
            RoutingRule(
                name="escalate_unclear",
                condition=lambda s: True,  # Catch-all
                decision=RouteDecision.ESCALATE,
                target_stage=FunnelStage.CONTACT,
                assigned_bot=self.BOT_ASSIGNMENTS["qualification"],
                priority=0,
            ),
        ], key=lambda r: -r.priority)
    
    def _estimate_deal_size(self, submission: Dict[str, Any]) -> float:
        """Estimate potential deal size from submission data."""
        # Check explicit deal size if provided
        if "estimated_deal_size" in submission:
            return float(submission["estimated_deal_size"])
        
        # Infer from org size, industry, etc.
        org_size = submission.get("org_employee_count", 0)
        if org_size > 1000:
            return 500_000
        elif org_size > 100:
            return 100_000
        elif org_size > 10:
            return 25_000
        return 10_000
    
    def _is_spam(self, submission: Dict[str, Any]) -> bool:
        """Detect spam submissions."""
        spam_indicators = [
            # No real company info
            not submission.get("org_name"),
            # Generic/disposable email
            any(d in submission.get("email", "") for d in [
                "mailinator", "tempmail", "throwaway", "test.com"
            ]),
            # Keyword spam
            any(w in submission.get("message", "").lower() for w in [
                "viagra", "crypto airdrop", "nigerian prince", "mlm opportunity"
            ]),
        ]
        return sum(spam_indicators) >= 2
    
    def route(self, submission: Dict[str, Any]) -> RoutingResult:
        """
        Route a single intake submission.
        
        Args:
            submission: Dict with submission data from Intake DB
            
        Returns:
            RoutingResult with decision and routing details
        """
        submission_id = submission.get("id", "unknown")
        signals = []
        
        # Apply lead scoring if we have contact history
        contact_id = submission.get("contact_id")
        lead_score = None
        if contact_id and self.scorer:
            lead_score = self.scorer.get_score(contact_id)
            if lead_score:
                signals.append({
                    "type": "lead_score",
                    "value": lead_score.total_score,
                    "tier": lead_score.tier.value if lead_score.tier else None,
                })
        
        # Evaluate rules in priority order
        for rule in self.rules:
            try:
                if rule.condition(submission):
                    confidence = self._calculate_confidence(submission, rule, lead_score)
                    reasoning = self._generate_reasoning(submission, rule, signals)
                    
                    result = RoutingResult(
                        submission_id=submission_id,
                        decision=rule.decision,
                        target_stage=rule.target_stage,
                        assigned_bot=rule.assigned_bot,
                        confidence=confidence,
                        matched_rule=rule.name,
                        reasoning=reasoning,
                        signals=signals,
                    )
                    
                    # Log the decision
                    if self.activity_log:
                        try:
                            from .activity_log import SignalCategory
                            self.activity_log.log_routing(
                                user_input=f"Intake submission {submission_id}",
                                signal=SignalCategory.INFORMATIONAL,
                                confidence=confidence,
                                target_agent=rule.assigned_bot or "unknown",
                                evidence=[rule.name, reasoning],
                                session_id=submission_id,
                            )
                        except Exception:
                            pass  # Don't fail routing on logging errors
                    
                    return result
                    
            except Exception as e:
                # Log error but continue to next rule
                signals.append({"type": "rule_error", "rule": rule.name, "error": str(e)})
                continue
        
        # Should never reach here due to catch-all rule
        return RoutingResult(
            submission_id=submission_id,
            decision=RouteDecision.ESCALATE,
            target_stage=FunnelStage.CONTACT,
            assigned_bot=self.BOT_ASSIGNMENTS["qualification"],
            confidence=0.0,
            matched_rule="fallback",
            reasoning="No rules matched; escalating for human review",
            signals=signals,
        )
    
    def _calculate_confidence(
        self,
        submission: Dict[str, Any],
        rule: RoutingRule,
        lead_score: Optional[Any],
    ) -> float:
        """Calculate confidence score for routing decision."""
        base_confidence = 0.5
        
        # Boost for high-priority rules (more specific)
        if rule.priority >= 80:
            base_confidence += 0.2
        elif rule.priority >= 50:
            base_confidence += 0.1
        
        # Boost for lead score alignment
        if lead_score:
            if lead_score.tier == "hot" and rule.decision == RouteDecision.AUTO_QUALIFY:
                base_confidence += 0.2
            elif lead_score.tier == "cold" and rule.decision == RouteDecision.NURTURE:
                base_confidence += 0.15
        
        # Boost for complete data
        completeness = sum([
            bool(submission.get("org_name")),
            bool(submission.get("email")),
            bool(submission.get("contact_name")),
            bool(submission.get("intent_signal")),
            bool(submission.get("source")),
        ]) / 5.0
        base_confidence += completeness * 0.1
        
        return min(base_confidence, 1.0)
    
    def _generate_reasoning(
        self,
        submission: Dict[str, Any],
        rule: RoutingRule,
        signals: List[Dict[str, Any]],
    ) -> str:
        """Generate human-readable reasoning for the decision."""
        parts = [f"Matched rule: {rule.name}"]
        
        if rule.decision == RouteDecision.AUTO_QUALIFY:
            parts.append("High-value signals detected, fast-tracking to qualification.")
        elif rule.decision == RouteDecision.NURTURE:
            parts.append("Low intent signals, adding to nurture sequence.")
        elif rule.decision == RouteDecision.REJECT:
            parts.append("Spam indicators detected, rejecting submission.")
        elif rule.decision == RouteDecision.ESCALATE:
            parts.append("Unclear routing criteria, escalating for human review.")
        
        if signals:
            signal_summary = ", ".join(
                f"{s['type']}={s.get('value', s.get('tier', '?'))}" 
                for s in signals if s.get('type') != 'rule_error'
            )
            if signal_summary:
                parts.append(f"Signals: {signal_summary}")
        
        return " ".join(parts)
    
    def process_new_submissions(self) -> List[RoutingResult]:
        """
        Process all new intake submissions.
        
        Returns:
            List of RoutingResults for each processed submission
        """
        if not self.notion:
            raise ValueError("Notion client required for batch processing")
        
        # Query Intake DB for new submissions
        new_submissions = self.notion.query_database(
            self.INTAKE_SUBMISSIONS_DB,
            filter={
                "property": "Status",
                "select": {"equals": IntakeStatus.NEW.value}
            }
        )
        
        results = []
        for submission in new_submissions:
            # Extract submission data from Notion page
            sub_data = self._extract_submission_data(submission)
            
            # Route it
            result = self.route(sub_data)
            results.append(result)
            
            # Update Intake status
            new_status = (
                IntakeStatus.REJECTED if result.decision == RouteDecision.REJECT
                else IntakeStatus.TRIAGED
            )
            self.notion.update_page(
                submission["id"],
                properties={
                    "Status": {"select": {"name": new_status.value}},
                    "Routing Decision": {"rich_text": [{"text": {"content": result.reasoning[:200]}}]},
                    "Routed At": {"date": {"start": result.timestamp}},
                }
            )
            
            # Create Funnel entry if not rejected
            if result.decision != RouteDecision.REJECT and result.target_stage:
                self.notion.create_page(
                    self.FUNNEL_TRACKER_DB,
                    properties={
                        "Name": {"title": [{"text": {"content": sub_data.get("org_name", "Unknown")}}]},
                        "Stage": {"select": {"name": result.target_stage.value}},
                        "Owner": {"relation": []},  # TODO: map assigned_bot to VT relation
                        "Source Submission": {"relation": [{"id": submission["id"]}]},
                        "Routing Confidence": {"number": result.confidence},
                        "Created": {"date": {"start": result.timestamp}},
                    }
                )
        
        return results
    
    def _extract_submission_data(self, notion_page: Dict[str, Any]) -> Dict[str, Any]:
        """Extract submission fields from Notion page properties."""
        props = notion_page.get("properties", {})
        
        def get_text(prop):
            """Extract text from various Notion property types."""
            if not prop:
                return None
            ptype = prop.get("type")
            if ptype == "title":
                return prop["title"][0]["plain_text"] if prop.get("title") else None
            elif ptype == "rich_text":
                return prop["rich_text"][0]["plain_text"] if prop.get("rich_text") else None
            elif ptype == "email":
                return prop.get("email")
            elif ptype == "select":
                return prop["select"]["name"] if prop.get("select") else None
            elif ptype == "number":
                return prop.get("number")
            return None
        
        return {
            "id": notion_page["id"],
            "org_name": get_text(props.get("Organization")),
            "contact_name": get_text(props.get("Contact Name")),
            "email": get_text(props.get("Email")),
            "source": get_text(props.get("Source")),
            "intent_signal": get_text(props.get("Intent Signal")),
            "message": get_text(props.get("Message")),
            "estimated_deal_size": get_text(props.get("Estimated Deal Size")),
            "org_employee_count": get_text(props.get("Org Size")),
            "existing_contact": bool(get_text(props.get("Existing Contact"))),
        }


# CLI for testing
if __name__ == "__main__":
    import sys
    
    router = BDRouter()
    
    # Test submission
    test_sub = {
        "id": "test-001",
        "org_name": "Acme Corp",
        "email": "ceo@acme.com",
        "source": "inbound",
        "intent_signal": "demo_request",
        "estimated_deal_size": 500000,
    }
    
    result = router.route(test_sub)
    print(f"Decision: {result.decision.value}")
    print(f"Stage: {result.target_stage.value if result.target_stage else 'N/A'}")
    print(f"Assigned: {result.assigned_bot}")
    print(f"Confidence: {result.confidence:.2f}")
    print(f"Reasoning: {result.reasoning}")
