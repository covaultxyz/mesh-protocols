#!/usr/bin/env node
/**
 * Improvement Request Manager
 * 
 * File, track, and manage improvement requests across the mesh.
 * 
 * Task 3.1 of Agent Persistence Work Plan
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKSPACE = process.env.CLAWD_WORKSPACE || '/root/clawd';
const IR_FILE = path.join(__dirname, 'improvement_requests.json');

// Domain mapping per BOT-COLLABORATION-PROTOCOL v2.0
const DOMAIN_OWNERS = {
  capability: {
    persona: 'sandman',
    creative: 'sandman',
    intelligence: 'sandman',
    'virtual-teams': 'sandman',
    systems: 'oracle',
    infrastructure: 'oracle',
    'notion-api': 'oracle',
    database: 'oracle',
    github: 'oracle',
    deployment: 'oracle',
    local: 'oraclelocalbot',
    mac: 'oraclelocalbot',
    camera: 'oraclelocalbot',
    screen: 'oraclelocalbot'
  },
  protocol: 'sandman',  // Sandman drafts, Oracle reviews
  infra: 'oracle',
  config: 'oracle'
};

function generateId() {
  return 'IR-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function timestamp() {
  return new Date().toISOString();
}

function loadRequests() {
  try {
    if (fs.existsSync(IR_FILE)) {
      return JSON.parse(fs.readFileSync(IR_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading requests:', e.message);
  }
  return { requests: [], lastUpdated: null };
}

function saveRequests(data) {
  data.lastUpdated = timestamp();
  fs.writeFileSync(IR_FILE, JSON.stringify(data, null, 2));
}

function autoAssignOwner(type, description = '') {
  const desc = description.toLowerCase();
  
  if (type === 'protocol') return DOMAIN_OWNERS.protocol;
  if (type === 'infra') return DOMAIN_OWNERS.infra;
  if (type === 'config') return DOMAIN_OWNERS.config;
  
  // For capabilities, check keywords
  for (const [keyword, owner] of Object.entries(DOMAIN_OWNERS.capability)) {
    if (desc.includes(keyword)) return owner;
  }
  
  // Default to sandman for unknown
  return 'sandman';
}

function fileRequest({ type, title, description, priority = 'medium', owner = 'auto', requester = 'sandman' }) {
  const data = loadRequests();
  
  const assignedOwner = owner === 'auto' 
    ? autoAssignOwner(type, description) 
    : owner.toLowerCase();
  
  const ir = {
    id: generateId(),
    type,
    title,
    description,
    priority,
    owner: assignedOwner,
    requester,
    status: 'FILED',
    createdAt: timestamp(),
    updatedAt: timestamp(),
    history: [
      { action: 'FILED', by: requester, at: timestamp() }
    ]
  };
  
  data.requests.push(ir);
  saveRequests(data);
  
  return ir;
}

function updateStatus(id, status, notes = '', by = 'unknown') {
  const data = loadRequests();
  const ir = data.requests.find(r => r.id === id);
  
  if (!ir) {
    return { success: false, error: 'IR not found' };
  }
  
  ir.status = status;
  ir.updatedAt = timestamp();
  ir.history.push({
    action: status,
    by,
    at: timestamp(),
    notes
  });
  
  saveRequests(data);
  return { success: true, ir };
}

function listRequests({ status, owner, priority } = {}) {
  const data = loadRequests();
  let results = data.requests;
  
  if (status) results = results.filter(r => r.status === status);
  if (owner) results = results.filter(r => r.owner === owner.toLowerCase());
  if (priority) results = results.filter(r => r.priority === priority);
  
  return results;
}

function getRequest(id) {
  const data = loadRequests();
  return data.requests.find(r => r.id === id);
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'help';

function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      result[key] = value;
    }
  }
  return result;
}

switch (command) {
  case 'file':
    const fileArgs = parseArgs(args.slice(1));
    if (!fileArgs.type || !fileArgs.title) {
      console.log('Usage: improvement_request.js file --type TYPE --title "TITLE" [--description "DESC"] [--priority PRIORITY] [--owner OWNER]');
      process.exit(1);
    }
    const ir = fileRequest(fileArgs);
    console.log(`✅ Filed: ${ir.id}`);
    console.log(JSON.stringify(ir, null, 2));
    break;
    
  case 'update':
    const updateArgs = parseArgs(args.slice(1));
    if (!updateArgs.id || !updateArgs.status) {
      console.log('Usage: improvement_request.js update --id IR-ID --status STATUS [--notes "NOTES"] [--by BOT]');
      process.exit(1);
    }
    const updateResult = updateStatus(
      updateArgs.id, 
      updateArgs.status.toUpperCase(), 
      updateArgs.notes || '',
      updateArgs.by || 'cli'
    );
    console.log(JSON.stringify(updateResult, null, 2));
    break;
    
  case 'list':
    const listArgs = parseArgs(args.slice(1));
    const requests = listRequests(listArgs);
    console.log(`=== Improvement Requests (${requests.length}) ===\n`);
    requests.forEach(r => {
      console.log(`${r.id} | ${r.status.padEnd(12)} | ${r.priority.padEnd(8)} | ${r.owner.padEnd(12)} | ${r.title}`);
    });
    break;
    
  case 'get':
    const getId = args[1];
    if (!getId) {
      console.log('Usage: improvement_request.js get IR-ID');
      process.exit(1);
    }
    const found = getRequest(getId);
    if (found) {
      console.log(JSON.stringify(found, null, 2));
    } else {
      console.log('Not found:', getId);
    }
    break;
    
  case 'mine':
    const owner = args[1] || 'sandman';
    const mine = listRequests({ owner });
    console.log(`=== IRs for ${owner} (${mine.length}) ===\n`);
    mine.forEach(r => {
      console.log(`${r.id} | ${r.status.padEnd(12)} | ${r.priority.padEnd(8)} | ${r.title}`);
    });
    break;
    
  case 'pending':
    const pending = listRequests().filter(r => 
      ['FILED', 'REVIEWING', 'IN_PROGRESS', 'BLOCKED'].includes(r.status)
    );
    console.log(`=== Pending IRs (${pending.length}) ===\n`);
    pending.forEach(r => {
      console.log(`${r.id} | ${r.status.padEnd(12)} | ${r.owner.padEnd(12)} | ${r.title}`);
    });
    break;
    
  default:
    console.log(`
Improvement Request Manager

Usage:
  improvement_request.js file --type TYPE --title "TITLE" [--description "DESC"] [--priority low|medium|high|critical] [--owner BOT|auto]
  improvement_request.js update --id IR-ID --status STATUS [--notes "NOTES"] [--by BOT]
  improvement_request.js list [--status STATUS] [--owner BOT] [--priority PRIORITY]
  improvement_request.js get IR-ID
  improvement_request.js mine [owner]
  improvement_request.js pending

Types: capability, protocol, infra, config
Statuses: FILED, REVIEWING, APPROVED, REJECTED, IN_PROGRESS, COMPLETED, BLOCKED

Examples:
  improvement_request.js file --type capability --title "Add weather skill" --priority medium
  improvement_request.js update --id IR-ABC123 --status APPROVED --by oracle
  improvement_request.js list --status FILED
`);
}