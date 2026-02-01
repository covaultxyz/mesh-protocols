#!/usr/bin/env node
/**
 * Mesh Resilience — Task Handoff Protocol
 * 
 * Ensures tasks don't stall when a node goes down.
 * 
 * Rules:
 * 1. Check node health before assigning tasks
 * 2. If assigned node is down, reassign to healthy node
 * 3. Track task ownership with timestamps
 * 4. Stale tasks (no progress in X minutes) get reassigned
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

// Mesh node configuration
const MESH_NODES = {
  sandman: {
    id: 'sandman',
    name: 'Cassian Sandman',
    ip: '100.112.130.22',
    port: 18789,
    healthEndpoint: '/health',
    primary: true
  },
  oracle: {
    id: 'oracle',
    name: 'Oracle',
    ip: '100.113.222.30',
    port: 18789,
    healthEndpoint: '/health',
    primary: false
  },
  oraclelocal: {
    id: 'oraclelocal',
    name: 'OracleLocalBot',
    ip: '100.82.39.77',
    port: 18789,
    healthEndpoint: '/health',
    primary: false
  }
};

// Task ownership tracking
const OWNERSHIP_FILE = path.join(__dirname, 'task_ownership.json');
const STALE_THRESHOLD_MINUTES = 30;

/**
 * Check if a node is healthy
 */
function checkNodeHealth(nodeId) {
  return new Promise((resolve) => {
    const node = MESH_NODES[nodeId];
    if (!node) {
      resolve({ nodeId, healthy: false, error: 'Unknown node' });
      return;
    }
    
    const options = {
      hostname: node.ip,
      port: node.port,
      path: node.healthEndpoint,
      method: 'GET',
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      resolve({
        nodeId,
        healthy: res.statusCode === 200,
        statusCode: res.statusCode,
        checkedAt: new Date().toISOString()
      });
    });
    
    req.on('error', (err) => {
      resolve({
        nodeId,
        healthy: false,
        error: err.message,
        checkedAt: new Date().toISOString()
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        nodeId,
        healthy: false,
        error: 'Timeout',
        checkedAt: new Date().toISOString()
      });
    });
    
    req.end();
  });
}

/**
 * Check health of all mesh nodes
 */
async function checkAllNodes() {
  const results = {};
  
  for (const nodeId of Object.keys(MESH_NODES)) {
    results[nodeId] = await checkNodeHealth(nodeId);
  }
  
  return {
    timestamp: new Date().toISOString(),
    nodes: results,
    healthyNodes: Object.values(results).filter(n => n.healthy).map(n => n.nodeId),
    downNodes: Object.values(results).filter(n => !n.healthy).map(n => n.nodeId)
  };
}

/**
 * Load task ownership
 */
function loadOwnership() {
  try {
    if (fs.existsSync(OWNERSHIP_FILE)) {
      return JSON.parse(fs.readFileSync(OWNERSHIP_FILE, 'utf8'));
    }
  } catch (e) {}
  return { tasks: {} };
}

/**
 * Save task ownership
 */
function saveOwnership(ownership) {
  fs.writeFileSync(OWNERSHIP_FILE, JSON.stringify(ownership, null, 2));
}

/**
 * Assign task to a node
 */
function assignTask(taskId, nodeId, description = '') {
  const ownership = loadOwnership();
  
  ownership.tasks[taskId] = {
    nodeId,
    assignedAt: new Date().toISOString(),
    lastUpdate: new Date().toISOString(),
    description,
    status: 'assigned'
  };
  
  saveOwnership(ownership);
  
  return ownership.tasks[taskId];
}

/**
 * Update task progress
 */
function updateTaskProgress(taskId, status, details = {}) {
  const ownership = loadOwnership();
  
  if (!ownership.tasks[taskId]) {
    return { error: 'Task not found' };
  }
  
  ownership.tasks[taskId].lastUpdate = new Date().toISOString();
  ownership.tasks[taskId].status = status;
  Object.assign(ownership.tasks[taskId], details);
  
  saveOwnership(ownership);
  
  return ownership.tasks[taskId];
}

/**
 * Complete a task
 */
function completeTask(taskId, result = {}) {
  const ownership = loadOwnership();
  
  if (!ownership.tasks[taskId]) {
    return { error: 'Task not found' };
  }
  
  ownership.tasks[taskId].status = 'completed';
  ownership.tasks[taskId].completedAt = new Date().toISOString();
  ownership.tasks[taskId].result = result;
  
  saveOwnership(ownership);
  
  return ownership.tasks[taskId];
}

/**
 * Find stale tasks (no update in threshold minutes)
 */
function findStaleTasks() {
  const ownership = loadOwnership();
  const now = Date.now();
  const staleTasks = [];
  
  for (const [taskId, task] of Object.entries(ownership.tasks)) {
    if (task.status === 'completed') continue;
    
    const lastUpdate = new Date(task.lastUpdate).getTime();
    const minutesSinceUpdate = (now - lastUpdate) / (1000 * 60);
    
    if (minutesSinceUpdate > STALE_THRESHOLD_MINUTES) {
      staleTasks.push({
        taskId,
        ...task,
        minutesSinceUpdate: Math.round(minutesSinceUpdate)
      });
    }
  }
  
  return staleTasks;
}

/**
 * Handoff stale tasks to healthy nodes
 */
async function handoffStaleTasks() {
  const meshStatus = await checkAllNodes();
  const staleTasks = findStaleTasks();
  
  if (staleTasks.length === 0) {
    return { handoffs: 0, message: 'No stale tasks' };
  }
  
  if (meshStatus.healthyNodes.length === 0) {
    return { handoffs: 0, error: 'No healthy nodes available' };
  }
  
  const handoffs = [];
  const ownership = loadOwnership();
  
  for (const staleTask of staleTasks) {
    const currentNode = staleTask.nodeId;
    
    // Find a healthy node that's not the current one
    const newNode = meshStatus.healthyNodes.find(n => n !== currentNode) 
                    || meshStatus.healthyNodes[0];
    
    if (newNode && newNode !== currentNode) {
      // Handoff the task
      ownership.tasks[staleTask.taskId].previousNode = currentNode;
      ownership.tasks[staleTask.taskId].nodeId = newNode;
      ownership.tasks[staleTask.taskId].handoffAt = new Date().toISOString();
      ownership.tasks[staleTask.taskId].handoffReason = 'stale';
      ownership.tasks[staleTask.taskId].lastUpdate = new Date().toISOString();
      ownership.tasks[staleTask.taskId].status = 'handed_off';
      
      handoffs.push({
        taskId: staleTask.taskId,
        from: currentNode,
        to: newNode,
        reason: `Stale for ${staleTask.minutesSinceUpdate} minutes`
      });
    }
  }
  
  saveOwnership(ownership);
  
  return {
    handoffs: handoffs.length,
    details: handoffs,
    meshStatus: {
      healthy: meshStatus.healthyNodes,
      down: meshStatus.downNodes
    }
  };
}

/**
 * Get best node for a new task
 */
async function getBestNode(preferredNode = null) {
  const meshStatus = await checkAllNodes();
  
  // If preferred node is healthy, use it
  if (preferredNode && meshStatus.healthyNodes.includes(preferredNode)) {
    return {
      nodeId: preferredNode,
      reason: 'preferred_healthy'
    };
  }
  
  // Otherwise, pick the primary healthy node
  const primaryHealthy = meshStatus.healthyNodes.find(n => MESH_NODES[n]?.primary);
  if (primaryHealthy) {
    return {
      nodeId: primaryHealthy,
      reason: 'primary_healthy'
    };
  }
  
  // Fall back to any healthy node
  if (meshStatus.healthyNodes.length > 0) {
    return {
      nodeId: meshStatus.healthyNodes[0],
      reason: 'fallback_healthy'
    };
  }
  
  return {
    nodeId: null,
    reason: 'no_healthy_nodes',
    error: 'All nodes are down'
  };
}

/**
 * Get current status
 */
async function getStatus() {
  const meshStatus = await checkAllNodes();
  const ownership = loadOwnership();
  const staleTasks = findStaleTasks();
  
  const activeTasks = Object.entries(ownership.tasks)
    .filter(([, t]) => t.status !== 'completed')
    .map(([id, t]) => ({ taskId: id, ...t }));
  
  return {
    timestamp: new Date().toISOString(),
    mesh: meshStatus,
    tasks: {
      total: Object.keys(ownership.tasks).length,
      active: activeTasks.length,
      stale: staleTasks.length,
      completed: Object.values(ownership.tasks).filter(t => t.status === 'completed').length
    },
    staleTasks: staleTasks.map(t => ({ taskId: t.taskId, node: t.nodeId, minutes: t.minutesSinceUpdate }))
  };
}

// CLI interface
if (require.main === module) {
  const cmd = process.argv[2] || 'status';
  
  switch (cmd) {
    case 'status':
      getStatus().then(s => console.log(JSON.stringify(s, null, 2)));
      break;
      
    case 'health':
      checkAllNodes().then(s => console.log(JSON.stringify(s, null, 2)));
      break;
      
    case 'handoff':
      handoffStaleTasks().then(r => console.log(JSON.stringify(r, null, 2)));
      break;
      
    case 'best-node':
      getBestNode(process.argv[3]).then(r => console.log(JSON.stringify(r, null, 2)));
      break;
      
    case 'assign':
      const taskId = process.argv[3];
      const nodeId = process.argv[4] || 'sandman';
      console.log(JSON.stringify(assignTask(taskId, nodeId), null, 2));
      break;
      
    case 'complete':
      console.log(JSON.stringify(completeTask(process.argv[3]), null, 2));
      break;
      
    default:
      console.log(`Usage: mesh_resilience.js [status|health|handoff|best-node|assign|complete]`);
  }
}

module.exports = {
  MESH_NODES,
  checkNodeHealth,
  checkAllNodes,
  assignTask,
  updateTaskProgress,
  completeTask,
  findStaleTasks,
  handoffStaleTasks,
  getBestNode,
  getStatus
};
