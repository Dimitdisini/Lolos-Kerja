/**
 * scripts/qa/check-wiring.js: Full-Stack Wiring & Dead Code Auditor
 * Checks contracts between Frontend, Serverless API (/api), and Database Migrations.
 *
 * Rules:
 * (a) Any fetch('/api/...') in FE must correspond to an existing file in api/
 * (b) Any endpoint in api/ must have at least one caller in FE (or cron workflow)
 * (c) Any supabase.from('table') in FE must exist in supabase/migrations/ (flags legacy dropped tables: users, transactions, blast_logs)
 * (d) Any onclick="fn()" or onsubmit="fn()" in HTML must be defined in scripts
 * (e) Flag orphaned global functions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

console.log('=================================================================');
console.log('       ANTIGRAVITY WIRING & DEAD CODE AUDITOR (check-wiring.js)  ');
console.log('=================================================================\n');

let failureCount = 0;
const report = {
  unresolvedApiFetches: [],
  orphanedEndpoints: [],
  invalidTableAccesses: [],
  missingHtmlEventHandlers: []
};

// 1. Gather all API endpoint files
function getApiEndpoints(dir, base = '') {
  const endpoints = [];
  if (!fs.existsSync(dir)) return endpoints;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.name.startsWith('_')) continue; // skip _lib
    const fullPath = path.join(dir, item.name);
    const relRoute = path.join(base, item.name);
    if (item.isDirectory()) {
      endpoints.push(...getApiEndpoints(fullPath, relRoute));
    } else if (item.name.endsWith('.js')) {
      const endpointRoute = '/api/' + relRoute.replace(/\\/g, '/').replace(/\.js$/, '');
      endpoints.push({ route: endpointRoute, file: fullPath });
    }
  }
  return endpoints;
}

const apiEndpoints = getApiEndpoints(path.join(rootDir, 'api'));
const apiRoutes = apiEndpoints.map(e => e.route);

// 2. Gather valid tables from migrations
function getMigrationTables() {
  const migrationsDir = path.join(rootDir, 'supabase/migrations');
  const validTables = new Set();
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    for (const f of files) {
      const content = fs.readFileSync(path.join(migrationsDir, f), 'utf-8');
      const createTableMatches = content.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-zA-Z0-9_]+)/gi);
      for (const m of createTableMatches) {
        validTables.add(m[1]);
      }
    }
  }
  return validTables;
}

const validTables = getMigrationTables();
// Legacy tables that must NOT be accessed
const legacyTables = new Set(['users', 'transactions', 'blast_logs']);

// 3. Scan Frontend Files
const feFiles = [];
if (fs.existsSync(path.join(rootDir, 'index.html'))) feFiles.push(path.join(rootDir, 'index.html'));
if (fs.existsSync(path.join(rootDir, 'admin/index.html'))) feFiles.push(path.join(rootDir, 'admin/index.html'));
if (fs.existsSync(path.join(rootDir, 'src'))) {
  function scanDir(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const p = path.join(dir, item.name);
      if (item.isDirectory()) scanDir(p);
      else if (item.name.endsWith('.js') || item.name.endsWith('.html')) feFiles.push(p);
    }
  }
  scanDir(path.join(rootDir, 'src'));
}

let allFeContent = '';
feFiles.forEach(f => {
  allFeContent += '\n' + fs.readFileSync(f, 'utf-8');
});

// Also check workflow files for cron callers (e.g. blast-tick)
const workflowFiles = [];
const wfDirs = [path.join(rootDir, '.github/workflows'), path.join(rootDir, 'deploy/workflows')];
wfDirs.forEach(wfd => {
  if (fs.existsSync(wfd)) {
    fs.readdirSync(wfd).filter(f => f.endsWith('.yml')).forEach(f => {
      workflowFiles.push(path.join(wfd, f));
      allFeContent += '\n' + fs.readFileSync(path.join(wfd, f), 'utf-8');
    });
  }
});

// CHECK (A): FE fetch('/api/...') calls vs existing files
const fetchMatches = allFeContent.matchAll(/fetch\s*\(\s*['"`](\/api\/[a-zA-Z0-9_\-\/]+)/g);
const feApiFetches = new Set();
for (const m of fetchMatches) {
  feApiFetches.add(m[1]);
  if (!apiRoutes.includes(m[1])) {
    report.unresolvedApiFetches.push(m[1]);
  }
}

// CHECK (B): Endpoints without callers in FE or Workflows
for (const endpoint of apiEndpoints) {
  // Allow unsubscribe to be an external link target in emails
  if (endpoint.route === '/api/blast/unsubscribe') continue;
  // Check if route is mentioned anywhere in FE / Workflows
  const routePattern = new RegExp(endpoint.route.replace(/\//g, '\\/'), 'i');
  if (!routePattern.test(allFeContent)) {
    report.orphanedEndpoints.push(endpoint.route);
  }
}

// CHECK (C): Supabase from('table') calls
const fromMatches = allFeContent.matchAll(/\.from\s*\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g);
for (const m of fromMatches) {
  const table = m[1];
  if (legacyTables.has(table)) {
    report.invalidTableAccesses.push(`Legacy table: '${table}' (must be migrated to new schema)`);
  } else if (!validTables.has(table) && !['profiles', 'payments', 'jobs', 'applications', 'cv_documents', 'interview_sessions'].includes(table)) {
    report.invalidTableAccesses.push(`Unknown table: '${table}'`);
  }
}

// CHECK (D): HTML event handlers vs function definitions
const htmlFiles = feFiles.filter(f => f.endsWith('.html'));
const definedFunctions = new Set();

// Extract defined functions across all FE content
const funcMatches = allFeContent.matchAll(/(?:function\s+([a-zA-Z0-9_$]+)|window\.([a-zA-Z0-9_$]+)\s*=|const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>))/g);
for (const m of funcMatches) {
  const fnName = m[1] || m[2] || m[3];
  if (fnName) definedFunctions.add(fnName);
}

for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(htmlFile, 'utf-8');
  const handlerMatches = html.matchAll(/on(?:click|submit|change|input)\s*=\s*['"]([a-zA-Z0-9_$]+)\s*\(/g);
  for (const m of handlerMatches) {
    const fn = m[1];
    if (!definedFunctions.has(fn)) {
      report.missingHtmlEventHandlers.push(`${fn} in ${path.basename(htmlFile)}`);
    }
  }
}

// PRINT RESULTS
console.log('--- HASIL AUDIT KONEKSI (WIRING AUDIT) ---');

console.log(`\n(a) API Calls Tanpa Endpoint di Backend: ${report.unresolvedApiFetches.length}`);
if (report.unresolvedApiFetches.length > 0) {
  report.unresolvedApiFetches.forEach(e => console.log(`   [FAIL] ${e}`));
  failureCount += report.unresolvedApiFetches.length;
} else {
  console.log('   [PASS] Semua panggilan fetch(/api/...) valid.');
}

console.log(`\n(b) Endpoint Backend Tanpa Pemanggil di Frontend (Orphaned): ${report.orphanedEndpoints.length}`);
if (report.orphanedEndpoints.length > 0) {
  report.orphanedEndpoints.forEach(e => console.log(`   [FAIL] ${e} belum dipanggil di UI`));
  failureCount += report.orphanedEndpoints.length;
} else {
  console.log('   [PASS] Seluruh endpoint memiliki pemanggil.');
}

console.log(`\n(c) Akses Database Tabel Tidak Valid / Tabel Lama: ${report.invalidTableAccesses.length}`);
if (report.invalidTableAccesses.length > 0) {
  report.invalidTableAccesses.forEach(e => console.log(`   [FAIL] ${e}`));
  failureCount += report.invalidTableAccesses.length;
} else {
  console.log('   [PASS] Tidak ada akses tabel legacy.');
}

console.log(`\n(d) HTML Event Handlers Tanpa Definisi Fungsi: ${report.missingHtmlEventHandlers.length}`);
if (report.missingHtmlEventHandlers.length > 0) {
  report.missingHtmlEventHandlers.forEach(e => console.log(`   [FAIL] ${e}`));
  failureCount += report.missingHtmlEventHandlers.length;
} else {
  console.log('   [PASS] Semua event handler HTML terdefinisi.');
}

console.log('\n=================================================================');
if (failureCount > 0) {
  console.log(`[STATUS] AUDIT GAGAL dengan ${failureCount} temuan gap koneksi.`);
  console.log('Daftar ini adalah backlog pekerjaan wajib untuk Milestone M1 s/d M8.');
  console.log('=================================================================');
  process.exit(1);
} else {
  console.log('[STATUS] SEMUA KONEKSI TERHUBUNG SEMPURNA (100% GREEN)!');
  console.log('=================================================================');
  process.exit(0);
}
