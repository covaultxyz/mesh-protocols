#!/usr/bin/env node
/**
 * Night Shift Runner for VoltAgent
 * 
 * Main execution script that orchestrates Night Shift runs.
 * Integrates all components: persona loading, work plans, constraints,
 * checkpoints, logging, and failure handling.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');

// Import components
const { loadPersona, loadNightShiftRoster, validateNightShiftEligibility, buildExecutionContext, generateSystemPrompt } = require('./persona_loader');
const { loadNightShiftEligibleTasks, buildExecutionPlan, generateExecutionContext: generateTaskContext } = require('./work_plan_loader');
const { validateCheckpoint, quickValidate } = require('./checkpoint_validator');
const { loadConstraints, enforceConstraints } = require('./constraint_enforcer');
const { createRun, startRun, getNextTask, startTask, completeTask, failTask, getRunStatus, abortRun, generateSummary } = require('./sequential_orchestrator');
const { logger, LogLevel } = require('./night_shift_logger');
const { handleFailure, Severity } = require('./failure_handler');

const CONFIG_FILE = path.join(__dirname, 'night_shift_config.json');
const STATE_FILE = path.join(__dirname, '..', 'memory', 'night-shift-state.json');

function timestamp() {
  return new Date().toISOString();
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  // Execution settings
  maxTasksPerRun: 10,
  taskTimeoutMs: 300000, // 5 minutes
  runTimeoutMs: 3600000, // 1 hour
  stopOnFailure: true,
  maxRetries: 1,
  
  // Persona settings
  defaultPersona: null, // Use task-assigned persona
  requireBetaHardening: true,
  
  // Constraint settings
  enforceConstraints: true,
  defaultHardeningLevel: 'Alpha',
  
  // Logging settings
  logToNotion: true,
  alertOnFailure: true,
  
  // Schedule settings
  startHour: 23, // 11 PM
  endHour: 6,    // 6 AM
  timezone: 'UTC'
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const custom = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return { ...DEFAULT_CONFIG, ...custom };
    }
  } catch (e) {}
  return DEFAULT_CONFIG;
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return {
    lastRun: null,
    totalRuns: 0,
    totalTasksCompleted: 0,
    totalTasksFailed: 0
  };
}

function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Check if current time is within Night Shift hours
 */
function isNightShiftTime(config) {
  const now = new Date();
  const hour = now.getUTCHours();
  
  if (config.startHour > config.endHour) {
    // Crosses midnight (e.g., 23:00 - 06:00)
    return hour >= config.startHour || hour < config.endHour;
  } else {
    return hour >= config.startHour && hour < config.endHour;
  }
}

/**
 * Validate Night Shift prerequisites
 */
async function validatePrerequisites(config) {
  const checks = {
    hasEligibleTasks: false,
    hasEligiblePersonas: false,
    isNightShiftTime: isNightShiftTime(config),
    notionAvailable: false,
    configValid: true
  };
  
  // Check for eligible tasks
  try {
    const tasks = await loadNightShiftEligibleTasks();
    checks.hasEligibleTasks = tasks.length > 0;
    checks.taskCount = tasks.length;
  } catch (e) {
    checks.taskError = e.message;
  }
  
  // Check for eligible personas
  try {
    const roster = await loadNightShiftRoster();
    checks.hasEligiblePersonas = roster.length > 0 || !config.requireBetaHardening;
    checks.personaCount = roster.length;
  } catch (e) {
    checks.personaError = e.message;
  }
  
  // Check Notion availability
  try {
    const tokenPath = '/root/.config/notion/api_key';
    checks.notionAvailable = fs.existsSync(tokenPath);
  } catch (e) {}
  
  const allPassed = checks.hasEligibleTasks && 
                    (checks.hasEligiblePersonas || !config.requireBetaHardening) &&
                    checks.notionAvailable;
  
  return { passed: allPassed, checks };
}

/**
 * Execute a single task
 */
async function executeTask(task, persona, config) {
  const startTime = Date.now();
  
  // Build execution context
  const personaContext = persona ? buildExecutionContext(persona, task) : null;
  const taskContext = generateTaskContext(task);
  
  // Log task start
  await logger.taskStart(task.id, task.title, persona?.codename);
  
  // Enforce constraints if enabled
  if (config.enforceConstraints && persona) {
    const constraints = loadConstraints({ 
      hardeningLevel: persona.hardeningLevel || config.defaultHardeningLevel 
    });
    
    // For now, we just validate the action type
    const actionCheck = enforceConstraints('execute_task', { taskId: task.id }, constraints);
    
    if (!actionCheck.allowed) {
      return {
        success: false,
        error: `Constraint violation: ${actionCheck.reason}`,
        requiresApproval: actionCheck.requiresApproval
      };
    }
  }
  
  // Simulate task execution (in real implementation, this would call the agent)
  // For now, we return a placeholder result
  const result = {
    success: true,
    output: `Task ${task.id} executed successfully`,
    executionTime: Date.now() - startTime
  };
  
  // Validate checkpoint if success criteria defined
  if (result.success && task.successCriteria) {
    const checkpoint = validateCheckpoint(task.id, result.output, task.successCriteria);
    
    if (!checkpoint.passed) {
      result.success = false;
      result.error = `Checkpoint failed: ${checkpoint.failedRules.join(', ')}`;
    }
  }
  
  // Log result
  if (result.success) {
    await logger.taskComplete(task.id, task.title, result.output);
  } else {
    await logger.taskFailed(task.id, task.title, result.error);
  }
  
  return result;
}

/**
 * Run Night Shift
 */
async function runNightShift(options = {}) {
  const config = loadConfig();
  const state = loadState();
  
  console.log('\n🌙 Starting Night Shift...\n');
  
  // Validate prerequisites
  if (!options.skipValidation) {
    console.log('Validating prerequisites...');
    const prereqs = await validatePrerequisites(config);
    
    if (!prereqs.passed) {
      console.log('❌ Prerequisites not met:');
      console.log(JSON.stringify(prereqs.checks, null, 2));
      
      if (!prereqs.checks.hasEligibleTasks) {
        console.log('\nNo eligible tasks. Mark tasks as automationEligible with status Ready.');
      }
      
      return { success: false, reason: 'Prerequisites not met', prereqs };
    }
    
    console.log('✅ Prerequisites validated');
  }
  
  // Load eligible tasks
  console.log('\nLoading tasks...');
  const tasks = await loadNightShiftEligibleTasks();
  const limitedTasks = tasks.slice(0, config.maxTasksPerRun);
  
  console.log(`Found ${tasks.length} eligible tasks, processing ${limitedTasks.length}`);
  
  if (limitedTasks.length === 0) {
    return { success: true, reason: 'No tasks to process', tasksProcessed: 0 };
  }
  
  // Create execution run
  const run = createRun(limitedTasks, {
    stopOnFailure: config.stopOnFailure,
    maxRetries: config.maxRetries,
    timeoutMs: config.taskTimeoutMs
  });
  
  // Start run
  startRun(run);
  await logger.runStart(run.id, limitedTasks.length);
  
  console.log(`\n🚀 Run ${run.id} started with ${limitedTasks.length} tasks\n`);
  
  // Process tasks
  let completedCount = 0;
  let failedCount = 0;
  
  while (true) {
    const nextTask = getNextTask(run);
    
    if (!nextTask) {
      // Check if run is complete
      const status = getRunStatus();
      if (status.status === 'NO_ACTIVE_RUN' || 
          status.tasks?.pending === 0 && status.tasks?.ready === 0 && status.tasks?.running === 0) {
        break;
      }
      continue;
    }
    
    console.log(`\n📋 Task: ${nextTask.title || nextTask.id}`);
    
    // Start task
    startTask(run, nextTask.id);
    
    // Load persona if assigned
    let persona = null;
    if (nextTask.persona) {
      try {
        persona = await loadPersona(nextTask.persona);
        console.log(`   Persona: ${persona.codename}`);
      } catch (e) {
        console.log(`   ⚠️ Could not load persona: ${e.message}`);
      }
    }
    
    // Execute task
    try {
      const result = await executeTask(nextTask, persona, config);
      
      if (result.success) {
        completeTask(run, nextTask.id, result.output);
        completedCount++;
        console.log(`   ✅ Completed`);
      } else {
        // Handle failure
        const failureResult = handleFailure(result.error, {
          taskId: nextTask.id,
          runId: run.id,
          state: run
        });
        
        failTask(run, nextTask.id, result.error);
        failedCount++;
        console.log(`   ❌ Failed: ${result.error}`);
        
        if (failureResult.action === 'STOP') {
          console.log('\n🛑 Critical failure - stopping run');
          break;
        }
      }
    } catch (e) {
      const failureResult = handleFailure(e.message, {
        taskId: nextTask.id,
        runId: run.id,
        state: run
      });
      
      failTask(run, nextTask.id, e.message);
      failedCount++;
      console.log(`   ❌ Error: ${e.message}`);
      
      if (failureResult.action === 'STOP') {
        console.log('\n🛑 Critical failure - stopping run');
        break;
      }
    }
    
    // Check run timeout
    if (Date.now() - new Date(run.startedAt).getTime() > config.runTimeoutMs) {
      console.log('\n⏱️ Run timeout - stopping');
      abortRun('Run timeout exceeded');
      break;
    }
  }
  
  // Generate summary
  const summary = generateSummary(run);
  await logger.runComplete(run.id, `${completedCount} completed, ${failedCount} failed`);
  
  // Update state
  state.lastRun = {
    id: run.id,
    timestamp: timestamp(),
    completed: completedCount,
    failed: failedCount
  };
  state.totalRuns++;
  state.totalTasksCompleted += completedCount;
  state.totalTasksFailed += failedCount;
  saveState(state);
  
  console.log(`\n🌙 Night Shift Complete\n`);
  console.log(`   Completed: ${completedCount}`);
  console.log(`   Failed: ${failedCount}`);
  console.log(`   Duration: ${summary.duration}\n`);
  
  return {
    success: failedCount === 0,
    runId: run.id,
    summary,
    completedCount,
    failedCount
  };
}

/**
 * Generate morning summary report
 */
async function generateMorningSummary() {
  const state = loadState();
  const config = loadConfig();
  
  if (!state.lastRun) {
    return { report: 'No Night Shift runs recorded.' };
  }
  
  const report = `
# 🌅 Night Shift Morning Summary

**Run ID:** ${state.lastRun.id}
**Completed At:** ${state.lastRun.timestamp}

## Results
- ✅ Tasks Completed: ${state.lastRun.completed}
- ❌ Tasks Failed: ${state.lastRun.failed}

## Lifetime Stats
- Total Runs: ${state.totalRuns}
- Total Tasks Completed: ${state.totalTasksCompleted}
- Total Tasks Failed: ${state.totalTasksFailed}
- Success Rate: ${((state.totalTasksCompleted / (state.totalTasksCompleted + state.totalTasksFailed)) * 100).toFixed(1)}%

## Review Items
${state.lastRun.failed > 0 ? '- Review failed tasks in failure log' : '- No failures to review'}
- Check checkpoint validation results
- Review any constraint violations

---
*Generated at ${timestamp()}*
`;

  return { report, state };
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'run':
    runNightShift({ skipValidation: args.includes('--force') })
      .then(result => {
        console.log('\nResult:', JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
      })
      .catch(e => {
        console.error('Error:', e);
        process.exit(1);
      });
    break;
    
  case 'validate':
    validatePrerequisites(loadConfig())
      .then(result => {
        console.log('\n=== Night Shift Prerequisites ===\n');
        console.log(result.passed ? '✅ All checks passed' : '❌ Some checks failed');
        console.log(JSON.stringify(result.checks, null, 2));
      });
    break;
    
  case 'status':
    const status = getRunStatus();
    const state = loadState();
    console.log('\n=== Night Shift Status ===\n');
    console.log('Current Run:', JSON.stringify(status, null, 2));
    console.log('\nLifetime Stats:');
    console.log(`  Total Runs: ${state.totalRuns}`);
    console.log(`  Tasks Completed: ${state.totalTasksCompleted}`);
    console.log(`  Tasks Failed: ${state.totalTasksFailed}`);
    break;
    
  case 'summary':
    generateMorningSummary()
      .then(result => {
        console.log(result.report);
      });
    break;
    
  case 'config':
    if (args[1] === 'show') {
      console.log(JSON.stringify(loadConfig(), null, 2));
    } else if (args[1] === 'set' && args[2] && args[3]) {
      const config = loadConfig();
      const value = args[3] === 'true' ? true : 
                    args[3] === 'false' ? false : 
                    isNaN(args[3]) ? args[3] : Number(args[3]);
      config[args[2]] = value;
      saveConfig(config);
      console.log(`Set ${args[2]} = ${value}`);
    } else {
      console.log('Usage: config show | config set <key> <value>');
    }
    break;
    
  case 'abort':
    const aborted = abortRun(args[1] || 'Manual abort');
    if (aborted) {
      console.log('Aborted run:', aborted.id);
    } else {
      console.log('No active run to abort');
    }
    break;
    
  default:
    console.log(`
Night Shift Runner for VoltAgent

Usage:
  night_shift_runner.js run [--force]   — Run Night Shift
  night_shift_runner.js validate        — Check prerequisites
  night_shift_runner.js status          — Show current status
  night_shift_runner.js summary         — Generate morning summary
  night_shift_runner.js config show     — Show configuration
  night_shift_runner.js config set <k> <v> — Set config value
  night_shift_runner.js abort [reason]  — Abort current run

Configuration:
  maxTasksPerRun     — Max tasks per run (default: 10)
  taskTimeoutMs      — Task timeout in ms (default: 300000)
  stopOnFailure      — Stop on first failure (default: true)
  requireBetaHardening — Require Beta+ personas (default: true)
  startHour/endHour  — Night Shift hours (default: 23-06 UTC)
`);
}

// Export for use as module
module.exports = {
  runNightShift,
  validatePrerequisites,
  generateMorningSummary,
  loadConfig,
  saveConfig,
  isNightShiftTime
};
