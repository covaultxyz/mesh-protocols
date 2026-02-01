#!/usr/bin/env node
/**
 * BD Surface Routing for VoltAgent
 * 
 * Wires BD Surface actions to appropriate teams:
 * - Research requests → Research Team
 * - Outreach → Campaign Automation
 * - Prospect updates → Liaison Team
 * - Notifications → BD Team
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');

const ROUTING_LOG = '/root/clawd/memory/bd-routing-log.json';

// Team routing configuration
const ROUTING_CONFIG = {
  research: {
    team: 'RESEARCH_TEAM',
    notifyPersona: 'RESEARCH_COORDINATOR',
    channel: 'telegram',
    priority: 'HIGH'
  },
  outreach: {
    team: 'CAMPAIGN_AUTOMATION_TEAM',
    notifyPersona: 'CAMPAIGN_MANAGER',
    channel: 'telegram',
    priority: 'MEDIUM'
  },
  prospect: {
    team: 'LIAISON_TEAM',
    notifyPersona: 'LIAISON_CHAIR',
    channel: 'telegram',
    priority: 'MEDIUM'
  },
  bd: {
    team: 'BD_TEAM',
    notifyPersona: 'DEAL_DIRECTOR',
    channel: 'telegram',
    priority: 'HIGH'
  }
};

function timestamp() {
  return new Date().toISOString();
}

function loadRoutingLog() {
  try {
    if (fs.existsSync(ROUTING_LOG)) {
      return JSON.parse(fs.readFileSync(ROUTING_LOG, 'utf8'));
    }
  } catch (e) {}
  return { routes: [] };
}

function saveRoutingLog(log) {
  const dir = path.dirname(ROUTING_LOG);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ROUTING_LOG, JSON.stringify(log, null, 2));
}

function logRoute(route) {
  const log = loadRoutingLog();
  log.routes.push({
    ...route,
    timestamp: timestamp()
  });
  // Keep last 500 routes
  if (log.routes.length > 500) {
    log.routes = log.routes.slice(-500);
  }
  saveRoutingLog(log);
}

/**
 * Send notification (uses notify.js if available)
 */
async function sendNotification(message, config = {}) {
  const notifyPath = '/root/clawd/voltagent/notify.js';
  
  if (fs.existsSync(notifyPath)) {
    const { spawn } = require('child_process');
    return new Promise((resolve) => {
      const proc = spawn('node', [notifyPath, 'send', message], { stdio: 'inherit' });
      proc.on('close', () => resolve(true));
    });
  }
  
  console.log(`📢 Notification: ${message}`);
  return true;
}

// ============ 4.1 Research Request Routing ============

async function routeResearchRequest(request) {
  const config = ROUTING_CONFIG.research;
  
  const message = `🔍 **New Research Request**

**Title:** ${request.title}
**Priority:** ${request.priority || 'Medium'}
**Requested By:** ${request.requestedBy || 'BD Surface'}
${request.relatedProspect ? `**Related Prospect:** ${request.relatedProspect}` : ''}
${request.notes ? `**Notes:** ${request.notes}` : ''}

Routed to: ${config.team}
Action: Review and assign to researcher`;

  await sendNotification(message);
  
  logRoute({
    type: 'research_request',
    target: config.team,
    request: request.title,
    priority: request.priority
  });
  
  return {
    routed: true,
    team: config.team,
    message
  };
}

// ============ 4.2 Outreach Routing ============

async function routeOutreach(outreach) {
  const config = ROUTING_CONFIG.outreach;
  
  const message = `📬 **Outreach Request**

**Prospect:** ${outreach.prospectName || 'Unknown'}
**Type:** ${outreach.type || 'Follow-up'}
**Channel:** ${outreach.channel || 'Email'}
${outreach.template ? `**Template:** ${outreach.template}` : ''}
${outreach.notes ? `**Notes:** ${outreach.notes}` : ''}

Routed to: ${config.team}
Action: Schedule and execute outreach`;

  await sendNotification(message);
  
  logRoute({
    type: 'outreach',
    target: config.team,
    prospect: outreach.prospectName,
    outreachType: outreach.type
  });
  
  return {
    routed: true,
    team: config.team,
    message
  };
}

// ============ 4.3 Prospect Update Routing ============

async function routeProspectUpdate(update) {
  const config = ROUTING_CONFIG.prospect;
  
  const message = `👤 **Prospect Update**

**Prospect:** ${update.prospectName || 'Unknown'}
**Change:** ${update.changeType || 'Status Update'}
**From:** ${update.oldValue || 'N/A'} → **To:** ${update.newValue || 'N/A'}
${update.notes ? `**Notes:** ${update.notes}` : ''}

Routed to: ${config.team}
Action: Review and update records`;

  await sendNotification(message);
  
  logRoute({
    type: 'prospect_update',
    target: config.team,
    prospect: update.prospectName,
    change: update.changeType
  });
  
  return {
    routed: true,
    team: config.team,
    message
  };
}

// ============ 4.4 BD Team Notifications ============

async function notifyBDTeam(notification) {
  const config = ROUTING_CONFIG.bd;
  
  const priorityEmoji = {
    'HIGH': '🔴',
    'MEDIUM': '🟡',
    'LOW': '🟢'
  }[notification.priority] || '⚪';
  
  const message = `${priorityEmoji} **BD Team Alert**

**Type:** ${notification.type || 'Update'}
**Subject:** ${notification.subject || 'N/A'}
${notification.details ? `**Details:** ${notification.details}` : ''}
${notification.action ? `**Action Required:** ${notification.action}` : ''}

Priority: ${notification.priority || 'Medium'}`;

  await sendNotification(message);
  
  logRoute({
    type: 'bd_notification',
    target: config.team,
    notificationType: notification.type,
    priority: notification.priority
  });
  
  return {
    sent: true,
    message
  };
}

// ============ Bulk Routing ============

/**
 * Route multiple items based on their type
 */
async function routeItems(items) {
  const results = [];
  
  for (const item of items) {
    let result;
    
    switch (item.type) {
      case 'research':
        result = await routeResearchRequest(item);
        break;
      case 'outreach':
        result = await routeOutreach(item);
        break;
      case 'prospect_update':
        result = await routeProspectUpdate(item);
        break;
      case 'notification':
        result = await notifyBDTeam(item);
        break;
      default:
        result = { routed: false, error: `Unknown type: ${item.type}` };
    }
    
    results.push({ item, result });
  }
  
  return results;
}

/**
 * Get routing statistics
 */
function getRoutingStats() {
  const log = loadRoutingLog();
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  const recent = log.routes.filter(r => new Date(r.timestamp).getTime() > oneDayAgo);
  
  const byType = {};
  const byTeam = {};
  
  recent.forEach(r => {
    byType[r.type] = (byType[r.type] || 0) + 1;
    byTeam[r.target] = (byTeam[r.target] || 0) + 1;
  });
  
  return {
    total: log.routes.length,
    last24h: recent.length,
    byType,
    byTeam
  };
}

// ============ CLI ============

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  switch (command) {
    case 'research':
      const researchTitle = args.slice(1).join(' ') || 'Test Research Request';
      routeResearchRequest({ title: researchTitle, priority: 'Medium' })
        .then(r => console.log('✅ Routed:', r.team))
        .catch(console.error);
      break;
      
    case 'outreach':
      const prospectName = args[1] || 'Test Prospect';
      routeOutreach({ prospectName, type: 'Follow-up', channel: 'Email' })
        .then(r => console.log('✅ Routed:', r.team))
        .catch(console.error);
      break;
      
    case 'update':
      routeProspectUpdate({
        prospectName: args[1] || 'Test Prospect',
        changeType: 'Stage Change',
        oldValue: 'Contacted',
        newValue: 'Meeting Set'
      }).then(r => console.log('✅ Routed:', r.team)).catch(console.error);
      break;
      
    case 'notify':
      const subject = args.slice(1).join(' ') || 'Test Notification';
      notifyBDTeam({
        type: 'Alert',
        subject,
        priority: 'MEDIUM',
        action: 'Review and respond'
      }).then(r => console.log('✅ Sent')).catch(console.error);
      break;
      
    case 'stats':
      const stats = getRoutingStats();
      console.log('\n=== BD Routing Statistics ===\n');
      console.log(`Total routes: ${stats.total}`);
      console.log(`Last 24h: ${stats.last24h}`);
      console.log('\nBy Type:');
      Object.entries(stats.byType).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
      console.log('\nBy Team:');
      Object.entries(stats.byTeam).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
      break;
      
    case 'config':
      console.log('\n=== BD Routing Configuration ===\n');
      Object.entries(ROUTING_CONFIG).forEach(([type, config]) => {
        console.log(`${type}:`);
        console.log(`  Team: ${config.team}`);
        console.log(`  Notify: ${config.notifyPersona}`);
        console.log(`  Channel: ${config.channel}`);
        console.log('');
      });
      break;
      
    default:
      console.log(`
BD Surface Routing for VoltAgent

Usage:
  bd_surface_routing.js research <title>    — Route research request (4.1)
  bd_surface_routing.js outreach <prospect> — Route outreach (4.2)
  bd_surface_routing.js update <prospect>   — Route prospect update (4.3)
  bd_surface_routing.js notify <subject>    — Send BD notification (4.4)
  bd_surface_routing.js stats               — Show routing statistics
  bd_surface_routing.js config              — Show routing configuration

Routing Targets:
  - Research → RESEARCH_TEAM
  - Outreach → CAMPAIGN_AUTOMATION_TEAM
  - Prospect Updates → LIAISON_TEAM
  - BD Alerts → BD_TEAM (DEAL_DIRECTOR)
`);
  }
}

module.exports = {
  ROUTING_CONFIG,
  routeResearchRequest,
  routeOutreach,
  routeProspectUpdate,
  notifyBDTeam,
  routeItems,
  getRoutingStats
};
