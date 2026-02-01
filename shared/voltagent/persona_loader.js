#!/usr/bin/env node
/**
 * Persona Loader for VoltAgent Night Shift
 * 
 * Loads persona definitions from Virtual Teams DB and prepares
 * execution context for Night Shift tasks.
 * 
 * Task 2.1 of VoltAgent Night Shift Work Plan
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Config
const VIRTUAL_TEAMS_DB = '2f735e81-2bbb-81eb-903a-d3c9edd8331a';
const NOTION_VERSION = '2022-06-28';
const CACHE_FILE = path.join(__dirname, 'persona_cache.json');
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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
    default:
      return null;
  }
}

function parsePersona(page) {
  const props = page.properties;
  
  return {
    id: page.id,
    codename: extractProperty(props, 'codename', 'rich_text'),
    displayName: extractProperty(props, 'displayName', 'title'),
    entityType: extractProperty(props, 'entityType', 'rich_text'),
    hardeningLevel: extractProperty(props, 'hardeningLevel', 'select'),
    lifecycleState: extractProperty(props, 'lifecycleState', 'select'),
    maturityStage: extractProperty(props, 'maturityStage', 'rich_text'),
    primaryJob: extractProperty(props, 'primaryJob', 'rich_text'),
    decisionRule: extractProperty(props, 'decisionRule', 'rich_text'),
    allowedActions: extractProperty(props, 'allowedActions', 'multi_select'),
    escalationTriggers: extractProperty(props, 'escalationTriggers', 'rich_text'),
    defaultOutputs: extractProperty(props, 'defaultOutputs', 'rich_text'),
    formatPreference: extractProperty(props, 'formatPreference', 'rich_text'),
    domain: extractProperty(props, 'domain', 'multi_select'),
    team: extractProperty(props, 'team', 'select'),
    complianceLevel: extractProperty(props, 'complianceLevel', 'number')
  };
}

async function loadPersona(codename) {
  console.log(`Loading persona: ${codename}`);
  
  const response = await notionRequest('POST', `/v1/databases/${VIRTUAL_TEAMS_DB}/query`, {
    filter: {
      property: 'codename',
      rich_text: { equals: codename }
    }
  });
  
  if (!response.results || response.results.length === 0) {
    throw new Error(`Persona not found: ${codename}`);
  }
  
  return parsePersona(response.results[0]);
}

async function loadNightShiftRoster() {
  console.log('Loading Night Shift eligible personas...');
  
  // First load all, then filter in-memory (Notion rich_text filters are limited)
  const all = await loadAllPersonas();
  
  return all.filter(p => 
    p.entityType === 'PERSONA' &&
    p.lifecycleState === 'ACTIVE' &&
    ['Beta', 'Stable'].includes(p.hardeningLevel)
  );
}

async function loadAllPersonas() {
  console.log('Loading all personas...');
  
  // Load all entries (entityType filtering done in-memory)
  const response = await notionRequest('POST', `/v1/databases/${VIRTUAL_TEAMS_DB}/query`, {
    page_size: 100
  });
  
  const all = (response.results || []).map(parsePersona);
  
  // Filter to only PERSONA type
  return all.filter(p => p.entityType === 'PERSONA');
}

function validateNightShiftEligibility(persona) {
  const checks = {
    isPersona: persona.entityType === 'PERSONA',
    isActive: persona.lifecycleState === 'ACTIVE',
    isHardened: ['Beta', 'Stable'].includes(persona.hardeningLevel),
    hasCodename: !!persona.codename,
    hasPrimaryJob: !!persona.primaryJob
  };
  
  const passed = Object.values(checks).every(v => v);
  const failures = Object.entries(checks).filter(([k, v]) => !v).map(([k]) => k);
  
  return { passed, checks, failures };
}

function buildExecutionContext(persona, task = null) {
  const context = {
    identity: {
      codename: persona.codename,
      name: persona.displayName || persona.codename,
      role: persona.primaryJob,
      team: persona.team
    },
    constraints: {
      allowedActions: persona.allowedActions || [],
      escalationTriggers: persona.escalationTriggers,
      hardeningLevel: persona.hardeningLevel
    },
    outputs: {
      defaultOutputs: persona.defaultOutputs,
      formatPreference: persona.formatPreference
    },
    decisionFramework: {
      decisionRule: persona.decisionRule,
      domain: persona.domain || []
    }
  };
  
  if (task) {
    context.task = {
      id: task.id,
      title: task.title,
      description: task.description,
      successCriteria: task.successCriteria,
      constraints: task.constraints
    };
  }
  
  return context;
}

function generateSystemPrompt(context) {
  const { identity, constraints, decisionFramework } = context;
  
  let prompt = `You are ${identity.name} (${identity.codename}).\n\n`;
  prompt += `## Role\n${identity.role}\n\n`;
  
  if (decisionFramework.decisionRule) {
    prompt += `## Decision Framework\n${decisionFramework.decisionRule}\n\n`;
  }
  
  if (constraints.allowedActions?.length > 0) {
    prompt += `## Allowed Actions\nYou may only perform these actions:\n`;
    constraints.allowedActions.forEach(a => prompt += `- ${a}\n`);
    prompt += '\n';
  }
  
  if (constraints.escalationTriggers) {
    prompt += `## Escalation\nEscalate when: ${constraints.escalationTriggers}\n\n`;
  }
  
  if (context.task) {
    prompt += `## Current Task\n`;
    prompt += `**Title:** ${context.task.title}\n`;
    if (context.task.description) prompt += `**Description:** ${context.task.description}\n`;
    if (context.task.successCriteria) prompt += `**Success Criteria:** ${context.task.successCriteria}\n`;
    prompt += '\n';
  }
  
  return prompt;
}

// Cache management
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      if (Date.now() - cache.timestamp < CACHE_TTL_MS) {
        return cache;
      }
    }
  } catch (e) {}
  return null;
}

function saveCache(personas) {
  const cache = {
    timestamp: Date.now(),
    personas
  };
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  try {
    switch (command) {
      case 'load':
        const codename = args[1];
        if (!codename) {
          console.log('Usage: persona_loader.js load <CODENAME>');
          process.exit(1);
        }
        const persona = await loadPersona(codename);
        console.log(JSON.stringify(persona, null, 2));
        break;
        
      case 'roster':
        const roster = await loadNightShiftRoster();
        console.log(`\n=== Night Shift Roster (${roster.length} eligible) ===\n`);
        roster.forEach(p => {
          console.log(`${p.codename.padEnd(25)} | ${p.hardeningLevel.padEnd(8)} | ${p.primaryJob?.slice(0, 40) || 'N/A'}`);
        });
        break;
        
      case 'all':
        const all = await loadAllPersonas();
        console.log(`\n=== All Personas (${all.length}) ===\n`);
        all.forEach(p => {
          const eligible = validateNightShiftEligibility(p).passed ? '✅' : '❌';
          console.log(`${eligible} ${p.codename?.padEnd(25) || 'NO_CODENAME'} | ${(p.hardeningLevel || 'N/A').padEnd(8)} | ${p.lifecycleState || 'N/A'}`);
        });
        break;
        
      case 'validate':
        const vCodename = args[1];
        if (!vCodename) {
          console.log('Usage: persona_loader.js validate <CODENAME>');
          process.exit(1);
        }
        const vPersona = await loadPersona(vCodename);
        const validation = validateNightShiftEligibility(vPersona);
        console.log(`\n=== Night Shift Eligibility: ${vCodename} ===\n`);
        console.log(`Result: ${validation.passed ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE'}\n`);
        Object.entries(validation.checks).forEach(([k, v]) => {
          console.log(`  ${v ? '✅' : '❌'} ${k}`);
        });
        break;
        
      case 'context':
        const cCodename = args[1];
        if (!cCodename) {
          console.log('Usage: persona_loader.js context <CODENAME>');
          process.exit(1);
        }
        const cPersona = await loadPersona(cCodename);
        const context = buildExecutionContext(cPersona);
        console.log(JSON.stringify(context, null, 2));
        break;
        
      case 'prompt':
        const pCodename = args[1];
        if (!pCodename) {
          console.log('Usage: persona_loader.js prompt <CODENAME>');
          process.exit(1);
        }
        const pPersona = await loadPersona(pCodename);
        const pContext = buildExecutionContext(pPersona);
        const prompt = generateSystemPrompt(pContext);
        console.log(prompt);
        break;
        
      default:
        console.log(`
Persona Loader for VoltAgent Night Shift

Usage:
  persona_loader.js load <CODENAME>     — Load a specific persona
  persona_loader.js roster              — List Night Shift eligible personas
  persona_loader.js all                 — List all personas with eligibility
  persona_loader.js validate <CODENAME> — Check Night Shift eligibility
  persona_loader.js context <CODENAME>  — Generate execution context
  persona_loader.js prompt <CODENAME>   — Generate system prompt

Examples:
  persona_loader.js load CASSIAN_SANDMAN
  persona_loader.js roster
  persona_loader.js validate AVERY_VALE
`);
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();

// Export for use as module
module.exports = {
  loadPersona,
  loadNightShiftRoster,
  loadAllPersonas,
  validateNightShiftEligibility,
  buildExecutionContext,
  generateSystemPrompt
};
