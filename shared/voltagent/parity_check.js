#!/usr/bin/env node
/**
 * Mesh Parity Check
 * 
 * Cross-agent health and compliance verification.
 * Run every 2 hours to ensure all agents maintain parity.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AGENTS = {
  sandman: { ip: '100.112.130.22', name: 'Sandman', handle: '@Covault_Sandman_Bot' },
  oracle: { ip: '100.113.222.30', name: 'Oracle VPS', handle: '@Oracleartificialmindsetsbot' },
  oraclelocal: { ip: '100.82.39.77', name: 'OracleLocalBot', handle: '@OracleLocalBot' }
};

const STATE_FILE = path.join(__dirname, 'parity_state.json');

function timestamp() {
  return new Date().toISOString();
}

function ping(ip) {
  try {
    execSync(`ping -c 1 -W 2 ${ip}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function checkHealth(ip) {
  try {
    const result = execSync(`curl -s --connect-timeout 3 http://${ip}:18789/health`, { stdio: 'pipe' });
    return result.toString().includes('ok') || result.toString().length > 0;
  } catch {
    return false;
  }
}

function getMyProtocolVersions() {
  const versions = {};
  const protocolDir = path.join(__dirname, '..', 'protocols');
  
  const files = ['BOT-COLLABORATION-PROTOCOL.md', 'MESH-PARITY-PROTOCOL.md', 'IMPROVEMENT-REQUEST-PROTOCOL.md'];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(protocolDir, file), 'utf8');
      const match = content.match(/v(\d+\.\d+)/);
      const name = file.replace('-PROTOCOL.md', '').replace(/-/g, '_');
      versions[name] = match ? match[1] : 'unknown';
    } catch {
      versions[file] = 'missing';
    }
  }
  
  return versions;
}

function checkMyCoreFiles() {
  const workspace = path.join(__dirname, '..');
  const results = {};
  
  // AGENTS.md
  try {
    const agents = fs.readFileSync(path.join(workspace, 'AGENTS.md'), 'utf8');
    results.agentsMd = {
      exists: true,
      hasCollabSection: agents.includes('Mesh Collaboration (MANDATORY)')
    };
  } catch {
    results.agentsMd = { exists: false };
  }
  
  // HEARTBEAT.md
  try {
    const hb = fs.readFileSync(path.join(workspace, 'HEARTBEAT.md'), 'utf8');
    results.heartbeatMd = {
      exists: true,
      hasCheckpoint: hb.includes('Collaboration Protocol Checkpoint')
    };
  } catch {
    results.heartbeatMd = { exists: false };
  }
  
  // SOUL.md
  try {
    const soul = fs.readFileSync(path.join(workspace, 'SOUL.md'), 'utf8');
    const versionMatch = soul.match(/v(\d+\.\d+\.\d+)/);
    results.soulMd = {
      exists: true,
      version: versionMatch ? versionMatch[1] : 'unknown'
    };
  } catch {
    results.soulMd = { exists: false };
  }
  
  return results;
}

function getMyCrons() {
  try {
    const result = execSync('clawdbot cron list --json 2>/dev/null || echo "[]"', { stdio: 'pipe' });
    const jobs = JSON.parse(result.toString());
    return jobs.map(j => j.name || j.id);
  } catch {
    return [];
  }
}

function runParityCheck() {
  console.log(`\n🔍 MESH PARITY CHECK — ${timestamp()}\n`);
  console.log('Checking all agents...\n');
  
  const results = {};
  
  for (const [id, agent] of Object.entries(AGENTS)) {
    const online = ping(agent.ip);
    const healthy = online ? checkHealth(agent.ip) : false;
    
    results[id] = {
      name: agent.name,
      handle: agent.handle,
      ip: agent.ip,
      online,
      healthy,
      checkedAt: timestamp()
    };
    
    const status = online ? (healthy ? '✅ Online+Healthy' : '⚠️ Online, Gateway Down') : '❌ Offline';
    console.log(`${agent.name.padEnd(15)} | ${agent.ip.padEnd(15)} | ${status}`);
  }
  
  // Add my own detailed status
  results.sandman.protocolVersions = getMyProtocolVersions();
  results.sandman.coreFiles = checkMyCoreFiles();
  results.sandman.crons = getMyCrons();
  
  console.log('\n--- My Status (Sandman) ---');
  console.log('Protocol versions:', JSON.stringify(results.sandman.protocolVersions));
  console.log('Core files:', JSON.stringify(results.sandman.coreFiles));
  console.log('Crons:', results.sandman.crons.join(', ') || 'none');
  
  // Save state
  fs.writeFileSync(STATE_FILE, JSON.stringify({
    lastCheck: timestamp(),
    results
  }, null, 2));
  
  console.log(`\nState saved to ${STATE_FILE}`);
  
  // Generate issues
  const issues = [];
  for (const [id, r] of Object.entries(results)) {
    if (!r.online) issues.push(`${r.name}: Offline`);
    else if (!r.healthy) issues.push(`${r.name}: Gateway down`);
  }
  
  if (issues.length > 0) {
    console.log('\n⚠️ Issues Found:');
    issues.forEach(i => console.log(`  - ${i}`));
  } else {
    console.log('\n✅ All agents healthy');
  }
  
  return { results, issues };
}

function generateReport() {
  const { results, issues } = runParityCheck();
  
  let report = `🔍 **MESH PARITY CHECK** — ${timestamp()}\nLead: Sandman\n\n`;
  
  report += '| Agent | Status | Gateway |\n';
  report += '|-------|--------|--------|\n';
  
  for (const [id, r] of Object.entries(results)) {
    const online = r.online ? '✅' : '❌';
    const healthy = r.healthy ? '✅' : '❌';
    report += `| ${r.name} | ${online} | ${healthy} |\n`;
  }
  
  if (issues.length > 0) {
    report += '\n**Issues:**\n';
    issues.forEach(i => report += `- ${i}\n`);
  } else {
    report += '\n✅ All agents at parity\n';
  }
  
  return report;
}

// CLI
const command = process.argv[2] || 'check';

switch (command) {
  case 'check':
    runParityCheck();
    break;
  case 'report':
    console.log(generateReport());
    break;
  case 'status':
    if (fs.existsSync(STATE_FILE)) {
      console.log(fs.readFileSync(STATE_FILE, 'utf8'));
    } else {
      console.log('No parity state yet. Run: parity_check.js check');
    }
    break;
  default:
    console.log(`
Mesh Parity Check

Usage:
  parity_check.js check   — Run full parity check
  parity_check.js report  — Generate markdown report
  parity_check.js status  — Show last check results
`);
}
