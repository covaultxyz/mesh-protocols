#!/usr/bin/env node
/**
 * Webhook Communication Logger
 * 
 * Logs all inter-agent webhook communications to:
 * 1. Local JSON file (fast)
 * 2. Notion DB (queryable)
 * 
 * Tracks: success, failure, timeout, latency, retries
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'webhook_log.json');
const NOTION_KEY = (() => {
  try {
    return fs.readFileSync(`${process.env.HOME}/.config/notion/api_key`, 'utf8').trim();
  } catch { return null; }
})();

const COMMS_LOG_DB = '2fa35e81-2bbb-811a-b6f7-ff9eb7448c99';

/**
 * Log a webhook communication event
 */
async function logWebhook(event) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...event
  };

  // 1. Log to local file
  await logToFile(entry);

  // 2. Log to Notion (async, don't block)
  if (NOTION_KEY) {
    logToNotion(entry).catch(err => {
      console.error('Notion log failed:', err.message);
    });
  }

  return entry;
}

/**
 * Log to local JSON file
 */
async function logToFile(entry) {
  let log = [];
  try {
    if (fs.existsSync(LOG_FILE)) {
      log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    }
  } catch (e) {}

  log.push(entry);

  // Keep last 1000 entries
  if (log.length > 1000) {
    log = log.slice(-1000);
  }

  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

/**
 * Log to Notion Mesh Communication Log
 */
async function logToNotion(entry) {
  const properties = {
    'Event': { title: [{ text: { content: entry.event || 'Webhook' } }] },
    'Source Agent': { select: { name: entry.source || 'Unknown' } },
    'Target Agent': { select: { name: entry.target || 'Unknown' } },
    'Status': { select: { name: mapStatus(entry.status) } },
    'Timeout (min)': { number: entry.timeoutMs ? entry.timeoutMs / 60000 : 0 },
    'Timestamp': { date: { start: entry.timestamp } },
    'Retry Count': { number: entry.retryCount || 0 }
  };

  if (entry.blockedTask) {
    properties['Blocked Task'] = { 
      rich_text: [{ text: { content: entry.blockedTask.slice(0, 200) } }] 
    };
  }

  return notionRequest('POST', '/pages', {
    parent: { database_id: COMMS_LOG_DB },
    properties
  });
}

function mapStatus(status) {
  const map = {
    'success': 'Received',
    'sent': 'Sent',
    'timeout': 'Timeout',
    'error': 'Blocked',
    'blocked': 'Blocked'
  };
  return map[status?.toLowerCase()] || 'Sent';
}

function notionRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: `/v1${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Send webhook with automatic logging
 */
async function sendWithLogging(options) {
  const {
    url,
    payload,
    source = 'Sandman',
    target = 'Unknown',
    timeoutMs = 30000,
    maxRetries = 3
  } = options;

  const startTime = Date.now();
  let lastError = null;
  let retryCount = 0;

  // Log send attempt
  await logWebhook({
    event: `Webhook to ${target}`,
    source,
    target,
    status: 'sent',
    url: url.replace(/token=[^&]+/, 'token=***')
  });

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    retryCount = attempt;
    
    try {
      const result = await sendWebhook(url, payload, timeoutMs);
      const latencyMs = Date.now() - startTime;

      // Log success
      await logWebhook({
        event: `Webhook success to ${target}`,
        source,
        target,
        status: 'success',
        latencyMs,
        retryCount,
        statusCode: result.statusCode
      });

      return { success: true, ...result, latencyMs, retryCount };

    } catch (err) {
      lastError = err;
      
      if (attempt < maxRetries - 1) {
        // Wait before retry (exponential backoff)
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  // Log failure
  const latencyMs = Date.now() - startTime;
  await logWebhook({
    event: `Webhook failed to ${target}`,
    source,
    target,
    status: 'timeout',
    latencyMs,
    retryCount,
    error: lastError?.message || 'Unknown error'
  });

  return { 
    success: false, 
    error: lastError?.message, 
    latencyMs, 
    retryCount 
  };
}

function sendWebhook(url, payload, timeoutMs) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : require('http');

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: timeoutMs
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

/**
 * Get recent logs
 */
function getRecentLogs(limit = 20) {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
      return log.slice(-limit);
    }
  } catch (e) {}
  return [];
}

/**
 * Get failure summary
 */
function getFailureSummary() {
  const logs = getRecentLogs(100);
  const failures = logs.filter(l => l.status === 'timeout' || l.status === 'error');
  
  const byTarget = {};
  for (const f of failures) {
    byTarget[f.target] = (byTarget[f.target] || 0) + 1;
  }

  return {
    total: failures.length,
    byTarget,
    recentFailures: failures.slice(-5)
  };
}

// CLI
if (require.main === module) {
  const cmd = process.argv[2];

  switch (cmd) {
    case 'recent':
      console.log(JSON.stringify(getRecentLogs(parseInt(process.argv[3]) || 20), null, 2));
      break;

    case 'failures':
      console.log(JSON.stringify(getFailureSummary(), null, 2));
      break;

    case 'test':
      logWebhook({
        event: 'Test webhook log',
        source: 'Sandman',
        target: 'Test',
        status: 'success',
        latencyMs: 42
      }).then(r => console.log('Logged:', r));
      break;

    default:
      console.log('Usage: webhook_logger.js [recent|failures|test]');
  }
}

module.exports = { logWebhook, sendWithLogging, getRecentLogs, getFailureSummary };
