#!/usr/bin/env node
/**
 * Alert Notification System
 * Sends alerts to Telegram when issues are detected.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Config
const MESH_CHAT_ID = '-5244307871';
let HOOKS_TOKEN = process.env.CLAWD_HOOKS_TOKEN || '';
try {
  HOOKS_TOKEN = fs.readFileSync('/root/clawd/.secrets/hooks-token', 'utf8').trim();
} catch {
  HOOKS_TOKEN = 'no-token';
}

// Send to Telegram via Clawdbot hooks
async function sendAlert(message, priority = 'normal') {
  const prefix = priority === 'high' ? '🚨 ' : priority === 'warning' ? '⚠️ ' : 'ℹ️ ';
  const fullMessage = `${prefix}${message}`;
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      message: fullMessage,
      deliver: true,
      channel: 'telegram',
      to: MESH_CHAT_ID
    });
    
    const options = {
      hostname: 'localhost',
      port: 18789,
      path: '/hooks/agent',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${HOOKS_TOKEN}`
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({ sent: true, body });
        }
      });
    });
    
    req.on('error', (e) => {
      // Fallback: just log to file
      const logLine = `${new Date().toISOString()} | ${priority} | ${message}\n`;
      fs.appendFileSync('/var/log/mesh_alerts.log', logLine);
      resolve({ logged: true });
    });
    
    req.write(data);
    req.end();
  });
}

// Check for alerts and send
async function checkAndNotify() {
  const alerts = [];
  
  // Check node connectivity
  const { execSync } = require('child_process');
  
  try {
    execSync('ping -c 1 -W 2 100.113.222.30', { stdio: 'ignore' });
  } catch {
    alerts.push({ msg: 'Oracle VPS (100.113.222.30) is DOWN', priority: 'high' });
  }
  
  try {
    execSync('ping -c 1 -W 2 100.82.39.77', { stdio: 'ignore' });
  } catch {
    alerts.push({ msg: 'Alex Mac (100.82.39.77) is DOWN', priority: 'warning' });
  }
  
  // Check agent activity
  const stateFile = path.join(__dirname, 'activity_state.json');
  if (fs.existsSync(stateFile)) {
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    const now = Date.now();
    
    for (const [agent, data] of Object.entries(state.agents || {})) {
      const idleHours = (now - data.lastActivity) / (1000 * 60 * 60);
      if (idleHours > 2) {
        alerts.push({ 
          msg: `${agent} has been idle for ${idleHours.toFixed(1)} hours`,
          priority: idleHours > 24 ? 'high' : 'warning'
        });
      }
    }
  }
  
  // Send alerts
  for (const alert of alerts) {
    await sendAlert(alert.msg, alert.priority);
  }
  
  return alerts;
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'send':
    const message = args.slice(1).join(' ') || 'Test alert';
    const priority = args.includes('--high') ? 'high' : 
                    args.includes('--warning') ? 'warning' : 'normal';
    sendAlert(message.replace('--high', '').replace('--warning', '').trim(), priority)
      .then(r => console.log('Sent:', JSON.stringify(r)))
      .catch(e => console.error('Error:', e.message));
    break;
    
  case 'check':
    checkAndNotify()
      .then(alerts => {
        if (alerts.length) {
          console.log(`Sent ${alerts.length} alerts`);
        } else {
          console.log('No alerts needed');
        }
      });
    break;
    
  default:
    console.log('Usage: notify.js [send <message> [--high|--warning]|check]');
}
