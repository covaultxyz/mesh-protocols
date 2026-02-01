#!/usr/bin/env node
/**
 * Checkpoint Validator for VoltAgent Night Shift
 * 
 * Validates task outputs against success criteria at each checkpoint.
 * Determines pass/fail and controls execution flow.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');

const CHECKPOINT_LOG = path.join(__dirname, '..', 'memory', 'checkpoint-log.json');

function timestamp() {
  return new Date().toISOString();
}

function loadCheckpointLog() {
  try {
    if (fs.existsSync(CHECKPOINT_LOG)) {
      return JSON.parse(fs.readFileSync(CHECKPOINT_LOG, 'utf8'));
    }
  } catch (e) {}
  return { checkpoints: [], lastUpdated: null };
}

function saveCheckpointLog(log) {
  log.lastUpdated = timestamp();
  const dir = path.dirname(CHECKPOINT_LOG);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CHECKPOINT_LOG, JSON.stringify(log, null, 2));
}

/**
 * Standard validation checks that can be composed
 */
const validators = {
  // Check if output exists (not null/undefined/empty)
  exists: (output) => {
    return output !== null && output !== undefined && output !== '';
  },
  
  // Check if output is a non-empty string
  nonEmptyString: (output) => {
    return typeof output === 'string' && output.trim().length > 0;
  },
  
  // Check if output is a file that exists
  fileExists: (output) => {
    return typeof output === 'string' && fs.existsSync(output);
  },
  
  // Check if output contains expected substring
  contains: (output, expected) => {
    return typeof output === 'string' && output.includes(expected);
  },
  
  // Check if output matches regex
  matchesPattern: (output, pattern) => {
    const regex = new RegExp(pattern);
    return regex.test(output);
  },
  
  // Check if output is valid JSON
  validJson: (output) => {
    try {
      JSON.parse(typeof output === 'string' ? output : JSON.stringify(output));
      return true;
    } catch {
      return false;
    }
  },
  
  // Check if output length is within range
  lengthBetween: (output, min, max) => {
    const len = typeof output === 'string' ? output.length : 
                Array.isArray(output) ? output.length : 0;
    return len >= min && len <= max;
  },
  
  // Check if numeric output is within range
  numberBetween: (output, min, max) => {
    const num = Number(output);
    return !isNaN(num) && num >= min && num <= max;
  },
  
  // Check if output has required properties
  hasProperties: (output, props) => {
    if (typeof output !== 'object' || output === null) return false;
    return props.every(p => p in output);
  },
  
  // Custom function validator
  custom: (output, fn) => {
    try {
      return fn(output);
    } catch {
      return false;
    }
  }
};

/**
 * Parse success criteria string into validation rules
 * 
 * Supported formats:
 * - "exists" - output must exist
 * - "file:/path/to/file" - file must exist
 * - "contains:expected text" - must contain text
 * - "pattern:regex" - must match regex
 * - "json" - must be valid JSON
 * - "length:min-max" - length in range
 * - "number:min-max" - number in range
 */
function parseSuccessCriteria(criteria) {
  if (!criteria) return [];
  
  const rules = [];
  const parts = criteria.split(';').map(s => s.trim()).filter(s => s);
  
  for (const part of parts) {
    if (part === 'exists') {
      rules.push({ type: 'exists' });
    } else if (part === 'json') {
      rules.push({ type: 'validJson' });
    } else if (part.startsWith('file:')) {
      rules.push({ type: 'fileExists', path: part.slice(5) });
    } else if (part.startsWith('contains:')) {
      rules.push({ type: 'contains', expected: part.slice(9) });
    } else if (part.startsWith('pattern:')) {
      rules.push({ type: 'matchesPattern', pattern: part.slice(8) });
    } else if (part.startsWith('length:')) {
      const [min, max] = part.slice(7).split('-').map(Number);
      rules.push({ type: 'lengthBetween', min, max });
    } else if (part.startsWith('number:')) {
      const [min, max] = part.slice(7).split('-').map(Number);
      rules.push({ type: 'numberBetween', min, max });
    } else {
      // Treat as custom description (manual review needed)
      rules.push({ type: 'manual', description: part });
    }
  }
  
  return rules;
}

/**
 * Validate output against a single rule
 */
function validateRule(output, rule) {
  switch (rule.type) {
    case 'exists':
      return { passed: validators.exists(output), rule: 'exists' };
    case 'nonEmptyString':
      return { passed: validators.nonEmptyString(output), rule: 'nonEmptyString' };
    case 'fileExists':
      const filePath = rule.path || output;
      return { passed: validators.fileExists(filePath), rule: `file:${filePath}` };
    case 'contains':
      return { passed: validators.contains(output, rule.expected), rule: `contains:${rule.expected}` };
    case 'matchesPattern':
      return { passed: validators.matchesPattern(output, rule.pattern), rule: `pattern:${rule.pattern}` };
    case 'validJson':
      return { passed: validators.validJson(output), rule: 'json' };
    case 'lengthBetween':
      return { passed: validators.lengthBetween(output, rule.min, rule.max), rule: `length:${rule.min}-${rule.max}` };
    case 'numberBetween':
      return { passed: validators.numberBetween(output, rule.min, rule.max), rule: `number:${rule.min}-${rule.max}` };
    case 'hasProperties':
      return { passed: validators.hasProperties(output, rule.props), rule: `hasProps:${rule.props.join(',')}` };
    case 'manual':
      return { passed: null, rule: `manual:${rule.description}`, requiresReview: true };
    default:
      return { passed: false, rule: 'unknown', error: `Unknown rule type: ${rule.type}` };
  }
}

/**
 * Validate task output against success criteria
 */
function validateCheckpoint(taskId, output, successCriteria) {
  const rules = parseSuccessCriteria(successCriteria);
  
  if (rules.length === 0) {
    // No criteria defined - default to existence check
    rules.push({ type: 'exists' });
  }
  
  const results = rules.map(rule => validateRule(output, rule));
  
  const passed = results.every(r => r.passed === true || r.passed === null);
  const failed = results.filter(r => r.passed === false);
  const manualReview = results.filter(r => r.requiresReview);
  
  const checkpoint = {
    taskId,
    timestamp: timestamp(),
    passed,
    results,
    failedRules: failed.map(r => r.rule),
    requiresManualReview: manualReview.length > 0,
    manualReviewItems: manualReview.map(r => r.rule)
  };
  
  // Log checkpoint
  const log = loadCheckpointLog();
  log.checkpoints.push(checkpoint);
  saveCheckpointLog(log);
  
  return checkpoint;
}

/**
 * Quick pass/fail check without full logging
 */
function quickValidate(output, successCriteria) {
  const rules = parseSuccessCriteria(successCriteria);
  
  if (rules.length === 0) {
    return validators.exists(output);
  }
  
  return rules.every(rule => {
    const result = validateRule(output, rule);
    return result.passed === true || result.passed === null;
  });
}

/**
 * Get recent checkpoint history
 */
function getCheckpointHistory(limit = 20) {
  const log = loadCheckpointLog();
  return log.checkpoints.slice(-limit);
}

/**
 * Get checkpoint stats
 */
function getCheckpointStats() {
  const log = loadCheckpointLog();
  const total = log.checkpoints.length;
  const passed = log.checkpoints.filter(c => c.passed).length;
  const failed = log.checkpoints.filter(c => !c.passed).length;
  const needsReview = log.checkpoints.filter(c => c.requiresManualReview).length;
  
  return {
    total,
    passed,
    failed,
    needsReview,
    passRate: total > 0 ? (passed / total * 100).toFixed(1) + '%' : 'N/A'
  };
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'validate':
    const taskId = args[1] || 'test-task';
    const output = args[2] || 'Test output';
    const criteria = args[3] || 'exists';
    const result = validateCheckpoint(taskId, output, criteria);
    console.log(JSON.stringify(result, null, 2));
    break;
    
  case 'quick':
    const qOutput = args[1] || '';
    const qCriteria = args[2] || 'exists';
    const qResult = quickValidate(qOutput, qCriteria);
    console.log(qResult ? '✅ PASS' : '❌ FAIL');
    break;
    
  case 'history':
    const limit = parseInt(args[1]) || 20;
    const history = getCheckpointHistory(limit);
    console.log(`\n=== Checkpoint History (last ${history.length}) ===\n`);
    history.forEach(c => {
      const status = c.passed ? '✅' : '❌';
      console.log(`${status} ${c.timestamp} | ${c.taskId} | ${c.failedRules.length} failures`);
    });
    break;
    
  case 'stats':
    const stats = getCheckpointStats();
    console.log('\n=== Checkpoint Stats ===\n');
    console.log(`Total: ${stats.total}`);
    console.log(`Passed: ${stats.passed}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Needs Review: ${stats.needsReview}`);
    console.log(`Pass Rate: ${stats.passRate}`);
    break;
    
  case 'test':
    console.log('\n=== Running Validation Tests ===\n');
    
    // Test exists
    console.log('exists("hello"):', validators.exists('hello') ? '✅' : '❌');
    console.log('exists(""):', validators.exists('') ? '✅' : '❌');
    console.log('exists(null):', validators.exists(null) ? '✅' : '❌');
    
    // Test contains
    console.log('contains("hello world", "world"):', validators.contains('hello world', 'world') ? '✅' : '❌');
    
    // Test JSON
    console.log('validJson("{}"):', validators.validJson('{}') ? '✅' : '❌');
    console.log('validJson("invalid"):', validators.validJson('invalid') ? '✅' : '❌');
    
    // Test pattern
    console.log('matchesPattern("test123", "\\\\d+"):', validators.matchesPattern('test123', '\\d+') ? '✅' : '❌');
    
    // Test criteria parsing
    console.log('\nParsing "exists;contains:hello;json":');
    console.log(JSON.stringify(parseSuccessCriteria('exists;contains:hello;json'), null, 2));
    break;
    
  default:
    console.log(`
Checkpoint Validator for VoltAgent Night Shift

Usage:
  checkpoint_validator.js validate <taskId> <output> <criteria>
  checkpoint_validator.js quick <output> <criteria>
  checkpoint_validator.js history [limit]
  checkpoint_validator.js stats
  checkpoint_validator.js test

Criteria Format (semicolon-separated):
  exists              — Output must exist
  json                — Must be valid JSON
  file:/path          — File must exist
  contains:text       — Must contain text
  pattern:regex       — Must match regex
  length:min-max      — Length in range
  number:min-max      — Number in range
  Any other text      — Marked for manual review

Examples:
  checkpoint_validator.js validate task-1 "output text" "exists;contains:success"
  checkpoint_validator.js quick '{"key":"value"}' "json"
  checkpoint_validator.js stats
`);
}

// Export for use as module
module.exports = {
  validators,
  parseSuccessCriteria,
  validateCheckpoint,
  quickValidate,
  getCheckpointHistory,
  getCheckpointStats
};
