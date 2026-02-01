#!/usr/bin/env node
/**
 * BD Surface Connector for VoltAgent
 * 
 * Connects BD Pipeline, BD Campaigns, and Research Requests DBs
 * into a unified data model for the BD Surface.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const https = require('https');

// Database IDs from TOOLS.md
const DATABASES = {
  BD_PIPELINE: '2f835e81-2bbb-81ea-b837-d35be2758878',
  BD_CAMPAIGNS: '2f835e81-2bbb-8102-8742-d8229946978f',
  RESEARCH_REQUESTS: '2f835e81-2bbb-81d3-ac1a-f219cbc2b4cc'
};

const NOTION_VERSION = '2022-06-28';
const CACHE_DIR = '/root/clawd/memory/bd-surface-cache';

function getNotionToken() {
  try {
    return fs.readFileSync('/root/.config/notion/api_key', 'utf8').trim();
  } catch (e) {
    throw new Error('Cannot read Notion token');
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
          reject(new Error(`Failed to parse: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function extractProp(props, name, type) {
  const prop = props[name];
  if (!prop) return null;
  
  switch (type) {
    case 'title': return prop.title?.[0]?.plain_text || null;
    case 'rich_text': return prop.rich_text?.[0]?.plain_text || null;
    case 'select': return prop.select?.name || null;
    case 'multi_select': return prop.multi_select?.map(s => s.name) || [];
    case 'number': return prop.number;
    case 'date': return prop.date?.start || null;
    case 'checkbox': return prop.checkbox || false;
    case 'email': return prop.email || null;
    case 'url': return prop.url || null;
    case 'relation': return prop.relation?.map(r => r.id) || [];
    case 'people': return prop.people?.map(p => p.name || p.id) || [];
    default: return null;
  }
}

// ============ BD Pipeline ============

async function queryBDPipeline(filter = null) {
  const body = { page_size: 100 };
  if (filter) body.filter = filter;
  
  const response = await notionRequest('POST', `/v1/databases/${DATABASES.BD_PIPELINE}/query`, body);
  return response.results || [];
}

function parsePipelineEntry(page) {
  const props = page.properties;
  
  return {
    id: page.id,
    type: 'pipeline',
    name: extractProp(props, 'Name', 'title') || extractProp(props, 'Company', 'title'),
    status: extractProp(props, 'Status', 'select'),
    stage: extractProp(props, 'Stage', 'select'),
    priority: extractProp(props, 'Priority', 'select'),
    owner: extractProp(props, 'Owner', 'people'),
    value: extractProp(props, 'Deal Value', 'number') || extractProp(props, 'Value', 'number'),
    lastContact: extractProp(props, 'Last Contact', 'date'),
    nextAction: extractProp(props, 'Next Action', 'rich_text'),
    notes: extractProp(props, 'Notes', 'rich_text'),
    campaigns: extractProp(props, 'Campaigns', 'relation'),
    research: extractProp(props, 'Research', 'relation'),
    lastUpdated: page.last_edited_time
  };
}

async function getPipelineProspects(options = {}) {
  let filter = null;
  
  if (options.status) {
    filter = { property: 'Status', select: { equals: options.status } };
  }
  
  if (options.stage) {
    filter = { property: 'Stage', select: { equals: options.stage } };
  }
  
  const results = await queryBDPipeline(filter);
  return results.map(parsePipelineEntry);
}

// ============ BD Campaigns ============

async function queryBDCampaigns(filter = null) {
  const body = { page_size: 100 };
  if (filter) body.filter = filter;
  
  const response = await notionRequest('POST', `/v1/databases/${DATABASES.BD_CAMPAIGNS}/query`, body);
  return response.results || [];
}

function parseCampaignEntry(page) {
  const props = page.properties;
  
  return {
    id: page.id,
    type: 'campaign',
    name: extractProp(props, 'Name', 'title') || extractProp(props, 'Campaign', 'title'),
    status: extractProp(props, 'Status', 'select'),
    type: extractProp(props, 'Type', 'select'),
    channel: extractProp(props, 'Channel', 'select'),
    startDate: extractProp(props, 'Start Date', 'date'),
    endDate: extractProp(props, 'End Date', 'date'),
    targets: extractProp(props, 'Targets', 'relation'),
    responses: extractProp(props, 'Responses', 'number'),
    conversions: extractProp(props, 'Conversions', 'number'),
    notes: extractProp(props, 'Notes', 'rich_text'),
    lastUpdated: page.last_edited_time
  };
}

async function getCampaigns(options = {}) {
  let filter = null;
  
  if (options.status) {
    filter = { property: 'Status', select: { equals: options.status } };
  }
  
  const results = await queryBDCampaigns(filter);
  return results.map(parseCampaignEntry);
}

// ============ Research Requests ============

async function queryResearchRequests(filter = null) {
  const body = { page_size: 100 };
  if (filter) body.filter = filter;
  
  const response = await notionRequest('POST', `/v1/databases/${DATABASES.RESEARCH_REQUESTS}/query`, body);
  return response.results || [];
}

function parseResearchEntry(page) {
  const props = page.properties;
  
  return {
    id: page.id,
    type: 'research',
    title: extractProp(props, 'Title', 'title') || extractProp(props, 'Request', 'title'),
    status: extractProp(props, 'Status', 'select'),
    priority: extractProp(props, 'Priority', 'select'),
    requestedBy: extractProp(props, 'Requested By', 'people'),
    assignedTo: extractProp(props, 'Assigned To', 'people'),
    dueDate: extractProp(props, 'Due Date', 'date'),
    relatedProspect: extractProp(props, 'Related Prospect', 'relation'),
    deliverables: extractProp(props, 'Deliverables', 'rich_text'),
    notes: extractProp(props, 'Notes', 'rich_text'),
    lastUpdated: page.last_edited_time
  };
}

async function getResearchRequests(options = {}) {
  let filter = null;
  
  if (options.status) {
    filter = { property: 'Status', select: { equals: options.status } };
  }
  
  if (options.priority) {
    filter = { property: 'Priority', select: { equals: options.priority } };
  }
  
  const results = await queryResearchRequests(filter);
  return results.map(parseResearchEntry);
}

// ============ Unified Data Model ============

/**
 * Get unified BD surface data
 */
async function getUnifiedBDData() {
  console.log('Loading BD Surface data...');
  
  const [pipeline, campaigns, research] = await Promise.all([
    getPipelineProspects(),
    getCampaigns(),
    getResearchRequests()
  ]);
  
  return {
    pipeline: {
      total: pipeline.length,
      byStatus: groupBy(pipeline, 'status'),
      byStage: groupBy(pipeline, 'stage'),
      items: pipeline
    },
    campaigns: {
      total: campaigns.length,
      byStatus: groupBy(campaigns, 'status'),
      items: campaigns
    },
    research: {
      total: research.length,
      byStatus: groupBy(research, 'status'),
      byPriority: groupBy(research, 'priority'),
      items: research
    },
    summary: {
      totalProspects: pipeline.length,
      activeCampaigns: campaigns.filter(c => c.status === 'Active').length,
      pendingResearch: research.filter(r => r.status !== 'Complete').length,
      lastUpdated: new Date().toISOString()
    }
  };
}

function groupBy(items, field) {
  return items.reduce((acc, item) => {
    const key = item[field] || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Get prospect with related data
 */
async function getProspectDetail(prospectId) {
  // Get prospect
  const page = await notionRequest('GET', `/v1/pages/${prospectId}`);
  const prospect = parsePipelineEntry(page);
  
  // Get related campaigns
  const relatedCampaigns = [];
  if (prospect.campaigns?.length > 0) {
    for (const campaignId of prospect.campaigns) {
      try {
        const campaignPage = await notionRequest('GET', `/v1/pages/${campaignId}`);
        relatedCampaigns.push(parseCampaignEntry(campaignPage));
      } catch (e) {}
    }
  }
  
  // Get related research
  const relatedResearch = [];
  if (prospect.research?.length > 0) {
    for (const researchId of prospect.research) {
      try {
        const researchPage = await notionRequest('GET', `/v1/pages/${researchId}`);
        relatedResearch.push(parseResearchEntry(researchPage));
      } catch (e) {}
    }
  }
  
  return {
    ...prospect,
    relatedCampaigns,
    relatedResearch
  };
}

/**
 * Create research request
 */
async function createResearchRequest(data) {
  const properties = {
    'Title': { title: [{ text: { content: data.title } }] }
  };
  
  if (data.priority) {
    properties['Priority'] = { select: { name: data.priority } };
  }
  
  if (data.notes) {
    properties['Notes'] = { rich_text: [{ text: { content: data.notes } }] };
  }
  
  if (data.relatedProspect) {
    properties['Related Prospect'] = { relation: [{ id: data.relatedProspect }] };
  }
  
  const response = await notionRequest('POST', '/v1/pages', {
    parent: { database_id: DATABASES.RESEARCH_REQUESTS },
    properties
  });
  
  return response.id;
}

/**
 * Get BD dashboard summary
 */
async function getDashboardSummary() {
  const data = await getUnifiedBDData();
  
  return `
📊 **BD Surface Dashboard**

**Pipeline:** ${data.summary.totalProspects} prospects
${Object.entries(data.pipeline.byStage).map(([k, v]) => `  • ${k}: ${v}`).join('\n')}

**Campaigns:** ${data.campaigns.total} total
  • Active: ${data.summary.activeCampaigns}

**Research:** ${data.research.total} requests
  • Pending: ${data.summary.pendingResearch}
${Object.entries(data.research.byPriority).map(([k, v]) => `  • ${k}: ${v}`).join('\n')}

*Last updated: ${data.summary.lastUpdated}*
`;
}

// ============ Cache Management ============

function saveCache(key, data) {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  
  const cachePath = `${CACHE_DIR}/${key}.json`;
  fs.writeFileSync(cachePath, JSON.stringify({
    timestamp: Date.now(),
    data
  }, null, 2));
}

function loadCache(key, maxAgeMs = 5 * 60 * 1000) {
  const cachePath = `${CACHE_DIR}/${key}.json`;
  
  try {
    if (fs.existsSync(cachePath)) {
      const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (Date.now() - cache.timestamp < maxAgeMs) {
        return cache.data;
      }
    }
  } catch (e) {}
  
  return null;
}

// ============ CLI ============

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  switch (command) {
    case 'dashboard':
      getDashboardSummary().then(console.log).catch(console.error);
      break;
      
    case 'pipeline':
      getPipelineProspects().then(data => {
        console.log(`\n=== BD Pipeline (${data.length} prospects) ===\n`);
        data.slice(0, 15).forEach(p => {
          console.log(`${(p.status || 'N/A').padEnd(12)} | ${(p.stage || 'N/A').padEnd(12)} | ${p.name || 'Unnamed'}`);
        });
        if (data.length > 15) console.log(`... and ${data.length - 15} more`);
      }).catch(console.error);
      break;
      
    case 'campaigns':
      getCampaigns().then(data => {
        console.log(`\n=== BD Campaigns (${data.length}) ===\n`);
        data.slice(0, 15).forEach(c => {
          console.log(`${(c.status || 'N/A').padEnd(12)} | ${(c.channel || 'N/A').padEnd(10)} | ${c.name || 'Unnamed'}`);
        });
      }).catch(console.error);
      break;
      
    case 'research':
      getResearchRequests().then(data => {
        console.log(`\n=== Research Requests (${data.length}) ===\n`);
        data.slice(0, 15).forEach(r => {
          console.log(`${(r.status || 'N/A').padEnd(12)} | ${(r.priority || 'N/A').padEnd(8)} | ${r.title || 'Unnamed'}`);
        });
      }).catch(console.error);
      break;
      
    case 'unified':
      getUnifiedBDData().then(data => {
        console.log(JSON.stringify(data.summary, null, 2));
      }).catch(console.error);
      break;
      
    case 'prospect':
      const prospectId = args[1];
      if (!prospectId) {
        console.log('Usage: bd_surface_connector.js prospect <id>');
        process.exit(1);
      }
      getProspectDetail(prospectId).then(data => {
        console.log(JSON.stringify(data, null, 2));
      }).catch(console.error);
      break;
      
    default:
      console.log(`
BD Surface Connector for VoltAgent

Usage:
  bd_surface_connector.js dashboard  — Show dashboard summary
  bd_surface_connector.js pipeline   — List pipeline prospects
  bd_surface_connector.js campaigns  — List campaigns
  bd_surface_connector.js research   — List research requests
  bd_surface_connector.js unified    — Get unified data model
  bd_surface_connector.js prospect <id> — Get prospect detail

Connected Databases:
  - BD Pipeline: ${DATABASES.BD_PIPELINE}
  - BD Campaigns: ${DATABASES.BD_CAMPAIGNS}
  - Research Requests: ${DATABASES.RESEARCH_REQUESTS}
`);
  }
}

module.exports = {
  DATABASES,
  getPipelineProspects,
  getCampaigns,
  getResearchRequests,
  getUnifiedBDData,
  getProspectDetail,
  createResearchRequest,
  getDashboardSummary
};
