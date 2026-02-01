#!/usr/bin/env node
/**
 * Failure Handler for VoltAgent Night Shift
 * 
 * Handles failures with severity-based responses.
 * Stops execution, preserves state, and alerts as needed.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', 'memory');
const FAILURE_LOG = path.join(STATE_DIR, 'failure-log.json');
const SNAPSHOT_DIR = path.join(STATE_DIR, 'failure-snapshots');

function timestamp() {
  return new Date().toISOString();
}

function loadFailureLog() {
  try {
    if (fs.existsSync(FAILURE_LOG)) {
      return JSON.parse(fs.readFileSync(FAILURE_LOG, 'utf8'));
    }
  } catch (e) {}
  return { failures: [], lastUpdated: null };
}

function saveFailureLog(log) {
  log.lastUpdated = timestamp();
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
  fs.writeFileSync(FAILURE_LOG, JSON.stringify(log, null, 2));
}

/**
 * Severity levels
 */
const Severity = {
  LOW: 'LOW',         // Log and continue
  MEDIUM: 'MEDIUM',   // Log, alert, continue
  HIGH: 'HIGH',       // Log, alert, pause for review
  CRITICAL: 'CRITICAL' // Log, alert, stop immediately
};

/**
 * Severity matrix for different failure types
 */
const SEVERITY_MATRIX = {
  // Task failures
  'task_timeout': Severity.MEDIUM,
  'task_error': Severity.MEDIUM,
  'task_validation_failed': Severity.MEDIUM,
  'task_constraint_violation': Severity.HIGH,
  
  // System failures
  'api_error': Severity.MEDIUM,
  'api_rate_limit': Severity.LOW,
  'network_error': Severity.MEDIUM,
  'disk_full': Severity.CRITICAL,
  'out_of_memory': Severity.CRITICAL,
  
  // Data failures
  'data_corruption': Severity.CRITICAL,
  'data_missing': Severity.MEDIUM,
  'schema_mismatch': Severity.MEDIUM,
  
  // Security failures
  'unauthorized': Severity.HIGH,
  'forbidden_action': Severity.CRITICAL,
  'credential_expired': Severity.HIGH,
  
  // Default
  'unknown': Severity.MEDIUM
};

/**
 * Response actions for each severity level
 */
const SEVERITY_RESPONSES = {
  [Severity.LOW]: {
    log: true,
    alert: false,
    pauseExecution: false,
    stopExecution: false,
    preserveState: false,
    escalate: false
  },
  [Severity.MEDIUM]: {
    log: true,
    alert: true,
    pauseExecution: false,
    stopExecution: false,
    preserveState: true,
    escalate: false
  },
  [Severity.HIGH]: {
    log: true,
    alert: true,
    pauseExecution: true,
    stopExecution: false,
    preserveState: true,
    escalate: true
  },
  [Severity.CRITICAL]: {
    log: true,
    alert: true,
    pauseExecution: false,
    stopExecution: true,
    preserveState: true,
    escalate: true
  }
};

/**
 * Classify failure severity
 */
function classifyFailure(error, context = {}) {
  const errorStr = String(error).toLowerCase();
  
  // Check against known patterns
  for (const [pattern, severity] of Object.entries(SEVERITY_MATRIX)) {
    if (errorStr.includes(pattern.replace('_', ' ')) || 
        errorStr.includes(pattern.replace('_', ''))) {
      return { type: pattern, severity };
    }
  }
  
  // Check for specific error types
  if (errorStr.includes('timeout')) return { type: 'task_timeout', severity: Severity.MEDIUM };
  if (errorStr.includes('rate limit')) return { type: 'api_rate_limit', severity: Severity.LOW };
  if (errorStr.includes('unauthorized') || errorStr.includes('401')) return { type: 'unauthorized', severity: Severity.HIGH };
  if (errorStr.includes('forbidden') || errorStr.includes('403')) return { type: 'forbidden_action', severity: Severity.CRITICAL };
  if (errorStr.includes('not found') || errorStr.includes('404')) return { type: 'data_missing', severity: Severity.MEDIUM };
  if (errorStr.includes('disk') || errorStr.includes('space')) return { type: 'disk_full', severity: Severity.CRITICAL };
  if (errorStr.includes('memory')) return { type: 'out_of_memory', severity: Severity.CRITICAL };
  
  // Context-based classification
  if (context.isSecurityRelated) return { type: 'security_failure', severity: Severity.HIGH };
  if (context.isDataCritical) return { type: 'data_corruption', severity: Severity.CRITICAL };
  
  return { type: 'unknown', severity: Severity.MEDIUM };
}

/**
 * Preserve state snapshot for debugging
 */
function preserveState(failure, state) {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
  
  const snapshotId = `snapshot-${Date.now()}`;
  const snapshotFile = path.join(SNAPSHOT_DIR, `${snapshotId}.json`);
  
  const snapshot = {
    id: snapshotId,
    timestamp: timestamp(),
    failure,
    state,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      memory: process.memoryUsage()
    }
  };
  
  fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));
  return snapshotId;
}

/**
 * Send alert (uses notify.js if available)
 */
function sendAlert(failure) {
  const notifyPath = path.join(__dirname, 'notify.js');
  
  const severityEmoji = {
    [Severity.LOW]: 'ℹ️',
    [Severity.MEDIUM]: '⚠️',
    [Severity.HIGH]: '🔴',
    [Severity.CRITICAL]: '🚨'
  }[failure.severity] || '❌';
  
  const message = `${severityEmoji} **Night Shift Failure**

**Severity:** ${failure.severity}
**Type:** ${failure.type}
**Task:** ${failure.taskId || 'N/A'}
**Error:** ${failure.error}

${failure.snapshotId ? `**Snapshot:** ${failure.snapshotId}` : ''}`;

  if (fs.existsSync(notifyPath)) {
    const { spawn } = require('child_process');
    spawn('node', [notifyPath, 'send', message], { stdio: 'inherit' });
  }
  
  console.error(message);
  return message;
}

/**
 * Handle a failure
 */
function handleFailure(error, context = {}) {
  // Classify the failure
  const classification = classifyFailure(error, context);
  const response = SEVERITY_RESPONSES[classification.severity];
  
  const failure = {
    id: `failure-${Date.now()}`,
    timestamp: timestamp(),
    type: classification.type,
    severity: classification.severity,
    error: String(error),
    taskId: context.taskId,
    runId: context.runId,
    response: response,
    snapshotId: null
  };
  
  // Preserve state if needed
  if (response.preserveState) {
    failure.snapshotId = preserveState(failure, context.state);
  }
  
  // Log the failure
  const log = loadFailureLog();
  log.failures.push(failure);
  saveFailureLog(log);
  
  // Send alert if needed
  if (response.alert) {
    sendAlert(failure);
  }
  
  // Return the failure record with recommended action
  return {
    failure,
    action: response.stopExecution ? 'STOP' : 
            response.pauseExecution ? 'PAUSE' : 
            'CONTINUE'
  };
}

/**
 * Get failure history
 */
function getFailureHistory(limit = 20) {
  const log = loadFailureLog();
  return log.failures.slice(-limit);
}

/**
 * Get failure stats
 */
function getFailureStats() {
  const log = loadFailureLog();
  const stats = {
    total: log.failures.length,
    bySeverity: {},
    byType: {},
    last24h: 0
  };
  
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  
  for (const f of log.failures) {
    stats.bySeverity[f.severity] = (stats.bySeverity[f.severity] || 0) + 1;
    stats.byType[f.type] = (stats.byType[f.type] || 0) + 1;
    
    if (new Date(f.timestamp).getTime() > oneDayAgo) {
      stats.last24h++;
    }
  }
  
  return stats;
}

/**
 * Load a snapshot
 */
function loadSnapshot(snapshotId) {
  const snapshotFile = path.join(SNAPSHOT_DIR, `${snapshotId}.json`);
  if (fs.existsSync(snapshotFile)) {
    return JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
  }
  return null;
}

/**
 * List snapshots
 */
function listSnapshots() {
  if (!fs.existsSync(SNAPSHOT_DIR)) return [];
  
  return fs.readdirSync(SNAPSHOT_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'handle':
    const error = args[1] || 'Test error';
    const taskId = args[2];
    const result = handleFailure(error, { taskId, state: { test: true } });
    console.log(JSON.stringify(result, null, 2));
    break;
    
  case 'classify':
    const classifyError = args[1] || 'Unknown error';
    const classification = classifyFailure(classifyError);
    console.log(JSON.stringify(classification, null, 2));
    break;
    
  case 'history':
    const limit = parseInt(args[1]) || 20;
    const history = getFailureHistory(limit);
    console.log(`\n=== Failure History (last ${history.length}) ===\n`);
    history.forEach(f => {
      const emoji = { LOW: 'ℹ️', MEDIUM: '⚠️', HIGH: '🔴', CRITICAL: '🚨' }[f.severity];
      console.log(`${emoji} ${f.timestamp} | ${f.severity.padEnd(8)} | ${f.type}`);
    });
    break;
    
  case 'stats':
    const stats = getFailureStats();
    console.log('\n=== Failure Stats ===\n');
    console.log(`Total: ${stats.total}`);
    console.log(`Last 24h: ${stats.last24h}`);
    console.log('\nBy Severity:');
    Object.entries(stats.bySeverity).forEach(([s, c]) => console.log(`  ${s}: ${c}`));
    console.log('\nBy Type:');
    Object.entries(stats.byType).forEach(([t, c]) => console.log(`  ${t}: ${c}`));
    break;
    
  case 'snapshots':
    const snapshots = listSnapshots();
    console.log(`\n=== Failure Snapshots (${snapshots.length}) ===\n`);
    snapshots.slice(-10).forEach(s => console.log(`  ${s}`));
    break;
    
  case 'snapshot':
    const snapshotId = args[1];
    if (!snapshotId) {
      console.log('Usage: failure_handler.js snapshot <snapshotId>');
      process.exit(1);
    }
    const snapshot = loadSnapshot(snapshotId);
    if (snapshot) {
      console.log(JSON.stringify(snapshot, null, 2));
    } else {
      console.log('Snapshot not found');
    }
    break;
    
  case 'test':
    console.log('\n=== Testing Failure Handler ===\n');
    
    const tests = [
      ['Connection timeout', 'task_timeout', Severity.MEDIUM],
      ['API rate limit exceeded', 'api_rate_limit', Severity.LOW],
      ['Unauthorized access', 'unauthorized', Severity.HIGH],
      ['Forbidden action blocked', 'forbidden_action', Severity.CRITICAL],
      ['Out of disk space', 'disk_full', Severity.CRITICAL],
      ['Random unknown error', 'unknown', Severity.MEDIUM]
    ];
    
    tests.forEach(([error, expectedType, expectedSeverity]) => {
      const c = classifyFailure(error);
      const typeMatch = c.type === expectedType;
      const sevMatch = c.severity === expectedSeverity;
      console.log(`${typeMatch && sevMatch ? '✅' : '❌'} "${error}" → ${c.type} (${c.severity})`);
    });
    break;
    
  default:
    console.log(`
Failure Handler for VoltAgent Night Shift

Usage:
  failure_handler.js handle <error> [taskId]  — Handle a failure
  failure_handler.js classify <error>         — Classify error severity
  failure_handler.js history [limit]          — View failure history
  failure_handler.js stats                    — View failure stats
  failure_handler.js snapshots                — List state snapshots
  failure_handler.js snapshot <id>            — View a snapshot
  failure_handler.js test                     — Run tests

Severity Levels:
  LOW      — Log and continue
  MEDIUM   — Log, alert, continue
  HIGH     — Log, alert, pause for review
  CRITICAL — Log, alert, stop immediately
`);
}

// Export for use as module
module.exports = {
  Severity,
  SEVERITY_MATRIX,
  SEVERITY_RESPONSES,
  classifyFailure,
  handleFailure,
  preserveState,
  getFailureHistory,
  getFailureStats,
  loadSnapshot,
  listSnapshots
};
