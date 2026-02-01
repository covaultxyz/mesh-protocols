#!/usr/bin/env node
/**
 * Rate Limit Handler for VoltAgent
 * 
 * Detects rate limits, triggers overflow routing, manages cooldown.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const STATE_FILE = '/root/clawd/memory/rate-limit-state.json';
const LOG_FILE = '/root/clawd/memory/overflow-log.json';

// Anthropic rate limit error patterns
const RATE_LIMIT_PATTERNS = {
  // HTTP status codes
  statusCodes: [429, 529],
  
  // Error messages
  errorMessages: [
    'rate_limit_exceeded',
    'rate limit',
    'too many requests',
    'overloaded',
    'capacity',
    'throttl'
  ],
  
  // Anthropic-specific error types
  errorTypes: [
    'rate_limit_error',
    'overloaded_error',
    'api_error'
  ]
};

// Default configuration
const DEFAULT_CONFIG = {
  // Cooldown settings
  cooldownMs: 5 * 60 * 1000, // 5 minutes
  maxCooldownMs: 30 * 60 * 1000, // 30 minutes max
  cooldownMultiplier: 1.5, // Exponential backoff
  
  // Overflow settings
  overflowEnabled: true,
  overflowEndpoint: null, // Must be configured
  overflowToken: null,
  
  // Alert settings
  alertOnOverflow: true,
  alertChannel: 'telegram',
  alertTarget: '-5244307871', // Mesh Mastermind
  
  // Retry settings
  maxRetries: 3,
  retryDelayMs: 1000
};

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return {
    inOverflow: false,
    overflowStartedAt: null,
    overflowCount: 0,
    currentCooldown: DEFAULT_CONFIG.cooldownMs,
    lastRateLimitAt: null,
    totalRateLimits: 0
  };
}

function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadLog() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    }
  } catch (e) {}
  return { events: [] };
}

function saveLog(log) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

function logEvent(type, details) {
  const log = loadLog();
  log.events.push({
    timestamp: new Date().toISOString(),
    type,
    ...details
  });
  // Keep last 1000 events
  if (log.events.length > 1000) {
    log.events = log.events.slice(-1000);
  }
  saveLog(log);
}

/**
 * Check if response indicates rate limiting
 */
function isRateLimited(response) {
  // Check status code
  if (response.status && RATE_LIMIT_PATTERNS.statusCodes.includes(response.status)) {
    return { limited: true, reason: `HTTP ${response.status}` };
  }
  
  // Check error type
  if (response.error?.type) {
    const errorType = response.error.type.toLowerCase();
    if (RATE_LIMIT_PATTERNS.errorTypes.some(t => errorType.includes(t))) {
      return { limited: true, reason: `Error type: ${response.error.type}` };
    }
  }
  
  // Check error message
  const message = (response.error?.message || response.message || '').toLowerCase();
  if (RATE_LIMIT_PATTERNS.errorMessages.some(m => message.includes(m))) {
    return { limited: true, reason: `Message: ${message.slice(0, 50)}` };
  }
  
  return { limited: false };
}

/**
 * Send alert to Telegram
 */
async function sendAlert(message, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  if (!cfg.alertOnOverflow) return;
  
  // Use notify.js if available
  const notifyPath = '/root/clawd/voltagent/notify.js';
  if (require('fs').existsSync(notifyPath)) {
    const { spawn } = require('child_process');
    spawn('node', [notifyPath, 'send', message], { stdio: 'inherit' });
  }
  
  console.log(`📢 Alert: ${message}`);
}

/**
 * Handle rate limit detection
 */
function handleRateLimit(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const state = loadState();
  
  state.lastRateLimitAt = new Date().toISOString();
  state.totalRateLimits++;
  
  if (!state.inOverflow) {
    // Enter overflow mode
    state.inOverflow = true;
    state.overflowStartedAt = new Date().toISOString();
    state.overflowCount++;
    
    logEvent('OVERFLOW_STARTED', {
      reason: 'Rate limit detected',
      cooldownMs: state.currentCooldown
    });
    
    // Send alert (4.1)
    sendAlert(`⚠️ **Rate Limit Triggered**\n\nEntering overflow mode.\nCooldown: ${state.currentCooldown / 1000}s\nTotal rate limits: ${state.totalRateLimits}`, cfg);
    
    console.log(`⚠️ Rate limit detected - entering overflow mode`);
    console.log(`   Cooldown: ${state.currentCooldown / 1000}s`);
    
    // Schedule return to primary
    if (typeof setTimeout !== 'undefined') {
      setTimeout(() => {
        exitOverflow();
      }, state.currentCooldown);
    }
  } else {
    // Already in overflow - increase cooldown
    state.currentCooldown = Math.min(
      state.currentCooldown * cfg.cooldownMultiplier,
      cfg.maxCooldownMs
    );
    
    logEvent('COOLDOWN_EXTENDED', {
      newCooldownMs: state.currentCooldown
    });
    
    console.log(`⚠️ Still rate limited - extending cooldown to ${state.currentCooldown / 1000}s`);
  }
  
  saveState(state);
  return state;
}

/**
 * Exit overflow mode
 */
function exitOverflow() {
  const state = loadState();
  
  if (state.inOverflow) {
    const duration = Date.now() - new Date(state.overflowStartedAt).getTime();
    
    state.inOverflow = false;
    state.currentCooldown = DEFAULT_CONFIG.cooldownMs; // Reset cooldown
    
    logEvent('OVERFLOW_ENDED', {
      durationMs: duration
    });
    
    console.log(`✅ Overflow mode ended after ${Math.round(duration / 1000)}s`);
    saveState(state);
  }
  
  return state;
}

/**
 * Check if should use overflow
 */
function shouldUseOverflow(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const state = loadState();
  
  if (!cfg.overflowEnabled || !cfg.overflowEndpoint) {
    return { useOverflow: false, reason: 'Overflow not configured' };
  }
  
  if (!state.inOverflow) {
    return { useOverflow: false, reason: 'Not in overflow mode' };
  }
  
  return { useOverflow: true, endpoint: cfg.overflowEndpoint };
}

/**
 * Route request through overflow if needed
 */
async function routeRequest(request, config = {}) {
  const overflow = shouldUseOverflow(config);
  
  if (overflow.useOverflow) {
    console.log(`🔀 Routing through overflow: ${overflow.endpoint}`);
    logEvent('OVERFLOW_ROUTED', { endpoint: overflow.endpoint });
    // Would make request to overflow endpoint here
    return { routed: true, endpoint: overflow.endpoint };
  }
  
  return { routed: false };
}

/**
 * Get overflow statistics
 */
function getStats() {
  const state = loadState();
  const log = loadLog();
  
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  
  const recentEvents = log.events.filter(e => new Date(e.timestamp).getTime() > oneDayAgo);
  const weekEvents = log.events.filter(e => new Date(e.timestamp).getTime() > oneWeekAgo);
  
  return {
    current: {
      inOverflow: state.inOverflow,
      overflowStartedAt: state.overflowStartedAt,
      currentCooldown: state.currentCooldown
    },
    lifetime: {
      totalRateLimits: state.totalRateLimits,
      totalOverflows: state.overflowCount
    },
    last24h: {
      rateLimits: recentEvents.filter(e => e.type === 'OVERFLOW_STARTED').length,
      totalOverflowTime: recentEvents
        .filter(e => e.type === 'OVERFLOW_ENDED')
        .reduce((sum, e) => sum + (e.durationMs || 0), 0)
    },
    lastWeek: {
      rateLimits: weekEvents.filter(e => e.type === 'OVERFLOW_STARTED').length
    }
  };
}

/**
 * Generate summary report
 */
function generateSummary() {
  const stats = getStats();
  
  return `
📊 **Overflow Summary**

**Current Status:** ${stats.current.inOverflow ? '🔴 IN OVERFLOW' : '🟢 Normal'}
${stats.current.inOverflow ? `Started: ${stats.current.overflowStartedAt}\nCooldown: ${stats.current.currentCooldown / 1000}s` : ''}

**Last 24 Hours:**
- Rate limits hit: ${stats.last24h.rateLimits}
- Total overflow time: ${Math.round(stats.last24h.totalOverflowTime / 1000 / 60)} min

**Last 7 Days:**
- Rate limits hit: ${stats.lastWeek.rateLimits}

**Lifetime:**
- Total rate limits: ${stats.lifetime.totalRateLimits}
- Total overflows: ${stats.lifetime.totalOverflows}
`;
}

/**
 * Generate and optionally send daily summary (4.3)
 */
async function sendDailySummary(config = {}) {
  const summary = generateSummary();
  const stats = getStats();
  
  // Only alert if there were issues in the last 24h
  if (stats.last24h.rateLimits > 0) {
    await sendAlert(`📊 **Daily Overflow Report**\n${summary}`, config);
  }
  
  logEvent('DAILY_SUMMARY', {
    rateLimits24h: stats.last24h.rateLimits,
    overflowTime24h: stats.last24h.totalOverflowTime
  });
  
  return summary;
}

/**
 * Check if overflow itself is hitting limits (4.4)
 */
function checkOverflowHealth(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const state = loadState();
  const log = loadLog();
  
  // Check for overflow failures in last hour
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentFailures = log.events.filter(e => 
    e.type === 'OVERFLOW_FAILED' && 
    new Date(e.timestamp).getTime() > oneHourAgo
  );
  
  if (recentFailures.length >= 3) {
    sendAlert(`🚨 **CRITICAL: Overflow Failing**\n\n${recentFailures.length} overflow failures in the last hour.\nBoth primary and overflow may be unavailable.`, cfg);
    
    logEvent('OVERFLOW_CRITICAL', {
      failuresLastHour: recentFailures.length
    });
    
    return { healthy: false, failures: recentFailures.length };
  }
  
  // Check if we've been in overflow too long
  if (state.inOverflow && state.overflowStartedAt) {
    const overflowDuration = Date.now() - new Date(state.overflowStartedAt).getTime();
    const maxOverflowDuration = 2 * 60 * 60 * 1000; // 2 hours
    
    if (overflowDuration > maxOverflowDuration) {
      sendAlert(`⚠️ **Extended Overflow**\n\nIn overflow mode for ${Math.round(overflowDuration / 1000 / 60)} minutes.\nConsider investigating primary API status.`, cfg);
      
      logEvent('EXTENDED_OVERFLOW', {
        durationMs: overflowDuration
      });
      
      return { healthy: false, extended: true, durationMs: overflowDuration };
    }
  }
  
  return { healthy: true };
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  switch (command) {
    case 'status':
      const state = loadState();
      console.log('\n=== Rate Limit Status ===\n');
      console.log(`In Overflow: ${state.inOverflow ? '🔴 YES' : '🟢 NO'}`);
      console.log(`Current Cooldown: ${state.currentCooldown / 1000}s`);
      console.log(`Total Rate Limits: ${state.totalRateLimits}`);
      console.log(`Last Rate Limit: ${state.lastRateLimitAt || 'Never'}`);
      break;
      
    case 'stats':
      console.log(generateSummary());
      break;
      
    case 'simulate':
      console.log('Simulating rate limit...');
      handleRateLimit();
      break;
      
    case 'reset':
      exitOverflow();
      console.log('Overflow mode reset.');
      break;
      
    case 'test':
      console.log('\n=== Testing Rate Limit Detection ===\n');
      
      const tests = [
        { status: 429 },
        { status: 200, error: { type: 'rate_limit_error', message: 'Rate limit exceeded' } },
        { status: 200, message: 'Too many requests, please try again later' },
        { status: 200, message: 'Request completed successfully' }
      ];
      
      tests.forEach((resp, i) => {
        const result = isRateLimited(resp);
        console.log(`Test ${i + 1}: ${result.limited ? '🔴 RATE LIMITED' : '🟢 OK'} ${result.reason || ''}`);
      });
      break;
      
    case 'log':
      const limit = parseInt(args[1]) || 20;
      const log = loadLog();
      console.log(`\n=== Overflow Log (last ${limit}) ===\n`);
      log.events.slice(-limit).forEach(e => {
        console.log(`${e.timestamp} | ${e.type}`);
      });
      break;
      
    case 'daily':
      sendDailySummary().then(() => console.log('Daily summary sent'));
      break;
      
    case 'health':
      const health = checkOverflowHealth();
      console.log(`\n=== Overflow Health Check ===\n`);
      console.log(`Status: ${health.healthy ? '🟢 Healthy' : '🔴 Issues Detected'}`);
      if (!health.healthy) {
        if (health.failures) console.log(`Failures: ${health.failures}`);
        if (health.extended) console.log(`Extended overflow: ${Math.round(health.durationMs / 1000 / 60)} min`);
      }
      break;
      
    default:
      console.log(`
Rate Limit Handler for VoltAgent

Usage:
  rate_limit_handler.js status   — Show current status
  rate_limit_handler.js stats    — Show statistics
  rate_limit_handler.js simulate — Simulate rate limit
  rate_limit_handler.js reset    — Exit overflow mode
  rate_limit_handler.js test     — Test detection logic
  rate_limit_handler.js log [n]  — Show last n log entries
  rate_limit_handler.js daily    — Send daily summary
  rate_limit_handler.js health   — Check overflow health
`);
  }
}

module.exports = {
  RATE_LIMIT_PATTERNS,
  isRateLimited,
  handleRateLimit,
  exitOverflow,
  shouldUseOverflow,
  routeRequest,
  getStats,
  generateSummary,
  sendDailySummary,
  checkOverflowHealth,
  sendAlert
};
