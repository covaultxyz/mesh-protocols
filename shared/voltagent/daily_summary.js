#!/usr/bin/env node
/**
 * Daily Summary Generator
 * Creates a summary of the day's work.
 */

const fs = require('fs');
const https = require('https');

const NOTION_KEY = fs.readFileSync(
  (process.env.HOME || '/root') + '/.config/notion/api_key', 'utf8'
).trim();

const TASK_LOG_DB = '2fa35e81-2bbb-8180-8f74-cbd9acd08b52';

async function notionQuery(dbId, filter = null) {
  return new Promise((resolve, reject) => {
    const body = filter ? { filter, page_size: 100 } : { page_size: 100 };
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

async function generateDailySummary() {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await notionQuery(TASK_LOG_DB, {
    property: 'Completed At',
    date: { equals: today }
  });
  
  const tasks = result.results || [];
  
  const completed = tasks.filter(t => (t.properties['Points Earned']?.number || 0) > 0);
  const penalties = tasks.filter(t => (t.properties['Points Earned']?.number || 0) < 0);
  const totalPoints = tasks.reduce((sum, t) => sum + (t.properties['Points Earned']?.number || 0), 0);
  
  console.log(`\n📅 DAILY SUMMARY — ${today}\n`);
  console.log(`Tasks Completed: ${completed.length}`);
  console.log(`Penalties: ${penalties.length}`);
  console.log(`Net Points: ${totalPoints}`);
  console.log(`\n🏆 Top Tasks:`);
  
  completed
    .sort((a, b) => (b.properties['Points Earned']?.number || 0) - (a.properties['Points Earned']?.number || 0))
    .slice(0, 5)
    .forEach(t => {
      const pts = t.properties['Points Earned']?.number || 0;
      const name = t.properties.Task?.title?.[0]?.text?.content || 'Unknown';
      console.log(`  +${pts}: ${name.slice(0, 50)}`);
    });
  
  if (penalties.length > 0) {
    console.log(`\n⚠️ Penalties:`);
    penalties.forEach(t => {
      const pts = t.properties['Points Earned']?.number || 0;
      const name = t.properties.Task?.title?.[0]?.text?.content || 'Unknown';
      console.log(`  ${pts}: ${name.slice(0, 50)}`);
    });
  }
}

generateDailySummary().catch(console.error);
