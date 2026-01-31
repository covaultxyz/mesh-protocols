"""
Mesh Infrastructure Library.
Shared utilities for VoltAgent, BD Surface, and Night Shift.
"""

from .notion_client import NotionClient, ActivityLogger, MeshWorkLogger
from .resource_tracker import ResourceTracker, ResourceBudget, NightShiftBudgets
from .lead_scoring import LeadScorer, LeadScore, EngagementSignal, SignalType
from .activity_log import (
    BDActivityLog,
    ActivityLogEntry,
    SignalCategory,
    ConfidenceLevel,
    RoutingDecision,
    ContactInfo,
)
from .bd_router import (
    BDRouter,
    RoutingRule,
    RoutingResult,
    RouteDecision,
    FunnelStage,
    IntakeStatus,
)

__all__ = [
    # Notion
    "NotionClient",
    "ActivityLogger", 
    "MeshWorkLogger",
    # Resources
    "ResourceTracker",
    "ResourceBudget",
    "NightShiftBudgets",
    # Lead Scoring
    "LeadScorer",
    "LeadScore",
    "EngagementSignal",
    "SignalType",
    # Activity Logging
    "BDActivityLog",
    "ActivityLogEntry",
    "SignalCategory",
    "ConfidenceLevel",
    "RoutingDecision",
    "ContactInfo",
    # BD Router
    "BDRouter",
    "RoutingRule",
    "RoutingResult",
    "RouteDecision",
    "FunnelStage",
    "IntakeStatus",
]
