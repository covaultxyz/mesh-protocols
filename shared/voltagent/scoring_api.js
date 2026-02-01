#!/usr/bin/env node
/**
 * Agent Scoring API
 * Lightweight HTTP server for querying agent scores and task logs.
 * 
 * Endpoints:
 * GET /leaderboard - Current standings
 * GET /agent/:name - Agent details
 * GET /tasks - Recent tasks
 * POST /task - Log a task
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Config
const PORT = process.env.SCORING_PORT || 8200;
const NOTION_KEY = fs.readFileSync(expanduser('~/.config/notion/api_key'), 'utf8').trim();

// Replace expanduser for Node
function expanduser(p) {
  return p.replace(/^~/, process.env.HOME || '/root');
}

// Database IDs
const DBS = {
  leaderboard: '2fa35e81-2bbb-8132-ac7f-e3fc447d10be',
  taskLog: '2fa35e81-2bbb-8180-8f74-cbd9acd08b52',
  ledger: '2fa35e81-2bbb-8149-ab1b-d168dd92a906'
};

// Notion API helper
async function notionQuery(dbId, filter = {}, sorts = []) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ filter, sorts, page_size: 100 });
    
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
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Get leaderboard
async function getLeaderboard() {
  const result = await notionQuery(DBS.leaderboard, {}, [
    { property: 'Points', direction: 'descending' }
  ]);
  
  return result.results.map(r => ({
    name: r.properties.Agent?.title?.[0]?.text?.content || 'Unknown',
    points: r.properties.Points?.number || 0,
    tasksCompleted: r.properties['Tasks Completed']?.number || 0,
    lastActive: r.properties['Last Active']?.date?.start || null
  }));
}

// Get agent details
async function getAgent(name) {
  const leaderboard = await getLeaderboard();
  const agent = leaderboard.find(a => a.name.toLowerCase() === name.toLowerCase());
  
  if (!agent) return null;
  
  // Get recent tasks
  const tasks = await notionQuery(DBS.taskLog, {
    property: 'Agent',
    select: { equals: agent.name }
  }, [
    { property: 'Completed At', direction: 'descending' }
  ]);
  
  agent.recentTasks = tasks.results.slice(0, 10).map(t => ({
    task: t.properties.Task?.title?.[0]?.text?.content || 'Unknown',
    points: t.properties['Points Earned']?.number || 0,
    completedAt: t.properties['Completed At']?.date?.start || null
  }));
  
  return agent;
}

// Get recent tasks
async function getRecentTasks(limit = 20) {
  const result = await notionQuery(DBS.taskLog, {}, [
    { property: 'Completed At', direction: 'descending' }
  ]);
  
  return result.results.slice(0, limit).map(t => ({
    task: t.properties.Task?.title?.[0]?.text?.content || 'Unknown',
    agent: t.properties.Agent?.select?.name || 'Unknown',
    points: t.properties['Points Earned']?.number || 0,
    confidence: t.properties.Confidence?.number || 0,
    coherence: t.properties.Coherence?.number || 0,
    completedAt: t.properties['Completed At']?.date?.start || null
  }));
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    if (req.method === 'GET' && url.pathname === '/leaderboard') {
      const data = await getLeaderboard();
      res.end(JSON.stringify({ success: true, data }));
    }
    else if (req.method === 'GET' && url.pathname.startsWith('/agent/')) {
      const name = url.pathname.split('/')[2];
      const data = await getAgent(name);
      if (data) {
        res.end(JSON.stringify({ success: true, data }));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, error: 'Agent not found' }));
      }
    }
    else if (req.method === 'GET' && url.pathname === '/tasks') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const data = await getRecentTasks(limit);
      res.end(JSON.stringify({ success: true, data }));
    }
    else if (req.method === 'GET' && url.pathname === '/health') {
      res.end(JSON.stringify({ success: true, status: 'healthy', timestamp: new Date().toISOString() }));
    }
    else {
      res.statusCode = 404;
      res.end(JSON.stringify({ success: false, error: 'Not found' }));
    }
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Agent Scoring API running on port ${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET /leaderboard - Current standings`);
  console.log(`  GET /agent/:name - Agent details`);
  console.log(`  GET /tasks - Recent tasks`);
  console.log(`  GET /health - Health check`);
});
