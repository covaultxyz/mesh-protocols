#!/usr/bin/env node
/**
 * Sequential Orchestrator for VoltAgent Night Shift
 * 
 * Manages task execution order, handoffs, and dependencies.
 * Ensures tasks run in correct sequence with proper state management.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', 'memory', 'orchestrator-state.json');
const HISTORY_FILE = path.join(__dirname, '..', 'memory', 'orchestrator-history.json');

function timestamp() {
  return new Date().toISOString();
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return {
    currentRun: null,
    queue: [],
    completed: [],
    failed: [],
    lastUpdated: null
  };
}

function saveState(state) {
  state.lastUpdated = timestamp();
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch (e) {}
  return { runs: [] };
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

/**
 * Task execution states
 */
const TaskState = {
  PENDING: 'PENDING',
  READY: 'READY',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  BLOCKED: 'BLOCKED',
  SKIPPED: 'SKIPPED'
};

/**
 * Create a new execution run
 */
function createRun(tasks, config = {}) {
  const run = {
    id: `run-${Date.now()}`,
    createdAt: timestamp(),
    status: 'CREATED',
    config: {
      stopOnFailure: config.stopOnFailure ?? true,
      maxRetries: config.maxRetries ?? 0,
      timeoutMs: config.timeoutMs ?? 300000, // 5 min default
      ...config
    },
    tasks: tasks.map((t, index) => ({
      id: t.id || `task-${index}`,
      title: t.title || t.id || `Task ${index + 1}`,
      description: t.description,
      persona: t.persona || t.assignedAgent,
      priority: t.priority,
      sequence: t.sequence ?? index,
      dependencies: t.dependencies || [],
      state: TaskState.PENDING,
      attempts: 0,
      startedAt: null,
      completedAt: null,
      output: null,
      error: null
    })),
    currentTaskIndex: -1,
    startedAt: null,
    completedAt: null,
    summary: null
  };
  
  // Sort by sequence/priority
  run.tasks.sort((a, b) => {
    if (a.sequence !== b.sequence) return a.sequence - b.sequence;
    const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
    return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
  });
  
  return run;
}

/**
 * Start a run
 */
function startRun(run) {
  run.status = 'RUNNING';
  run.startedAt = timestamp();
  run.currentTaskIndex = 0;
  
  // Mark first ready tasks
  updateTaskStates(run);
  
  const state = loadState();
  state.currentRun = run;
  saveState(state);
  
  return run;
}

/**
 * Update task states based on dependencies
 */
function updateTaskStates(run) {
  for (const task of run.tasks) {
    if (task.state !== TaskState.PENDING) continue;
    
    // Check dependencies
    const depsComplete = task.dependencies.every(depId => {
      const dep = run.tasks.find(t => t.id === depId);
      return dep && dep.state === TaskState.COMPLETED;
    });
    
    const depsBlocked = task.dependencies.some(depId => {
      const dep = run.tasks.find(t => t.id === depId);
      return dep && (dep.state === TaskState.FAILED || dep.state === TaskState.BLOCKED);
    });
    
    if (depsBlocked) {
      task.state = TaskState.BLOCKED;
    } else if (depsComplete) {
      task.state = TaskState.READY;
    }
  }
}

/**
 * Get next ready task
 */
function getNextTask(run) {
  return run.tasks.find(t => t.state === TaskState.READY);
}

/**
 * Start a task
 */
function startTask(run, taskId) {
  const task = run.tasks.find(t => t.id === taskId);
  if (!task) return null;
  
  task.state = TaskState.RUNNING;
  task.startedAt = timestamp();
  task.attempts++;
  
  const state = loadState();
  state.currentRun = run;
  saveState(state);
  
  return task;
}

/**
 * Complete a task
 */
function completeTask(run, taskId, output) {
  const task = run.tasks.find(t => t.id === taskId);
  if (!task) return null;
  
  task.state = TaskState.COMPLETED;
  task.completedAt = timestamp();
  task.output = output;
  
  // Update dependent task states
  updateTaskStates(run);
  
  // Check if run is complete
  checkRunCompletion(run);
  
  const state = loadState();
  state.currentRun = run;
  if (task.state === TaskState.COMPLETED) {
    state.completed.push({ taskId, completedAt: task.completedAt });
  }
  saveState(state);
  
  return task;
}

/**
 * Fail a task
 */
function failTask(run, taskId, error) {
  const task = run.tasks.find(t => t.id === taskId);
  if (!task) return null;
  
  // Check retries
  if (task.attempts < run.config.maxRetries) {
    task.state = TaskState.READY; // Allow retry
    task.error = error;
  } else {
    task.state = TaskState.FAILED;
    task.completedAt = timestamp();
    task.error = error;
    
    // Handle stopOnFailure
    if (run.config.stopOnFailure) {
      run.status = 'FAILED';
      run.completedAt = timestamp();
    }
  }
  
  // Update dependent task states
  updateTaskStates(run);
  
  const state = loadState();
  state.currentRun = run;
  state.failed.push({ taskId, error, failedAt: timestamp() });
  saveState(state);
  
  return task;
}

/**
 * Skip a task
 */
function skipTask(run, taskId, reason) {
  const task = run.tasks.find(t => t.id === taskId);
  if (!task) return null;
  
  task.state = TaskState.SKIPPED;
  task.completedAt = timestamp();
  task.error = reason || 'Skipped by user';
  
  updateTaskStates(run);
  checkRunCompletion(run);
  
  const state = loadState();
  state.currentRun = run;
  saveState(state);
  
  return task;
}

/**
 * Check if run is complete
 */
function checkRunCompletion(run) {
  const pending = run.tasks.filter(t => 
    t.state === TaskState.PENDING || 
    t.state === TaskState.READY || 
    t.state === TaskState.RUNNING
  );
  
  if (pending.length === 0) {
    const failed = run.tasks.filter(t => t.state === TaskState.FAILED);
    run.status = failed.length > 0 ? 'COMPLETED_WITH_FAILURES' : 'COMPLETED';
    run.completedAt = timestamp();
    
    // Generate summary
    run.summary = generateSummary(run);
    
    // Archive to history
    const history = loadHistory();
    history.runs.push({
      id: run.id,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      totalTasks: run.tasks.length,
      completed: run.tasks.filter(t => t.state === TaskState.COMPLETED).length,
      failed: run.tasks.filter(t => t.state === TaskState.FAILED).length,
      skipped: run.tasks.filter(t => t.state === TaskState.SKIPPED).length
    });
    saveHistory(history);
    
    // Clear current run
    const state = loadState();
    state.currentRun = null;
    saveState(state);
  }
}

/**
 * Generate run summary
 */
function generateSummary(run) {
  const completed = run.tasks.filter(t => t.state === TaskState.COMPLETED);
  const failed = run.tasks.filter(t => t.state === TaskState.FAILED);
  const skipped = run.tasks.filter(t => t.state === TaskState.SKIPPED);
  const blocked = run.tasks.filter(t => t.state === TaskState.BLOCKED);
  
  const durationMs = new Date(run.completedAt) - new Date(run.startedAt);
  const durationMin = Math.round(durationMs / 60000);
  
  return {
    runId: run.id,
    status: run.status,
    duration: `${durationMin} minutes`,
    total: run.tasks.length,
    completed: completed.length,
    failed: failed.length,
    skipped: skipped.length,
    blocked: blocked.length,
    failedTasks: failed.map(t => ({ id: t.id, title: t.title, error: t.error })),
    completedTasks: completed.map(t => ({ id: t.id, title: t.title }))
  };
}

/**
 * Get current run status
 */
function getRunStatus() {
  const state = loadState();
  if (!state.currentRun) {
    return { status: 'NO_ACTIVE_RUN' };
  }
  
  const run = state.currentRun;
  const pending = run.tasks.filter(t => t.state === TaskState.PENDING).length;
  const ready = run.tasks.filter(t => t.state === TaskState.READY).length;
  const running = run.tasks.filter(t => t.state === TaskState.RUNNING).length;
  const completed = run.tasks.filter(t => t.state === TaskState.COMPLETED).length;
  const failed = run.tasks.filter(t => t.state === TaskState.FAILED).length;
  
  return {
    runId: run.id,
    status: run.status,
    startedAt: run.startedAt,
    tasks: {
      total: run.tasks.length,
      pending,
      ready,
      running,
      completed,
      failed
    },
    nextTask: getNextTask(run)?.title || null
  };
}

/**
 * Abort current run
 */
function abortRun(reason) {
  const state = loadState();
  if (!state.currentRun) return null;
  
  state.currentRun.status = 'ABORTED';
  state.currentRun.completedAt = timestamp();
  state.currentRun.summary = {
    ...generateSummary(state.currentRun),
    abortReason: reason
  };
  
  const history = loadHistory();
  history.runs.push({
    id: state.currentRun.id,
    status: 'ABORTED',
    abortReason: reason,
    completedAt: timestamp()
  });
  saveHistory(history);
  
  const aborted = state.currentRun;
  state.currentRun = null;
  saveState(state);
  
  return aborted;
}

// CLI (only run if executed directly)
if (require.main === module) {
const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'status':
    const status = getRunStatus();
    console.log(JSON.stringify(status, null, 2));
    break;
    
  case 'create':
    // Create test run
    const testTasks = [
      { id: 'task-1', title: 'First Task', priority: 'P0' },
      { id: 'task-2', title: 'Second Task', priority: 'P1', dependencies: ['task-1'] },
      { id: 'task-3', title: 'Third Task', priority: 'P1', dependencies: ['task-1'] },
      { id: 'task-4', title: 'Final Task', priority: 'P2', dependencies: ['task-2', 'task-3'] }
    ];
    const run = createRun(testTasks);
    console.log('Created run:', run.id);
    console.log(JSON.stringify(run, null, 2));
    break;
    
  case 'start':
    const state = loadState();
    if (state.currentRun && state.currentRun.status === 'CREATED') {
      const started = startRun(state.currentRun);
      console.log('Started run:', started.id);
      console.log('Status:', started.status);
      console.log('Next task:', getNextTask(started)?.title);
    } else {
      console.log('No run to start. Create one first.');
    }
    break;
    
  case 'next':
    const currentState = loadState();
    if (currentState.currentRun) {
      const next = getNextTask(currentState.currentRun);
      if (next) {
        console.log(JSON.stringify(next, null, 2));
      } else {
        console.log('No ready tasks');
      }
    } else {
      console.log('No active run');
    }
    break;
    
  case 'complete':
    const taskId = args[1];
    const output = args[2] || 'Completed';
    const completeState = loadState();
    if (completeState.currentRun && taskId) {
      const task = completeTask(completeState.currentRun, taskId, output);
      console.log('Completed:', task?.title);
      console.log('Run status:', completeState.currentRun.status);
    }
    break;
    
  case 'fail':
    const failTaskId = args[1];
    const error = args[2] || 'Unknown error';
    const failState = loadState();
    if (failState.currentRun && failTaskId) {
      const task = failTask(failState.currentRun, failTaskId, error);
      console.log('Failed:', task?.title);
      console.log('Run status:', failState.currentRun.status);
    }
    break;
    
  case 'abort':
    const reason = args[1] || 'Manual abort';
    const aborted = abortRun(reason);
    if (aborted) {
      console.log('Aborted run:', aborted.id);
    } else {
      console.log('No active run to abort');
    }
    break;
    
  case 'history':
    const history = loadHistory();
    console.log(`\n=== Run History (${history.runs.length} runs) ===\n`);
    history.runs.slice(-10).forEach(r => {
      console.log(`${r.status.padEnd(25)} | ${r.id} | ${r.completed || 0}/${r.totalTasks || '?'} tasks`);
    });
    break;
    
  default:
    console.log(`
Sequential Orchestrator for VoltAgent Night Shift

Usage:
  sequential_orchestrator.js status     — Get current run status
  sequential_orchestrator.js create     — Create test run
  sequential_orchestrator.js start      — Start created run
  sequential_orchestrator.js next       — Get next ready task
  sequential_orchestrator.js complete <taskId> [output]
  sequential_orchestrator.js fail <taskId> [error]
  sequential_orchestrator.js abort [reason]
  sequential_orchestrator.js history    — View run history

Task States: PENDING → READY → RUNNING → COMPLETED/FAILED/SKIPPED/BLOCKED
`);
}
} // end CLI block

// Export for use as module
module.exports = {
  TaskState,
  createRun,
  startRun,
  getNextTask,
  startTask,
  completeTask,
  failTask,
  skipTask,
  getRunStatus,
  abortRun,
  generateSummary
};
