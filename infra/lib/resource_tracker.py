#!/usr/bin/env python3
"""
Resource Tracker for VoltAgent Night Shift.
Tracks token budgets, API calls, and runtime limits per session.
"""

import os
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict, field
import threading


@dataclass
class ResourceBudget:
    """Defines limits for a night shift run."""
    max_tokens: int = 100_000          # Total tokens allowed
    max_api_calls: int = 50            # Max external API calls
    max_runtime_seconds: int = 600     # 10 minute cap
    max_retries_per_step: int = 2      # Retries before failing step
    max_personas: int = 5              # Max concurrent persona loads
    
    # Soft limits (warn but don't stop)
    warn_at_token_pct: float = 0.7     # Warn at 70% token usage
    warn_at_time_pct: float = 0.8      # Warn at 80% runtime


@dataclass
class ResourceUsage:
    """Tracks current resource consumption."""
    tokens_used: int = 0
    api_calls_made: int = 0
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    personas_loaded: List[str] = field(default_factory=list)
    steps_completed: int = 0
    steps_failed: int = 0
    retries_total: int = 0
    
    @property
    def runtime_seconds(self) -> float:
        if not self.start_time:
            return 0
        end = self.end_time or time.time()
        return end - self.start_time


class ResourceTracker:
    """
    Tracks and enforces resource limits for VoltAgent runs.
    Thread-safe for concurrent persona execution.
    """
    
    STATE_DIR = Path(os.path.expanduser("~/.cache/voltagent"))
    
    def __init__(
        self,
        session_id: str,
        budget: Optional[ResourceBudget] = None,
        persist: bool = True
    ):
        self.session_id = session_id
        self.budget = budget or ResourceBudget()
        self.usage = ResourceUsage()
        self.persist = persist
        self._lock = threading.Lock()
        
        if persist:
            self.STATE_DIR.mkdir(parents=True, exist_ok=True)
            self._load_state()
    
    @property
    def state_file(self) -> Path:
        return self.STATE_DIR / f"{self.session_id}.json"
    
    def _load_state(self):
        """Load existing state if resuming a session."""
        if self.state_file.exists():
            with open(self.state_file) as f:
                data = json.load(f)
                self.usage = ResourceUsage(**data.get("usage", {}))
                self.budget = ResourceBudget(**data.get("budget", {}))
    
    def _save_state(self):
        """Persist state to disk."""
        if not self.persist:
            return
        with open(self.state_file, 'w') as f:
            json.dump({
                "session_id": self.session_id,
                "budget": asdict(self.budget),
                "usage": asdict(self.usage),
                "last_updated": datetime.utcnow().isoformat(),
            }, f, indent=2, default=str)
    
    def start(self):
        """Mark session start."""
        with self._lock:
            if not self.usage.start_time:
                self.usage.start_time = time.time()
                self._save_state()
    
    def stop(self):
        """Mark session end."""
        with self._lock:
            self.usage.end_time = time.time()
            self._save_state()
    
    def add_tokens(self, count: int) -> Dict[str, Any]:
        """
        Add token usage. Returns status with warnings/errors.
        """
        with self._lock:
            self.usage.tokens_used += count
            self._save_state()
            return self._check_limits()
    
    def add_api_call(self) -> Dict[str, Any]:
        """Track an API call."""
        with self._lock:
            self.usage.api_calls_made += 1
            self._save_state()
            return self._check_limits()
    
    def load_persona(self, persona_id: str) -> Dict[str, Any]:
        """Track persona load."""
        with self._lock:
            if persona_id not in self.usage.personas_loaded:
                self.usage.personas_loaded.append(persona_id)
            self._save_state()
            return self._check_limits()
    
    def complete_step(self, success: bool = True, retries: int = 0):
        """Track step completion."""
        with self._lock:
            if success:
                self.usage.steps_completed += 1
            else:
                self.usage.steps_failed += 1
            self.usage.retries_total += retries
            self._save_state()
    
    def _check_limits(self) -> Dict[str, Any]:
        """Check all limits and return status."""
        status = {
            "ok": True,
            "warnings": [],
            "errors": [],
            "usage": {
                "tokens": f"{self.usage.tokens_used}/{self.budget.max_tokens}",
                "api_calls": f"{self.usage.api_calls_made}/{self.budget.max_api_calls}",
                "runtime": f"{self.usage.runtime_seconds:.1f}s/{self.budget.max_runtime_seconds}s",
                "personas": f"{len(self.usage.personas_loaded)}/{self.budget.max_personas}",
            }
        }
        
        # Token limits
        token_pct = self.usage.tokens_used / self.budget.max_tokens
        if token_pct >= 1.0:
            status["ok"] = False
            status["errors"].append(f"Token limit exceeded: {self.usage.tokens_used}")
        elif token_pct >= self.budget.warn_at_token_pct:
            status["warnings"].append(f"Token usage at {token_pct:.0%}")
        
        # API call limits
        if self.usage.api_calls_made >= self.budget.max_api_calls:
            status["ok"] = False
            status["errors"].append(f"API call limit exceeded: {self.usage.api_calls_made}")
        
        # Runtime limits
        runtime_pct = self.usage.runtime_seconds / self.budget.max_runtime_seconds
        if runtime_pct >= 1.0:
            status["ok"] = False
            status["errors"].append(f"Runtime limit exceeded: {self.usage.runtime_seconds:.0f}s")
        elif runtime_pct >= self.budget.warn_at_time_pct:
            status["warnings"].append(f"Runtime at {runtime_pct:.0%}")
        
        # Persona limits
        if len(self.usage.personas_loaded) > self.budget.max_personas:
            status["ok"] = False
            status["errors"].append(f"Persona limit exceeded: {len(self.usage.personas_loaded)}")
        
        return status
    
    def can_continue(self) -> bool:
        """Quick check if execution should continue."""
        return self._check_limits()["ok"]
    
    def get_summary(self) -> Dict[str, Any]:
        """Get full session summary."""
        return {
            "session_id": self.session_id,
            "budget": asdict(self.budget),
            "usage": asdict(self.usage),
            "status": self._check_limits(),
            "efficiency": {
                "tokens_per_step": (
                    self.usage.tokens_used / max(1, self.usage.steps_completed)
                ),
                "success_rate": (
                    self.usage.steps_completed / 
                    max(1, self.usage.steps_completed + self.usage.steps_failed)
                ),
                "retry_rate": (
                    self.usage.retries_total /
                    max(1, self.usage.steps_completed + self.usage.steps_failed)
                ),
            }
        }
    
    def cleanup(self):
        """Remove state file after successful completion."""
        if self.state_file.exists():
            self.state_file.unlink()


class NightShiftBudgets:
    """Pre-defined budgets for different run types."""
    
    @staticmethod
    def dry_run() -> ResourceBudget:
        """Minimal budget for testing."""
        return ResourceBudget(
            max_tokens=20_000,
            max_api_calls=10,
            max_runtime_seconds=300,  # 5 min
            max_personas=3,
        )
    
    @staticmethod
    def standard() -> ResourceBudget:
        """Standard overnight run."""
        return ResourceBudget(
            max_tokens=100_000,
            max_api_calls=50,
            max_runtime_seconds=600,  # 10 min
            max_personas=5,
        )
    
    @staticmethod
    def heavy() -> ResourceBudget:
        """Resource-intensive run (requires approval)."""
        return ResourceBudget(
            max_tokens=500_000,
            max_api_calls=200,
            max_runtime_seconds=1800,  # 30 min
            max_personas=10,
        )


if __name__ == "__main__":
    # Demo usage
    print("Testing Resource Tracker...")
    
    tracker = ResourceTracker(
        session_id="test-run-001",
        budget=NightShiftBudgets.dry_run(),
        persist=False  # Don't write to disk for test
    )
    
    tracker.start()
    
    # Simulate some usage
    tracker.load_persona("quinn_kenobi")
    status = tracker.add_tokens(5000)
    print(f"After 5K tokens: {status}")
    
    tracker.add_tokens(10000)
    status = tracker.add_api_call()
    tracker.complete_step(success=True)
    
    print(f"\nFinal summary:")
    summary = tracker.get_summary()
    print(json.dumps(summary, indent=2, default=str))
    
    tracker.stop()
    print(f"\n✓ Resource tracker working")
