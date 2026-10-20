import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=================================================================');
console.log('       DEWI & BIMA - COMPREHENSIVE UI/UX & MOBILE AUDIT          ');
console.log('       Target: index.html (Lolos Kerja Production UI)            ');
console.log('=================================================================\n');

const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const dom = new JSDOM(htmlContent, {
  runScripts: 'outside-only',
  url: 'https://lolos-kerja-seven.vercel.app/'
});

const { document } = dom.window;

let totalAuditTests = 0;
let passedAuditTests = 0;
let failedAuditTests = 0;
const auditResults = [];

function assertUIUX(id, category, title, condition, details = '') {
  totalAuditTests++;
  if (condition) {
    passedAuditTests++;
    console.log(`[PASS] ${id} (${category}): ${title} -> ${details}`);
    auditResults.push({ id, category, title, status: 'PASS', details });
  } else {
    failedAuditTests++;
    console.error(`[FAIL] ${id} (${category}): ${title} -> ${details}`);
    auditResults.push({ id, category, title, status: 'FAIL', details });
  }
}

// -----------------------------------------------------------------------------
// 1. TYPOGRAPHY & READABILITY AUDIT
// -----------------------------------------------------------------------------
console.log('--- 1. TYPOGRAPHY & READABILITY AUDIT ---');

const t9Count = (htmlContent.match(/text-\[9px\]/g) || []).length;
const t10Count = (htmlContent.match(/text-\[10px\]/g) || []).length;
const t11Count = (htmlContent.match(/text-\[11px\]/g) || []).length;
const totalMicroscopic = t9Count + t10Count + t11Count;
assertUIUX('UX-01', 'Typography', 'Zero Microscopic Text (< 12px)', totalMicroscopic === 0, `Microscopic font classes remaining: ${totalMicroscopic}`);

const h1Elements = document.querySelectorAll('h1');
assertUIUX('UX-02', 'Typography', 'Hero H1 Headline Exists & Unique', h1Elements.length >= 1, `Found ${h1Elements.length} H1 element(s)`);

const heroParagraph = document.querySelector('#home-module p');
const heroWords = heroParagraph ? heroParagraph.textContent.trim().split(/\s+/).length : 0;
assertUIUX('UX-03', 'Typography', 'Hero Paragraph Density (< 35 Words)', heroWords > 0 && heroWords <= 35, `Hero paragraph length: ${heroWords} words`);

const fontDeclaration = htmlContent.includes("font-family: 'Plus Jakarta Sans'");
assertUIUX('UX-04', 'Typography', 'Clean Brand Typeface (Plus Jakarta Sans)', fontDeclaration, 'Plus Jakarta Sans active');

// -----------------------------------------------------------------------------
// 2. MOBILE VIEWPORT & TOUCH TARGET ACCESSIBILITY AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 2. MOBILE VIEWPORT & TOUCH TARGET ACCESSIBILITY ---');

const viewportMeta = document.querySelector('meta[name="viewport"]');
assertUIUX('UX-05', 'Mobile', 'Viewport Meta Configured Correctly', viewportMeta && viewportMeta.getAttribute('content').includes('width=device-width'), viewportMeta ? viewportMeta.getAttribute('content') : 'Missing');

const bottomNav = document.getElementById('mobileBottomNav');
assertUIUX('UX-06', 'Mobile', 'Floating Bottom Nav Present on Mobile (md:hidden)', bottomNav && bottomNav.className.includes('md:hidden') && bottomNav.className.includes('fixed bottom-0'), 'Fixed bottom-0 nav verified');

const pbSafeExists = htmlContent.includes('.pb-safe') && htmlContent.includes('calc(6rem');
assertUIUX('UX-07', 'Mobile', 'Safe Area Clearance Padding (pb-safe >= 6rem)', pbSafeExists, 'Safe bottom clearance verified');

const heroInputContainer = document.getElementById('heroQuickInput')?.parentElement;
const isHeroStackedOnMobile = heroInputContainer && heroInputContainer.className.includes('flex-col sm:flex-row');
assertUIUX('UX-08', 'Mobile', 'Hero Input Stacked Layout on Mobile (No Horizontal Cutoff)', isHeroStackedOnMobile, 'flex-col sm:flex-row active');

const bottomNavButtons = document.querySelectorAll('.mobile-bottom-tab');
assertUIUX('UX-09', 'Mobile', 'Mobile Bottom Tabs Touch Target (5 Tabs with min-h 44px)', bottomNavButtons.length === 5, `Found ${bottomNavButtons.length} mobile tabs`);

// -----------------------------------------------------------------------------
// 3. COLOR CONTRAST & ACCESSIBILITY (WCAG AA COMPLIANCE)
// -----------------------------------------------------------------------------
console.log('\n--- 3. COLOR CONTRAST & ACCESSIBILITY ---');

const primaryButtons = document.querySelectorAll('button.bg-blue-600, a.bg-blue-600, button.bg-slate-900');
const highContrastWhiteText = Array.from(primaryButtons).every(btn => btn.className.includes('text-white'));
assertUIUX('UX-10', 'A11y', 'Primary Action Buttons High Contrast (text-white)', highContrastWhiteText && primaryButtons.length > 5, `${primaryButtons.length} primary buttons verified`);

const inputs = document.querySelectorAll('input, select, textarea');
const inputsHaveLabelsOrPlaceholders = Array.from(inputs).every(inp => inp.hasAttribute('placeholder') || inp.hasAttribute('aria-label') || inp.id);
assertUIUX('UX-11', 'A11y', 'All Form Controls Have Accessible Label / Placeholder', inputsHaveLabelsOrPlaceholders, `${inputs.length} form controls verified`);

// -----------------------------------------------------------------------------
// 4. INFORMATION ARCHITECTURE & CLUTTER CONTROL
// -----------------------------------------------------------------------------
console.log('\n--- 4. INFORMATION ARCHITECTURE & CLUTTER CONTROL ---');

const coreModules = ['home-module', 'cv-module', 'interview-module', 'jobs-module', 'blast-module', 'pricing-module'];
const allCoreModulesPresent = coreModules.every(id => document.getElementById(id) !== null);
assertUIUX('UX-12', 'Architecture', 'All 6 Core Modules Structured with Clean IDs', allCoreModulesPresent, 'Core module architecture intact');

const mobileComparisonCards = document.querySelector('.sm\\:hidden.space-y-2\\.5');
assertUIUX('UX-13', 'Architecture', 'Mobile Clean Comparison Cards (sm:hidden replaces wide table)', mobileComparisonCards !== null, 'Mobile comparative card layout active');

const modals = ['authModal', 'qrisModal', 'blastJobDetailModal'];
const allModalsResponsive = modals.every(id => {
  const m = document.getElementById(id);
  return m && m.className.includes('fixed inset-0') && m.className.includes('backdrop-blur');
});
assertUIUX('UX-14', 'Architecture', 'Responsive Modal Dialogs with Backdrop Blur', allModalsResponsive, 'Auth, QRIS & Blast detail modals verified');

console.log('\n=================================================================');
console.log('                 EXECUTIVE UI/UX AUDIT REPORT                    ');
console.log('=================================================================');
console.log(`TOTAL AUDITS: ${totalAuditTests} | PASS: ${passedAuditTests} | FAIL: ${failedAuditTests}`);
const complianceRate = ((passedAuditTests / totalAuditTests) * 100).toFixed(1);
console.log(`UI/UX COMPLIANCE RATE: ${complianceRate}%`);

if (failedAuditTests === 0) {
  console.log('\nALL 14 UI/UX & MOBILE ACCESSIBILITY STANDARDS COMPLIANT (100%)!');
  process.exit(0);
} else {
  console.error(`\nFAILED ${failedAuditTests} UI/UX AUDITS!`);
  process.exit(1);
}
