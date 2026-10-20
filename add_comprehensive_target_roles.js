const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const protoPath = path.join(__dirname, 'Prototipe Karir Copilot.html');

let html = fs.readFileSync(indexPath, 'utf8');

// 1. Replace the select#targetRole with rich categorized options + custom
const oldSelectHtml = `                <select id="targetRole" onchange="runCVAnalysis()" class="dospem-input w-full text-xs rounded-lg p-2.5 font-medium">
                  <option value="business-analyst">Business Analyst / Product Specialist</option>
                  <option value="software-eng">Junior Software Engineer / AI Tech</option>
                  <option value="digital-marketing">Digital Marketing & Growth Lead</option>
                  <option value="operations-trainee">Management / Operations Trainee (MT)</option>
                  <option value="finance-accounting">Finance, Tax & Accounting Analyst</option>
                </select>`;

const newSelectHtml = `                <select id="targetRole" onchange="handleTargetRoleChange()" class="dospem-input w-full text-xs rounded-lg p-2.5 font-medium">
                  <optgroup label="Bisnis, Manajemen & Operasional">
                    <option value="business-analyst" selected>Business Analyst / Product Specialist</option>
                    <option value="operations-trainee">Management Trainee (MT) / ODP Generalist</option>
                    <option value="project-officer">Project Management Officer (PMO)</option>
                    <option value="supply-chain">Supply Chain & Logistik Coordinator</option>
                    <option value="hr-talent">HR & Talent Acquisition Associate</option>
                    <option value="legal-officer">Legal & Corporate Compliance</option>
                  </optgroup>
                  <optgroup label="Teknologi, AI & Data">
                    <option value="software-eng">Junior Software Engineer / Web & Mobile</option>
                    <option value="data-analyst">Data Analyst & Business Intelligence</option>
                    <option value="uiux-designer">UI/UX & Product Designer</option>
                    <option value="ai-prompt-eng">AI Prompt & Machine Learning Engineer</option>
                    <option value="qa-tester">QA / Software Tester & Automation</option>
                    <option value="it-support">IT Support, Network & Cloud DevOps</option>
                    <option value="cyber-security">Cyber Security Analyst</option>
                  </optgroup>
                  <optgroup label="Pemasaran, Konten & Penjualan">
                    <option value="digital-marketing">Digital Marketing & Growth Lead</option>
                    <option value="social-media">Social Media Specialist & Content Creator</option>
                    <option value="copywriter">Copywriter & Brand Communications</option>
                    <option value="sales-b2b">Business Development & Sales Executive</option>
                    <option value="pr-comms">Public Relations (PR) & Event Lead</option>
                  </optgroup>
                  <optgroup label="Keuangan, Akuntansi & Perbankan">
                    <option value="finance-accounting">Finance, Tax & Accounting Analyst</option>
                    <option value="tax-specialist">Konsultan Pajak (Tax Specialist)</option>
                    <option value="audit-assurance">Audit & Assurance Associate</option>
                    <option value="credit-analyst">Credit & Risk Analyst</option>
                    <option value="investment-banking">Investment & Banking Operations</option>
                  </optgroup>
                  <optgroup label="Kreatif, Desain & Layanan">
                    <option value="graphic-designer">Graphic Designer & Visual Artist</option>
                    <option value="video-editor">Video Editor & Motion Designer</option>
                    <option value="customer-success">Customer Success & Relationship</option>
                    <option value="hospitality-trainee">Hospitality & Hotel Trainee</option>
                  </optgroup>
                  <optgroup label="Kustom / Bidang Lain">
                    <option value="custom">+ Posisi Lainnya (Ketik Sendiri...)</option>
                  </optgroup>
                </select>

                <!-- Input Posisi Kustom (Muncul jika pilih 'Posisi Lainnya') -->
                <div id="customRoleInputContainer" class="hidden mt-2 p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      Ketik Posisi Impianmu Sendiri:
                    </span>
                    <span class="text-xs text-blue-700 font-semibold bg-blue-100/70 px-2 py-0.5 rounded-full">AI Menyesuaikan</span>
                  </div>
                  <div class="flex gap-2 flex-col sm:flex-row">
                    <input type="text" id="customTargetRoleInput" oninput="handleCustomRoleInput()" placeholder="misal: Medical Representative, Arsitek, Environmental Specialist..." class="dospem-input w-full p-2 text-xs rounded-lg font-medium bg-white">
                    <button type="button" onclick="triggerScrapeForCustomRole()" class="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-lg whitespace-nowrap transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      <span>Minta Bot Scrape Posisi Ini</span>
                    </button>
                  </div>
                </div>`;

if (html.includes(oldSelectHtml)) {
  html = html.replace(oldSelectHtml, newSelectHtml);
  console.log("Replaced targetRole select with categorized options and custom input container");
} else {
  console.error("Could not find oldSelectHtml");
}

// 2. Add JavaScript handlers: handleTargetRoleChange, handleCustomRoleInput, triggerScrapeForCustomRole
const jsHandlers = `
    function handleTargetRoleChange() {
      const roleElem = document.getElementById('targetRole');
      const customContainer = document.getElementById('customRoleInputContainer');
      if (roleElem && roleElem.value === 'custom') {
        if (customContainer) customContainer.classList.remove('hidden');
        const customInput = document.getElementById('customTargetRoleInput');
        if (customInput) customInput.focus();
      } else {
        if (customContainer) customContainer.classList.add('hidden');
      }
      runCVAnalysis();
    }

    function handleCustomRoleInput() {
      const customInput = document.getElementById('customTargetRoleInput');
      const customVal = customInput ? customInput.value.trim() : '';
      if (customVal) {
        // Sync with blast current role title display
        const blastTitleElem = document.getElementById('blastCurrentRoleTitle');
        if (blastTitleElem) {
          blastTitleElem.innerHTML = '<span>' + customVal + '</span> <span class="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">KUSTOM</span>';
        }
      }
      runCVAnalysis();
    }

    function triggerScrapeForCustomRole() {
      const customInput = document.getElementById('customTargetRoleInput');
      const val = customInput ? customInput.value.trim() : '';
      openRequestScrapingModal(val || 'Posisi Kustom Fresh Graduate');
    }
`;

if (!html.includes('function handleTargetRoleChange()')) {
  const insertMarker = 'function runCVAnalysis() {';
  html = html.replace(insertMarker, jsHandlers + '\n    ' + insertMarker);
  console.log("Inserted custom target role JS handlers");
}

// 3. Update generateHarvardAtsCv to read custom target role properly
const oldRoleTextLogic = `      const roleElem = document.getElementById('targetRole');
      const roleText = roleElem ? roleElem.options[roleElem.selectedIndex].text : 'Junior Business Analyst';`;

const newRoleTextLogic = `      const roleElem = document.getElementById('targetRole');
      let roleText = 'Junior Business Analyst';
      if (roleElem) {
        if (roleElem.value === 'custom') {
          const customVal = document.getElementById('customTargetRoleInput')?.value.trim();
          roleText = customVal || 'Profesional Fresh Graduate';
        } else if (roleElem.selectedIndex >= 0) {
          roleText = roleElem.options[roleElem.selectedIndex].text;
        }
      }`;

if (html.includes(oldRoleTextLogic)) {
  html = html.replace(oldRoleTextLogic, newRoleTextLogic);
  console.log("Updated roleText logic in generateHarvardAtsCv");
}

fs.writeFileSync(indexPath, html, 'utf8');
if (fs.existsSync(protoPath)) {
  fs.writeFileSync(protoPath, html, 'utf8');
}
console.log("Saved updated files successfully!");
