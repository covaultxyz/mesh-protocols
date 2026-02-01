#!/usr/bin/env node
/**
 * SOUL/IDENTITY Self-Update with Audit Trail
 * 
 * Allows controlled self-modification of SOUL.md and IDENTITY.md
 * with version tracking and audit logging.
 * 
 * Task 2.2 of Agent Persistence Work Plan
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const WORKSPACE = process.env.CLAWD_WORKSPACE || '/root/clawd';
const SOUL_FILE = path.join(WORKSPACE, 'SOUL.md');
const IDENTITY_FILE = path.join(WORKSPACE, 'IDENTITY.md');
const AUDIT_LOG = path.join(WORKSPACE, 'memory', 'soul-audit.log');
const BACKUP_DIR = path.join(WORKSPACE, '.soul-backups');

function ensureDirs() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  const memoryDir = path.dirname(AUDIT_LOG);
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }
}

function getHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

function timestamp() {
  return new Date().toISOString();
}

function backup(filePath) {
  if (!fs.existsSync(filePath)) return null;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const hash = getHash(content);
  const basename = path.basename(filePath, '.md');
  const backupName = `${basename}-${timestamp().replace(/[:.]/g, '-')}-${hash}.md`;
  const backupPath = path.join(BACKUP_DIR, backupName);
  
  fs.writeFileSync(backupPath, content);
  return { path: backupPath, hash, size: content.length };
}

function audit(action, file, details) {
  ensureDirs();
  const entry = JSON.stringify({
    timestamp: timestamp(),
    action,
    file: path.basename(file),
    ...details
  }) + '\n';
  
  fs.appendFileSync(AUDIT_LOG, entry);
}

function getCurrentVersion(filePath) {
  if (!fs.existsSync(filePath)) return null;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const versionMatch = content.match(/\*v(\d+\.\d+\.\d+)/);
  return versionMatch ? versionMatch[1] : '0.0.0';
}

function bumpVersion(version, type = 'patch') {
  const [major, minor, patch] = version.split('.').map(Number);
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch':
    default: return `${major}.${minor}.${patch + 1}`;
  }
}

function updateFile(filePath, updateFn, reason, versionBump = 'patch') {
  ensureDirs();
  
  // Backup current version
  const backupInfo = backup(filePath);
  
  // Read current content
  const currentContent = fs.existsSync(filePath) 
    ? fs.readFileSync(filePath, 'utf8') 
    : '';
  
  // Get current version and bump
  const currentVersion = getCurrentVersion(filePath) || '1.0.0';
  const newVersion = bumpVersion(currentVersion, versionBump);
  
  // Apply update
  let newContent = updateFn(currentContent);
  
  // Update version in content if present
  newContent = newContent.replace(
    /\*v\d+\.\d+\.\d+/,
    `*v${newVersion}`
  );
  
  // Calculate hashes
  const oldHash = getHash(currentContent);
  const newHash = getHash(newContent);
  
  // Write new content
  fs.writeFileSync(filePath, newContent);
  
  // Audit the change
  audit('UPDATE', filePath, {
    reason,
    oldVersion: currentVersion,
    newVersion,
    oldHash,
    newHash,
    backup: backupInfo?.path,
    linesChanged: newContent.split('\n').length - currentContent.split('\n').length
  });
  
  // Try to commit to git
  try {
    const basename = path.basename(filePath);
    execSync(`cd ${WORKSPACE} && git add ${basename} && git commit -m "Self-update ${basename}: ${reason}" --no-verify`, {
      stdio: 'pipe'
    });
    audit('GIT_COMMIT', filePath, { reason });
  } catch (e) {
    // Git commit optional
  }
  
  return {
    success: true,
    file: path.basename(filePath),
    oldVersion: currentVersion,
    newVersion,
    oldHash,
    newHash,
    backup: backupInfo?.path,
    reason
  };
}

function appendSection(filePath, section, content, reason) {
  return updateFile(filePath, (current) => {
    // Find section or append at end
    const sectionHeader = `## ${section}`;
    if (current.includes(sectionHeader)) {
      // Append to existing section
      const lines = current.split('\n');
      const sectionIndex = lines.findIndex(l => l.startsWith(sectionHeader));
      const nextSectionIndex = lines.findIndex((l, i) => i > sectionIndex && l.startsWith('## '));
      
      const insertAt = nextSectionIndex > 0 ? nextSectionIndex : lines.length;
      lines.splice(insertAt, 0, '', content);
      return lines.join('\n');
    } else {
      // Add new section at end
      return current.trimEnd() + `\n\n${sectionHeader}\n\n${content}\n`;
    }
  }, reason);
}

function getAuditHistory(limit = 10) {
  if (!fs.existsSync(AUDIT_LOG)) return [];
  
  const lines = fs.readFileSync(AUDIT_LOG, 'utf8').trim().split('\n');
  return lines.slice(-limit).map(line => {
    try { return JSON.parse(line); }
    catch { return { raw: line }; }
  });
}

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      size: fs.statSync(path.join(BACKUP_DIR, f)).size,
      mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);
}

function rollback(backupPath) {
  if (!fs.existsSync(backupPath)) {
    return { success: false, error: 'Backup not found' };
  }
  
  const basename = path.basename(backupPath);
  const targetFile = basename.startsWith('SOUL') ? SOUL_FILE : IDENTITY_FILE;
  
  // Backup current before rollback
  const currentBackup = backup(targetFile);
  
  // Restore from backup
  const backupContent = fs.readFileSync(backupPath, 'utf8');
  fs.writeFileSync(targetFile, backupContent);
  
  audit('ROLLBACK', targetFile, {
    from: backupPath,
    currentBackup: currentBackup?.path
  });
  
  return {
    success: true,
    restored: path.basename(targetFile),
    from: basename,
    currentBackedUpTo: currentBackup?.path
  };
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'status':
    console.log('=== Soul/Identity Status ===');
    console.log(`SOUL.md version: ${getCurrentVersion(SOUL_FILE) || 'not found'}`);
    console.log(`IDENTITY.md version: ${getCurrentVersion(IDENTITY_FILE) || 'not found'}`);
    console.log(`\nRecent audit entries:`);
    getAuditHistory(5).forEach(e => console.log(`  ${e.timestamp} | ${e.action} | ${e.file} | ${e.reason || ''}`));
    break;
    
  case 'append':
    const file = args[1] === 'identity' ? IDENTITY_FILE : SOUL_FILE;
    const section = args[2] || 'Evolution';
    const content = args[3] || 'Entry added via soul_updater';
    const reason = args[4] || 'Self-evolution append';
    const result = appendSection(file, section, content, reason);
    console.log(JSON.stringify(result, null, 2));
    break;
    
  case 'backups':
    const backups = listBackups();
    console.log(`=== Backups (${backups.length}) ===`);
    backups.slice(0, 10).forEach(b => {
      console.log(`  ${b.name} (${b.size} bytes)`);
    });
    break;
    
  case 'rollback':
    const backupFile = args[1];
    if (!backupFile) {
      console.log('Usage: soul_updater.js rollback <backup-path>');
      break;
    }
    const rbResult = rollback(backupFile);
    console.log(JSON.stringify(rbResult, null, 2));
    break;
    
  case 'audit':
    const limit = parseInt(args[1]) || 20;
    console.log(`=== Audit Log (last ${limit}) ===`);
    getAuditHistory(limit).forEach(e => {
      console.log(JSON.stringify(e));
    });
    break;
    
  default:
    console.log(`
Soul/Identity Self-Update Tool

Usage:
  node soul_updater.js status                    — Show current versions and recent changes
  node soul_updater.js append soul SECTION "content" "reason"  — Append to SOUL.md section
  node soul_updater.js append identity SECTION "content" "reason"  — Append to IDENTITY.md
  node soul_updater.js backups                   — List available backups
  node soul_updater.js rollback <backup-path>    — Restore from backup
  node soul_updater.js audit [limit]             — Show audit history

Examples:
  node soul_updater.js append soul "What I Love" "- Building mesh infrastructure" "Learned from overnight session"
  node soul_updater.js status
`);
}
