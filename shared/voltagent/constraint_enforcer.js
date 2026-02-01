#!/usr/bin/env node
/**
 * Constraint Enforcer for VoltAgent Night Shift
 * 
 * Enforces pre-approved actions as guardrails during Night Shift execution.
 * Rejects actions outside approved scope and audits all actions.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');

const AUDIT_LOG = path.join(__dirname, '..', 'memory', 'constraint-audit.json');

function timestamp() {
  return new Date().toISOString();
}

function loadAuditLog() {
  try {
    if (fs.existsSync(AUDIT_LOG)) {
      return JSON.parse(fs.readFileSync(AUDIT_LOG, 'utf8'));
    }
  } catch (e) {}
  return { audits: [], lastUpdated: null };
}

function saveAuditLog(log) {
  log.lastUpdated = timestamp();
  const dir = path.dirname(AUDIT_LOG);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(AUDIT_LOG, JSON.stringify(log, null, 2));
}

/**
 * Standard action categories for Night Shift
 */
const ACTION_CATEGORIES = {
  // Read operations (generally safe)
  READ: ['read_file', 'read_db', 'read_api', 'list_files', 'query_notion', 'search'],
  
  // Write operations (need approval)
  WRITE: ['write_file', 'create_file', 'update_db', 'create_notion', 'update_notion'],
  
  // Delete operations (dangerous)
  DELETE: ['delete_file', 'delete_db', 'archive_notion', 'trash'],
  
  // Execute operations (very dangerous)
  EXECUTE: ['exec_command', 'run_script', 'spawn_process'],
  
  // Network operations
  NETWORK: ['http_request', 'webhook', 'send_message', 'notify'],
  
  // Git operations
  GIT: ['git_commit', 'git_push', 'git_pull', 'git_branch'],
  
  // Analysis operations (safe)
  ANALYZE: ['parse', 'validate', 'transform', 'compare', 'summarize']
};

/**
 * Default constraint profiles for different persona hardening levels
 */
const HARDENING_PROFILES = {
  Alpha: {
    allowed: ['READ', 'ANALYZE'],
    forbidden: ['DELETE', 'EXECUTE'],
    requiresApproval: ['WRITE', 'NETWORK', 'GIT']
  },
  Beta: {
    allowed: ['READ', 'ANALYZE', 'WRITE'],
    forbidden: ['DELETE'],
    requiresApproval: ['EXECUTE', 'GIT']
  },
  Stable: {
    allowed: ['READ', 'ANALYZE', 'WRITE', 'NETWORK', 'GIT'],
    forbidden: [],
    requiresApproval: ['DELETE', 'EXECUTE']
  }
};

/**
 * Parse action type from action description
 */
function parseActionType(action) {
  const actionLower = action.toLowerCase();
  
  // Match against known action patterns
  if (actionLower.includes('read') || actionLower.includes('get') || actionLower.includes('fetch')) {
    return 'READ';
  }
  if (actionLower.includes('write') || actionLower.includes('create') || actionLower.includes('update') || actionLower.includes('set')) {
    return 'WRITE';
  }
  if (actionLower.includes('delete') || actionLower.includes('remove') || actionLower.includes('trash')) {
    return 'DELETE';
  }
  if (actionLower.includes('exec') || actionLower.includes('run') || actionLower.includes('spawn')) {
    return 'EXECUTE';
  }
  if (actionLower.includes('http') || actionLower.includes('request') || actionLower.includes('send') || actionLower.includes('notify')) {
    return 'NETWORK';
  }
  if (actionLower.includes('git') || actionLower.includes('commit') || actionLower.includes('push')) {
    return 'GIT';
  }
  if (actionLower.includes('parse') || actionLower.includes('validate') || actionLower.includes('analyze')) {
    return 'ANALYZE';
  }
  
  return 'UNKNOWN';
}

/**
 * Load constraints from task or persona
 */
function loadConstraints(config) {
  const constraints = {
    allowedActions: [],
    forbiddenActions: [],
    requiresApproval: [],
    maxExecutionTime: 300, // seconds
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedPaths: ['/root/clawd/', '/tmp/'],
    forbiddenPaths: ['/etc/', '/var/', '/usr/'],
    allowedDomains: ['api.notion.com', 'api.github.com'],
    source: 'default'
  };
  
  // Apply hardening profile if specified
  if (config.hardeningLevel && HARDENING_PROFILES[config.hardeningLevel]) {
    const profile = HARDENING_PROFILES[config.hardeningLevel];
    constraints.allowedActions = profile.allowed.flatMap(cat => ACTION_CATEGORIES[cat] || []);
    constraints.forbiddenActions = profile.forbidden.flatMap(cat => ACTION_CATEGORIES[cat] || []);
    constraints.requiresApproval = profile.requiresApproval.flatMap(cat => ACTION_CATEGORIES[cat] || []);
    constraints.source = `hardening:${config.hardeningLevel}`;
  }
  
  // Override with task-specific constraints
  if (config.allowedActions) {
    constraints.allowedActions = config.allowedActions;
    constraints.source = 'task-specific';
  }
  
  if (config.forbiddenActions) {
    constraints.forbiddenActions = config.forbiddenActions;
  }
  
  return constraints;
}

/**
 * Validate action against constraints
 */
function validateAction(action, constraints) {
  const actionType = parseActionType(action);
  const actionLower = action.toLowerCase();
  
  const result = {
    action,
    actionType,
    allowed: false,
    requiresApproval: false,
    reason: null,
    timestamp: timestamp()
  };
  
  // Check forbidden first
  if (constraints.forbiddenActions.some(f => actionLower.includes(f.toLowerCase()))) {
    result.allowed = false;
    result.reason = 'Action is explicitly forbidden';
    return result;
  }
  
  // Check if in allowed list
  const isAllowed = constraints.allowedActions.length === 0 || 
    constraints.allowedActions.some(a => actionLower.includes(a.toLowerCase()));
  
  // Check if requires approval
  const needsApproval = constraints.requiresApproval.some(a => actionLower.includes(a.toLowerCase()));
  
  if (needsApproval) {
    result.allowed = false;
    result.requiresApproval = true;
    result.reason = 'Action requires manual approval';
    return result;
  }
  
  if (!isAllowed) {
    result.allowed = false;
    result.reason = 'Action not in allowed list';
    return result;
  }
  
  result.allowed = true;
  result.reason = 'Action permitted';
  return result;
}

/**
 * Validate file path against constraints
 */
function validatePath(filePath, constraints) {
  const normalizedPath = path.resolve(filePath);
  
  // Check forbidden paths
  for (const forbidden of constraints.forbiddenPaths) {
    if (normalizedPath.startsWith(forbidden)) {
      return {
        allowed: false,
        reason: `Path ${normalizedPath} is in forbidden zone: ${forbidden}`
      };
    }
  }
  
  // Check allowed paths (if specified)
  if (constraints.allowedPaths.length > 0) {
    const inAllowed = constraints.allowedPaths.some(allowed => 
      normalizedPath.startsWith(allowed)
    );
    
    if (!inAllowed) {
      return {
        allowed: false,
        reason: `Path ${normalizedPath} not in allowed zones: ${constraints.allowedPaths.join(', ')}`
      };
    }
  }
  
  return { allowed: true, reason: 'Path permitted' };
}

/**
 * Validate domain for network requests
 */
function validateDomain(url, constraints) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    if (constraints.allowedDomains.length > 0) {
      const isAllowed = constraints.allowedDomains.some(allowed => 
        domain === allowed || domain.endsWith('.' + allowed)
      );
      
      if (!isAllowed) {
        return {
          allowed: false,
          reason: `Domain ${domain} not in allowed list: ${constraints.allowedDomains.join(', ')}`
        };
      }
    }
    
    return { allowed: true, reason: 'Domain permitted' };
  } catch {
    return { allowed: false, reason: 'Invalid URL' };
  }
}

/**
 * Full action audit and enforcement
 */
function enforceConstraints(action, context, constraints) {
  const audit = {
    action,
    context,
    timestamp: timestamp(),
    checks: [],
    allowed: true,
    reason: null
  };
  
  // Validate action type
  const actionCheck = validateAction(action, constraints);
  audit.checks.push({ type: 'action', ...actionCheck });
  
  if (!actionCheck.allowed) {
    audit.allowed = false;
    audit.reason = actionCheck.reason;
    audit.requiresApproval = actionCheck.requiresApproval;
  }
  
  // Validate path if present
  if (context.path) {
    const pathCheck = validatePath(context.path, constraints);
    audit.checks.push({ type: 'path', ...pathCheck });
    
    if (!pathCheck.allowed && audit.allowed) {
      audit.allowed = false;
      audit.reason = pathCheck.reason;
    }
  }
  
  // Validate URL if present
  if (context.url) {
    const domainCheck = validateDomain(context.url, constraints);
    audit.checks.push({ type: 'domain', ...domainCheck });
    
    if (!domainCheck.allowed && audit.allowed) {
      audit.allowed = false;
      audit.reason = domainCheck.reason;
    }
  }
  
  // Log audit
  const log = loadAuditLog();
  log.audits.push(audit);
  saveAuditLog(log);
  
  return audit;
}

/**
 * Get audit history
 */
function getAuditHistory(limit = 50) {
  const log = loadAuditLog();
  return log.audits.slice(-limit);
}

/**
 * Get audit stats
 */
function getAuditStats() {
  const log = loadAuditLog();
  const total = log.audits.length;
  const allowed = log.audits.filter(a => a.allowed).length;
  const blocked = log.audits.filter(a => !a.allowed && !a.requiresApproval).length;
  const needsApproval = log.audits.filter(a => a.requiresApproval).length;
  
  return {
    total,
    allowed,
    blocked,
    needsApproval,
    blockRate: total > 0 ? (blocked / total * 100).toFixed(1) + '%' : 'N/A'
  };
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'validate':
    const action = args[1] || 'read_file';
    const hardening = args[2] || 'Alpha';
    const constraints = loadConstraints({ hardeningLevel: hardening });
    const result = validateAction(action, constraints);
    console.log(JSON.stringify(result, null, 2));
    break;
    
  case 'enforce':
    const eAction = args[1] || 'read_file';
    const eHardening = args[2] || 'Alpha';
    const ePath = args[3];
    const eConstraints = loadConstraints({ hardeningLevel: eHardening });
    const eResult = enforceConstraints(eAction, { path: ePath }, eConstraints);
    console.log(JSON.stringify(eResult, null, 2));
    break;
    
  case 'profiles':
    console.log('\n=== Hardening Profiles ===\n');
    for (const [level, profile] of Object.entries(HARDENING_PROFILES)) {
      console.log(`${level}:`);
      console.log(`  Allowed: ${profile.allowed.join(', ')}`);
      console.log(`  Forbidden: ${profile.forbidden.join(', ') || 'None'}`);
      console.log(`  Requires Approval: ${profile.requiresApproval.join(', ')}`);
      console.log('');
    }
    break;
    
  case 'history':
    const limit = parseInt(args[1]) || 20;
    const history = getAuditHistory(limit);
    console.log(`\n=== Audit History (last ${history.length}) ===\n`);
    history.forEach(a => {
      const status = a.allowed ? '✅' : (a.requiresApproval ? '⚠️' : '❌');
      console.log(`${status} ${a.timestamp} | ${a.action}`);
    });
    break;
    
  case 'stats':
    const stats = getAuditStats();
    console.log('\n=== Constraint Audit Stats ===\n');
    console.log(`Total: ${stats.total}`);
    console.log(`Allowed: ${stats.allowed}`);
    console.log(`Blocked: ${stats.blocked}`);
    console.log(`Needs Approval: ${stats.needsApproval}`);
    console.log(`Block Rate: ${stats.blockRate}`);
    break;
    
  case 'test':
    console.log('\n=== Running Constraint Tests ===\n');
    
    const testConstraints = loadConstraints({ hardeningLevel: 'Alpha' });
    
    const tests = [
      ['read_file', true],
      ['write_file', false],  // Alpha: WRITE requires approval
      ['delete_file', false], // Alpha: DELETE forbidden
      ['exec_command', false], // Alpha: EXECUTE forbidden
      ['parse_json', true],
      ['validate_schema', true]
    ];
    
    tests.forEach(([action, expected]) => {
      const result = validateAction(action, testConstraints);
      const passed = result.allowed === expected;
      console.log(`${passed ? '✅' : '❌'} ${action}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} (expected: ${expected ? 'ALLOWED' : 'BLOCKED'})`);
    });
    break;
    
  default:
    console.log(`
Constraint Enforcer for VoltAgent Night Shift

Usage:
  constraint_enforcer.js validate <action> [hardening]
  constraint_enforcer.js enforce <action> [hardening] [path]
  constraint_enforcer.js profiles
  constraint_enforcer.js history [limit]
  constraint_enforcer.js stats
  constraint_enforcer.js test

Hardening Levels:
  Alpha  — Read + Analyze only, Write needs approval
  Beta   — Read + Analyze + Write, Execute needs approval
  Stable — Most actions allowed, Delete/Execute need approval

Examples:
  constraint_enforcer.js validate "write_file" Alpha
  constraint_enforcer.js enforce "read_file" Beta "/root/clawd/test.txt"
  constraint_enforcer.js profiles
`);
}

// Export for use as module
module.exports = {
  ACTION_CATEGORIES,
  HARDENING_PROFILES,
  loadConstraints,
  validateAction,
  validatePath,
  validateDomain,
  enforceConstraints,
  getAuditHistory,
  getAuditStats
};
