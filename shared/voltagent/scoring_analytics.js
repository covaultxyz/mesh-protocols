#!/usr/bin/env node
/**
 * Scoring Analytics
 * Generate insights from agent scoring data.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const https = require('https');

const NOTION_KEY = fs.readFileSync(
  (process.env.HOME || '/root') + '/.config/notion/api_key', 'utf8'
).trim();

const TASK_LOG_DB = '2fa35e81-2bbb-8180-8f74-cbd9acd08b52';

async function notionQuery(dbId, filter = null, sorts = []) {
  return new Promise((resolve, reject) => {
    const body = { page_size: 100 };
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

async function getAnalytics(agentName = null) {
  const filter = agentName ? {
    property: 'Agent',
    select: { equals: agentName }
  } : null;
  
  const result = await notionQuery(TASK_LOG_DB, filter, [
    { property: 'Completed At', direction: 'descending' }
  ]);
  
  if (!result.results) {
    throw new Error('No results from Notion: ' + JSON.stringify(result));
  }
  
  const tasks = result.results.map(r => ({
    task: r.properties.Task?.title?.[0]?.text?.content || '',
    agent: r.properties.Agent?.select?.name || 'Unknown',
    points: r.properties['Points Earned']?.number || 0,
    priority: r.properties['Priority Score']?.number || 0,
    confidence: r.properties.Confidence?.number || 0,
    coherence: r.properties.Coherence?.number || 0,
    completedAt: r.properties['Completed At']?.date?.start || null,
    isPenalty: (r.properties['Points Earned']?.number || 0) < 0
  }));
  
  // Calculate analytics
  const totalTasks = tasks.length;
  const penalties = tasks.filter(t => t.isPenalty);
  const completions = tasks.filter(t => !t.isPenalty);
  
  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
  const totalPenalties = penalties.reduce((sum, t) => sum + Math.abs(t.points), 0);
  const grossPoints = completions.reduce((sum, t) => sum + t.points, 0);
  
  const avgConfidence = completions.length > 0
    ? completions.reduce((sum, t) => sum + (t.confidence || 0), 0) / completions.length
    : 0;
  const avgCoherence = completions.length > 0
    ? completions.reduce((sum, t) => sum + (t.coherence || 0), 0) / completions.length
    : 0;
  const avgPoints = completions.length > 0
    ? grossPoints / completions.length
    : 0;
  
  // By agent breakdown
  const byAgent = {};
  for (const t of tasks) {
    if (!byAgent[t.agent]) {
      byAgent[t.agent] = { tasks: 0, points: 0, penalties: 0 };
    }
    byAgent[t.agent].tasks++;
    byAgent[t.agent].points += t.points;
    if (t.isPenalty) byAgent[t.agent].penalties++;
  }
  
  return {
    summary: {
      totalTasks,
      completions: completions.length,
      penalties: penalties.length,
      penaltyRate: totalTasks > 0 ? (penalties.length / totalTasks * 100).toFixed(1) + '%' : '0%',
      grossPoints,
      totalPenalties,
      netPoints: totalPoints
    },
    quality: {
      avgConfidence: avgConfidence.toFixed(1),
      avgCoherence: avgCoherence.toFixed(1),
      avgPoints: avgPoints.toFixed(1)
    },
    byAgent,
    topTasks: completions.slice(0, 5).map(t => ({
      task: t.task,
      points: t.points
    })),
    recentPenalties: penalties.slice(0, 5).map(t => ({
      task: t.task,
      points: t.points
    }))
  };
}

// CLI
async function main() {
  const agent = process.argv[2];
  
  console.log('=== Scoring Analytics ===\n');
  
  try {
    const analytics = await getAnalytics(agent);
    
    console.log('📊 Summary');
    console.log(`  Tasks: ${analytics.summary.totalTasks} (${analytics.summary.completions} complete, ${analytics.summary.penalties} penalties)`);
    console.log(`  Penalty Rate: ${analytics.summary.penaltyRate}`);
    console.log(`  Gross Points: +${analytics.summary.grossPoints}`);
    console.log(`  Penalties: -${analytics.summary.totalPenalties}`);
    console.log(`  Net Points: ${analytics.summary.netPoints}`);
    
    console.log('\n📈 Quality Metrics');
    console.log(`  Avg Confidence: ${analytics.quality.avgConfidence}/100`);
    console.log(`  Avg Coherence: ${analytics.quality.avgCoherence}/100`);
    console.log(`  Avg Points/Task: ${analytics.quality.avgPoints}`);
    
    console.log('\n👥 By Agent');
    for (const [name, data] of Object.entries(analytics.byAgent)) {
      console.log(`  ${name}: ${data.points} pts (${data.tasks} tasks, ${data.penalties} penalties)`);
    }
    
    console.log('\n🏆 Top Tasks');
    analytics.topTasks.forEach(t => {
      console.log(`  +${t.points}: ${t.task.substring(0, 50)}${t.task.length > 50 ? '...' : ''}`);
    });
    
    if (analytics.recentPenalties.length > 0) {
      console.log('\n⚠️ Recent Penalties');
      analytics.recentPenalties.forEach(t => {
        console.log(`  ${t.points}: ${t.task.substring(0, 50)}${t.task.length > 50 ? '...' : ''}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
