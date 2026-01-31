#!/usr/bin/env python3
"""
Notion API client for mesh infrastructure.
Handles Activity Log, Mesh Work Log, and Virtual Teams databases.
"""

import os
import json
import subprocess
from datetime import datetime
from typing import Optional, Dict, Any, List
import requests


class NotionClient:
    """Lightweight Notion API wrapper for mesh infra."""
    
    BASE_URL = "https://api.notion.com/v1"
    VERSION = "2022-06-28"
    
    # Covault workspace databases
    DBS = {
        "activity_log": "2f735e81-2bbb-8139-9be3-e9363b309b46",
        "mesh_work_log": "2f935e81-2bbb-810e-8bc0-eed9cfdf3c19",
        "virtual_teams": "2f735e81-2bbb-81eb-903a-d3c9edd8331a",
    }
    
    def __init__(self, token: Optional[str] = None):
        self.token = token or self._get_token()
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "Notion-Version": self.VERSION,
        }
    
    def _get_token(self) -> str:
        """Get token from pass store."""
        result = subprocess.run(
            ["pass", "show", "api/notion/covault"],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            raise ValueError("Failed to get Notion token from pass")
        return result.stdout.strip()
    
    def query_database(self, db_key: str, filter_obj: Optional[Dict] = None, 
                       sorts: Optional[List] = None, page_size: int = 100) -> List[Dict]:
        """Query a database with optional filters and sorts."""
        db_id = self.DBS.get(db_key, db_key)  # Allow raw ID too
        
        payload = {"page_size": page_size}
        if filter_obj:
            payload["filter"] = filter_obj
        if sorts:
            payload["sorts"] = sorts
            
        resp = requests.post(
            f"{self.BASE_URL}/databases/{db_id}/query",
            headers=self.headers,
            json=payload
        )
        resp.raise_for_status()
        return resp.json().get("results", [])
    
    def create_page(self, db_key: str, properties: Dict[str, Any]) -> Dict:
        """Create a page in a database."""
        db_id = self.DBS.get(db_key, db_key)
        
        payload = {
            "parent": {"database_id": db_id},
            "properties": properties
        }
        
        resp = requests.post(
            f"{self.BASE_URL}/pages",
            headers=self.headers,
            json=payload
        )
        resp.raise_for_status()
        return resp.json()
    
    def update_page(self, page_id: str, properties: Dict[str, Any]) -> Dict:
        """Update a page's properties."""
        resp = requests.patch(
            f"{self.BASE_URL}/pages/{page_id}",
            headers=self.headers,
            json={"properties": properties}
        )
        resp.raise_for_status()
        return resp.json()


class ActivityLogger:
    """Log activities to Virtual Team Activity Log."""
    
    def __init__(self, notion: Optional[NotionClient] = None):
        self.notion = notion or NotionClient()
    
    def log(
        self,
        event: str,
        logged_by: str,
        event_type: str = "task",
        outcome: str = "success",
        confidence: Optional[str] = None,  # Now a select: high/medium/low
        notes: Optional[str] = None,
        related_protocol: Optional[str] = None,
        run_id: Optional[str] = None,
        is_protocol_run: bool = False,
        auto_logged: bool = True,
    ) -> Dict:
        """
        Log an activity entry.
        
        Args:
            event: What happened (title)
            logged_by: Agent/persona who performed it (stored in Notes since Logged by is people type)
            event_type: task|routing|research|escalation|error
            outcome: success|partial|failed|skipped
            confidence: high|medium|low (select type)
            notes: Additional details
            related_protocol: Protocol that was executed (select type)
            run_id: Session/run identifier
            is_protocol_run: Was this a protocol execution?
            auto_logged: Was this auto-logged vs manual?
        """
        # Build notes with logged_by since that field is people type
        full_notes = f"[{logged_by}] {notes}" if notes else f"[{logged_by}]"
        
        properties = {
            "Event": {"title": [{"text": {"content": event}}]},
            "Type": {"select": {"name": event_type}},
            "Outcome": {"select": {"name": outcome}},
            "Logged at": {"date": {"start": datetime.utcnow().isoformat() + "Z"}},
            "Auto-logged": {"checkbox": auto_logged},
            "isProtocolRun": {"checkbox": is_protocol_run},
            "Notes": {"rich_text": [{"text": {"content": full_notes[:2000]}}]},
        }
        
        if confidence:
            properties["Confidence"] = {"select": {"name": confidence}}
        if related_protocol:
            properties["Related protocol"] = {"select": {"name": related_protocol}}
        if run_id:
            properties["Receipt / run ID"] = {"rich_text": [{"text": {"content": run_id}}]}
        
        return self.notion.create_page("activity_log", properties)
    
    def log_routing(
        self,
        signal_category: str,
        target_agent: str,
        confidence: float,
        evidence: List[str],
        action_taken: str,
        session_id: str,
        user_input: Optional[str] = None,
    ) -> Dict:
        """Log a routing decision (per intelligence layer spec)."""
        event = f"Route to {target_agent} ({signal_category})"
        notes = f"Confidence: {confidence:.2f}\nAction: {action_taken}\nEvidence: {', '.join(evidence)}"
        if user_input:
            notes = f"Input: {user_input[:100]}...\n{notes}" if len(user_input) > 100 else f"Input: {user_input}\n{notes}"
        
        # Map numeric confidence to select option
        conf_level = "high" if confidence >= 0.85 else "medium" if confidence >= 0.6 else "low"
        
        return self.log(
            event=event,
            logged_by="intelligence_layer",
            event_type="routing",
            outcome="success" if action_taken == "route_direct" else "partial",
            confidence=conf_level,
            notes=notes,
            run_id=session_id,
        )
    
    def log_error(
        self,
        error_summary: str,
        logged_by: str,
        full_error: Optional[str] = None,
        retry_count: int = 0,
        run_id: Optional[str] = None,
    ) -> Dict:
        """Log an error event."""
        return self.log(
            event=f"ERROR: {error_summary[:50]}",
            logged_by=logged_by,
            event_type="error",
            outcome="failed",
            notes=full_error or error_summary,
            run_id=run_id,
        )


class MeshWorkLogger:
    """Log work items to Mesh Work Log."""
    
    def __init__(self, notion: Optional[NotionClient] = None):
        self.notion = notion or NotionClient()
    
    def create_entry(
        self,
        entry: str,
        owner: str,
        category: str = "task",
        priority: str = "medium",
        details: Optional[str] = None,
        status: str = "open",
        waiting_on: Optional[str] = None,
    ) -> Dict:
        """Create a work log entry."""
        properties = {
            "Entry": {"title": [{"text": {"content": entry}}]},
            "Owner": {"rich_text": [{"text": {"content": owner}}]},
            "Category": {"select": {"name": category}},
            "Priority": {"select": {"name": priority}},
            "Status": {"select": {"name": status}},
            "Created": {"date": {"start": datetime.utcnow().isoformat() + "Z"}},
            "Last Updated": {"date": {"start": datetime.utcnow().isoformat() + "Z"}},
        }
        
        if details:
            properties["Details"] = {"rich_text": [{"text": {"content": details}}]}
        if waiting_on:
            properties["Waiting On"] = {"rich_text": [{"text": {"content": waiting_on}}]}
        
        return self.notion.create_page("mesh_work_log", properties)
    
    def update_status(self, page_id: str, status: str, details: Optional[str] = None) -> Dict:
        """Update work item status."""
        properties = {
            "Status": {"select": {"name": status}},
            "Last Updated": {"date": {"start": datetime.utcnow().isoformat() + "Z"}},
        }
        if details:
            properties["Details"] = {"rich_text": [{"text": {"content": details}}]}
        
        return self.notion.update_page(page_id, properties)
    
    def get_open_items(self, owner: Optional[str] = None) -> List[Dict]:
        """Get open work items, optionally filtered by owner."""
        filter_obj = {
            "property": "Status",
            "select": {"does_not_equal": "done"}
        }
        
        if owner:
            filter_obj = {
                "and": [
                    filter_obj,
                    {"property": "Owner", "rich_text": {"contains": owner}}
                ]
            }
        
        return self.notion.query_database(
            "mesh_work_log",
            filter_obj=filter_obj,
            sorts=[{"property": "Priority", "direction": "ascending"}]
        )


if __name__ == "__main__":
    # Test connectivity
    client = NotionClient()
    print("Testing Notion connectivity...")
    
    # Test Activity Log
    activity = ActivityLogger(client)
    result = activity.log(
        event="Infrastructure test",
        logged_by="oracle",
        event_type="task",
        outcome="success",
        notes="Testing Notion API connectivity from mesh infra lib",
    )
    print(f"✓ Activity logged: {result['id']}")
    
    # Test Work Log
    work = MeshWorkLogger(client)
    items = work.get_open_items()
    print(f"✓ Work log accessible: {len(items)} open items")
