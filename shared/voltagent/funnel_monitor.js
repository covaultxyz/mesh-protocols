#!/usr/bin/env node
/**
 * Funnel Monitor for VoltAgent
 * 
 * Monitors Funnel Projects DB and triggers orchestration actions.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const https = require('https');

const FUNNEL_DB = '2fa35e81-2bbb-81e3-90c0-dc584630d171';
const NOTION_VERSION = '2022-06-28';
const STATE_FILE = '/root/clawd/memory/funnel-monitor-state.json';

function getNotionToken() {
  try {
    return fs.readFileSync('/root/.config/notion/api_key', 'utf8').trim();
  } catch (e) {
    throw new Error('Cannot read Notion token');
  }
}

async function notionRequest(method, endpoint, body = null) {
  const token = getNotionToken();
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return { lastCheck: null, seenIds: [], alerts: [] };
}

function saveState(state) {
  state.lastCheck = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function extractProp(props, name, type) {
  const prop = props[name];
  if (!prop) return null;
  
  switch (type) {
    case 'title': return prop.title?.[0]?.plain_text || null;
    case 'rich_text': return prop.rich_text?.[0]?.plain_text || null;
    case 'select': return prop.select?.name || null;
    case 'date': return prop.date?.start || null;
    case 'last_edited_time': return prop.last_edited_time || null;
    default: return null;
  }
}

async function queryFunnelProjects(filter = null) {
  const body = { page_size: 100 };
  if (filter) body.filter = filter;
  
  const response = await notionRequest('POST', `/v1/databases/${FUNNEL_DB}/query`, body);
  
  return (response.results || []).map(page => ({
    id: page.id,
    project: extractProp(page.properties, 'Project', 'title'),
    client: extractProp(page.properties, 'Client', 'rich_text'),
    phase: extractProp(page.properties, 'Phase', 'select'),
    subStep: extractProp(page.properties, 'Sub-Step', 'select'),
    status: extractProp(page.properties, 'Status', 'select'),
    leadAgent: extractProp(page.properties, 'Lead Agent', 'rich_text'),
    dueDate: extractProp(page.properties, 'Due Date', 'date'),
    priority: extractProp(page.properties, 'Priority', 'select'),
    lastUpdated: page.last_edited_time
  }));
}

async function checkBlockedProjects() {
  const projects = await queryFunnelProjects({
    property: 'Status',
    select: { equals: 'Blocked' }
  });
  
  return projects.map(p => ({
    type: 'BLOCKED',
    project: p.project,
    client: p.client,
    agent: p.leadAgent,
    phase: p.phase,
    priority: p.priority
  }));
}

async function checkDueDates() {
  const projects = await queryFunnelProjects();
  const now = new Date();
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  const alerts = [];
  
  for (const p of projects) {
    if (!p.dueDate || p.status === 'Complete') continue;
    
    const due = new Date(p.dueDate);
    
    if (due < now) {
      alerts.push({
        type: 'OVERDUE',
        project: p.project,
        dueDate: p.dueDate,
        agent: p.leadAgent,
        priority: p.priority
      });
    } else if (due < threeDays) {
      alerts.push({
        type: 'DUE_SOON',
        project: p.project,
        dueDate: p.dueDate,
        agent: p.leadAgent,
        daysLeft: Math.ceil((due - now) / (24 * 60 * 60 * 1000))
      });
    }
  }
  
  return alerts;
}

async function checkStaleProjects() {
  const projects = await queryFunnelProjects();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return projects
    .filter(p => {
      if (p.status === 'Complete') return false;
      const updated = new Date(p.lastUpdated);
      return updated < sevenDaysAgo;
    })
    .map(p => ({
      type: 'STALE',
      project: p.project,
      lastUpdated: p.lastUpdated,
      agent: p.leadAgent,
      daysSinceUpdate: Math.floor((Date.now() - new Date(p.lastUpdated)) / (24 * 60 * 60 * 1000))
    }));
}

async function checkNewIntakes(state) {
  const projects = await queryFunnelProjects({
    property: 'Phase',
    select: { equals: 'A - Intake' }
  });
  
  const newProjects = projects.filter(p => !state.seenIds.includes(p.id));
  
  // Add to seen
  newProjects.forEach(p => {
    if (!state.seenIds.includes(p.id)) {
      state.seenIds.push(p.id);
    }
  });
  
  // Keep only last 100 IDs
  if (state.seenIds.length > 100) {
    state.seenIds = state.seenIds.slice(-100);
  }
  
  return newProjects.map(p => ({
    type: 'NEW_INTAKE',
    project: p.project,
    client: p.client,
    priority: p.priority
  }));
}

async function runMonitor() {
  console.log(`\n=== Funnel Monitor ${new Date().toISOString()} ===\n`);
  
  const state = loadState();
  const alerts = [];
  
  // Check blocked
  const blocked = await checkBlockedProjects();
  alerts.push(...blocked);
  console.log(`Blocked projects: ${blocked.length}`);
  
  // Check due dates
  const dues = await checkDueDates();
  alerts.push(...dues);
  console.log(`Due date alerts: ${dues.length}`);
  
  // Check stale
  const stale = await checkStaleProjects();
  alerts.push(...stale);
  console.log(`Stale projects: ${stale.length}`);
  
  // Check new intakes
  const intakes = await checkNewIntakes(state);
  alerts.push(...intakes);
  console.log(`New intakes: ${intakes.length}`);
  
  // Check phase transitions
  const transitions = await checkPhaseTransitions(state);
  alerts.push(...transitions);
  console.log(`Phase transitions ready: ${transitions.length}`);
  
  // Store alerts
  state.alerts = alerts;
  saveState(state);
  
  // Print alerts
  if (alerts.length > 0) {
    console.log('\n--- Alerts ---');
    alerts.forEach(a => {
      console.log(`[${a.type}] ${a.project || 'Unknown'} — ${JSON.stringify(a)}`);
    });
  } else {
    console.log('\nNo alerts.');
  }
  
  return alerts;
}

// Routing rules: Program Type → Builder
const ROUTING_RULES = {
  'SPV': { primary: 'SOLUTION_PACKAGING_ENGINEER', backup: 'DEAL_DIRECTOR' },
  'Fund': { primary: 'FUND_STRUCTURING_TEAM', backup: 'CFO_OFFICE' },
  'Tokenization': { primary: 'TOKENIZATION_ARCHITECT', backup: 'TECH_TEAM' },
  'Infrastructure': { primary: 'INFRASTRUCTURE_LEAD', backup: 'DEAL_DIRECTOR' },
  'Energy': { primary: 'ENERGY_SPECIALIST', backup: 'INFRASTRUCTURE_LEAD' },
  'Real Estate': { primary: 'RE_STRUCTURING_TEAM', backup: 'DEAL_DIRECTOR' }
};

// Phase transition rules
const PHASE_TRANSITIONS = {
  'A - Intake': {
    next: 'B - Diligence',
    notifyTeam: 'RESEARCH_TEAM',
    exitCriteria: ['intake_complete', 'materials_received', 'agent_assigned']
  },
  'B - Diligence': {
    next: 'C - Structuring',
    notifyTeam: 'DEAL_DIRECTOR',
    exitCriteria: ['diligence_complete', 'ic_memo_approved', 'no_blockers']
  },
  'C - Structuring': {
    next: 'D - Close',
    notifyTeam: 'LEGAL_TEAM',
    exitCriteria: ['structure_approved', 'terms_agreed', 'compliance_cleared']
  },
  'D - Close': {
    next: null,
    notifyTeam: null,
    exitCriteria: ['docs_signed', 'funding_complete', 'handoff_done']
  }
};

function getBuilderForProgram(programType) {
  return ROUTING_RULES[programType] || { primary: 'DEAL_DIRECTOR', backup: 'LIAISON_CHAIR' };
}

function getPhaseTransition(currentPhase) {
  return PHASE_TRANSITIONS[currentPhase] || null;
}

async function checkPhaseTransitions(state) {
  const projects = await queryFunnelProjects();
  const alerts = [];
  
  for (const p of projects) {
    if (p.status !== 'Complete' && p.status !== 'Review') continue;
    
    const transition = getPhaseTransition(p.phase);
    if (!transition || !transition.next) continue;
    
    // Check if this transition was already notified
    const transitionKey = `${p.id}-${p.phase}`;
    if (state.notifiedTransitions && state.notifiedTransitions.includes(transitionKey)) continue;
    
    alerts.push({
      type: 'PHASE_TRANSITION_READY',
      project: p.project,
      currentPhase: p.phase,
      nextPhase: transition.next,
      notifyTeam: transition.notifyTeam
    });
    
    // Track notified transitions
    if (!state.notifiedTransitions) state.notifiedTransitions = [];
    state.notifiedTransitions.push(transitionKey);
  }
  
  // Keep only last 100 transitions
  if (state.notifiedTransitions && state.notifiedTransitions.length > 100) {
    state.notifiedTransitions = state.notifiedTransitions.slice(-100);
  }
  
  return alerts;
}

async function getSummary() {
  const projects = await queryFunnelProjects();
  
  const byPhase = {};
  const byStatus = {};
  
  projects.forEach(p => {
    byPhase[p.phase] = (byPhase[p.phase] || 0) + 1;
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
  });
  
  console.log('\n=== Funnel Summary ===\n');
  console.log(`Total Projects: ${projects.length}`);
  console.log('\nBy Phase:');
  Object.entries(byPhase).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('\nBy Status:');
  Object.entries(byStatus).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  
  return { total: projects.length, byPhase, byStatus };
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'run';
  
  switch (command) {
    case 'run':
      runMonitor().catch(console.error);
      break;
    case 'summary':
      getSummary().catch(console.error);
      break;
    case 'blocked':
      checkBlockedProjects().then(r => console.log(JSON.stringify(r, null, 2))).catch(console.error);
      break;
    case 'due':
      checkDueDates().then(r => console.log(JSON.stringify(r, null, 2))).catch(console.error);
      break;
    case 'stale':
      checkStaleProjects().then(r => console.log(JSON.stringify(r, null, 2))).catch(console.error);
      break;
    default:
      console.log(`
Funnel Monitor for VoltAgent

Usage:
  funnel_monitor.js run      — Run full monitor check
  funnel_monitor.js summary  — Show funnel summary
  funnel_monitor.js blocked  — Check blocked projects
  funnel_monitor.js due      — Check due dates
  funnel_monitor.js stale    — Check stale projects
`);
  }
}

module.exports = {
  runMonitor,
  getSummary,
  checkBlockedProjects,
  checkDueDates,
  checkStaleProjects
};
