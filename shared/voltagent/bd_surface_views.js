#!/usr/bin/env node
/**
 * BD Surface Views for VoltAgent
 * 
 * UI views for BD Surface: pipeline dashboard, prospect detail,
 * outreach triggers, research forms, campaign performance.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const {
  getPipelineProspects,
  getCampaigns,
  getResearchRequests,
  getUnifiedBDData,
  getProspectDetail,
  createResearchRequest,
  DATABASES
} = require('./bd_surface_connector');

// ============ 3.1 Pipeline Dashboard View ============

async function renderPipelineDashboard() {
  const prospects = await getPipelineProspects();
  
  // Group by stage
  const stages = ['Lead', 'Contacted', 'Meeting Set', 'Proposal', 'Diligence', 'Closing', 'Won', 'Lost'];
  const byStage = {};
  
  stages.forEach(s => byStage[s] = []);
  prospects.forEach(p => {
    const stage = p.stage || 'Unknown';
    if (!byStage[stage]) byStage[stage] = [];
    byStage[stage].push(p);
  });
  
  let output = `
╔══════════════════════════════════════════════════════════════╗
║                    📊 BD PIPELINE DASHBOARD                   ║
╠══════════════════════════════════════════════════════════════╣
║  Total Prospects: ${String(prospects.length).padEnd(42)}║
╚══════════════════════════════════════════════════════════════╝

`;

  // Funnel visualization
  const maxWidth = 50;
  const maxCount = Math.max(...Object.values(byStage).map(arr => arr.length), 1);
  
  stages.forEach(stage => {
    const count = byStage[stage]?.length || 0;
    if (count === 0 && !['Lead', 'Won', 'Lost'].includes(stage)) return;
    
    const barWidth = Math.round((count / maxCount) * maxWidth);
    const bar = '█'.repeat(barWidth) + '░'.repeat(maxWidth - barWidth);
    output += `${stage.padEnd(12)} │${bar}│ ${count}\n`;
  });
  
  output += `\n─── Recent Activity ───\n`;
  
  // Show 5 most recently updated
  const sorted = [...prospects].sort((a, b) => 
    new Date(b.lastUpdated) - new Date(a.lastUpdated)
  );
  
  sorted.slice(0, 5).forEach(p => {
    const date = p.lastUpdated?.split('T')[0] || 'N/A';
    output += `  ${date} │ ${(p.stage || 'N/A').padEnd(12)} │ ${(p.name || 'Unnamed').slice(0, 30)}\n`;
  });
  
  return output;
}

// ============ 3.2 Prospect Detail View ============

async function renderProspectDetail(prospectId) {
  const prospect = await getProspectDetail(prospectId);
  
  let output = `
╔══════════════════════════════════════════════════════════════╗
║                    👤 PROSPECT DETAIL                         ║
╠══════════════════════════════════════════════════════════════╣

  Name:        ${prospect.name || 'N/A'}
  Stage:       ${prospect.stage || 'N/A'}
  Status:      ${prospect.status || 'N/A'}
  Priority:    ${prospect.priority || 'N/A'}
  Value:       ${prospect.value ? '$' + prospect.value.toLocaleString() : 'N/A'}
  Owner:       ${prospect.owner?.join(', ') || 'Unassigned'}
  Last Contact: ${prospect.lastContact || 'N/A'}

─── Next Action ───
  ${prospect.nextAction || 'None specified'}

─── Notes ───
  ${prospect.notes || 'No notes'}

`;

  if (prospect.relatedCampaigns?.length > 0) {
    output += `─── Related Campaigns (${prospect.relatedCampaigns.length}) ───\n`;
    prospect.relatedCampaigns.forEach(c => {
      output += `  • ${c.name || 'Unnamed'} (${c.status || 'N/A'})\n`;
    });
  }
  
  if (prospect.relatedResearch?.length > 0) {
    output += `\n─── Related Research (${prospect.relatedResearch.length}) ───\n`;
    prospect.relatedResearch.forEach(r => {
      output += `  • ${r.title || 'Unnamed'} (${r.status || 'N/A'})\n`;
    });
  }
  
  output += `\n╚══════════════════════════════════════════════════════════════╝`;
  
  return output;
}

// ============ 3.3 Outreach Trigger Interface ============

async function renderOutreachTriggers() {
  const prospects = await getPipelineProspects();
  
  // Find prospects needing outreach
  const needsOutreach = prospects.filter(p => {
    // No contact in 7+ days
    if (p.lastContact) {
      const lastContact = new Date(p.lastContact);
      const daysSince = (Date.now() - lastContact) / (1000 * 60 * 60 * 24);
      if (daysSince > 7) return true;
    }
    // In early stages
    if (['Lead', 'Contacted'].includes(p.stage)) return true;
    return false;
  });
  
  // Find hot prospects
  const hotProspects = prospects.filter(p => 
    p.priority === 'High' || p.stage === 'Proposal' || p.stage === 'Closing'
  );
  
  let output = `
╔══════════════════════════════════════════════════════════════╗
║                    📬 OUTREACH TRIGGERS                       ║
╠══════════════════════════════════════════════════════════════╣

─── 🔥 Hot Prospects (${hotProspects.length}) ───
`;

  hotProspects.slice(0, 5).forEach(p => {
    output += `  ⚡ ${(p.name || 'Unnamed').slice(0, 25).padEnd(25)} │ ${p.stage || 'N/A'}\n`;
  });
  
  output += `
─── ⏰ Needs Follow-up (${needsOutreach.length}) ───
`;

  needsOutreach.slice(0, 5).forEach(p => {
    const days = p.lastContact 
      ? Math.floor((Date.now() - new Date(p.lastContact)) / (1000 * 60 * 60 * 24))
      : '?';
    output += `  📅 ${(p.name || 'Unnamed').slice(0, 25).padEnd(25)} │ ${days} days ago\n`;
  });
  
  output += `
─── Suggested Actions ───
`;

  if (hotProspects.length > 0) {
    output += `  • Schedule calls with ${hotProspects.length} hot prospects\n`;
  }
  if (needsOutreach.length > 0) {
    output += `  • Send follow-up to ${needsOutreach.length} stale prospects\n`;
  }
  
  output += `\n╚══════════════════════════════════════════════════════════════╝`;
  
  return output;
}

// ============ 3.4 Research Request Form ============

async function renderResearchForm() {
  const templates = [
    { name: 'Company Deep Dive', fields: ['Company Name', 'Industry', 'Focus Areas'] },
    { name: 'Market Research', fields: ['Market/Sector', 'Geographic Focus', 'Key Questions'] },
    { name: 'Competitor Analysis', fields: ['Target Company', 'Competitors to Analyze'] },
    { name: 'Contact Discovery', fields: ['Target Profile', 'Industry', 'Geography'] }
  ];
  
  let output = `
╔══════════════════════════════════════════════════════════════╗
║                    🔍 RESEARCH REQUEST FORM                   ║
╠══════════════════════════════════════════════════════════════╣

─── Available Templates ───
`;

  templates.forEach((t, i) => {
    output += `  ${i + 1}. ${t.name}\n`;
    output += `     Fields: ${t.fields.join(', ')}\n`;
  });
  
  output += `
─── Create Request ───
  Use: bd_surface_views.js request <title> [priority] [notes]

  Priorities: High, Medium, Low
  
─── Pending Requests ───
`;

  const requests = await getResearchRequests({ status: 'Pending' });
  requests.slice(0, 5).forEach(r => {
    output += `  • ${(r.title || 'Unnamed').slice(0, 40)} (${r.priority || 'N/A'})\n`;
  });
  
  output += `\n╚══════════════════════════════════════════════════════════════╝`;
  
  return output;
}

// ============ 3.5 Campaign Performance View ============

async function renderCampaignPerformance() {
  const campaigns = await getCampaigns();
  
  let output = `
╔══════════════════════════════════════════════════════════════╗
║                    📈 CAMPAIGN PERFORMANCE                    ║
╠══════════════════════════════════════════════════════════════╣

  Total Campaigns: ${campaigns.length}
  Active: ${campaigns.filter(c => c.status === 'Active').length}
  Completed: ${campaigns.filter(c => c.status === 'Complete').length}

`;

  if (campaigns.length === 0) {
    output += `  No campaigns found. Create campaigns in BD Campaigns DB.\n`;
  } else {
    output += `─── Campaign Metrics ───\n`;
    
    campaigns.forEach(c => {
      const responses = c.responses || 0;
      const conversions = c.conversions || 0;
      const convRate = responses > 0 ? ((conversions / responses) * 100).toFixed(1) : '0.0';
      
      output += `
  ${c.name || 'Unnamed'}
  ├─ Status: ${c.status || 'N/A'}
  ├─ Channel: ${c.channel || 'N/A'}
  ├─ Responses: ${responses}
  ├─ Conversions: ${conversions}
  └─ Conv. Rate: ${convRate}%
`;
    });
  }
  
  output += `\n╚══════════════════════════════════════════════════════════════╝`;
  
  return output;
}

// ============ CLI ============

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  switch (command) {
    case 'pipeline':
      renderPipelineDashboard().then(console.log).catch(console.error);
      break;
      
    case 'prospect':
      const prospectId = args[1];
      if (!prospectId) {
        console.log('Usage: bd_surface_views.js prospect <id>');
        process.exit(1);
      }
      renderProspectDetail(prospectId).then(console.log).catch(console.error);
      break;
      
    case 'outreach':
      renderOutreachTriggers().then(console.log).catch(console.error);
      break;
      
    case 'research':
      renderResearchForm().then(console.log).catch(console.error);
      break;
      
    case 'request':
      const title = args[1];
      const priority = args[2] || 'Medium';
      const notes = args.slice(3).join(' ') || '';
      
      if (!title) {
        console.log('Usage: bd_surface_views.js request <title> [priority] [notes]');
        process.exit(1);
      }
      
      createResearchRequest({ title, priority, notes }).then(id => {
        console.log(`✅ Research request created: ${id}`);
      }).catch(console.error);
      break;
      
    case 'campaigns':
      renderCampaignPerformance().then(console.log).catch(console.error);
      break;
      
    case 'all':
      (async () => {
        console.log(await renderPipelineDashboard());
        console.log(await renderOutreachTriggers());
        console.log(await renderCampaignPerformance());
      })().catch(console.error);
      break;
      
    default:
      console.log(`
BD Surface Views for VoltAgent

Usage:
  bd_surface_views.js pipeline         — Pipeline dashboard (3.1)
  bd_surface_views.js prospect <id>    — Prospect detail (3.2)
  bd_surface_views.js outreach         — Outreach triggers (3.3)
  bd_surface_views.js research         — Research form (3.4)
  bd_surface_views.js request <title>  — Create research request
  bd_surface_views.js campaigns        — Campaign performance (3.5)
  bd_surface_views.js all              — Show all views
`);
  }
}

module.exports = {
  renderPipelineDashboard,
  renderProspectDetail,
  renderOutreachTriggers,
  renderResearchForm,
  renderCampaignPerformance
};
