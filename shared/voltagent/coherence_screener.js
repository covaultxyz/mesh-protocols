#!/usr/bin/env node
/**
 * Coherence Screener for VoltAgent
 * 
 * Screens data rooms for coherence, completeness, and consistency.
 * 
 * Author: Cassian Sandman
 * Date: 2026-02-01
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = '/root/clawd/memory/screening-reports';

// Severity levels
const Severity = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  ADVISORY: 'ADVISORY'
};

// Required documents by program type
const REQUIRED_DOCS = {
  'ALL': [
    'Executive Summary / Pitch Deck',
    'Financial Model',
    'Cap Table',
    'Legal Formation Docs',
    'Management Bios'
  ],
  'SPV': [
    'Asset Purchase Agreement',
    'Asset Valuation',
    'Escrow Instructions',
    'Distribution Waterfall'
  ],
  'Fund': [
    'PPM (Private Placement Memo)',
    'Limited Partnership Agreement',
    'Investment Policy',
    'Fee Schedule'
  ],
  'Tokenization': [
    'Token Economics',
    'Smart Contract Audit',
    'Legal Opinion',
    'Custody Arrangement'
  ],
  'Infrastructure': [
    'Engineering Report',
    'Environmental Assessment',
    'Permits/Approvals',
    'Construction Timeline'
  ],
  'Energy': [
    'Resource Assessment',
    'PPA (Power Purchase Agreement)',
    'Interconnection Agreement',
    'Environmental Permits'
  ],
  'Real Estate': [
    'Appraisal',
    'Title Report',
    'Property Condition Report',
    'Zoning Confirmation'
  ]
};

// Cross-reference checks
const CROSS_REFERENCES = [
  {
    name: 'Revenue Consistency',
    sources: ['Pitch Deck', 'Financial Model', 'Historical Financials'],
    field: 'revenue',
    severity: Severity.CRITICAL
  },
  {
    name: 'Valuation Math',
    sources: ['Cap Table', 'PPM', 'Financial Model'],
    field: 'valuation',
    severity: Severity.CRITICAL
  },
  {
    name: 'Timeline Consistency',
    sources: ['Project Schedule', 'Financial Model', 'Contracts'],
    field: 'dates',
    severity: Severity.HIGH
  },
  {
    name: 'Entity Name',
    sources: ['All Documents'],
    field: 'entity_name',
    severity: Severity.HIGH
  },
  {
    name: 'Ownership Percentages',
    sources: ['Cap Table', 'Legal Docs', 'PPM'],
    field: 'ownership',
    severity: Severity.CRITICAL
  }
];

/**
 * Check document completeness
 */
function checkCompleteness(documents, programType) {
  const required = [...REQUIRED_DOCS['ALL'], ...(REQUIRED_DOCS[programType] || [])];
  const findings = [];
  
  for (const doc of required) {
    const found = documents.some(d => 
      d.name.toLowerCase().includes(doc.toLowerCase()) ||
      doc.toLowerCase().includes(d.name.toLowerCase())
    );
    
    if (!found) {
      findings.push({
        type: 'MISSING_DOCUMENT',
        severity: Severity.HIGH,
        document: doc,
        message: `Required document missing: ${doc}`
      });
    }
  }
  
  return {
    required: required.length,
    present: required.length - findings.length,
    missing: findings.length,
    findings
  };
}

/**
 * Check numerical consistency
 */
function checkNumericalConsistency(extractedData) {
  const findings = [];
  
  // Check if same values appear in different sources
  for (const ref of CROSS_REFERENCES) {
    const values = ref.sources
      .map(source => extractedData[source]?.[ref.field])
      .filter(v => v !== undefined);
    
    if (values.length > 1) {
      const unique = [...new Set(values.map(v => String(v)))];
      
      if (unique.length > 1) {
        findings.push({
          type: 'NUMERICAL_MISMATCH',
          severity: ref.severity,
          check: ref.name,
          sources: ref.sources,
          values: values,
          message: `${ref.name} mismatch: found values ${unique.join(', ')}`
        });
      }
    }
  }
  
  return findings;
}

/**
 * Check claim-evidence alignment
 */
function checkClaimEvidence(claims) {
  const findings = [];
  
  for (const claim of claims) {
    if (!claim.evidence || claim.evidence.length === 0) {
      findings.push({
        type: 'UNSUPPORTED_CLAIM',
        severity: Severity.HIGH,
        claim: claim.text,
        location: claim.location,
        message: `Claim without evidence: "${claim.text.slice(0, 50)}..."`
      });
    } else if (claim.evidenceStrength === 'weak') {
      findings.push({
        type: 'WEAK_EVIDENCE',
        severity: Severity.MEDIUM,
        claim: claim.text,
        evidence: claim.evidence,
        message: `Weak evidence for claim: "${claim.text.slice(0, 50)}..."`
      });
    }
  }
  
  return findings;
}

/**
 * Generate screening report
 */
function generateReport(projectName, programType, findings, metadata = {}) {
  const now = new Date().toISOString();
  
  const bySeverity = {
    [Severity.CRITICAL]: findings.filter(f => f.severity === Severity.CRITICAL),
    [Severity.HIGH]: findings.filter(f => f.severity === Severity.HIGH),
    [Severity.MEDIUM]: findings.filter(f => f.severity === Severity.MEDIUM),
    [Severity.ADVISORY]: findings.filter(f => f.severity === Severity.ADVISORY)
  };
  
  const recommendation = bySeverity[Severity.CRITICAL].length > 0 ? 'HOLD' :
                         bySeverity[Severity.HIGH].length > 3 ? 'HOLD' :
                         bySeverity[Severity.HIGH].length > 0 ? 'PROCEED_WITH_CONDITIONS' :
                         'PROCEED';
  
  const report = {
    header: {
      project: projectName,
      programType,
      screeningDate: now,
      screeningLead: metadata.screeningLead || 'COHERENCE_ANALYST',
      version: '1.0'
    },
    summary: {
      totalFindings: findings.length,
      critical: bySeverity[Severity.CRITICAL].length,
      high: bySeverity[Severity.HIGH].length,
      medium: bySeverity[Severity.MEDIUM].length,
      advisory: bySeverity[Severity.ADVISORY].length,
      recommendation
    },
    findings: bySeverity,
    metadata
  };
  
  return report;
}

/**
 * Format report as markdown
 */
function formatReportMarkdown(report) {
  let md = `# Coherence Screening Report

**Project:** ${report.header.project}
**Program Type:** ${report.header.programType}
**Screening Date:** ${report.header.screeningDate}
**Screening Lead:** ${report.header.screeningLead}

## Executive Summary

- Total Findings: ${report.summary.totalFindings}
- Critical: ${report.summary.critical}
- High: ${report.summary.high}
- Medium: ${report.summary.medium}
- Advisory: ${report.summary.advisory}
- **Recommendation: ${report.summary.recommendation}**

## Findings

`;

  for (const severity of [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.ADVISORY]) {
    const findings = report.findings[severity];
    if (findings.length === 0) continue;
    
    md += `### ${severity}\n\n`;
    
    findings.forEach((f, i) => {
      md += `${i + 1}. **${f.type}**\n`;
      md += `   - ${f.message}\n`;
      if (f.location) md += `   - Location: ${f.location}\n`;
      if (f.resolution) md += `   - Resolution: ${f.resolution}\n`;
      md += '\n';
    });
  }
  
  md += `---
*Report generated: ${report.header.screeningDate}*
*Version: ${report.header.version}*
`;
  
  return md;
}

/**
 * Save report to file
 */
function saveReport(report) {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  const filename = `${report.header.project.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
  const jsonPath = path.join(REPORTS_DIR, `${filename}.json`);
  const mdPath = path.join(REPORTS_DIR, `${filename}.md`);
  
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(mdPath, formatReportMarkdown(report));
  
  return { jsonPath, mdPath };
}

/**
 * Run full screening
 */
function runScreening(projectName, programType, documents, extractedData = {}, claims = []) {
  console.log(`\n=== Coherence Screening: ${projectName} ===\n`);
  console.log(`Program Type: ${programType}`);
  console.log(`Documents: ${documents.length}`);
  
  const allFindings = [];
  
  // Check completeness
  console.log('\nChecking completeness...');
  const completeness = checkCompleteness(documents, programType);
  console.log(`  Required: ${completeness.required}, Present: ${completeness.present}, Missing: ${completeness.missing}`);
  allFindings.push(...completeness.findings);
  
  // Check numerical consistency
  console.log('\nChecking numerical consistency...');
  const numerical = checkNumericalConsistency(extractedData);
  console.log(`  Mismatches found: ${numerical.length}`);
  allFindings.push(...numerical);
  
  // Check claim-evidence alignment
  console.log('\nChecking claim-evidence alignment...');
  const claimEvidence = checkClaimEvidence(claims);
  console.log(`  Issues found: ${claimEvidence.length}`);
  allFindings.push(...claimEvidence);
  
  // Generate report
  console.log('\nGenerating report...');
  const report = generateReport(projectName, programType, allFindings);
  
  console.log(`\n=== Summary ===`);
  console.log(`Critical: ${report.summary.critical}`);
  console.log(`High: ${report.summary.high}`);
  console.log(`Medium: ${report.summary.medium}`);
  console.log(`Advisory: ${report.summary.advisory}`);
  console.log(`\nRecommendation: ${report.summary.recommendation}`);
  
  return report;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  switch (command) {
    case 'test':
      // Run test screening with mock data
      const mockDocs = [
        { name: 'Pitch Deck.pdf' },
        { name: 'Financial Model.xlsx' },
        { name: 'Cap Table.xlsx' },
        { name: 'Operating Agreement.pdf' }
        // Missing: Management Bios, Engineering Report, etc.
      ];
      
      const mockData = {
        'Pitch Deck': { revenue: 5000000, valuation: 25000000 },
        'Financial Model': { revenue: 4800000, valuation: 25000000 } // Slight mismatch
      };
      
      const mockClaims = [
        { text: 'Market size of $50B by 2030', location: 'Pitch Deck p.5', evidence: [] },
        { text: 'Proprietary technology with 3 patents', location: 'Pitch Deck p.8', evidence: ['Patent filing docs'], evidenceStrength: 'strong' }
      ];
      
      const report = runScreening('Test Infrastructure Project', 'Infrastructure', mockDocs, mockData, mockClaims);
      const paths = saveReport(report);
      console.log(`\nReport saved to: ${paths.mdPath}`);
      break;
      
    case 'check':
      const programType = args[1] || 'SPV';
      console.log(`\n=== Required Documents for ${programType} ===\n`);
      const required = [...REQUIRED_DOCS['ALL'], ...(REQUIRED_DOCS[programType] || [])];
      required.forEach(d => console.log(`  - ${d}`));
      break;
      
    case 'reports':
      if (!fs.existsSync(REPORTS_DIR)) {
        console.log('No reports found.');
      } else {
        const files = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.md'));
        console.log(`\n=== Screening Reports (${files.length}) ===\n`);
        files.slice(-10).forEach(f => console.log(`  ${f}`));
      }
      break;
      
    default:
      console.log(`
Coherence Screener for VoltAgent

Usage:
  coherence_screener.js test            — Run test screening with mock data
  coherence_screener.js check <type>    — Show required docs for program type
  coherence_screener.js reports         — List generated reports

Program Types: SPV, Fund, Tokenization, Infrastructure, Energy, Real Estate
`);
  }
}

module.exports = {
  Severity,
  REQUIRED_DOCS,
  CROSS_REFERENCES,
  checkCompleteness,
  checkNumericalConsistency,
  checkClaimEvidence,
  generateReport,
  formatReportMarkdown,
  saveReport,
  runScreening
};
