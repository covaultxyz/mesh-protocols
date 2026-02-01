#!/usr/bin/env node
/**
 * Agent Activity Monitor
 * Tracks agent heartbeats and flags idle/stale agents.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Config
const STATE_FILE = path.join(__dirname, 'activity_state.json');
const NOTION_KEY = fs.readFileSync(
  (process.env.HOME || '/root') + '/.config/notion/api_key', 'utf8'
).trim();

// Thresholds
const THRESHOLDS = {
  IDLE_MINUTES: 30,      // Consider idle after 30 min
  STALE_HOURS: 2,        // Consider stale after 2 hours
  DEAD_HOURS: 24         // Consider dead after 24 hours
};

// Load state
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { agents: {}, lastCheck: null };
  }
}

// Save state
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Record activity
function recordActivity(agentName, activityType = 'heartbeat') {
  const state = loadState();
  const now = Date.now();
  
  if (!state.agents[agentName]) {
    state.agents[agentName] = {
      firstSeen: now,
      activities: []
    };
  }
  
  state.agents[agentName].lastActivity = now;
  state.agents[agentName].lastActivityType = activityType;
  state.agents[agentName].activities.push({
    type: activityType,
    timestamp: now
  });
  
  // Keep last 100 activities
  if (state.agents[agentName].activities.length > 100) {
    state.agents[agentName].activities = 
      state.agents[agentName].activities.slice(-100);
  }
  
  saveState(state);
  return state.agents[agentName];
}

// Get agent status
function getAgentStatus(agentName) {
  const state = loadState();
  const agent = state.agents[agentName];
  
  if (!agent) {
    return { status: 'UNKNOWN', message: 'Agent not found' };
  }
  
  const now = Date.now();
  const idleMs = now - agent.lastActivity;
  const idleMinutes = idleMs / (1000 * 60);
  const idleHours = idleMinutes / 60;
  
  let status, message;
  
  if (idleMinutes < THRESHOLDS.IDLE_MINUTES) {
    status = 'ACTIVE';
    message = `Last activity ${Math.round(idleMinutes)} minutes ago`;
  } else if (idleHours < THRESHOLDS.STALE_HOURS) {
    status = 'IDLE';
    message = `Idle for ${Math.round(idleMinutes)} minutes`;
  } else if (idleHours < THRESHOLDS.DEAD_HOURS) {
    status = 'STALE';
    message = `Stale for ${idleHours.toFixed(1)} hours`;
  } else {
    status = 'DEAD';
    message = `Dead for ${idleHours.toFixed(1)} hours`;
  }
  
  return {
    status,
    message,
    lastActivity: new Date(agent.lastActivity).toISOString(),
    lastActivityType: agent.lastActivityType,
    idleMinutes: Math.round(idleMinutes),
    activitiesLast24h: agent.activities.filter(
      a => a.timestamp > now - 24 * 60 * 60 * 1000
    ).length
  };
}

// Get all agents status
function getAllStatus() {
  const state = loadState();
  const results = {};
  
  for (const name of Object.keys(state.agents)) {
    results[name] = getAgentStatus(name);
  }
  
  return results;
}

// Check for alerts
function checkAlerts() {
  const all = getAllStatus();
  const alerts = [];
  
  for (const [name, status] of Object.entries(all)) {
    if (status.status === 'STALE' || status.status === 'DEAD') {
      alerts.push({
        agent: name,
        status: status.status,
        message: status.message
      });
    }
  }
  
  return alerts;
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'record':
    const agent = args[1] || 'Unknown';
    const type = args[2] || 'heartbeat';
    const result = recordActivity(agent, type);
    console.log(JSON.stringify({ success: true, agent, lastActivity: result.lastActivity }));
    break;
    
  case 'status':
    const agentName = args[1];
    if (agentName) {
      console.log(JSON.stringify(getAgentStatus(agentName), null, 2));
    } else {
      console.log(JSON.stringify(getAllStatus(), null, 2));
    }
    break;
    
  case 'alerts':
    const alerts = checkAlerts();
    if (alerts.length) {
      console.log('⚠️ ALERTS:');
      alerts.forEach(a => console.log(`  ${a.agent}: ${a.status} - ${a.message}`));
    } else {
      console.log('✅ All agents healthy');
    }
    break;
    
  default:
    console.log('Usage: activity_monitor.js [record <agent> [type]|status [agent]|alerts]');
}
