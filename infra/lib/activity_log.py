#!/usr/bin/env python3
"""
Activity Logging System for BD Surface.
Implements the schema from intelligence-layer.md.
"""

import uuid
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field, asdict
from enum import Enum

# Optional Notion integration
try:
    from notion_client import ActivityLogger, NotionClient
    NOTION_AVAILABLE = True
except ImportError:
    NOTION_AVAILABLE = False


class SignalCategory(Enum):
    """Intelligence layer signal categories."""
    BLOCKER = "BLOCKER"
    RHYTHM = "RHYTHM"
    STRATEGY = "STRATEGY"
    COACHING = "COACHING"
    ESCALATION = "ESCALATION"
    INTELLIGENCE = "INTELLIGENCE"


class ConfidenceLevel(Enum):
    """Confidence level buckets."""
    HIGH = "HIGH"        # 0.85+
    MEDIUM = "MEDIUM"    # 0.60-0.84
    LOW = "LOW"          # 0.40-0.59
    UNCERTAIN = "UNCERTAIN"  # <0.40
    
    @classmethod
    def from_score(cls, score: float) -> "ConfidenceLevel":
        if score >= 0.85:
            return cls.HIGH
        elif score >= 0.60:
            return cls.MEDIUM
        elif score >= 0.40:
            return cls.LOW
        return cls.UNCERTAIN


class ActionTaken(Enum):
    """Routing actions."""
    ROUTE_DIRECT = "route_direct"
    SUGGEST = "suggest"
    CLARIFY = "clarify"


class ResolutionStatus(Enum):
    """Resolution status values."""
    PENDING = "pending"
    COMPLETED = "completed"
    ESCALATED = "escalated"
    ABANDONED = "abandoned"


class OrgConfidence(Enum):
    """Organization confidence tiers."""
    KNOWN = "known"        # Confirmed org
    INFERRED = "inferred"  # Matched by pattern
    DEFAULT = "default"    # Linked to _Unaffiliated


@dataclass
class ContactInfo:
    """Contact context for activity."""
    person_id: str
    org_id: Optional[str] = None
    org_confidence: OrgConfidence = OrgConfidence.DEFAULT


@dataclass
class RoutingDecision:
    """Full routing decision per intelligence layer spec."""
    signal_detected: SignalCategory
    confidence: float
    confidence_level: ConfidenceLevel
    evidence: List[str]
    target_agent: str
    fallback_agent: Optional[str] = None
    cc_agents: List[str] = field(default_factory=list)
    action_taken: ActionTaken = ActionTaken.SUGGEST
    protocol_id: Optional[str] = None


@dataclass
class Resolution:
    """How the activity was resolved."""
    status: ResolutionStatus = ResolutionStatus.PENDING
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    outcome_summary: Optional[str] = None


@dataclass
class Feedback:
    """Post-hoc feedback on routing."""
    routing_correct: Optional[bool] = None
    user_override: Optional[str] = None
    notes: Optional[str] = None


@dataclass
class ActivityLogEntry:
    """
    Full activity log entry per intelligence-layer.md schema.
    """
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=datetime.utcnow)
    session_id: str = ""
    user_id: str = ""
    
    # Input
    raw_text: str = ""
    source_channel: str = "api"
    
    # Contact
    contact: Optional[ContactInfo] = None
    
    # Routing
    routing: Optional[RoutingDecision] = None
    
    # Resolution
    resolution: Resolution = field(default_factory=Resolution)
    
    # Feedback
    feedback: Feedback = field(default_factory=Feedback)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        result = {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "session_id": self.session_id,
            "user_id": self.user_id,
            "input": {
                "raw_text": self.raw_text,
                "source_channel": self.source_channel,
            },
        }
        
        if self.contact:
            result["contact"] = {
                "person_id": self.contact.person_id,
                "org_id": self.contact.org_id,
                "org_confidence": self.contact.org_confidence.value,
            }
        
        if self.routing:
            result["routing"] = {
                "signal_detected": self.routing.signal_detected.value,
                "confidence": self.routing.confidence,
                "confidence_level": self.routing.confidence_level.value,
                "evidence": self.routing.evidence,
                "target_agent": self.routing.target_agent,
                "fallback_agent": self.routing.fallback_agent,
                "cc_agents": self.routing.cc_agents,
                "action_taken": self.routing.action_taken.value,
                "protocol_id": self.routing.protocol_id,
            }
        
        result["resolution"] = {
            "status": self.resolution.status.value,
            "resolved_by": self.resolution.resolved_by,
            "resolved_at": self.resolution.resolved_at.isoformat() if self.resolution.resolved_at else None,
            "outcome_summary": self.resolution.outcome_summary,
        }
        
        result["feedback"] = {
            "routing_correct": self.feedback.routing_correct,
            "user_override": self.feedback.user_override,
            "notes": self.feedback.notes,
        }
        
        return result


class BDActivityLog:
    """
    Activity logging for BD Surface.
    Logs locally and optionally syncs to Notion.
    """
    
    def __init__(
        self,
        log_file: Optional[str] = None,
        sync_to_notion: bool = True,
    ):
        self.log_file = log_file
        self.sync_to_notion = sync_to_notion and NOTION_AVAILABLE
        self._notion_logger = None
        self._entries: List[ActivityLogEntry] = []
        
        if self.sync_to_notion:
            try:
                self._notion_logger = ActivityLogger()
            except Exception:
                self.sync_to_notion = False
    
    def log_routing(
        self,
        user_input: str,
        signal: SignalCategory,
        confidence: float,
        target_agent: str,
        evidence: List[str],
        session_id: str,
        user_id: str = "",
        source_channel: str = "telegram",
        contact: Optional[ContactInfo] = None,
        fallback_agent: Optional[str] = None,
        protocol_id: Optional[str] = None,
    ) -> ActivityLogEntry:
        """
        Log a routing decision.
        
        This is the main entry point for BD Surface to log all routing.
        """
        conf_level = ConfidenceLevel.from_score(confidence)
        action = (ActionTaken.ROUTE_DIRECT if conf_level == ConfidenceLevel.HIGH
                  else ActionTaken.CLARIFY if conf_level == ConfidenceLevel.UNCERTAIN
                  else ActionTaken.SUGGEST)
        
        entry = ActivityLogEntry(
            session_id=session_id,
            user_id=user_id,
            raw_text=user_input,
            source_channel=source_channel,
            contact=contact,
            routing=RoutingDecision(
                signal_detected=signal,
                confidence=confidence,
                confidence_level=conf_level,
                evidence=evidence,
                target_agent=target_agent,
                fallback_agent=fallback_agent,
                action_taken=action,
                protocol_id=protocol_id,
            ),
        )
        
        self._entries.append(entry)
        self._persist(entry)
        self._sync_notion(entry)
        
        return entry
    
    def resolve(
        self,
        entry_id: str,
        status: ResolutionStatus,
        resolved_by: str,
        outcome: Optional[str] = None,
    ) -> Optional[ActivityLogEntry]:
        """Update resolution status for an entry."""
        for entry in self._entries:
            if entry.id == entry_id:
                entry.resolution = Resolution(
                    status=status,
                    resolved_by=resolved_by,
                    resolved_at=datetime.utcnow(),
                    outcome_summary=outcome,
                )
                self._persist(entry)
                return entry
        return None
    
    def add_feedback(
        self,
        entry_id: str,
        routing_correct: bool,
        override: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[ActivityLogEntry]:
        """Add feedback to an entry for learning."""
        for entry in self._entries:
            if entry.id == entry_id:
                entry.feedback = Feedback(
                    routing_correct=routing_correct,
                    user_override=override,
                    notes=notes,
                )
                self._persist(entry)
                return entry
        return None
    
    def get_pending(self, limit: int = 50) -> List[ActivityLogEntry]:
        """Get pending entries (not resolved)."""
        return [
            e for e in self._entries
            if e.resolution.status == ResolutionStatus.PENDING
        ][:limit]
    
    def get_by_session(self, session_id: str) -> List[ActivityLogEntry]:
        """Get entries for a session."""
        return [e for e in self._entries if e.session_id == session_id]
    
    def _persist(self, entry: ActivityLogEntry):
        """Persist to local log file."""
        if not self.log_file:
            return
        with open(self.log_file, 'a') as f:
            f.write(json.dumps(entry.to_dict()) + "\n")
    
    def _sync_notion(self, entry: ActivityLogEntry):
        """Sync entry to Notion Activity Log."""
        if not self._notion_logger or not entry.routing:
            return
        
        try:
            self._notion_logger.log_routing(
                signal_category=entry.routing.signal_detected.value,
                target_agent=entry.routing.target_agent,
                confidence=entry.routing.confidence,
                evidence=entry.routing.evidence,
                action_taken=entry.routing.action_taken.value,
                session_id=entry.session_id,
                user_input=entry.raw_text[:500],
            )
        except Exception as e:
            # Don't fail on Notion errors
            print(f"Warning: Notion sync failed: {e}")
    
    def get_routing_accuracy(self, days: int = 7) -> Dict[str, Any]:
        """
        Calculate routing accuracy from feedback.
        Used for learning/tuning.
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        recent = [e for e in self._entries if e.timestamp >= cutoff and e.feedback.routing_correct is not None]
        
        if not recent:
            return {"sample_size": 0, "accuracy": None}
        
        correct = sum(1 for e in recent if e.feedback.routing_correct)
        
        # Break down by signal category
        by_category = {}
        for e in recent:
            if e.routing:
                cat = e.routing.signal_detected.value
                if cat not in by_category:
                    by_category[cat] = {"correct": 0, "total": 0}
                by_category[cat]["total"] += 1
                if e.feedback.routing_correct:
                    by_category[cat]["correct"] += 1
        
        return {
            "sample_size": len(recent),
            "accuracy": correct / len(recent),
            "by_category": {
                k: v["correct"] / v["total"] if v["total"] > 0 else None
                for k, v in by_category.items()
            },
            "period_days": days,
        }


# Import timedelta for get_routing_accuracy
from datetime import timedelta


if __name__ == "__main__":
    print("Testing BD Activity Log...")
    
    log = BDActivityLog(sync_to_notion=False)
    
    # Log a routing decision
    entry = log.log_routing(
        user_input="What should I focus on today?",
        signal=SignalCategory.RHYTHM,
        confidence=0.92,
        target_agent="orion_locke",
        evidence=["Direct ask", "morning timestamp"],
        session_id="session-001",
        user_id="ely",
        source_channel="telegram",
    )
    
    print(f"\nLogged entry: {entry.id}")
    print(f"Routing: {entry.routing.signal_detected.value} → {entry.routing.target_agent}")
    print(f"Action: {entry.routing.action_taken.value} (confidence: {entry.routing.confidence})")
    
    # Resolve it
    log.resolve(
        entry.id,
        status=ResolutionStatus.COMPLETED,
        resolved_by="orion_locke",
        outcome="Delivered morning priorities",
    )
    
    # Add feedback
    log.add_feedback(
        entry.id,
        routing_correct=True,
        notes="Good match for daily rhythm question",
    )
    
    print(f"\nFull entry:")
    print(json.dumps(entry.to_dict(), indent=2))
    
    print("\n✓ BD Activity Log working")
