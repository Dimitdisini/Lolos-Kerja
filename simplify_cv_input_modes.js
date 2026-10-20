const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const protoPath = path.join(__dirname, 'Prototipe Karir Copilot.html');

[indexPath, protoPath].forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Replace 3-pill switcher with clean 2-pill switcher
  const oldSwitcherRegex = /<!-- Tab Switcher 3 Mode Input -->[\s\S]*?<\/div>[\s\S]*?<\/div>/;
  const targetOldSwitcher = `              <!-- Tab Switcher 3 Mode Input -->
              <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 flex-wrap gap-1">
                <button type="button" id="btnModeGrillCv" onclick="switchCvInputMode('grill')" class="text-xs font-bold px-3 py-1.5 rounded-lg transition bg-white text-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                  <span>Tanya Jawab Santai (Grill-Me)</span>
                </button>
                <button type="button" id="btnModeUploadCv" onclick="switchCvInputMode('upload')" class="text-xs font-semibold px-3 py-1.5 rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <span>Unggah PDF</span>
                </button>
                <button type="button" id="btnModeTextCv" onclick="switchCvInputMode('text')" class="text-xs font-semibold px-3 py-1.5 rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  <span>Tempel Teks</span>
                </button>
              </div>`;

  const newSwitcher = `              <!-- Tab Switcher 2 Mode Input (Tanya Jawab Santai vs Unggah CV PDF) -->
              <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                <button type="button" id="btnModeGrillCv" onclick="switchCvInputMode('grill')" class="text-xs font-bold px-3.5 py-1.5 rounded-lg transition bg-white text-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                  <span>Tanya Jawab Santai</span>
                </button>
                <button type="button" id="btnModeUploadCv" onclick="switchCvInputMode('upload')" class="text-xs font-semibold px-3.5 py-1.5 rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <span>Unggah CV (PDF)</span>
                </button>
                <button type="button" id="btnModeTextCv" onclick="switchCvInputMode('text')" class="hidden"></button>
              </div>`;

  if (html.includes(targetOldSwitcher)) {
    html = html.replace(targetOldSwitcher, newSwitcher);
    console.log(`Updated switcher to 2 modes in ${path.basename(filePath)}`);
  }

  // 2. Ensure cvModeUploadView has hidden class by default
  const oldUploadTarget = '<div id="cvModeUploadView" class="space-y-3">';
  const newUploadTarget = '<div id="cvModeUploadView" class="hidden space-y-3">';
  if (html.includes(oldUploadTarget)) {
    html = html.replace(oldUploadTarget, newUploadTarget);
    console.log(`Added hidden class to cvModeUploadView in ${path.basename(filePath)}`);
  }

  // 3. Make sure switchCvInputMode sets the classes cleanly
  const oldActiveInactive = `      const activeClass = 'text-xs font-bold px-3 py-1.5 rounded-lg transition bg-white text-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer';
      const inactiveClass = 'text-xs font-semibold px-3 py-1.5 rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer';`;
  
  const newActiveInactive = `      const activeClass = 'text-xs font-bold px-3.5 py-1.5 rounded-lg transition bg-white text-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer';
      const inactiveClass = 'text-xs font-semibold px-3.5 py-1.5 rounded-lg transition text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer';`;

  if (html.includes(oldActiveInactive)) {
    html = html.replace(oldActiveInactive, newActiveInactive);
  }

  fs.writeFileSync(filePath, html, 'utf8');
});
console.log('Done simplifying CV input modes!');
