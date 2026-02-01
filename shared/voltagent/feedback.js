#!/usr/bin/env node
/**
 * Feedback Loop Manager
 * 
 * Track outcomes from improvement requests and capture learnings.
 * Task 3.4 of Agent Persistence Work Plan.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'feedback_state.json');
const IR_FILE = path.join(__dirname, 'improvement_requests.json');
const LEARNING_LOG = path.join(__dirname, '..', 'memory', 'learning-log.md');

function timestamp() {
  return new Date().toISOString();
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading state:', e.message);
  }
  return {
    feedback: [],
    pendingVerification: [],
    pendingOutcome: [],
    lessons: [],
    lastUpdated: null
  };
}

function saveState(state) {
  state.lastUpdated = timestamp();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadIRs() {
  try {
    if (fs.existsSync(IR_FILE)) {
      return JSON.parse(fs.readFileSync(IR_FILE, 'utf8'));
    }
  } catch (e) {}
  return { requests: [] };
}

function getIR(irId) {
  const data = loadIRs();
  return data.requests.find(r => r.id === irId);
}

function complete(irId, deliverable, implementedBy = 'unknown') {
  const state = loadState();
  const ir = getIR(irId);
  
  if (!ir) {
    console.log(`IR ${irId} not found`);
    return;
  }
  
  const entry = {
    irId,
    title: ir.title,
    implementedBy,
    implementedAt: timestamp(),
    deliverable,
    status: 'pending_verification'
  };
  
  state.feedback.push(entry);
  state.pendingVerification.push(irId);
  saveState(state);
  
  console.log(`✅ Logged completion for ${irId}`);
  console.log(`   Next: Run 'feedback.js verify ${irId}' after testing`);
  return entry;
}

function verify(irId, method = 'manual', notes = '') {
  const state = loadState();
  const entry = state.feedback.find(f => f.irId === irId);
  
  if (!entry) {
    console.log(`No feedback entry for ${irId}. Run 'complete' first.`);
    return;
  }
  
  entry.verifiedAt = timestamp();
  entry.verificationMethod = method;
  entry.verificationNotes = notes;
  entry.status = 'pending_outcome';
  
  state.pendingVerification = state.pendingVerification.filter(id => id !== irId);
  state.pendingOutcome.push(irId);
  saveState(state);
  
  console.log(`✅ Verified ${irId}`);
  console.log(`   Next: Run 'feedback.js outcome ${irId}' in 24-72 hours`);
  return entry;
}

function outcome(irId, score, notes = '', problemSolved = true) {
  const state = loadState();
  const entry = state.feedback.find(f => f.irId === irId);
  
  if (!entry) {
    console.log(`No feedback entry for ${irId}`);
    return;
  }
  
  entry.outcomeCheckedAt = timestamp();
  entry.outcome = {
    score: parseInt(score),
    problemSolved,
    notes
  };
  entry.status = 'complete';
  
  state.pendingOutcome = state.pendingOutcome.filter(id => id !== irId);
  saveState(state);
  
  console.log(`✅ Outcome recorded for ${irId}: ${score}/10`);
  return entry;
}

function lesson(irId, lessonText) {
  const state = loadState();
  const entry = state.feedback.find(f => f.irId === irId);
  
  const lessonEntry = {
    irId,
    title: entry?.title || 'Unknown',
    lesson: lessonText,
    capturedAt: timestamp()
  };
  
  state.lessons.push(lessonEntry);
  
  // Keep only last 50 lessons in state
  if (state.lessons.length > 50) {
    state.lessons = state.lessons.slice(-50);
  }
  
  saveState(state);
  
  // Also append to learning-log.md
  const logEntry = `\n## ${timestamp().split('T')[0]} — ${entry?.title || irId}\n\n${lessonText}\n`;
  fs.appendFileSync(LEARNING_LOG, logEntry);
  
  console.log(`📝 Lesson captured for ${irId}`);
  console.log(`   Added to learning-log.md`);
  return lessonEntry;
}

function pending() {
  const state = loadState();
  
  console.log('\n📋 PENDING FEEDBACK ITEMS\n');
  
  console.log('Awaiting Verification:');
  if (state.pendingVerification.length === 0) {
    console.log('  (none)');
  } else {
    state.pendingVerification.forEach(id => {
      const f = state.feedback.find(e => e.irId === id);
      console.log(`  ${id} — ${f?.title || 'Unknown'} (completed ${f?.implementedAt})`);
    });
  }
  
  console.log('\nAwaiting Outcome Check:');
  if (state.pendingOutcome.length === 0) {
    console.log('  (none)');
  } else {
    state.pendingOutcome.forEach(id => {
      const f = state.feedback.find(e => e.irId === id);
      console.log(`  ${id} — ${f?.title || 'Unknown'} (verified ${f?.verifiedAt})`);
    });
  }
}

function rollup() {
  const state = loadState();
  const completed = state.feedback.filter(f => f.status === 'complete');
  
  if (completed.length === 0) {
    console.log('No completed feedback entries yet.');
    return;
  }
  
  const scores = completed.map(f => f.outcome?.score || 0);
  const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  
  console.log('\n📊 FEEDBACK ROLLUP\n');
  console.log(`Total completed: ${completed.length}`);
  console.log(`Average outcome score: ${avgScore}/10`);
  console.log(`Pending verification: ${state.pendingVerification.length}`);
  console.log(`Pending outcome: ${state.pendingOutcome.length}`);
  console.log(`Lessons captured: ${state.lessons.length}`);
  
  if (state.lessons.length > 0) {
    console.log('\nRecent Lessons:');
    state.lessons.slice(-5).forEach(l => {
      console.log(`  • ${l.lesson.slice(0, 60)}...`);
    });
  }
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
  case 'complete':
    const cArgs = parseArgs(args.slice(2));
    complete(args[1], cArgs.deliverable || '', cArgs.by || 'cli');
    break;
    
  case 'verify':
    const vArgs = parseArgs(args.slice(2));
    verify(args[1], vArgs.method || 'manual', vArgs.notes || '');
    break;
    
  case 'outcome':
    const oArgs = parseArgs(args.slice(2));
    outcome(args[1], oArgs.score || 7, oArgs.notes || '', oArgs.solved !== 'false');
    break;
    
  case 'lesson':
    lesson(args[1], args.slice(2).join(' '));
    break;
    
  case 'pending':
    pending();
    break;
    
  case 'rollup':
    rollup();
    break;
    
  default:
    console.log(`
Feedback Loop Manager

Usage:
  feedback.js complete IR-ID [--deliverable PATH] [--by AGENT]
  feedback.js verify IR-ID [--method manual|auto] [--notes "TEXT"]
  feedback.js outcome IR-ID --score 1-10 [--notes "TEXT"] [--solved true|false]
  feedback.js lesson IR-ID "Lesson learned text"
  feedback.js pending
  feedback.js rollup

Flow:
  complete → verify (after testing) → outcome (after 24-72h) → lesson (capture learnings)

Examples:
  feedback.js complete IR-ABC123 --deliverable "/root/clawd/voltagent/tool.js" --by sandman
  feedback.js verify IR-ABC123 --method manual --notes "Tested, works correctly"
  feedback.js outcome IR-ABC123 --score 9 --notes "Solved problem, minor tweak needed"
  feedback.js lesson IR-ABC123 "Always add timeout handling to network calls"
`);
}
