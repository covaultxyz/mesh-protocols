#!/usr/bin/env node
/**
 * Session Report Generator
 * Creates a summary report of agent activity.
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
const LEADERBOARD_DB = '2fa35e81-2bbb-8132-ac7f-e3fc447d10be';

async function notionQuery(dbId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ page_size: 100 });
    
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

async function generateReport() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toISOString().split('T')[1].slice(0, 5);
  
  // Get tasks
  const taskResult = await notionQuery(TASK_LOG_DB);
  const tasks = taskResult.results || [];
  
  // Get leaderboard
  const lbResult = await notionQuery(LEADERBOARD_DB);
  const agents = (lbResult.results || []).map(r => ({
    name: r.properties.Agent?.title?.[0]?.text?.content || 'Unknown',
    points: r.properties.Points?.number || 0,
    tasks: r.properties['Tasks Completed']?.number || 0
  })).sort((a, b) => b.points - a.points);
  
  // Calculate stats
  const completedTasks = tasks.filter(t => 
    (t.properties['Points Earned']?.number || 0) > 0
  ).length;
  const penalties = tasks.filter(t => 
    (t.properties['Points Earned']?.number || 0) < 0
  ).length;
  const totalPoints = tasks.reduce((sum, t) => 
    sum + (t.properties['Points Earned']?.number || 0), 0
  );
  
  // Generate report
  let report = `
╔══════════════════════════════════════════════════════════════╗
║             MESH SESSION REPORT — ${dateStr} ${timeStr} UTC          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  LEADERBOARD                                                 ║
`;
  
  agents.slice(0, 3).forEach((a, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
    const line = `║    ${medal} ${a.name.padEnd(15)} ${String(a.points).padStart(6)} pts   ${String(a.tasks || '-').padStart(3)} tasks  ║`;
    report += line + '\n';
  });
  
  report += `║                                                              ║
║  SESSION STATS                                               ║
║    Total Tasks:     ${String(tasks.length).padStart(4)}                                    ║
║    Completed:       ${String(completedTasks).padStart(4)}                                    ║
║    Penalties:       ${String(penalties).padStart(4)}                                    ║
║    Net Points:   ${String(totalPoints).padStart(6)}                                    ║
║    Penalty Rate:   ${String((penalties / tasks.length * 100).toFixed(1)).padStart(5)}%                                  ║
║                                                              ║
║  TOP 5 TASKS                                                 ║
`;
  
  const topTasks = tasks
    .filter(t => (t.properties['Points Earned']?.number || 0) > 0)
    .sort((a, b) => (b.properties['Points Earned']?.number || 0) - (a.properties['Points Earned']?.number || 0))
    .slice(0, 5);
  
  topTasks.forEach(t => {
    const pts = t.properties['Points Earned']?.number || 0;
    const title = (t.properties.Task?.title?.[0]?.text?.content || 'Unknown').slice(0, 40);
    report += `║    +${String(pts).padStart(2)} ${title.padEnd(42)}║\n`;
  });
  
  report += `║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;
  
  return report;
}

generateReport()
  .then(report => console.log(report))
  .catch(err => console.error('Error:', err.message));
