#!/usr/bin/env node
/**
 * Night Shift Logger for VoltAgent
 * 
 * Unified logging interface for Night Shift execution.
 * Logs to local files, Notion databases, and alerts.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Config
const NOTION_VERSION = '2022-06-28';
const LOG_DIR = path.join(__dirname, '..', 'memory');

// Notion DB IDs
const DATABASES = {
  AGENT_TASK_LOG: '2fa35e81-2bbb-8180-8f74-cbd9acd08b52',
  VT_ACTIVITY_LOG: '2f735e81-2bbb-8139-9be3-e9363b309b46',
  MESH_WORK_LOG: '2f935e81-2bbb-810e-8bc0-eed9cfdf3c19'
};

function timestamp() {
  return new Date().toISOString();
}

function dateString() {
  return new Date().toISOString().split('T')[0];
}

function getNotionToken() {
  const tokenPath = '/root/.config/notion/api_key';
  try {
    return fs.readFileSync(tokenPath, 'utf8').trim();
  } catch (e) {
    return null;
  }
}

async function notionRequest(method, endpoint, body = null) {
  const token = getNotionToken();
  if (!token) {
    console.error('Notion token not available');
    return null;
  }
  
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
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Log levels
 */
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

/**
 * Log to local file
 */
function logToFile(entry) {
  const logFile = path.join(LOG_DIR, `night-shift-${dateString()}.log`);
  
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  
  const line = `[${entry.timestamp}] [${entry.level}] [${entry.source}] ${entry.message}\n`;
  fs.appendFileSync(logFile, line);
  
  return logFile;
}

/**
 * Log to daily memory file
 */
function logToMemory(entry) {
  const memFile = path.join(LOG_DIR, `${dateString()}.md`);
  
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  
  let content = '';
  if (fs.existsSync(memFile)) {
    content = fs.readFileSync(memFile, 'utf8');
  }
  
  const section = `\n## ${entry.source} (${entry.timestamp.split('T')[1].split('.')[0]})\n${entry.message}\n`;
  fs.writeFileSync(memFile, content + section);
  
  return memFile;
}

/**
 * Log to Agent Task Log (Notion)
 */
async function logToAgentTaskLog(entry) {
  const properties = {
    'ID': { title: [{ text: { content: entry.taskId || entry.source } }] },
    'Description': { rich_text: [{ text: { content: entry.message.slice(0, 2000) } }] },
    'status': { select: { name: entry.status || 'OPEN' } },
    'taskType': { select: { name: 'Night Shift' } }
  };
  
  if (entry.agent) {
    properties['assignedAgent'] = { select: { name: entry.agent } };
  }
  
  const result = await notionRequest('POST', '/v1/pages', {
    parent: { database_id: DATABASES.AGENT_TASK_LOG },
    properties
  });
  
  return result?.id || null;
}

/**
 * Log to VT Activity Log (Notion)
 */
async function logToVTActivityLog(entry) {
  const properties = {
    'Activity': { title: [{ text: { content: entry.message.slice(0, 200) } }] }
  };
  
  const result = await notionRequest('POST', '/v1/pages', {
    parent: { database_id: DATABASES.VT_ACTIVITY_LOG },
    properties
  });
  
  return result?.id || null;
}

/**
 * Log to Mesh Work Log (Notion)
 */
async function logToMeshWorkLog(entry) {
  const properties = {
    'Title': { title: [{ text: { content: entry.source + ': ' + entry.message.slice(0, 150) } }] }
  };
  
  const result = await notionRequest('POST', '/v1/pages', {
    parent: { database_id: DATABASES.MESH_WORK_LOG },
    properties
  });
  
  return result?.id || null;
}

/**
 * Send Telegram alert
 */
async function sendAlert(entry) {
  // Use the notify.js module if available
  const notifyPath = path.join(__dirname, 'notify.js');
  if (fs.existsSync(notifyPath)) {
    const { spawn } = require('child_process');
    const emoji = {
      DEBUG: '🔍',
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      CRITICAL: '🚨'
    }[entry.level] || '📋';
    
    const message = `${emoji} **Night Shift ${entry.level}**\n\n**Source:** ${entry.source}\n**Message:** ${entry.message}`;
    
    spawn('node', [notifyPath, 'send', message], { stdio: 'inherit' });
    return true;
  }
  return false;
}

/**
 * Main logging function
 */
async function log(level, source, message, options = {}) {
  const entry = {
    timestamp: timestamp(),
    level,
    source,
    message,
    taskId: options.taskId,
    agent: options.agent,
    status: options.status,
    runId: options.runId
  };
  
  // Always log to file
  logToFile(entry);
  
  // Log to memory for significant events
  if (level !== LogLevel.DEBUG) {
    logToMemory(entry);
  }
  
  // Log to Notion for INFO and above
  if (level !== LogLevel.DEBUG && options.notion !== false) {
    if (options.taskLog) {
      await logToAgentTaskLog(entry);
    }
    if (options.activityLog) {
      await logToVTActivityLog(entry);
    }
    if (options.workLog) {
      await logToMeshWorkLog(entry);
    }
  }
  
  // Send alerts for WARN and above
  if ([LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL].includes(level) && options.alert !== false) {
    await sendAlert(entry);
  }
  
  return entry;
}

// Convenience methods
const logger = {
  debug: (source, message, opts) => log(LogLevel.DEBUG, source, message, opts),
  info: (source, message, opts) => log(LogLevel.INFO, source, message, opts),
  warn: (source, message, opts) => log(LogLevel.WARN, source, message, opts),
  error: (source, message, opts) => log(LogLevel.ERROR, source, message, opts),
  critical: (source, message, opts) => log(LogLevel.CRITICAL, source, message, opts),
  
  // Night Shift specific
  taskStart: (taskId, title, agent) => log(LogLevel.INFO, 'TaskStart', `Starting: ${title}`, { taskId, agent, taskLog: true }),
  taskComplete: (taskId, title, output) => log(LogLevel.INFO, 'TaskComplete', `Completed: ${title}`, { taskId, status: 'COMPLETED', taskLog: true }),
  taskFailed: (taskId, title, error) => log(LogLevel.ERROR, 'TaskFailed', `Failed: ${title} - ${error}`, { taskId, status: 'FAILED', taskLog: true, alert: true }),
  
  runStart: (runId, taskCount) => log(LogLevel.INFO, 'RunStart', `Night Shift started with ${taskCount} tasks`, { runId, workLog: true }),
  runComplete: (runId, summary) => log(LogLevel.INFO, 'RunComplete', `Night Shift completed: ${summary}`, { runId, workLog: true }),
  runFailed: (runId, reason) => log(LogLevel.ERROR, 'RunFailed', `Night Shift failed: ${reason}`, { runId, workLog: true, alert: true })
};

/**
 * Get logs for a date
 */
function getLogs(date = dateString()) {
  const logFile = path.join(LOG_DIR, `night-shift-${date}.log`);
  if (fs.existsSync(logFile)) {
    return fs.readFileSync(logFile, 'utf8').split('\n').filter(l => l);
  }
  return [];
}

/**
 * Get log stats
 */
function getLogStats(date = dateString()) {
  const logs = getLogs(date);
  const stats = {
    total: logs.length,
    byLevel: {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      CRITICAL: 0
    }
  };
  
  for (const line of logs) {
    for (const level of Object.keys(stats.byLevel)) {
      if (line.includes(`[${level}]`)) {
        stats.byLevel[level]++;
        break;
      }
    }
  }
  
  return stats;
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'log':
    const level = args[1] || 'INFO';
    const source = args[2] || 'CLI';
    const message = args[3] || 'Test message';
    log(level.toUpperCase(), source, message).then(entry => {
      console.log('Logged:', JSON.stringify(entry, null, 2));
    });
    break;
    
  case 'view':
    const date = args[1] || dateString();
    const logs = getLogs(date);
    console.log(`\n=== Logs for ${date} (${logs.length} entries) ===\n`);
    logs.slice(-20).forEach(l => console.log(l));
    break;
    
  case 'stats':
    const statsDate = args[1] || dateString();
    const stats = getLogStats(statsDate);
    console.log(`\n=== Log Stats for ${statsDate} ===\n`);
    console.log(`Total: ${stats.total}`);
    Object.entries(stats.byLevel).forEach(([level, count]) => {
      if (count > 0) console.log(`  ${level}: ${count}`);
    });
    break;
    
  case 'test':
    console.log('\n=== Testing Logger ===\n');
    (async () => {
      await logger.debug('Test', 'Debug message');
      await logger.info('Test', 'Info message');
      await logger.warn('Test', 'Warning message', { alert: false });
      console.log('Logged test messages');
      
      const stats = getLogStats();
      console.log('Stats:', stats);
    })();
    break;
    
  default:
    console.log(`
Night Shift Logger for VoltAgent

Usage:
  night_shift_logger.js log <level> <source> <message>
  night_shift_logger.js view [date]
  night_shift_logger.js stats [date]
  night_shift_logger.js test

Log Levels: DEBUG, INFO, WARN, ERROR, CRITICAL

Examples:
  night_shift_logger.js log INFO TaskRunner "Task completed successfully"
  night_shift_logger.js view 2026-02-01
  night_shift_logger.js stats
`);
}

// Export for use as module
module.exports = {
  LogLevel,
  log,
  logger,
  getLogs,
  getLogStats,
  logToFile,
  logToMemory,
  logToAgentTaskLog,
  logToVTActivityLog,
  logToMeshWorkLog
};
