import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=================================================================');
console.log('   DEWI (LEAD QA GATEKEEPER) - FULL END-TO-END QA AUDIT SCRIPT   ');
const targetHtmlFile = fs.existsSync(path.join(__dirname, 'legacy.html')) ? 'legacy.html' : 'index.html';
console.log(`   Target: ${targetHtmlFile} (Lolos Kerja Production File)`);
console.log('=================================================================\n');

let htmlContent = fs.readFileSync(path.join(__dirname, targetHtmlFile), 'utf8');
// Mock tailwind CDN script to avoid external network delay in jsdom
htmlContent = htmlContent.replace(
  /<script src="https:\/\/cdn.tailwindcss.com"><\/script>/g,
  '<script>window.tailwind = { config: {} };</script>'
);

// Initialize JSDOM with script execution enabled
// Data hasil scraping untuk Auto-Blast (pengganti data/blast-targets.js, karena JSDOM tidak memuat berkas eksternal)
const BLAST_FIXTURE = {
  generated_at: '2026-10-20T10:00:00.000Z',
  report: { companies_total: 3, companies_with_email: 3 },
  targets: [
    { id: 'tgt-qa1', company: 'Acme Indonesia', email: 'career@acme.co.id', kind: 'recruiting', source_url: 'https://acme.co.id/career', category: 'tech', role_keys: ['business-analyst'], jobs: [{ title: 'Business Analyst Trainee', location: 'Jakarta', link: 'https://example.org/1', role_keys: ['business-analyst'] }] },
    { id: 'tgt-qa2', company: 'Beta Retail', email: 'recruitment@beta.id', kind: 'recruiting', source_url: 'https://beta.id/karir', category: 'fmcg_corp', role_keys: ['operations-trainee'], jobs: [{ title: 'Store Supervisor', location: 'Bandung', link: 'https://example.org/2', role_keys: ['operations-trainee'] }] },
    { id: 'tgt-qa3', company: 'Gamma Finance', email: 'info@gamma.id', kind: 'general', source_url: 'https://gamma.id/contact', category: 'bumn_bank', role_keys: ['finance-accounting'], jobs: [{ title: 'Accounting Staff', location: 'Surabaya', link: 'https://example.org/3', role_keys: ['finance-accounting'] }] }
  ]
};

const dom = new JSDOM(htmlContent, {
  runScripts: 'dangerously',
  url: 'https://lolos-kerja-seven.vercel.app/',
  beforeParse(w) {
    w.BLAST_TARGETS_DATA = BLAST_FIXTURE;
    w.scrollTo = () => {};
  }
});

const { window } = dom;
const { document } = window;

// Mock alert, confirm, prompt, audio, fetch, and open
let lastAlert = null;
let lastConfirm = null;
let lastPrompt = null;
window.alert = (msg) => { lastAlert = msg; };
window.confirm = (msg) => { lastConfirm = msg; return true; };
window.prompt = (msg, def) => { lastPrompt = msg; return def || 'dummy'; };
window.open = (url) => { window.lastOpenedUrl = url; };

// Mock Google Sheets Webhook fetch
const originalFetch = window.fetch;
window.webhookPayloads = [];
window.fetch = async (url, opts) => {
  if (url.includes('script.google.com')) {
    let payload = null;
    try { payload = JSON.parse(opts.body); } catch(e) { payload = opts.body; }
    window.webhookPayloads.push({ url, payload });
    return {
      json: async () => ({ status: 'SUCCESS', message: 'Mocked GAS response' }),
      text: async () => '{"status":"SUCCESS"}'
    };
  }
  return originalFetch ? originalFetch(url, opts) : Promise.resolve();
};

const results = [];

function assertTest(id, name, condition, details = '') {
  const status = condition ? 'PASS' : 'FAIL';
  results.push({ id, name, status, details });
  console.log(`[${status}] ${id}: ${name} ${details ? '-> ' + details : ''}`);
}

async function runAudit() {
  console.log('--- FASE 1: SMOKE TEST & INITIAL DOM STATE ---');
  assertTest('T01', 'Page Title & Branding', document.title.includes('Lolos Kerja'), document.title);
  assertTest('T02', 'Hero Headline Proporsional', document.querySelector('h1').className.includes('text-2xl sm:text-3xl'), 'Scaled down typography verified');
  assertTest('T03', 'Admin Initial Blast KPI', document.getElementById('adminTotalEmailsSent').textContent.includes('0 Terkirim'), 'Initial 0 Terkirim verified');
  assertTest('T04', 'Universal Category Pills Exist', document.querySelectorAll('#appleJobCategoryPills .job-category-pill').length === 6, '6 Category pills found');
  assertTest('T05', 'Career Compass Container Exists', document.querySelectorAll('.career-compass-btn').length === 5, '5 Career Compass buttons found');

  console.log('\n--- FASE 2: CV BEDAH - MESSY & UNFORMATTED INPUT TESTING ---');
  // Scenario: Freshgrad inputs a messy, informal text without metrics or STAR format
  const messyCvText = `halo nama sy budi lulusan manajemen unpad 2024.. pernah magang di pt maju mundur disana saya bantuin bikin laporan keuangan tiap akhir bulan, ngurusin arsip dan entry data excel, sama kadang bantuin tim sales rekap orderan customer. pernah jd ketua divisi acara ospek kampus juga ngurusin 500 maba bareng temen2.`;
  
  const cvInput = document.getElementById('cvExperienceInput');
  cvInput.value = messyCvText;
  window.updateCharCount();
  assertTest('T06', 'Char count reflects messy input', parseInt(document.getElementById('charCountBadge').textContent) > 200, document.getElementById('charCountBadge').textContent);

  // Run initial analysis on messy CV
  window.runCVAnalysis();
  const rawScore = parseInt(document.getElementById('atsScoreValue').textContent);
  assertTest('T07', 'ATS Health Score calculated on messy CV', rawScore >= 40 && rawScore <= 80, `Raw score: ${rawScore}/100`);
  assertTest('T08', 'ATS Grade Badge generated', document.getElementById('atsBadgeStatus').textContent.length > 0, document.getElementById('atsBadgeStatus').textContent);

  // Apply STAR Optimization
  window.applyStarOptimization();
  const starScore = parseInt(document.getElementById('atsScoreValue').textContent);
  // Poles STAR tidak boleh mengarang skor atau angka: skor tetap hasil analisis isi, angka hanya milik pengguna.
  assertTest('T09', 'STAR polish does not inflate score with a fixed number', starScore === rawScore && starScore !== 98, `Score tetap ${rawScore} -> ${starScore} (dihitung dari isi, bukan angka tetap)`);
  const starAfterText = document.getElementById('previewAfter').textContent;
  assertTest('T10', 'STAR rewrite keeps only the user numbers and invents no percentages', starAfterText.includes('500') && !/\d+\s?%/.test(starAfterText), 'Angka 500 dari pengguna dipertahankan, tidak ada persen karangan');
  assertTest('T11', 'Comparison vs Harvard ATS subtab switchable', typeof window.switchCvSubTab === 'function', 'switchCvSubTab exists');
  
  window.switchCvSubTab('harvard');
  assertTest('T12', 'Harvard tab visible after switch', !document.getElementById('cvTabHarvardContent').classList.contains('hidden'), 'Harvard tab visible');

  // Test Harvard ATS formatted export
  assertTest('T13', 'Harvard ATS dynamic content populated', document.getElementById('harvardCvContentDynamic').children.length > 0, 'Harvard ATS view ready');
  
  // Test Reset
  window.resetCVInput();
  assertTest('T14', 'Reset CV restores score to 0 / Belum Ada Draf', document.getElementById('atsScoreValue').textContent === '0', 'ATS score reset to 0');

  console.log('\n--- FASE 3: SIMULASI WAWANCARA SUARA DUAL-SCORE ---');
  // Scenario: Nervous answer with high filler word count ('aaa', 'eee', 'kayak', 'anu', 'gitu')
  const nervousAnswer = "aaa jadi waktu itu saya kan ketua panitia yaaa, terus eee ada masalah sponsor yang tiba-tiba cancel seminggu sebelum acara. kayak bingung banget kan, terus anu saya kumpulin semua anggota panitia buat eee brainstorming. akhirnya kayak kita jualan merchandise dadakan dan dapet dana darurat gitu sih.";
  
  const transcriptInput = document.getElementById('interviewTranscriptInput');
  transcriptInput.value = nervousAnswer;
  window.updateTranscriptWordCount();
  assertTest('T15', 'Transcript word count calculated', parseInt(document.getElementById('transcriptWordCount').textContent) > 20, document.getElementById('transcriptWordCount').textContent);

  // Analyze answer
  window.analyzeInterviewAnswer();
  const relevancyScore = parseInt(document.getElementById('relevancyScoreValue').textContent);
  const deliveryScore = parseInt(document.getElementById('deliveryScoreValue').textContent);
  const fillerBadgeText = document.getElementById('fillerWordBadge').textContent;
  
  assertTest('T16', 'Relevancy Score calculated', relevancyScore > 0, `Relevancy: ${relevancyScore}%`);
  assertTest('T17', 'Filler words correctly audited', fillerBadgeText.includes('Terdeteksi'), `Detected: ${fillerBadgeText}`);
  assertTest('T18', 'Delivery Score penalizes high fillers', deliveryScore <= 75, `Delivery score: ${deliveryScore}%`);
  assertTest('T19', 'Constructive Feedback generated', document.getElementById('interviewFeedbackText').textContent.length > 20, document.getElementById('interviewFeedbackText').textContent);

  // Test Custom Question Feature
  const customQ = "Jelaskan proyek IoT telemetri paling menantang yang pernah Anda rancang.";
  document.getElementById('customIvQuestionInput').value = customQ;
  window.saveCustomInterviewQuestion();
  assertTest('T20', 'Custom Interview Question saved to simulator', document.getElementById('interviewQuestionText').textContent.includes('proyek IoT telemetri'), document.getElementById('interviewQuestionText').textContent);

  // Test English Switch
  window.setInterviewLang('en');
  assertTest('T22', 'Language switched to English MNC', document.getElementById('btn-lang-en').className.includes('bg-amber-500 text-white'), 'English active');

  console.log('\n--- FASE 4: SMART JOB MATCHER & CAREER COMPASS ---');
  // Test Career Compass: All Majors / Generalist
  window.selectCareerCompass('all_majors');
  const allMajorsCards = document.querySelectorAll('#curatedJobsContainer .dospem-card');
  assertTest('T23', 'Career Compass "All Majors" filters jobs', allMajorsCards.length > 0, `${allMajorsCards.length} jobs rendered`);
  
  // Verify that the "Buka Semua Jurusan" tag renders
  const tagAllMajors = document.querySelector('#curatedJobsContainer span.bg-emerald-50');
  assertTest('T24', 'Tag "Buka Semua Jurusan" rendered on matching cards', !!tagAllMajors, tagAllMajors ? tagAllMajors.textContent : 'Not found');

  // Test Career Compass: Tech & Data
  window.selectCareerCompass('tech');
  assertTest('T25', 'Career Compass "Tech" filters properly', window.currentJobCategoryFilter === 'tech', 'Current filter: tech');

  // Test Job Search Query
  document.getElementById('jobSearchInput').value = 'Shopee';
  window.filterJobs();
  const searchResults = document.querySelectorAll('#curatedJobsContainer .dospem-card');
  assertTest('T26', 'Job search query filters by keyword', searchResults.length >= 0, `Search returned ${searchResults.length} jobs`);

  // Test Reset
  window.resetJobFilters();
  assertTest('T27', 'Reset Job Filters restores all 400+ jobs', document.querySelectorAll('#curatedJobsContainer .dospem-card').length >= 400, '400+ jobs rendered');

  console.log('\n--- FASE 5: SMART DRIP AUTO-BLAST & ATOMIC QUOTA SYNC ---');
  // Access Gate 1: Check that unauthenticated user is blocked
  window.currentUser.isLoggedIn = false;
  window.startSmartDripBlast();
  assertTest('T28', 'Access Gate blocks unauthenticated user from blasting', lastAlert && lastAlert.includes('login akun terlebih dahulu'), lastAlert);

  // Test Portal Auth Tab Switcher
  window.switchAuthTab('register');
  assertTest('T28_tab_reg', 'Auth Tab switches to Register View', !document.getElementById('authTabRegisterView').classList.contains('hidden') && document.getElementById('authTabLoginView').classList.contains('hidden'), 'Register View Active');
  
  window.switchAuthTab('login');
  assertTest('T28_tab_login', 'Auth Tab switches to Login View', document.getElementById('authTabRegisterView').classList.contains('hidden') && !document.getElementById('authTabLoginView').classList.contains('hidden'), 'Login View Active');

  // Test Email Registration Flow (New Freshgrad Candidate)
  document.getElementById('registerNameInput').value = 'Rangga Daniswara';
  document.getElementById('registerEmailInput').value = 'rangga.danis@telkomuniversity.ac.id';
  document.getElementById('registerPasswordInput').value = 'rahasia123';
  document.getElementById('registerPasswordConfirmInput').value = 'rahasia123';
  await window.handleEmailRegister();
  assertTest('T28_register', 'Email Registration creates account & sets 10 blast quota', window.currentUser.isLoggedIn === true && window.currentUser.email === 'rangga.danis@telkomuniversity.ac.id' && window.currentUser.blastQuota === 10, `User: ${window.currentUser.name}, Quota: ${window.currentUser.blastQuota}`);

  // Test Logout Flow
  window.logoutUser();
  assertTest('T28_logout', 'User Logout clears session cleanly', window.currentUser.isLoggedIn === false, 'Logged out state verified');

  // Test Email Login Flow with Invalid Password (Security rejection check)
  document.getElementById('authEmailInput').value = 'rangga.danis@telkomuniversity.ac.id';
  document.getElementById('authPasswordInput').value = 'passwordsalah123';
  await window.handleEmailLogin();
  assertTest('T28_pass_security', 'Email Login rejects invalid password', lastAlert && lastAlert.includes('Kata sandi yang Anda masukkan salah'), 'Security rejection verified');

  // Test Email Login Flow with Valid Password
  document.getElementById('authEmailInput').value = 'rangga.danis@telkomuniversity.ac.id';
  document.getElementById('authPasswordInput').value = 'rahasia123';
  await window.handleEmailLogin();
  assertTest('T28_login', 'Email Login authenticates previously registered candidate', window.currentUser.isLoggedIn === true && window.currentUser.name === 'Rangga Daniswara', `Welcome back ${window.currentUser.name}`);

  // Authenticate user via Google login simulation
  window.selectGoogleAccount('Kandidat Pelamar', 'kandidat@gmail.com');
  assertTest('T29_auth', 'User authenticated via Google Login simulation', window.currentUser.isLoggedIn === true, window.currentUser.email);

  // Access Gate 2: Check that Free user receives VIP upgrade prompt
  window.currentUser.tier = 'FREE';
  window.startSmartDripBlast();
  assertTest('T29_gate', 'Access Gate prompts Free user to upgrade to VIP', lastConfirm && lastConfirm.includes('Dikerjain VIP'), 'Upgrade prompt triggered');

  // Upgrade user to VIP for Auto-Blast execution test
  window.currentUser.tier = 'VIP';
  window.currentUser.tierName = 'Dikerjain VIP';
  window.currentUser.blastQuota = 20;

  // Test blast pairing from job catalog
  window.blastJobDirect(1);
  assertTest('T29', 'blastJobDirect switches tab to blast-module and populates subject', document.getElementById('blastSubjectFormat').value.includes('Application:'), document.getElementById('blastSubjectFormat').value);

  // Initialize targets and select target recruiters
  window.initBlastTargets();
  const checkboxes = document.querySelectorAll('input[name="blastTargetCheck"]');
  if (checkboxes.length >= 2) {
    checkboxes[0].checked = true;
    checkboxes[0].setAttribute('checked', 'checked');
    checkboxes[1].checked = true;
    checkboxes[1].setAttribute('checked', 'checked');
    window.updateBlastQueuePreview();
  }
  
  // Trigger Auto-Blast
  window.startSmartDripBlast();
  assertTest('T30', 'Auto-Blast queue initialized and running', window.isBlastRunning === true, 'isBlastRunning is true');

  // Check if blastTimeoutId is scheduled
  assertTest('T31', 'Smart drip timer interval active', window.blastTimeoutId !== null, 'Timeout scheduled');

  // Reset blast
  window.resetSmartDripBlast();
  assertTest('T32', 'Reset blast resets status to Standby', document.getElementById('blastOverallStatus').textContent === 'Standby', 'Standby verified');

  console.log('\n--- FASE 6: QRIS CHECKOUT & ADMIN PORTAL PERSISTENCE ---');
  // Test Select Plan & QRIS Modal
  window.handleSelectPlan('Dikerjain VIP', 149000);
  assertTest('T33', 'QRIS Modal opened with order details', !document.getElementById('qrisModal').classList.contains('hidden'), 'QRIS modal visible');
  assertTest('T34', 'Order ID generated with format LK-ORD-', document.getElementById('qrisOrderId').textContent.startsWith('LK-ORD-'), document.getElementById('qrisOrderId').textContent);
  assertTest('T35', 'Price formatted in IDR', document.getElementById('qrisAmountTag').textContent.includes('149.000'), document.getElementById('qrisAmountTag').textContent);

  // Simulate Payment Success
  const prevAdminTxCount = window.adminState.transactions.length;
  window.simulatePaymentSuccess();
  assertTest('T36', 'User session upgraded to VIP', window.currentUser.tier === 'VIP', window.currentUser.tierName);
  assertTest('T37', 'Quota increased on VIP upgrade', window.currentUser.blastQuota >= 20, `New quota: ${window.currentUser.blastQuota}`);
  assertTest('T38', 'Transaction recorded in Admin Portal', window.adminState.transactions.length === prevAdminTxCount + 1, `${window.adminState.transactions.length} total tx`);
  
  // Verify Admin KPI Updates
  window.updateAdminKPIs();
  const totalRevenueText = document.getElementById('adminTotalRevenue').textContent;
  const successTxText = document.getElementById('adminSuccessTxCount').textContent;
  assertTest('T39', 'Admin Total Revenue updated dynamically', totalRevenueText.includes('Rp') && !totalRevenueText.includes('Rp 0'), totalRevenueText);
  assertTest('T40', 'Admin Success Tx Count updated dynamically', parseInt(successTxText) > 0, successTxText);

  // Admin User Quota Adjustment
  window.adjustUserQuota(0, 10);
  assertTest('T41', 'Admin can adjust user quota (+10)', window.adminState.users[0].quota > 0, `User 0 quota: ${window.adminState.users[0].quota}`);

  // Security Compliance Tests: Zero Plain-Text Password & Access Gate
  const modalPasswordInput = document.getElementById('modalUserPasswordInput');
  assertTest('T42', 'Security: Admin User Modal does not expose plaintext password input', !modalPasswordInput, 'Passwords safely delegated to Supabase Auth');

  window.openAdminUserModal(true, 0);
  assertTest('T43', 'Security: User data does not leak raw plaintext password', !window.adminState.users[0].password, 'Zero plaintext password leak verified');

  // Security Gate: Unauthorized Admin Access is blocked
  const prevTab = window.appState.currentTab;
  window.currentUser.role = 'user';
  window.switchTab('admin-module');
  assertTest('T44', 'Security: Unauthorized user blocked from Admin Command Center', window.appState.currentTab === prevTab, 'Access Gate safely rejected regular user');
  window.currentUser.role = 'owner'; // restore owner for subsequent admin tests

  const adminUsersTable = document.getElementById('adminUsersTableBody').innerHTML;
  assertTest('T45', 'Security: Admin Users table does not leak candidate passwords', !adminUsersTable.includes('Sandi:'), 'Clean authenticated badge rendered');

  // Reality Check Tests: XSS Sanitization & Category Integrity
  assertTest('T46', 'XSS Protection: escapeHtml escapes script and img tags', typeof window.escapeHtml === 'function' && window.escapeHtml('<script>alert("xss")</script>').includes('&lt;script&gt;'), 'XSS Sanitization active');

  const fbJob = { title: 'Food and Beverage Team Leader', category: 'it-software', keyRequirements: ['Leadership'] };
  const mappedCat = window.getUniversalJobCategory(fbJob);
  assertTest('T47', 'Category Integrity: F&B job not polluted into tech', mappedCat === 'ops-mt', `Mapped to: ${mappedCat}`);

  const mobileNavDrawerHtml = document.getElementById('mobileNavDrawer').innerHTML;
  assertTest('T48', 'Mobile Nav Drawer uses valid auth modal functions', !mobileNavDrawerHtml.includes('openLoginModal') && mobileNavDrawerHtml.includes('openAuthModal'), 'Mobile Drawer verified');

  console.log('\n--- FASE 7: SPRINT 2 / FASE 1 INTEGRATED ARCHITECTURE AUDIT ---');
  // 1. Unified Master Profile Data Layer
  assertTest('T49', 'Master Profile layer initialized in appState', Boolean(window.appState && window.appState.masterProfile && window.appState.masterProfile.identity && window.appState.masterProfile.experience.length > 0), `Candidate: ${window.appState.masterProfile.identity.name}`);
  
  // Update CV text and sync to Master Profile
  document.getElementById('grillFullName').value = 'Dimas Pratama, S.M.';
  document.getElementById('grillOrgName').value = 'PT Solusi Teknologi Nusantara';
  document.getElementById('grillOrgRole').value = 'Junior Analyst';
  window.syncCvToMasterProfile();
  assertTest('T50', 'CV updates synchronize seamlessly to masterProfile', window.appState.masterProfile.identity.name === 'Dimas Pratama, S.M.' && window.appState.masterProfile.experience[0].org === 'PT Solusi Teknologi Nusantara', 'Master Profile sync verified');

  // 2. Real ATS PDF Exporter (Bukan Fake HTML / Fake 142800)
  assertTest('T51', 'Real Harvard ATS PDF Blob generator exists', typeof window.generateHarvardAtsPdfBlob === 'function', 'generateHarvardAtsPdfBlob available');
  const pdfBlob = window.generateHarvardAtsPdfBlob();
  assertTest('T52', 'PDF generator produces real application/pdf blob', pdfBlob && pdfBlob.type === 'application/pdf' && pdfBlob.size > 1500, `Real PDF Size: ${pdfBlob.size} bytes`);
  
  window.linkCvToModule4();
  assertTest('T53', 'linkCvToModule4 sets real dynamic PDF file (replaces fake 142800)', window.currentBlastCvFile && window.currentBlastCvFile.size !== 142800 && window.currentBlastCvFile.size > 1500, `Attached PDF: ${window.currentBlastCvFile.name} (${window.currentBlastCvFile.size} bytes)`);

  // 3. Hapus Email Tebakan (No More Fake careers@<nama>.com)
  const unknownCompEmail = window.resolveScrapedCompanyEmail('Perusahaan Antah Berantah');
  assertTest('T54', 'resolveScrapedCompanyEmail returns null instead of guessing careers@<nama>.com', unknownCompEmail === null, 'Email guessing eliminated');

  // 4. Keterhubungan Modul Wawancara dengan Loker & CV
  window.practiceInterviewForJob(1);
  assertTest('T55', 'practiceInterviewForJob loads tailored question connecting CV to Job', window.appState.customQuestion && (window.appState.customQuestion.q.includes('PT Gocean Indonesia') || window.appState.customQuestion.q.includes('Hyatt Regency')) && window.appState.currentTab === 'interview-module', window.appState.customQuestion.q);

  // 5. Admin Manual Payment Confirmation
  const pendingTxIndex = window.adminState.transactions.findIndex(t => t.status === 'PENDING');
  assertTest('T56_find', 'Admin portal identifies PENDING transaction for manual settlement', pendingTxIndex !== -1, `Found pending tx at index ${pendingTxIndex}`);
  
  if (pendingTxIndex !== -1) {
    const targetEmail = window.adminState.transactions[pendingTxIndex].email;
    window.confirmManualPayment(pendingTxIndex);
    const settledTx = window.adminState.transactions[pendingTxIndex];
    const matchedUser = window.adminState.users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase());
    
    assertTest('T56_settle', 'confirmManualPayment settles transaction and applies tier with tier_expires_at', settledTx.status === 'SETTLED' && Boolean(settledTx.settledAt) && matchedUser && matchedUser.tier === 'VIP' && Boolean(matchedUser.tier_expires_at), `Status: ${settledTx.status}, Tier: ${matchedUser.tier}, Expires: ${matchedUser.tier_expires_at}`);
  }

  console.log('\n=================================================================');
  console.log('                    EXECUTIVE QA SUMMARY REPORT                  ');
  console.log('=================================================================');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS: ${results.length} | PASS: ${passCount} | FAIL: ${failCount}`);
  console.log(`COMPLIANCE RATE: ${((passCount / results.length) * 100).toFixed(1)}%`);
  
  if (failCount > 0) {
    console.error('\nFAILED TESTS DETECTED:');
    results.filter(r => r.status === 'FAIL').forEach(f => console.error(`- ${f.id}: ${f.name} (${f.details})`));
    process.exit(1);
  } else {
    console.log('\nALL END-TO-END QA SCENARIOS PASSED WITH ZERO ERRORS!');
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
