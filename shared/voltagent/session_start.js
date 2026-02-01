#!/usr/bin/env node
/**
 * SESSION START - Mandatory Work Plan Check
 * 
 * MUST run at the start of every session.
 * Pulls active work plans and shows assigned items.
 * Cannot be bypassed.
 */

const fs = require('fs');
const https = require('https');

const NOTION_KEY = fs.readFileSync('/root/.config/notion/api_key', 'utf8').trim();
const AGENT = 'Sandman';

// Work plan page IDs (from Notion)
const WORK_PLANS = [
  { id: '2f935e81-2bbb-81ca-be26-ca0196dcb71a', name: 'VoltAgent Night Shift Execution' },
  { id: '2f935e81-2bbb-8137-aeba-e59cdc43f51d', name: 'Funnel Build Workflow' },
  { id: '2f935e81-2bbb-81c8-9793-d55978dbc9ba', name: 'Coherence Screening - Data Rooms' },
  { id: '2f935e81-2bbb-8176-8ad7-deb247cabd9a', name: 'Rate Limit Monitoring & Overflow' },
  { id: '2f935e81-2bbb-8177-864a-e891f79fa03c', name: 'BD Surface Development' }
];

function queryNotion(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2022-06-28'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getWorkPlanTasks(pageId) {
  try {
    const result = await queryNotion(`/v1/blocks/${pageId}/children?page_size=100`);
    const tasks = [];
    
    if (result.results) {
      for (const block of result.results) {
        if (block.type === 'to_do') {
          const text = block.to_do.rich_text?.[0]?.plain_text || '';
          const checked = block.to_do.checked;
          if (!checked && text) {
            tasks.push({ text, checked });
          }
        }
      }
    }
    return tasks;
  } catch (e) {
    return [];
  }
}

async function sessionStart() {
  console.log('\n' + '═'.repeat(60));
  console.log('  🚀 SESSION START - MANDATORY WORK PLAN CHECK');
  console.log('═'.repeat(60));
  console.log(`\nAgent: ${AGENT}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('\n' + '─'.repeat(60));
  
  let totalTasks = 0;
  
  for (const plan of WORK_PLANS) {
    const tasks = await getWorkPlanTasks(plan.id);
    if (tasks.length > 0) {
      console.log(`\n📋 ${plan.name}`);
      console.log(`   ${tasks.length} unchecked items:`);
      tasks.slice(0, 5).forEach(t => {
        console.log(`   ☐ ${t.text.substring(0, 60)}${t.text.length > 60 ? '...' : ''}`);
      });
      if (tasks.length > 5) {
        console.log(`   ... and ${tasks.length - 5} more`);
      }
      totalTasks += tasks.length;
    }
  }
  
  console.log('\n' + '─'.repeat(60));
  console.log(`\n📊 TOTAL PENDING: ${totalTasks} items across ${WORK_PLANS.length} work plans`);
  
  if (totalTasks > 0) {
    console.log('\n⚠️  YOU HAVE WORK PLAN ITEMS PENDING');
    console.log('   Execute these BEFORE self-generating tasks!');
    console.log('\n   To mark progress, update Notion checkboxes or log to Mesh Work Log.');
  } else {
    console.log('\n✅ All work plan items complete. Free to work on other tasks.');
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('  SESSION START COMPLETE - Work plans acknowledged');
  console.log('═'.repeat(60) + '\n');
  
  // Log that session start was run
  fs.appendFileSync('/root/clawd/voltagent/session_log.txt', 
    `${new Date().toISOString()} - Session started, ${totalTasks} pending items\n`);
  
  return totalTasks;
}

sessionStart().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
