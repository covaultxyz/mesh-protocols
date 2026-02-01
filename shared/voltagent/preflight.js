#!/usr/bin/env node
/**
 * Pre-flight check - Query task sources before starting work
 * Prevents duplicate work across agents
 * 
 * Checks:
 * 1. Covault Tasks DB (canonical source)
 * 2. Mesh Task Queue
 * 3. Agent Task Log
 */

const fs = require('fs');
const https = require('https');

const NOTION_KEY = fs.readFileSync('/root/.config/notion/api_key', 'utf8').trim();

// Databases
const COVAULT_TASKS_DB = '2f835e81-2bbb-81b6-9700-e18108a40b1f';  // Canonical source
const MESH_TASK_QUEUE = '2fa0a11d-c7e5-8123-9946-c6baab70f2d3';
const AGENT_TASK_LOG = '2fa35e81-2bbb-8180-8f74-cbd9acd08b52';

function queryNotion(path, body = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2022-06-28',
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
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function checkCovaultTasks(searchTerm) {
  console.log('📋 Checking Covault Tasks DB...');
  
  try {
    const result = await queryNotion(`/v1/databases/${COVAULT_TASKS_DB}/query`, {
      page_size: 20
    });
    
    if (result.results) {
      const matches = result.results.filter(r => {
        const name = r.properties.Name?.title?.[0]?.plain_text || '';
        const desc = r.properties.Description?.rich_text?.[0]?.plain_text || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               desc.toLowerCase().includes(searchTerm.toLowerCase());
      });
      
      if (matches.length > 0) {
        console.log(`   ⚠️  Found ${matches.length} matching tasks:`);
        matches.forEach(r => {
          const name = r.properties.Name?.title?.[0]?.plain_text || 'Untitled';
          const status = r.properties.status?.select?.name || 'Unknown';
          const assignee = r.properties.assignedAgent?.select?.name || 
                          r.properties.claimed_by?.rich_text?.[0]?.plain_text || 'Unassigned';
          console.log(`      - [${status}] ${name} (${assignee})`);
        });
        return matches;
      }
    }
    console.log('   ✅ No matching tasks in Covault DB');
    return [];
  } catch (e) {
    console.log('   ⚠️  Could not query Covault Tasks:', e.message);
    return [];
  }
}

async function checkMeshQueue(searchTerm) {
  console.log('📬 Checking Mesh Task Queue...');
  
  try {
    const result = await queryNotion(`/v1/databases/${MESH_TASK_QUEUE}/query`, {
      filter: {
        property: 'Task',
        title: { contains: searchTerm }
      }
    });
    
    if (result.results && result.results.length > 0) {
      console.log(`   ⚠️  Found ${result.results.length} in queue`);
      return result.results;
    }
    console.log('   ✅ Not in mesh queue');
    return [];
  } catch (e) {
    console.log('   ⚠️  Could not query mesh queue:', e.message);
    return [];
  }
}

async function checkTaskLog(searchTerm) {
  console.log('📝 Checking Agent Task Log...');
  
  try {
    const result = await queryNotion(`/v1/databases/${AGENT_TASK_LOG}/query`, {
      filter: {
        property: 'Task',
        title: { contains: searchTerm }
      },
      page_size: 10
    });
    
    if (result.results && result.results.length > 0) {
      console.log(`   📋 Found ${result.results.length} completed tasks with similar name`);
      result.results.slice(0, 3).forEach(r => {
        const name = r.properties.Task?.title?.[0]?.plain_text || 'Untitled';
        const agent = r.properties.Agent?.select?.name || 'Unknown';
        console.log(`      - ${name} (${agent})`);
      });
      return result.results;
    }
    console.log('   ✅ No similar completed tasks');
    return [];
  } catch (e) {
    console.log('   ⚠️  Could not query task log:', e.message);
    return [];
  }
}

async function runPreflight(searchTerm) {
  console.log(`\n🔍 PRE-FLIGHT CHECK: "${searchTerm}"\n`);
  console.log('═'.repeat(50));
  
  const covaultMatches = await checkCovaultTasks(searchTerm);
  const queueMatches = await checkMeshQueue(searchTerm);
  const logMatches = await checkTaskLog(searchTerm);
  
  console.log('═'.repeat(50));
  console.log('');
  
  // Determine result
  if (covaultMatches.length > 0) {
    console.log('⚠️  RESULT: Task exists in Covault Tasks DB');
    console.log('   → Check if already assigned before claiming');
    return 'warning';
  } else if (queueMatches.length > 0) {
    console.log('⚠️  RESULT: Task in Mesh Queue');
    console.log('   → Another agent may be working on this');
    return 'warning';
  } else if (logMatches.length > 0) {
    console.log('📋 RESULT: Similar tasks previously completed');
    console.log('   → Review if this is duplicate work');
    return 'review';
  } else {
    console.log('✅ RESULT: Clear to proceed');
    console.log('   → No conflicts found');
    return 'clear';
  }
}

// Main
const searchTerm = process.argv[2];
if (!searchTerm) {
  console.log('Usage: preflight.js <search_term>');
  console.log('');
  console.log('Examples:');
  console.log('  preflight.js "portfolio"');
  console.log('  preflight.js "persona rename"');
  console.log('  preflight.js "Alan"');
  process.exit(1);
}

runPreflight(searchTerm).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
