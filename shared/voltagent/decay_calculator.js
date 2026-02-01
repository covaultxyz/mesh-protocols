#!/usr/bin/env node
/**
 * Agent Idle Decay Calculator
 * Calculates and applies point decay based on idle time
 * Run hourly via cron or heartbeat
 */

const https = require('https');
const fs = require('fs');

const NOTION_KEY = fs.readFileSync(`${process.env.HOME}/.config/notion/api_key`, 'utf8').trim();
const LEADERBOARD_DB = '2fa35e81-2bbb-8132-ac7f-e3fc447d10be';

// Decay schedule: [maxHours, decayPerHour]
const DECAY_SCHEDULE = [
  [2, 0],    // 0-2 hours: no decay
  [6, 1],    // 2-6 hours: -1/hr
  [12, 2],   // 6-12 hours: -2/hr
  [24, 5],   // 12-24 hours: -5/hr
  [Infinity, 10] // 24+ hours: -10/hr
];

function calculateDecay(hoursIdle) {
  let totalDecay = 0;
  let remainingHours = hoursIdle;
  let prevThreshold = 0;

  for (const [threshold, rate] of DECAY_SCHEDULE) {
    if (remainingHours <= 0) break;
    
    const hoursInBracket = Math.min(remainingHours, threshold - prevThreshold);
    totalDecay += hoursInBracket * rate;
    remainingHours -= hoursInBracket;
    prevThreshold = threshold;
  }

  return Math.floor(totalDecay);
}

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
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getAgents() {
  const result = await notionRequest('POST', `/databases/${LEADERBOARD_DB}/query`, {});
  return result.results || [];
}

async function updateAgent(pageId, newPoints, status) {
  const properties = {
    'Total Points': { number: newPoints }  // No floor - negative scores allowed for debugging
  };
  
  if (status) {
    properties['Status'] = { select: { name: status } };
  }

  return notionRequest('PATCH', `/pages/${pageId}`, { properties });
}

async function run() {
  const now = new Date();
  console.log(`\n=== Decay Calculator @ ${now.toISOString()} ===\n`);

  const agents = await getAgents();
  const results = [];

  for (const agent of agents) {
    const name = agent.properties.Agent?.title?.[0]?.text?.content || 'Unknown';
    const points = agent.properties['Total Points']?.number || 0;
    const lastUpdated = agent.properties['Last Updated']?.date?.start;

    if (!lastUpdated) {
      console.log(`${name}: No last active timestamp, skipping`);
      continue;
    }

    const lastActive = new Date(lastUpdated);
    const hoursIdle = (now - lastActive) / (1000 * 60 * 60);
    const decay = calculateDecay(hoursIdle);
    const newPoints = Math.max(0, points - decay);
    const status = hoursIdle > 24 ? 'Idle' : 'Active';

    console.log(`${name}:`);
    console.log(`  Current: ${points} pts`);
    console.log(`  Idle: ${hoursIdle.toFixed(1)} hours`);
    console.log(`  Decay: -${decay} pts`);
    console.log(`  New: ${newPoints} pts (${status})`);

    if (decay > 0) {
      await updateAgent(agent.id, newPoints, status);
      console.log(`  ✓ Updated in Notion`);
    }

    results.push({ name, points, hoursIdle, decay, newPoints, status });
  }

  console.log('\n=== Summary ===');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

// Run if called directly
if (require.main === module) {
  run().catch(console.error);
}

module.exports = { calculateDecay, run };
