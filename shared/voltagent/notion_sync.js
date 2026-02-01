#!/usr/bin/env node
/**
 * VoltAgent Notion Sync
 * 
 * Pulls tasks from Notion Mesh Work Log and queues for execution.
 * Updates Notion with task status and results.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Config
const NOTION_KEY = fs.readFileSync('/root/.config/notion/api_key', 'utf8').trim();
const NOTION_VERSION = '2022-06-28';

// Database IDs
const MESH_WORK_LOG_DB = '2f935e81-2bbb-810e-8bc0-eed9cfdf3c19';
const TASKS_DB = '2f835e81-2bbb-813b-a6fa-000ba219406c';

const QUEUE_FILE = path.join(__dirname, 'task_queue.json');

/**
 * Make Notion API request
 */
function notionRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: `/v1/${endpoint}`,
      method,
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${data.slice(0, 100)}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Query tasks ready for automation from Mesh Work Log
 */
async function getAutomationReadyTasks() {
  // Query for tasks with specific criteria:
  // - Status contains "Queued" or "Ready"
  // - Or Priority is Critical/High
  const result = await notionRequest(
    `databases/${MESH_WORK_LOG_DB}/query`,
    'POST',
    {
      filter: {
        or: [
          {
            property: 'Status',
            select: { equals: 'Queued for Automation' }
          },
          {
            property: 'Status', 
            select: { equals: 'Ready' }
          },
          {
            and: [
              {
                property: 'Priority',
                select: { equals: '🔴 Critical' }
              },
              {
                property: 'Category',
                select: { equals: 'Infrastructure' }
              }
            ]
          }
        ]
      },
      page_size: 20
    }
  );
  
  if (result.error) {
    console.error('Notion query error:', result.message);
    return [];
  }
  
  return result.results || [];
}

/**
 * Convert Notion page to task format
 */
function pageToTask(page) {
  const props = page.properties;
  
  // Extract title from Entry field
  const title = props.Entry?.title?.[0]?.plain_text || 
                props.Name?.title?.[0]?.plain_text || 
                'Untitled Task';
  
  // Extract details
  const details = props.Details?.rich_text?.[0]?.plain_text || '';
  
  // Extract priority
  const priorityRaw = props.Priority?.select?.name || 'Medium';
  const priority = priorityRaw.includes('Critical') ? 'CRITICAL' :
                   priorityRaw.includes('High') ? 'HIGH' :
                   priorityRaw.includes('Low') ? 'LOW' : 'MEDIUM';
  
  // Extract category for task type mapping
  const category = props.Category?.select?.name || 'Operations';
  const taskType = mapCategoryToTaskType(category);
  
  // Extract owner for agent assignment
  const owner = props.Owner?.rich_text?.[0]?.plain_text ||
                props.Owner?.select?.name || 
                'general-pool';
  
  return {
    task_id: page.id,
    description: `${title}\n\n${details}`.trim(),
    task_type: taskType,
    priority,
    assigned_agent: mapOwnerToAgent(owner),
    notion_page_id: page.id,
    created_at: page.created_time
  };
}

/**
 * Map category to task type
 */
function mapCategoryToTaskType(category) {
  const mapping = {
    'Research': 'research',
    'Analysis': 'analysis',
    'Infrastructure': 'automation',
    'Content': 'content',
    'Data': 'data',
    'Design': 'content',
    'Strategy': 'analysis',
    'Operations': 'automation',
    'Setup': 'automation'
  };
  return mapping[category] || 'default';
}

/**
 * Map owner name to agent ID
 */
function mapOwnerToAgent(owner) {
  const ownerLower = owner.toLowerCase();
  
  if (ownerLower.includes('cassian') || ownerLower.includes('sandman')) return 'cassian-sandman';
  if (ownerLower.includes('avery')) return 'avery-vale';
  if (ownerLower.includes('rowan')) return 'rowan-sable';
  if (ownerLower.includes('elliot')) return 'elliot-brandt';
  if (ownerLower.includes('orion')) return 'orion-locke';
  if (ownerLower.includes('oracle')) return 'oracle';
  if (ownerLower.includes('voltagent')) return 'voltagent';
  
  return 'general-pool';
}

/**
 * Update task status in Notion
 */
async function updateTaskStatus(pageId, status, notes = '') {
  const properties = {
    Status: { select: { name: status } }
  };
  
  if (notes) {
    properties.Details = {
      rich_text: [{ text: { content: notes } }]
    };
  }
  
  return notionRequest(`pages/${pageId}`, 'PATCH', { properties });
}

/**
 * Sync tasks from Notion to queue
 */
async function syncFromNotion() {
  console.log('\n=== VoltAgent Notion Sync ===');
  console.log(`Time: ${new Date().toISOString()}`);
  
  // Get automation-ready tasks
  const pages = await getAutomationReadyTasks();
  console.log(`Found ${pages.length} tasks in Notion`);
  
  if (pages.length === 0) {
    return { synced: 0, tasks: [] };
  }
  
  // Load existing queue
  let queue = [];
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    }
  } catch (e) {}
  
  const existingIds = new Set(queue.map(t => t.task_id));
  
  // Convert and add new tasks
  const newTasks = [];
  for (const page of pages) {
    if (!existingIds.has(page.id)) {
      const task = pageToTask(page);
      newTasks.push(task);
      queue.push(task);
      
      // Update Notion status
      await updateTaskStatus(page.id, 'Processing', 'Queued for VoltAgent execution');
    }
  }
  
  // Save queue
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  
  console.log(`Synced ${newTasks.length} new tasks`);
  console.log(`Queue size: ${queue.length}`);
  
  return {
    synced: newTasks.length,
    queueSize: queue.length,
    tasks: newTasks.map(t => ({ id: t.task_id, type: t.task_type, priority: t.priority }))
  };
}

/**
 * Report task completion back to Notion
 */
async function reportCompletion(taskId, success, outputFile = null, notes = '') {
  const status = success ? 'Completed' : 'Failed';
  let details = notes;
  
  if (outputFile && fs.existsSync(outputFile)) {
    const output = fs.readFileSync(outputFile, 'utf8');
    details = `${notes}\n\nOutput:\n${output.slice(0, 1000)}${output.length > 1000 ? '...' : ''}`;
  }
  
  return updateTaskStatus(taskId, status, details);
}

// CLI
if (require.main === module) {
  const cmd = process.argv[2] || 'sync';
  
  switch (cmd) {
    case 'sync':
      syncFromNotion().then(r => {
        console.log('\nResult:', JSON.stringify(r, null, 2));
      }).catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
      });
      break;
      
    case 'complete':
      const taskId = process.argv[3];
      const success = process.argv[4] !== 'false';
      const output = process.argv[5];
      if (!taskId) {
        console.log('Usage: notion_sync.js complete <taskId> [success] [outputFile]');
        process.exit(1);
      }
      reportCompletion(taskId, success, output).then(r => {
        console.log('Updated:', r.id || r);
      });
      break;
      
    default:
      console.log('Usage: notion_sync.js [sync | complete <taskId> [success] [outputFile]]');
  }
}

module.exports = { syncFromNotion, reportCompletion, getAutomationReadyTasks };
