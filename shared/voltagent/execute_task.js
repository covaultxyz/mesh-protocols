#!/usr/bin/env node
/**
 * VoltAgent Task Executor
 * 
 * Actually executes tasks by spawning Clawdbot sub-agents.
 * Called by process_queue.js or directly via CLI.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const OUTPUTS_DIR = path.join(__dirname, 'outputs');
const RESULTS_FILE = path.join(__dirname, 'task_results.json');

// Ensure outputs directory exists
if (!fs.existsSync(OUTPUTS_DIR)) {
  fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}

/**
 * Execute a task via Clawdbot CLI
 */
async function executeTask(task) {
  const startTime = Date.now();
  
  console.log(`\n🚀 Executing task: ${task.task_id}`);
  console.log(`   Type: ${task.task_type}`);
  console.log(`   Agent: ${task.assigned_agent}`);
  
  // Build the task prompt
  const prompt = buildPrompt(task);
  
  // Create output file path
  const outputFile = path.join(OUTPUTS_DIR, `${task.task_id}.md`);
  
  // Execute via clawdbot send (to main session which can spawn sub-agents)
  const message = `VOLTAGENT TASK EXECUTION

Task ID: ${task.task_id}
Type: ${task.task_type}
Priority: ${task.priority}
Agent: ${task.assigned_agent}

${prompt}

Output file: ${outputFile}

Execute this task now. Write results to the output file. Report completion.`;

  try {
    // Use clawdbot agent CLI to spawn a task execution
    // Using --session-id to spawn a new sub-session for this task
    const escapedMsg = escapeForShell(message);
    const result = await runCommand(`clawdbot agent --session-id "voltagent-${task.task_id}" --message "${escapedMsg}" --json --timeout 300`);
    
    const duration = Date.now() - startTime;
    
    // Save result
    saveResult({
      task_id: task.task_id,
      status: 'dispatched',
      dispatched_at: new Date().toISOString(),
      duration_ms: duration,
      output_file: outputFile
    });
    
    console.log(`✅ Task dispatched (${duration}ms)`);
    return { success: true, duration };
    
  } catch (err) {
    const duration = Date.now() - startTime;
    
    saveResult({
      task_id: task.task_id,
      status: 'error',
      error: err.message,
      failed_at: new Date().toISOString(),
      duration_ms: duration
    });
    
    console.log(`❌ Task failed: ${err.message}`);
    return { success: false, error: err.message, duration };
  }
}

/**
 * Build execution prompt based on task type
 */
function buildPrompt(task) {
  const prompts = {
    research: `RESEARCH TASK:
${task.description}

Instructions:
1. Search for relevant information
2. Analyze and synthesize findings
3. Write structured report with sources
4. Save to output file`,

    analysis: `ANALYSIS TASK:
${task.description}

Instructions:
1. Gather relevant data
2. Perform analysis
3. Document findings with executive summary
4. Include recommendations
5. Save to output file`,

    content: `CONTENT CREATION TASK:
${task.description}

Instructions:
1. Create the requested content
2. Include variations if applicable
3. Make it ready-to-use
4. Save to output file`,

    automation: `AUTOMATION TASK:
${task.description}

Instructions:
1. Build the automation/script
2. Test it works
3. Document usage
4. Save code and docs to output file`,

    default: `TASK:
${task.description}

Instructions:
1. Execute this task
2. Document results
3. Save to output file`
  };
  
  return prompts[task.task_type?.toLowerCase()] || prompts.default;
}

/**
 * Run shell command and return result
 */
function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

/**
 * Escape string for shell
 */
function escapeForShell(str) {
  return str.replace(/'/g, "'\\''").replace(/"/g, '\\"');
}

/**
 * Save result to results file
 */
function saveResult(result) {
  let results = [];
  try {
    if (fs.existsSync(RESULTS_FILE)) {
      results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
    }
  } catch (e) {}
  
  results.push(result);
  
  // Keep last 100
  if (results.length > 100) {
    results = results.slice(-100);
  }
  
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

/**
 * Execute tasks from queue file
 */
async function executeFromQueue(maxTasks = 3) {
  const queueFile = path.join(__dirname, 'task_queue.json');
  
  if (!fs.existsSync(queueFile)) {
    console.log('No queue file found');
    return { executed: 0 };
  }
  
  const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
  
  if (queue.length === 0) {
    console.log('Queue is empty');
    return { executed: 0 };
  }
  
  console.log(`\n=== VoltAgent Executor ===`);
  console.log(`Queue: ${queue.length} tasks`);
  console.log(`Processing: ${Math.min(maxTasks, queue.length)}`);
  
  const toExecute = queue.slice(0, maxTasks);
  const results = [];
  
  for (const task of toExecute) {
    const result = await executeTask(task);
    results.push({ task_id: task.task_id, ...result });
  }
  
  // Remove executed tasks from queue
  const executedIds = new Set(results.filter(r => r.success).map(r => r.task_id));
  const remaining = queue.filter(t => !executedIds.has(t.task_id));
  fs.writeFileSync(queueFile, JSON.stringify(remaining, null, 2));
  
  console.log(`\n=== Complete ===`);
  console.log(`Executed: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
  console.log(`Remaining: ${remaining.length}`);
  
  return {
    executed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    remaining: remaining.length,
    results
  };
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'queue';
  
  if (cmd === 'queue') {
    const max = parseInt(args[1]) || 3;
    executeFromQueue(max).then(r => {
      console.log('\nResult:', JSON.stringify(r, null, 2));
    });
  } else if (cmd === 'task') {
    // Execute single task from JSON arg
    const taskJson = args[1];
    if (!taskJson) {
      console.log('Usage: execute_task.js task <json>');
      process.exit(1);
    }
    const task = JSON.parse(taskJson);
    executeTask(task).then(r => {
      console.log('\nResult:', JSON.stringify(r, null, 2));
    });
  } else {
    console.log('Usage: execute_task.js [queue [max] | task <json>]');
  }
}

module.exports = { executeTask, executeFromQueue };
