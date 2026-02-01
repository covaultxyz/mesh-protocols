#!/usr/bin/env node
/**
 * Task Picker
 * Suggests the next highest-value task to work on.
 * 
 * Checks:
 * 1. Notion Task DB for pending items
 * 2. mesh-shared execution-state.json
 * 3. Heartbeat state for overdue checks
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const NOTION_KEY = fs.readFileSync(
  (process.env.HOME || '/root') + '/.config/notion/api_key', 'utf8'
).trim();

const TASKS_DB = '2f835e81-2bbb-813b-a6fa-000ba219406c';

async function notionQuery(dbId, filter = null, sorts = []) {
  return new Promise((resolve, reject) => {
    const body = { page_size: 20 };
    if (filter) body.filter = filter;
    if (sorts.length) body.sorts = sorts;
    const data = JSON.stringify(body);
    
    const options = {
      hostname: 'api.notion.com',
      path: `/v1/databases/${dbId}/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getNotionTasks() {
  try {
    const result = await notionQuery(TASKS_DB, {
      property: 'Status',
      select: { does_not_equal: 'Done' }
    });
    
    if (!result.results) return [];
    
    return result.results.map(r => ({
      source: 'notion',
      title: r.properties.Task?.title?.[0]?.text?.content || 'Unknown',
      priority: r.properties.Priority?.select?.name || 'Normal',
      due: r.properties['Due Date']?.date?.start || null
    }));
  } catch {
    return [];
  }
}

function getMeshSharedTasks() {
  try {
    const statePath = '/root/clawd/mesh-shared/execution-state.json';
    if (!fs.existsSync(statePath)) return [];
    
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    return (state.tasks || [])
      .filter(t => t.status !== 'done' && t.owner === 'Cassian')
      .map(t => ({
        source: 'mesh-shared',
        title: t.task,
        priority: t.priority || 'P2',
        owner: t.owner
      }));
  } catch {
    return [];
  }
}

function getQuickWins() {
  // Built-in quick win suggestions
  return [
    { source: 'system', title: 'Update MEMORY.md with session learnings', priority: 'P2' },
    { source: 'system', title: 'Review and commit pending changes', priority: 'P3' },
    { source: 'system', title: 'Check mesh-shared for Oracle updates', priority: 'P2' },
    { source: 'system', title: 'Run analytics and review trends', priority: 'P3' },
    { source: 'system', title: 'Seed more coherence-field archetypes', priority: 'P3' }
  ];
}

function priorityScore(p) {
  const scores = { 'P0': 100, 'P1': 80, 'High': 80, 'P2': 60, 'Normal': 50, 'P3': 30, 'Low': 20 };
  return scores[p] || 40;
}

async function pickTask() {
  console.log('=== Task Picker ===\n');
  
  // Gather tasks from all sources
  const [notionTasks, meshTasks] = await Promise.all([
    getNotionTasks(),
    getMeshSharedTasks()
  ]);
  
  const quickWins = getQuickWins();
  
  // Combine and sort
  const allTasks = [...notionTasks, ...meshTasks, ...quickWins];
  allTasks.sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority));
  
  if (allTasks.length === 0) {
    console.log('No pending tasks found. You might want to:');
    console.log('  1. Check Notion for new requests');
    console.log('  2. Review mesh-shared for coordination');
    console.log('  3. Build something new');
    return;
  }
  
  console.log('📋 Top 5 Suggested Tasks:\n');
  allTasks.slice(0, 5).forEach((t, i) => {
    const emoji = i === 0 ? '🎯' : '  ';
    console.log(`${emoji} [${t.priority}] ${t.title}`);
    console.log(`     Source: ${t.source}${t.due ? ` | Due: ${t.due}` : ''}`);
    console.log('');
  });
  
  console.log('---');
  console.log(`Recommendation: Start with "${allTasks[0].title}"`);
}

pickTask();
