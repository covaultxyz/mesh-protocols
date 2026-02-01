#!/usr/bin/env node
/**
 * Work Plan Loader for VoltAgent Night Shift
 * 
 * Loads and parses work plans from Notion for Night Shift execution.
 * 
 * Task 2.2 of VoltAgent Night Shift Work Plan
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const https = require('https');

// Database IDs
const ACTIVE_PROJECTS_DB = '2f935e81-2bbb-8196-bc3b-fdd9fbacc949';
const TASKS_DB = '2f835e81-2bbb-81b6-9700-e18108a40b1f';
const NOTION_VERSION = '2022-06-28';

function getNotionToken() {
  const tokenPath = '/root/.config/notion/api_key';
  try {
    return fs.readFileSync(tokenPath, 'utf8').trim();
  } catch (e) {
    throw new Error(`Cannot read Notion token from ${tokenPath}`);
  }
}

async function notionRequest(method, endpoint, body = null) {
  const token = getNotionToken();
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
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
          reject(new Error(`Failed to parse response: ${data}`));
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

function extractProperty(props, name, type) {
  const prop = props[name];
  if (!prop) return null;
  
  switch (type) {
    case 'title':
      return prop.title?.[0]?.plain_text || null;
    case 'rich_text':
      return prop.rich_text?.[0]?.plain_text || null;
    case 'select':
      return prop.select?.name || null;
    case 'multi_select':
      return prop.multi_select?.map(s => s.name) || [];
    case 'checkbox':
      return prop.checkbox || false;
    case 'number':
      return prop.number;
    case 'date':
      return prop.date?.start || null;
    case 'relation':
      return prop.relation?.map(r => r.id) || [];
    case 'url':
      return prop.url || null;
    default:
      return null;
  }
}

function parseProject(page) {
  const props = page.properties;
  
  return {
    id: page.id,
    name: extractProperty(props, 'Project', 'title'),
    status: extractProperty(props, 'Status', 'select'),
    priority: extractProperty(props, 'Priority', 'select'),
    category: extractProperty(props, 'Category', 'select'),
    lead: extractProperty(props, 'Lead', 'relation'),
    support: extractProperty(props, 'Support', 'relation'),
    virtualTeams: extractProperty(props, 'Virtual Teams', 'relation'),
    protocols: extractProperty(props, 'Protocols', 'relation'),
    objective: extractProperty(props, 'Objective', 'rich_text'),
    notes: extractProperty(props, 'Notes', 'rich_text'),
    sequence: extractProperty(props, 'Sequence', 'number'),
    blockedOn: extractProperty(props, 'Blocked On', 'relation'),
    githubLink: extractProperty(props, 'GitHub Link', 'url'),
    lastUpdated: extractProperty(props, 'Last Updated', 'date')
  };
}

function parseTask(page) {
  const props = page.properties;
  
  return {
    id: page.id,
    title: extractProperty(props, 'ID', 'title'),
    description: extractProperty(props, 'Description', 'rich_text'),
    status: extractProperty(props, 'status', 'select'),
    priority: extractProperty(props, 'priority', 'select'),
    taskType: extractProperty(props, 'taskType', 'select'),
    assignedAgent: extractProperty(props, 'assignedAgent', 'select'),
    executionMode: extractProperty(props, 'executionMode', 'select'),
    automationEligible: extractProperty(props, 'automationEligible', 'checkbox'),
    automationScore: extractProperty(props, 'automationScore', 'number'),
    requiresApproval: extractProperty(props, 'requiresApproval', 'checkbox'),
    requiresReview: extractProperty(props, 'requiresReview', 'checkbox'),
    approvalStatus: extractProperty(props, 'approvalStatus', 'select'),
    dueDate: extractProperty(props, 'dueDate', 'date'),
    claimedBy: extractProperty(props, 'claimed_by', 'rich_text'),
    claimedAt: extractProperty(props, 'claimed_at', 'date'),
    artifacts: extractProperty(props, 'artifacts', 'rich_text'),
    successCriteria: extractProperty(props, 'resolutionNotes', 'rich_text') // Using resolutionNotes as success criteria
  };
}

async function loadProjects(filter = {}) {
  console.log('Loading projects...');
  
  const body = { page_size: 100 };
  
  if (filter.status) {
    body.filter = {
      property: 'Status',
      select: { equals: filter.status }
    };
  }
  
  const response = await notionRequest('POST', `/v1/databases/${ACTIVE_PROJECTS_DB}/query`, body);
  return (response.results || []).map(parseProject);
}

async function loadTasks(filter = {}) {
  console.log('Loading tasks...');
  
  const body = { page_size: 100 };
  
  if (filter.automationEligible) {
    body.filter = {
      property: 'automationEligible',
      checkbox: { equals: true }
    };
  }
  
  if (filter.status) {
    body.filter = {
      property: 'status',
      select: { equals: filter.status }
    };
  }
  
  const response = await notionRequest('POST', `/v1/databases/${TASKS_DB}/query`, body);
  return (response.results || []).map(parseTask);
}

async function loadNightShiftEligibleTasks() {
  console.log('Loading Night Shift eligible tasks...');
  
  const response = await notionRequest('POST', `/v1/databases/${TASKS_DB}/query`, {
    filter: {
      and: [
        { property: 'automationEligible', checkbox: { equals: true } },
        { property: 'status', select: { equals: 'Ready' } }
      ]
    },
    page_size: 100
  });
  
  return (response.results || []).map(parseTask);
}

function validateNightShiftEligibility(task) {
  const checks = {
    isAutomationEligible: task.automationEligible === true,
    isReady: task.status === 'Ready',
    hasDescription: !!task.description,
    notBlocked: task.status !== 'Blocked',
    hasAssignee: !!task.assignedAgent
  };
  
  const passed = checks.isAutomationEligible && checks.isReady && checks.hasDescription;
  const failures = Object.entries(checks).filter(([k, v]) => !v).map(([k]) => k);
  
  return { passed, checks, failures };
}

function buildExecutionPlan(tasks) {
  // Sort by priority (P0 > P1 > P2 > P3)
  const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3, null: 99 };
  
  const sorted = [...tasks].sort((a, b) => {
    return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
  });
  
  return {
    tasks: sorted,
    totalTasks: sorted.length,
    estimatedDuration: sorted.length * 15, // Rough estimate: 15 min per task
    createdAt: new Date().toISOString()
  };
}

function generateExecutionContext(task) {
  return {
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      taskType: task.taskType
    },
    constraints: {
      requiresApproval: task.requiresApproval,
      requiresReview: task.requiresReview,
      executionMode: task.executionMode
    },
    successCriteria: task.successCriteria,
    artifacts: task.artifacts
  };
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  try {
    switch (command) {
      case 'projects':
        const projects = await loadProjects();
        console.log(`\n=== Active Projects (${projects.length}) ===\n`);
        projects.forEach(p => {
          console.log(`${(p.status || 'N/A').padEnd(12)} | ${(p.priority || 'N/A').padEnd(4)} | ${p.name || 'Untitled'}`);
        });
        break;
        
      case 'tasks':
        const tasks = await loadTasks();
        console.log(`\n=== All Tasks (${tasks.length}) ===\n`);
        tasks.slice(0, 20).forEach(t => {
          const eligible = t.automationEligible ? '✅' : '❌';
          console.log(`${eligible} ${(t.status || 'N/A').padEnd(10)} | ${(t.priority || 'N/A').padEnd(4)} | ${t.title || 'Untitled'}`);
        });
        if (tasks.length > 20) console.log(`... and ${tasks.length - 20} more`);
        break;
        
      case 'eligible':
        const eligible = await loadNightShiftEligibleTasks();
        console.log(`\n=== Night Shift Eligible Tasks (${eligible.length}) ===\n`);
        eligible.forEach(t => {
          console.log(`${(t.priority || 'N/A').padEnd(4)} | ${(t.assignedAgent || 'Unassigned').padEnd(15)} | ${t.title || 'Untitled'}`);
        });
        break;
        
      case 'plan':
        const eligibleTasks = await loadNightShiftEligibleTasks();
        const plan = buildExecutionPlan(eligibleTasks);
        console.log(`\n=== Execution Plan ===\n`);
        console.log(`Total tasks: ${plan.totalTasks}`);
        console.log(`Est. duration: ${plan.estimatedDuration} min`);
        console.log(`\nTask order:`);
        plan.tasks.forEach((t, i) => {
          console.log(`  ${i + 1}. [${t.priority || 'N/A'}] ${t.title || 'Untitled'}`);
        });
        break;
        
      case 'validate':
        const taskId = args[1];
        if (!taskId) {
          console.log('Usage: work_plan_loader.js validate <TASK_TITLE>');
          process.exit(1);
        }
        const allTasks = await loadTasks();
        const task = allTasks.find(t => t.title === taskId || t.id === taskId);
        if (!task) {
          console.log(`Task not found: ${taskId}`);
          process.exit(1);
        }
        const validation = validateNightShiftEligibility(task);
        console.log(`\n=== Night Shift Eligibility: ${task.title} ===\n`);
        console.log(`Result: ${validation.passed ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE'}\n`);
        Object.entries(validation.checks).forEach(([k, v]) => {
          console.log(`  ${v ? '✅' : '❌'} ${k}`);
        });
        break;
        
      case 'context':
        const cTaskId = args[1];
        if (!cTaskId) {
          console.log('Usage: work_plan_loader.js context <TASK_TITLE>');
          process.exit(1);
        }
        const cAllTasks = await loadTasks();
        const cTask = cAllTasks.find(t => t.title === cTaskId || t.id === cTaskId);
        if (!cTask) {
          console.log(`Task not found: ${cTaskId}`);
          process.exit(1);
        }
        const context = generateExecutionContext(cTask);
        console.log(JSON.stringify(context, null, 2));
        break;
        
      default:
        console.log(`
Work Plan Loader for VoltAgent Night Shift

Usage:
  work_plan_loader.js projects         — List all active projects
  work_plan_loader.js tasks            — List all tasks
  work_plan_loader.js eligible         — List Night Shift eligible tasks
  work_plan_loader.js plan             — Generate execution plan
  work_plan_loader.js validate <ID>    — Check task eligibility
  work_plan_loader.js context <ID>     — Generate execution context

Examples:
  work_plan_loader.js eligible
  work_plan_loader.js plan
  work_plan_loader.js validate "Task Title"
`);
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

if (require.main === module) main();

// Export for use as module
module.exports = {
  loadProjects,
  loadTasks,
  loadNightShiftEligibleTasks,
  validateNightShiftEligibility,
  buildExecutionPlan,
  generateExecutionContext
};
