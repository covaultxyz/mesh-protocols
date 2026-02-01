#!/usr/bin/env node
/**
 * Priority Engine — Weighted Task Prioritization
 * 
 * Discovers, weighs, and queues tasks so the mesh is always working.
 * 
 * Weight Factors:
 * - Revenue proximity (how close to money?)
 * - Urgency (time-sensitive?)
 * - Dependencies (blocking other work?)
 * - Effort (quick wins vs big lifts)
 * - Strategic value (long-term impact)
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, 'task_queue.json');
const DISCOVERED_FILE = path.join(__dirname, 'discovered_tasks.json');
const PRIORITY_LOG = path.join(__dirname, 'priority_log.json');

// Weight factors (sum to 100)
const WEIGHT_FACTORS = {
  revenue_proximity: 30,   // How close to generating revenue?
  urgency: 25,             // Time-sensitive?
  dependencies: 20,        // Blocking other work?
  effort_inverse: 15,      // Quick wins score higher
  strategic_value: 10      // Long-term impact
};

// Revenue proximity scores
const REVENUE_SCORES = {
  'direct': 100,           // Directly generates revenue
  'enables_deal': 80,      // Enables a deal to close
  'pipeline': 60,          // Builds pipeline
  'capacity': 40,          // Increases capacity to do deals
  'infrastructure': 20,    // Foundation work
  'nice_to_have': 10       // Not revenue-related
};

// Urgency scores
const URGENCY_SCORES = {
  'critical': 100,         // Do now
  'today': 80,             // Must be done today
  'this_week': 60,         // This week
  'this_month': 40,        // This month
  'backlog': 20            // Whenever
};

// Effort scores (inverse - less effort = higher score)
const EFFORT_SCORES = {
  'trivial': 100,          // < 5 minutes
  'small': 80,             // < 30 minutes
  'medium': 60,            // < 2 hours
  'large': 40,             // < 1 day
  'epic': 20               // Multiple days
};

/**
 * Calculate priority score for a task
 */
function calculatePriority(task) {
  const scores = {
    revenue_proximity: REVENUE_SCORES[task.revenue_proximity] || 30,
    urgency: URGENCY_SCORES[task.urgency] || 40,
    dependencies: task.blocks_count ? Math.min(100, task.blocks_count * 25) : 0,
    effort_inverse: EFFORT_SCORES[task.effort] || 50,
    strategic_value: task.strategic_value || 50
  };
  
  // Weighted sum
  let totalScore = 0;
  for (const [factor, weight] of Object.entries(WEIGHT_FACTORS)) {
    totalScore += (scores[factor] / 100) * weight;
  }
  
  return {
    score: Math.round(totalScore),
    breakdown: scores,
    weights: WEIGHT_FACTORS
  };
}

/**
 * Discover new tasks from various sources
 */
async function discoverTasks() {
  const discovered = [];
  
  // Source 1: Check for gaps in documentation
  const docGaps = await checkDocumentationGaps();
  discovered.push(...docGaps);
  
  // Source 2: Check for stale data
  const staleData = await checkStaleData();
  discovered.push(...staleData);
  
  // Source 3: Check for incomplete implementations
  const incomplete = await checkIncompleteWork();
  discovered.push(...incomplete);
  
  // Source 4: Check for monitoring/health issues
  const healthIssues = await checkHealthIssues();
  discovered.push(...healthIssues);
  
  // Save discovered tasks
  saveDiscoveredTasks(discovered);
  
  return discovered;
}

/**
 * Check for documentation gaps
 */
async function checkDocumentationGaps() {
  const tasks = [];
  
  // Check if key files have READMEs
  const dirsToCheck = [
    { path: '/root/clawd/protocols', name: 'Protocols' },
    { path: '/root/clawd/plans', name: 'Plans' },
    { path: '/root/clawd/mesh-protocols', name: 'Mesh Protocols' }
  ];
  
  for (const dir of dirsToCheck) {
    if (fs.existsSync(dir.path)) {
      const readmePath = path.join(dir.path, 'README.md');
      if (!fs.existsSync(readmePath)) {
        tasks.push({
          task_id: `doc-readme-${path.basename(dir.path)}`,
          description: `Create README.md for ${dir.name} directory`,
          task_type: 'content',
          source: 'doc_gap',
          revenue_proximity: 'infrastructure',
          urgency: 'backlog',
          effort: 'small',
          strategic_value: 30,
          auto_discovered: true,
          discovered_at: new Date().toISOString()
        });
      }
    }
  }
  
  return tasks;
}

/**
 * Check for stale data that needs refresh
 */
async function checkStaleData() {
  const tasks = [];
  
  // Check memory file freshness
  const memoryDir = '/root/clawd/memory';
  if (fs.existsSync(memoryDir)) {
    const today = new Date().toISOString().split('T')[0];
    const todayFile = path.join(memoryDir, `${today}.md`);
    
    if (!fs.existsSync(todayFile)) {
      tasks.push({
        task_id: `memory-daily-${today}`,
        description: `Create daily memory file for ${today}`,
        task_type: 'automation',
        source: 'stale_data',
        revenue_proximity: 'infrastructure',
        urgency: 'today',
        effort: 'trivial',
        strategic_value: 40,
        auto_discovered: true,
        discovered_at: new Date().toISOString()
      });
    }
  }
  
  return tasks;
}

/**
 * Check for incomplete implementations
 */
async function checkIncompleteWork() {
  const tasks = [];
  
  // Check for TODO comments in recent code
  const codeDirs = [
    '/root/clawd/bd-terminal/lib',
    '/root/clawd/voltagent'
  ];
  
  for (const dir of codeDirs) {
    if (fs.existsSync(dir)) {
      // Skip venv/node_modules directories
      const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.js') || f.endsWith('.py'))
        .filter(f => !f.includes('venv') && !f.includes('node_modules'));
      for (const file of files) {
        const filePath = path.join(dir, file);
        // Skip if inside venv or node_modules
        if (filePath.includes('venv') || filePath.includes('node_modules')) continue;
        const content = fs.readFileSync(filePath, 'utf8');
        // Only count real TODOs (not just references to TODO scanning)
        const todoCount = (content.match(/\/\/\s*TODO:|#\s*TODO:/gi) || []).length;
        
        if (todoCount > 0) {
          tasks.push({
            task_id: `todo-${path.basename(file, '.js')}`,
            description: `Complete ${todoCount} TODOs in ${file}`,
            task_type: 'automation',
            source: 'incomplete_work',
            revenue_proximity: 'infrastructure',
            urgency: 'this_week',
            effort: todoCount > 5 ? 'large' : 'medium',
            strategic_value: 50,
            blocks_count: 0,
            auto_discovered: true,
            discovered_at: new Date().toISOString()
          });
        }
      }
    }
  }
  
  return tasks;
}

/**
 * Check for health/monitoring issues
 */
async function checkHealthIssues() {
  const tasks = [];
  
  // Import mesh resilience to check node health
  try {
    const resilience = require('./mesh_resilience');
    const status = await resilience.getStatus();
    
    for (const nodeId of status.mesh.downNodes) {
      tasks.push({
        task_id: `health-${nodeId}-down`,
        description: `Investigate and restore ${nodeId} node`,
        task_type: 'automation',
        source: 'health_issue',
        revenue_proximity: 'capacity',
        urgency: 'today',
        effort: 'medium',
        strategic_value: 70,
        blocks_count: 2,
        auto_discovered: true,
        discovered_at: new Date().toISOString()
      });
    }
  } catch (e) {
    // Mesh resilience not available
  }
  
  return tasks;
}

/**
 * Load discovered tasks
 */
function loadDiscoveredTasks() {
  try {
    if (fs.existsSync(DISCOVERED_FILE)) {
      return JSON.parse(fs.readFileSync(DISCOVERED_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

/**
 * Save discovered tasks
 */
function saveDiscoveredTasks(tasks) {
  // Merge with existing, avoiding duplicates
  const existing = loadDiscoveredTasks();
  const existingIds = new Set(existing.map(t => t.task_id));
  
  const newTasks = tasks.filter(t => !existingIds.has(t.task_id));
  const merged = [...existing, ...newTasks];
  
  fs.writeFileSync(DISCOVERED_FILE, JSON.stringify(merged, null, 2));
  return newTasks.length;
}

/**
 * Prioritize and queue tasks
 */
function prioritizeAndQueue(maxTasks = 5) {
  const discovered = loadDiscoveredTasks();
  
  if (discovered.length === 0) {
    return { queued: 0, message: 'No discovered tasks' };
  }
  
  // Calculate priorities
  const prioritized = discovered.map(task => ({
    ...task,
    priority: calculatePriority(task)
  }));
  
  // Sort by score (highest first)
  prioritized.sort((a, b) => b.priority.score - a.priority.score);
  
  // Take top tasks
  const toQueue = prioritized.slice(0, maxTasks);
  
  // Load existing queue
  let queue = [];
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    }
  } catch (e) {}
  
  const queuedIds = new Set(queue.map(t => t.task_id));
  
  // Add to queue (avoid duplicates)
  const newlyQueued = [];
  for (const task of toQueue) {
    if (!queuedIds.has(task.task_id)) {
      queue.push({
        task_id: task.task_id,
        description: task.description,
        task_type: task.task_type,
        priority: task.priority.score > 70 ? 'HIGH' : task.priority.score > 40 ? 'MEDIUM' : 'LOW',
        priority_score: task.priority.score,
        assigned_agent: 'sandman',
        source: task.source,
        created_at: new Date().toISOString()
      });
      newlyQueued.push(task.task_id);
    }
  }
  
  // Save queue
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  
  // Log prioritization
  logPrioritization(prioritized, newlyQueued);
  
  return {
    queued: newlyQueued.length,
    tasks: newlyQueued,
    topPriorities: prioritized.slice(0, 5).map(t => ({
      id: t.task_id,
      score: t.priority.score,
      description: t.description.slice(0, 50)
    }))
  };
}

/**
 * Log prioritization decisions
 */
function logPrioritization(prioritized, queued) {
  let log = [];
  try {
    if (fs.existsSync(PRIORITY_LOG)) {
      log = JSON.parse(fs.readFileSync(PRIORITY_LOG, 'utf8'));
    }
  } catch (e) {}
  
  log.push({
    timestamp: new Date().toISOString(),
    discovered: prioritized.length,
    queued: queued.length,
    topTask: prioritized[0]?.task_id,
    topScore: prioritized[0]?.priority.score
  });
  
  // Keep last 100 entries
  if (log.length > 100) log = log.slice(-100);
  
  fs.writeFileSync(PRIORITY_LOG, JSON.stringify(log, null, 2));
}

/**
 * Full cycle: discover → prioritize → queue
 */
async function runCycle(maxTasks = 3) {
  console.log('\n=== Priority Engine Cycle ===');
  console.log(`Time: ${new Date().toISOString()}`);
  
  // Discover
  const discovered = await discoverTasks();
  console.log(`Discovered: ${discovered.length} tasks`);
  
  // Prioritize and queue
  const result = prioritizeAndQueue(maxTasks);
  console.log(`Queued: ${result.queued} tasks`);
  
  if (result.topPriorities?.length > 0) {
    console.log('\nTop priorities:');
    result.topPriorities.forEach((t, i) => {
      console.log(`  ${i + 1}. [${t.score}] ${t.description}...`);
    });
  }
  
  return {
    discovered: discovered.length,
    ...result
  };
}

/**
 * Get current priority status
 */
function getStatus() {
  const discovered = loadDiscoveredTasks();
  let queue = [];
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    }
  } catch (e) {}
  
  const prioritized = discovered.map(task => ({
    task_id: task.task_id,
    description: task.description.slice(0, 60),
    score: calculatePriority(task).score,
    source: task.source
  })).sort((a, b) => b.score - a.score);
  
  return {
    timestamp: new Date().toISOString(),
    discovered: discovered.length,
    queued: queue.length,
    topTasks: prioritized.slice(0, 10),
    weightFactors: WEIGHT_FACTORS
  };
}

// CLI
if (require.main === module) {
  const cmd = process.argv[2] || 'status';
  
  switch (cmd) {
    case 'discover':
      discoverTasks().then(t => {
        console.log(`Discovered ${t.length} tasks`);
        console.log(JSON.stringify(t, null, 2));
      });
      break;
      
    case 'prioritize':
      console.log(JSON.stringify(prioritizeAndQueue(parseInt(process.argv[3]) || 5), null, 2));
      break;
      
    case 'cycle':
      runCycle(parseInt(process.argv[3]) || 3).then(r => {
        console.log('\nResult:', JSON.stringify(r, null, 2));
      });
      break;
      
    case 'status':
      console.log(JSON.stringify(getStatus(), null, 2));
      break;
      
    case 'score':
      // Score a task from JSON
      const task = JSON.parse(process.argv[3] || '{}');
      console.log(JSON.stringify(calculatePriority(task), null, 2));
      break;
      
    default:
      console.log('Usage: priority_engine.js [discover|prioritize|cycle|status|score]');
  }
}

module.exports = {
  WEIGHT_FACTORS,
  calculatePriority,
  discoverTasks,
  prioritizeAndQueue,
  runCycle,
  getStatus
};
