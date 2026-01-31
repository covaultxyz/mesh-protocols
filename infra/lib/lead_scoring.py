#!/usr/bin/env python3
"""
Lead Scoring System for BD Surface.
Calculates engagement scores for contacts and organizations.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum
import json


class SignalType(Enum):
    """Types of engagement signals."""
    EMAIL_OPEN = "email_open"
    EMAIL_REPLY = "email_reply"
    MEETING_SCHEDULED = "meeting_scheduled"
    MEETING_COMPLETED = "meeting_completed"
    WEBSITE_VISIT = "website_visit"
    CONTENT_DOWNLOAD = "content_download"
    LINKEDIN_CONNECT = "linkedin_connect"
    LINKEDIN_ENGAGE = "linkedin_engage"
    REFERRAL = "referral"
    INBOUND_REQUEST = "inbound_request"
    DEAL_STAGE_ADVANCE = "deal_stage_advance"


@dataclass
class ScoringWeights:
    """Configurable weights for different signals."""
    
    # Activity points
    email_open: int = 1
    email_reply: int = 10
    meeting_scheduled: int = 15
    meeting_completed: int = 25
    website_visit: int = 2
    content_download: int = 5
    linkedin_connect: int = 3
    linkedin_engage: int = 5
    referral: int = 30
    inbound_request: int = 40
    deal_stage_advance: int = 20
    
    # Decay settings
    decay_half_life_days: int = 30     # Points halve every 30 days
    recency_boost_days: int = 7        # Extra points for recent activity
    recency_boost_multiplier: float = 1.5
    
    # Thresholds
    hot_threshold: int = 80
    warm_threshold: int = 40
    cold_threshold: int = 10
    
    def get_weight(self, signal_type: SignalType) -> int:
        """Get weight for a signal type."""
        return getattr(self, signal_type.value, 0)


@dataclass
class EngagementSignal:
    """A single engagement event."""
    signal_type: SignalType
    timestamp: datetime
    source: str = "unknown"
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class LeadScore:
    """Calculated score for a lead."""
    contact_id: str
    org_id: Optional[str]
    raw_score: float
    decayed_score: float
    tier: str  # hot, warm, cold, dormant
    signal_count: int
    last_activity: Optional[datetime]
    top_signals: List[str]
    calculated_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "contact_id": self.contact_id,
            "org_id": self.org_id,
            "score": round(self.decayed_score, 1),
            "tier": self.tier,
            "signal_count": self.signal_count,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "top_signals": self.top_signals,
        }


class LeadScorer:
    """
    Calculates engagement scores for leads based on activity signals.
    Uses time-decay to weight recent activity higher.
    """
    
    def __init__(self, weights: Optional[ScoringWeights] = None):
        self.weights = weights or ScoringWeights()
    
    def _decay_factor(self, age_days: float) -> float:
        """Calculate decay factor based on age."""
        if age_days <= 0:
            return 1.0
        half_life = self.weights.decay_half_life_days
        return 0.5 ** (age_days / half_life)
    
    def _recency_multiplier(self, timestamp: datetime, now: datetime) -> float:
        """Apply recency boost for very recent activity."""
        age_days = (now - timestamp).total_seconds() / 86400
        if age_days <= self.weights.recency_boost_days:
            return self.weights.recency_boost_multiplier
        return 1.0
    
    def _get_tier(self, score: float) -> str:
        """Classify score into tier."""
        if score >= self.weights.hot_threshold:
            return "hot"
        elif score >= self.weights.warm_threshold:
            return "warm"
        elif score >= self.weights.cold_threshold:
            return "cold"
        return "dormant"
    
    def calculate(
        self,
        contact_id: str,
        signals: List[EngagementSignal],
        org_id: Optional[str] = None,
        reference_time: Optional[datetime] = None,
    ) -> LeadScore:
        """
        Calculate lead score from engagement signals.
        
        Args:
            contact_id: Contact identifier
            signals: List of engagement signals
            org_id: Optional organization ID
            reference_time: Time to calculate from (default: now)
        
        Returns:
            LeadScore with raw, decayed, and tier info
        """
        now = reference_time or datetime.utcnow()
        
        if not signals:
            return LeadScore(
                contact_id=contact_id,
                org_id=org_id,
                raw_score=0,
                decayed_score=0,
                tier="dormant",
                signal_count=0,
                last_activity=None,
                top_signals=[],
            )
        
        raw_score = 0.0
        decayed_score = 0.0
        signal_contributions: List[Tuple[str, float]] = []
        
        for signal in signals:
            weight = self.weights.get_weight(signal.signal_type)
            raw_score += weight
            
            # Calculate age and decay
            age_days = (now - signal.timestamp).total_seconds() / 86400
            decay = self._decay_factor(age_days)
            recency = self._recency_multiplier(signal.timestamp, now)
            
            adjusted_weight = weight * decay * recency
            decayed_score += adjusted_weight
            
            signal_contributions.append((signal.signal_type.value, adjusted_weight))
        
        # Sort signals by contribution
        signal_contributions.sort(key=lambda x: x[1], reverse=True)
        top_signals = [s[0] for s in signal_contributions[:3]]
        
        # Find last activity
        last_activity = max(s.timestamp for s in signals)
        
        return LeadScore(
            contact_id=contact_id,
            org_id=org_id,
            raw_score=raw_score,
            decayed_score=decayed_score,
            tier=self._get_tier(decayed_score),
            signal_count=len(signals),
            last_activity=last_activity,
            top_signals=top_signals,
        )
    
    def calculate_org_score(
        self,
        org_id: str,
        contact_scores: List[LeadScore],
    ) -> Dict[str, Any]:
        """
        Aggregate contact scores into org-level score.
        Uses weighted average with champion boost.
        """
        if not contact_scores:
            return {
                "org_id": org_id,
                "score": 0,
                "tier": "dormant",
                "contact_count": 0,
                "champions": [],
            }
        
        # Find champions (hot leads at the org)
        champions = [c for c in contact_scores if c.tier == "hot"]
        
        # Weighted average: champion's worth more
        total_weight = 0
        weighted_sum = 0
        for score in contact_scores:
            weight = 3 if score.tier == "hot" else 2 if score.tier == "warm" else 1
            weighted_sum += score.decayed_score * weight
            total_weight += weight
        
        org_score = weighted_sum / total_weight if total_weight > 0 else 0
        
        return {
            "org_id": org_id,
            "score": round(org_score, 1),
            "tier": self._get_tier(org_score),
            "contact_count": len(contact_scores),
            "champions": [c.contact_id for c in champions],
            "avg_contact_score": sum(c.decayed_score for c in contact_scores) / len(contact_scores),
        }
    
    def batch_score(
        self,
        leads: Dict[str, List[EngagementSignal]],
    ) -> List[LeadScore]:
        """Score multiple leads at once."""
        return [
            self.calculate(contact_id, signals)
            for contact_id, signals in leads.items()
        ]
    
    def prioritize(
        self,
        scores: List[LeadScore],
        limit: int = 10,
        tier_filter: Optional[str] = None,
    ) -> List[LeadScore]:
        """
        Prioritize leads for outreach.
        
        Args:
            scores: List of lead scores
            limit: Max leads to return
            tier_filter: Only return specific tier
        
        Returns:
            Prioritized list of leads
        """
        filtered = scores
        if tier_filter:
            filtered = [s for s in scores if s.tier == tier_filter]
        
        # Sort by score descending, then recency
        filtered.sort(key=lambda x: (x.decayed_score, x.last_activity or datetime.min), reverse=True)
        
        return filtered[:limit]


if __name__ == "__main__":
    # Demo usage
    print("Testing Lead Scoring System...")
    
    scorer = LeadScorer()
    now = datetime.utcnow()
    
    # Create test signals
    signals = [
        EngagementSignal(SignalType.INBOUND_REQUEST, now - timedelta(days=2)),
        EngagementSignal(SignalType.MEETING_COMPLETED, now - timedelta(days=5)),
        EngagementSignal(SignalType.EMAIL_REPLY, now - timedelta(days=10)),
        EngagementSignal(SignalType.EMAIL_OPEN, now - timedelta(days=15)),
        EngagementSignal(SignalType.LINKEDIN_CONNECT, now - timedelta(days=30)),
    ]
    
    score = scorer.calculate("contact-001", signals, org_id="org-001")
    print(f"\nLead Score:")
    print(json.dumps(score.to_dict(), indent=2))
    
    # Test cold lead
    cold_signals = [
        EngagementSignal(SignalType.EMAIL_OPEN, now - timedelta(days=60)),
    ]
    cold_score = scorer.calculate("contact-002", cold_signals)
    print(f"\nCold Lead: {cold_score.tier} ({cold_score.decayed_score:.1f})")
    
    # Test org scoring
    org_scores = [score, cold_score]
    org_result = scorer.calculate_org_score("org-001", org_scores)
    print(f"\nOrg Score:")
    print(json.dumps(org_result, indent=2))
    
    print("\n✓ Lead scoring working")
