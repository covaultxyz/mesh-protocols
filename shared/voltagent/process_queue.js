#!/usr/bin/env node
/**
 * VoltAgent Task Queue Processor
 * 
 * Reads task_queue.json and processes tasks via Clawdbot sub-agents.
 * Called from heartbeat or cron.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, 'task_queue.json');
const RESULTS_FILE = path.join(__dirname, 'task_results.json');
const PROCESSING_FILE = path.join(__dirname, 'processing.json');

/**
 * Load queue file
 */
function loadQueue() {
  try {
    if (!fs.existsSync(QUEUE_FILE)) return [];
    const data = fs.readFileSync(QUEUE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading queue:', err.message);
    return [];
  }
}

/**
 * Save queue file
 */
function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

/**
 * Load results file
 */
function loadResults() {
  try {
    if (!fs.existsSync(RESULTS_FILE)) return [];
    const data = fs.readFileSync(RESULTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

/**
 * Save result
 */
function saveResult(result) {
  const results = loadResults();
  results.push(result);
  
  // Keep last 100 results
  if (results.length > 100) {
    results.splice(0, results.length - 100);
  }
  
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

/**
 * Get processing state (tasks currently being processed)
 */
function getProcessingState() {
  try {
    if (!fs.existsSync(PROCESSING_FILE)) return {};
    const data = fs.readFileSync(PROCESSING_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

/**
 * Save processing state
 */
function saveProcessingState(state) {
  fs.writeFileSync(PROCESSING_FILE, JSON.stringify(state, null, 2));
}

/**
 * Generate task execution prompt for sub-agent
 */
function generateTaskPrompt(task) {
  const taskTypePrompts = {
    'research': `Research task: ${task.description}. 
Output: Write findings to /root/clawd/voltagent/outputs/${task.task_id}.md
Format: Structured markdown with sources.`,
    
    'analysis': `Analysis task: ${task.description}
Output: Write analysis to /root/clawd/voltagent/outputs/${task.task_id}.md
Format: Executive summary, detailed findings, recommendations.`,
    
    'automation': `Automation task: ${task.description}
Output: Create script or update config as needed.
Test the automation before marking complete.`,
    
    'content': `Content creation task: ${task.description}
Output: Write content to /root/clawd/voltagent/outputs/${task.task_id}.md
Format: Ready-to-use content with variations if applicable.`,
    
    'data': `Data task: ${task.description}
Output: Process data and save results to /root/clawd/voltagent/outputs/${task.task_id}.json
Include summary statistics.`,
    
    'default': `Task: ${task.description}
Execute this task and report results.
Output: /root/clawd/voltagent/outputs/${task.task_id}.md`
  };
  
  const basePrompt = taskTypePrompts[task.task_type?.toLowerCase()] || taskTypePrompts.default;
  
  return `You are executing a VoltAgent task.

Task ID: ${task.task_id}
Priority: ${task.priority}
Assigned Agent: ${task.assigned_agent}

${basePrompt}

When complete:
1. Write output to the specified file
2. Report success/failure
3. Note any follow-up actions needed`;
}

/**
 * Process a single task (returns status)
 */
async function processTask(task) {
  console.log(`Processing task ${task.task_id}: ${task.description.slice(0, 50)}...`);
  
  // Mark as processing
  const processing = getProcessingState();
  processing[task.task_id] = {
    startedAt: new Date().toISOString(),
    task
  };
  saveProcessingState(processing);
  
  try {
    // Ensure outputs directory exists
    const outputDir = path.join(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate prompt
    const prompt = generateTaskPrompt(task);
    
    // For now, write a placeholder - in production this would call sessions_spawn
    const outputFile = path.join(outputDir, `${task.task_id}.md`);
    fs.writeFileSync(outputFile, `# Task: ${task.task_id}\n\n${task.description}\n\n*Queued for processing*\n\nGenerated: ${new Date().toISOString()}`);
    
    // Save result
    const result = {
      task_id: task.task_id,
      status: 'queued',
      prompt,
      output_file: outputFile,
      queued_at: new Date().toISOString()
    };
    saveResult(result);
    
    // Remove from processing
    delete processing[task.task_id];
    saveProcessingState(processing);
    
    return { success: true, result };
    
  } catch (err) {
    console.error(`Error processing task ${task.task_id}:`, err.message);
    
    // Save error result
    const result = {
      task_id: task.task_id,
      status: 'error',
      error: err.message,
      failed_at: new Date().toISOString()
    };
    saveResult(result);
    
    // Remove from processing
    const processing = getProcessingState();
    delete processing[task.task_id];
    saveProcessingState(processing);
    
    return { success: false, error: err.message };
  }
}

/**
 * Process queue (main entry point)
 */
async function processQueue(maxTasks = 5) {
  console.log(`\n=== VoltAgent Queue Processor ===`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  const queue = loadQueue();
  console.log(`Queue size: ${queue.length}`);
  
  if (queue.length === 0) {
    console.log('No tasks to process');
    return { processed: 0, tasks: [] };
  }
  
  // Get tasks to process (respect max, skip already processing)
  const processing = getProcessingState();
  const processingIds = new Set(Object.keys(processing));
  
  const toProcess = queue
    .filter(t => !processingIds.has(t.task_id))
    .slice(0, maxTasks);
  
  console.log(`Processing ${toProcess.length} tasks...`);
  
  const results = [];
  for (const task of toProcess) {
    const result = await processTask(task);
    results.push({ task_id: task.task_id, ...result });
  }
  
  // Remove processed tasks from queue
  const processedIds = new Set(results.filter(r => r.success).map(r => r.task_id));
  const newQueue = queue.filter(t => !processedIds.has(t.task_id));
  saveQueue(newQueue);
  
  console.log(`\nProcessed: ${results.filter(r => r.success).length}`);
  console.log(`Errors: ${results.filter(r => !r.success).length}`);
  console.log(`Remaining in queue: ${newQueue.length}`);
  
  return {
    processed: results.filter(r => r.success).length,
    errors: results.filter(r => !r.success).length,
    remaining: newQueue.length,
    tasks: results
  };
}

/**
 * Get queue status
 */
function getStatus() {
  const queue = loadQueue();
  const processing = getProcessingState();
  const results = loadResults();
  
  return {
    queueSize: queue.length,
    processing: Object.keys(processing).length,
    recentResults: results.slice(-10),
    queuedTasks: queue.map(t => ({
      id: t.task_id,
      type: t.task_type,
      priority: t.priority,
      created: t.created_at
    }))
  };
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command) {
    case 'process':
      const max = parseInt(args[1]) || 5;
      processQueue(max).then(result => {
        console.log('\nResult:', JSON.stringify(result, null, 2));
      });
      break;
      
    case 'status':
      console.log(JSON.stringify(getStatus(), null, 2));
      break;
      
    default:
      console.log('Usage: process_queue.js [process [max] | status]');
  }
}

module.exports = {
  processQueue,
  getStatus,
  loadQueue,
  saveResult
};
