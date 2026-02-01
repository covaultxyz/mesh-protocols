#!/usr/bin/env node
/**
 * Weekly Leaderboard Rollup
 * 
 * Aggregates task log data and updates agent leaderboards.
 * Run weekly via cron or on-demand.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const https = require('https');
const fs = require('fs');

const NOTION_KEY = fs.readFileSync(`${process.env.HOME}/.config/notion/api_key`, 'utf8').trim();
const TASK_LOG_DB = '2fa35e81-2bbb-8180-8f74-cbd9acd08b52';
const LEADERBOARD_DB = '2fa35e81-2bbb-8132-ac7f-e3fc447d10be';

function notionRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: `/v1${path}`,
      method,
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
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function queryAllTasks(filter = {}) {
  const results = [];
  let hasMore = true;
  let cursor = undefined;

  while (hasMore) {
    const body = { ...filter };
    if (cursor) body.start_cursor = cursor;

    const response = await notionRequest('POST', `/databases/${TASK_LOG_DB}/query`, body);
    results.push(...(response.results || []));
    hasMore = response.has_more;
    cursor = response.next_cursor;
  }

  return results;
}

async function getLeaderboardEntries() {
  const response = await notionRequest('POST', `/databases/${LEADERBOARD_DB}/query`, {});
  return response.results || [];
}

async function updateLeaderboardEntry(pageId, properties) {
  return notionRequest('PATCH', `/pages/${pageId}`, { properties });
}

function parseTask(page) {
  const props = page.properties;
  return {
    id: page.id,
    task: props.Task?.title?.[0]?.text?.content || '',
    agent: props.Agent?.select?.name || 'Unknown',
    points: props['Points Earned']?.number || 0,
    confidence: props.Confidence?.number || 0,
    coherence: props.Coherence?.number || 0,
    status: props.Status?.select?.name || '',
    completedAt: props['Completed At']?.date?.start || null
  };
}

async function calculateAggregates(tasks) {
  const byAgent = {};

  for (const task of tasks) {
    const agent = task.agent;
    if (!byAgent[agent]) {
      byAgent[agent] = {
        totalPoints: 0,
        tasksCompleted: 0,
        confidenceSum: 0,
        coherenceSum: 0,
        reworkCount: 0,
        penaltyCount: 0
      };
    }

    const a = byAgent[agent];
    a.totalPoints += task.points;
    
    if (task.status === 'Completed') {
      a.tasksCompleted++;
      a.confidenceSum += task.confidence;
      a.coherenceSum += task.coherence;
    }
    
    if (task.status === 'Rework') {
      a.reworkCount++;
    }
    
    if (task.task.includes('PENALTY')) {
      a.penaltyCount++;
    }
  }

  // Calculate averages
  for (const agent of Object.keys(byAgent)) {
    const a = byAgent[agent];
    const count = a.tasksCompleted || 1;
    a.avgConfidence = Math.round(a.confidenceSum / count);
    a.avgCoherence = Math.round(a.coherenceSum / count);
  }

  return byAgent;
}

async function run() {
  console.log('\n=== Weekly Leaderboard Rollup ===');
  console.log(`Time: ${new Date().toISOString()}\n`);

  // Get all tasks
  const taskPages = await queryAllTasks();
  const tasks = taskPages.map(parseTask);
  console.log(`Found ${tasks.length} task entries`);

  // Calculate aggregates
  const aggregates = await calculateAggregates(tasks);
  console.log('\nAggregates by agent:');
  console.log(JSON.stringify(aggregates, null, 2));

  // Get leaderboard entries
  const leaderboard = await getLeaderboardEntries();
  const agentPages = {};
  for (const entry of leaderboard) {
    const name = entry.properties.Agent?.title?.[0]?.text?.content;
    if (name) agentPages[name] = entry.id;
  }

  // Update leaderboard
  console.log('\nUpdating leaderboard...');
  for (const [agent, stats] of Object.entries(aggregates)) {
    const pageId = agentPages[agent];
    if (!pageId) {
      console.log(`  ${agent}: No leaderboard entry found, skipping`);
      continue;
    }

    await updateLeaderboardEntry(pageId, {
      'Total Points': { number: stats.totalPoints },
      'Tasks Completed': { number: stats.tasksCompleted },
      'Avg Confidence': { number: stats.avgConfidence },
      'Avg Coherence': { number: stats.avgCoherence },
      'Rework Count': { number: stats.reworkCount },
      'Last Updated': { date: { start: new Date().toISOString() } }
    });
    console.log(`  ${agent}: Updated (${stats.totalPoints} pts, ${stats.tasksCompleted} tasks)`);
  }

  // Generate summary
  const summary = {
    timestamp: new Date().toISOString(),
    totalTasks: tasks.length,
    agents: aggregates,
    leaderboard: Object.entries(aggregates)
      .map(([name, stats]) => ({ name, points: stats.totalPoints }))
      .sort((a, b) => b.points - a.points)
  };

  console.log('\n=== Leaderboard ===');
  summary.leaderboard.forEach((agent, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
    console.log(`${medal} ${agent.name}: ${agent.points} pts`);
  });

  return summary;
}

// CLI
if (require.main === module) {
  run()
    .then(summary => {
      console.log('\n✅ Rollup complete');
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

module.exports = { run };
