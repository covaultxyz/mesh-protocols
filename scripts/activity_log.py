#!/usr/bin/env python3
"""
Activity Logger — Structured logging for agent actions
Supports local JSONL + Notion sync
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Paths
LOG_DIR = Path("/root/clawd/logs")
ACTIVITY_LOG = LOG_DIR / "activity.jsonl"
LOG_DIR.mkdir(exist_ok=True)

# Activity categories
CATEGORIES = {
    "task": "Task execution (start, complete, fail)",
    "decision": "Decisions made with rationale",
    "learning": "Lessons learned, mistakes, patterns",
    "collaboration": "Inter-agent coordination",
    "system": "System events (restart, error, recovery)",
    "human": "Human interactions (request, response)",
}

def log_activity(
    category: str,
    action: str,
    details: str = "",
    outcome: str = "success",
    agent: str = "oracle",
    metadata: dict = None
):
    """Log an activity entry."""
    
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent": agent,
        "session": os.environ.get("SESSION_ID", datetime.now().strftime("%Y%m%d")),
        "category": category,
        "action": action,
        "details": details,
        "outcome": outcome,
        "metadata": metadata or {}
    }
    
    # Append to JSONL
    with open(ACTIVITY_LOG, "a") as f:
        f.write(json.dumps(entry) + "\n")
    
    return entry

def query_activities(
    category: str = None,
    since: str = None,
    agent: str = None,
    limit: int = 50
):
    """Query activity log with filters."""
    
    if not ACTIVITY_LOG.exists():
        return []
    
    results = []
    with open(ACTIVITY_LOG) as f:
        for line in f:
            try:
                entry = json.loads(line.strip())
                
                # Apply filters
                if category and entry.get("category") != category:
                    continue
                if agent and entry.get("agent") != agent:
                    continue
                if since and entry.get("timestamp", "") < since:
                    continue
                
                results.append(entry)
            except json.JSONDecodeError:
                continue
    
    return results[-limit:]

def summarize_today():
    """Get summary of today's activities."""
    
    today = datetime.now().strftime("%Y-%m-%d")
    activities = query_activities(since=today)
    
    summary = {
        "total": len(activities),
        "by_category": {},
        "by_outcome": {"success": 0, "failure": 0, "pending": 0}
    }
    
    for a in activities:
        cat = a.get("category", "unknown")
        outcome = a.get("outcome", "unknown")
        
        summary["by_category"][cat] = summary["by_category"].get(cat, 0) + 1
        if outcome in summary["by_outcome"]:
            summary["by_outcome"][outcome] += 1
    
    return summary

# CLI interface
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: activity_log.py <category> <action> [details] [outcome]")
        print(f"Categories: {', '.join(CATEGORIES.keys())}")
        sys.exit(1)
    
    category = sys.argv[1]
    action = sys.argv[2]
    details = sys.argv[3] if len(sys.argv) > 3 else ""
    outcome = sys.argv[4] if len(sys.argv) > 4 else "success"
    
    entry = log_activity(category, action, details, outcome)
    print(f"✅ Logged: {category}/{action} ({outcome})")
