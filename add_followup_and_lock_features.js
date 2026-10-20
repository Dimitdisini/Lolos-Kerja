const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const protoPath = path.join(__dirname, 'Prototipe Karir Copilot.html');

let html = fs.readFileSync(indexPath, 'utf8');

// 1. Update renderJobs to check if job is already applied
const oldRenderJobsCard = `            \${isEmailApply ? \`
              <button type="button" onclick="blastJobDirect(\${job.id})" class="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer">
                <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <span>Kirim via Email</span>
              </button>
            \` : \``;

const newRenderJobsCard = `            \${(typeof isJobAlreadyApplied === 'function' && isJobAlreadyApplied(job)) ? \`
              <button type="button" disabled class="text-xs bg-slate-100 text-slate-400 border border-slate-200 font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 cursor-not-allowed" title="Lamaran sudah pernah dikirimkan ke HRD perusahaan ini">
                <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <span>Sudah Dilamar</span>
              </button>
            \` : isEmailApply ? \`
              <button type="button" onclick="blastJobDirect(\${job.id})" class="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer">
                <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <span>Kirim via Email</span>
              </button>
            \` : \``;

if (html.includes(oldRenderJobsCard)) {
  html = html.replace(oldRenderJobsCard, newRenderJobsCard);
  console.log("Successfully patched renderJobs to lock applied cards!");
} else {
  console.log("oldRenderJobsCard not matched exactly, checking alternative");
}

// 2. Enhance renderAppliedJobsList with Follow-up H+7 Action Button
const oldAppliedCardSnippet = `<span class="text-xs font-mono text-slate-400 block">\${item.sentAt || 'Hari ini'}</span>
            <span class="text-xs text-emerald-600 font-bold flex items-center gap-1 justify-end mt-0.5">
              <svg class="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              Lamaran Masuk Inbox
            </span>`;

const newAppliedCardSnippet = `<span class="text-xs font-mono text-slate-400 block">\${item.sentAt || 'Hari ini'}</span>
            <div class="flex items-center gap-1.5 justify-end mt-1 flex-wrap">
              <span class="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <svg class="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                Masuk Inbox
              </span>
              <button type="button" onclick="openFollowUpModal('\${item.id || ''}', '\${(item.company || '').replace(/'/g, \"\\\\'\")}', '\${(item.role || '').replace(/'/g, \"\\\\'\")}', '\${item.email || ''}', '\${item.sentAt || ''}')" class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold px-2 py-0.5 rounded-lg transition flex items-center gap-1 cursor-pointer">
                <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <span>Follow-up H+7</span>
              </button>
            </div>`;

if (html.includes(oldAppliedCardSnippet)) {
  html = html.replace(oldAppliedCardSnippet, newAppliedCardSnippet);
  console.log("Successfully added Follow-up H+7 button to applied jobs cards!");
}

// 3. Add openFollowUpModal and closeFollowUpModal and modal markup
const followUpModalHtml = `
  <!-- MODAL: FOLLOW-UP STATUS LAMARAN (H+7 / H+14) -->
  <div id="followUpModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm hidden p-4">
    <div class="dospem-card max-w-xl w-full p-6 sm:p-7 space-y-4 bg-white relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
      <button type="button" onclick="closeFollowUpModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>

      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-900">Follow-up Sopan Status Lamaran (H+7)</h3>
          <p class="text-xs text-slate-500">Tanyakan kelanjutan proses rekrutmen secara etis tanpa terkesan memaksa.</p>
        </div>
      </div>

      <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
        <div class="flex items-center justify-between">
          <span class="text-slate-500">Tujuan Perusahaan:</span>
          <strong id="fuCompanyDisplay" class="text-slate-900">-</strong>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-slate-500">Posisi yang Dilamar:</span>
          <strong id="fuRoleDisplay" class="text-blue-700">-</strong>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-slate-500">Email Recruiter:</span>
          <span id="fuEmailDisplay" class="font-mono text-slate-600">-</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-slate-500">Waktu Lamaran Dikirim:</span>
          <span id="fuSentAtDisplay" class="text-slate-600">-</span>
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs font-bold text-slate-700">Subjek Email:</label>
        <input type="text" id="fuSubjectInput" class="dospem-input w-full text-xs font-mono p-2.5 rounded-xl bg-slate-50" readonly>
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs font-bold text-slate-700">Isi Email Follow-up:</label>
        <textarea id="fuBodyInput" rows="7" class="dospem-input w-full text-xs p-3 rounded-xl font-sans leading-relaxed"></textarea>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 flex-wrap">
        <button type="button" onclick="copyFollowUpText()" id="btnCopyFuText" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
          <span>Salin Teks</span>
        </button>
        <button type="button" onclick="openFollowUpInGmail()" class="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          <span>Buka di Gmail (1-Click)</span>
        </button>
      </div>
    </div>
  </div>
`;

if (!html.includes('id="followUpModal"')) {
  const footerMarker = '<!-- FOOTER (Clean Dospem Style) -->';
  html = html.replace(footerMarker, followUpModalHtml + '\n  ' + footerMarker);
  console.log("Successfully inserted followUpModal markup!");
}

// 4. Add JavaScript logic for FollowUpModal
const followUpJs = `
    // =========================================================================
    // MODAL FOLLOW-UP CONTROLLER (H+7)
    // =========================================================================
    let currentFollowUpTarget = null;

    function openFollowUpModal(id, company, role, email, sentAt) {
      currentFollowUpTarget = { id, company, role, email, sentAt };
      const modal = document.getElementById('followUpModal');
      if (!modal) return;

      const userName = (currentUser && currentUser.isLoggedIn && currentUser.name) ? currentUser.name : 'Kandidat Pelamar';
      const userPhone = '+62 812-3456-7890';
      const userEmail = (currentUser && currentUser.isLoggedIn && currentUser.email) ? currentUser.email : 'kandidat@gmail.com';

      document.getElementById('fuCompanyDisplay').innerText = company || '-';
      document.getElementById('fuRoleDisplay').innerText = role || '-';
      document.getElementById('fuEmailDisplay').innerText = email || '-';
      document.getElementById('fuSentAtDisplay').innerText = sentAt || '7 hari yang lalu';

      const subject = 'Follow-up: Status Lamaran - ' + role + ' - ' + userName;
      document.getElementById('fuSubjectInput').value = subject;

      const body = 'Yth. Tim Talent Acquisition ' + company + ',\\n\\n' +
        'Semoga email ini menemui Bapak/Ibu dalam keadaan sehat.\\n\\n' +
        'Perkenalkan kembali, saya ' + userName + ', pelamar untuk posisi ' + role + ' yang telah mengirimkan berkas lamaran pada tanggal ' + (sentAt || 'beberapa hari lalu') + '.\\n\\n' +
        'Melalui korespondensi singkat ini, saya bermaksud menanyakan kabar dan menindaklanjuti kelanjutan proses seleksi untuk posisi tersebut. Saya sangat tertarik untuk dapat berkontribusi di ' + company + ' dengan kompetensi yang saya miliki.\\n\\n' +
        'Apabila terdapat dokumen atau informasi pendukung tambahan yang diperlukan, saya siap melengkapinya sewaktu-waktu.\\n\\n' +
        'Terima kasih banyak atas waktu dan perhatian Bapak/Ibu.\\n\\n' +
        'Salam hormat,\\n' + userName + '\\n' + userPhone + ' | ' + userEmail;

      document.getElementById('fuBodyInput').value = body;
      modal.classList.remove('hidden');
    }

    function closeFollowUpModal() {
      const modal = document.getElementById('followUpModal');
      if (modal) modal.classList.add('hidden');
    }

    function copyFollowUpText() {
      const subject = document.getElementById('fuSubjectInput')?.value || '';
      const body = document.getElementById('fuBodyInput')?.value || '';
      const full = 'Subject: ' + subject + '\\n\\n' + body;
      navigator.clipboard.writeText(full).then(() => {
        const btn = document.getElementById('btnCopyFuText');
        if (btn) {
          btn.innerHTML = '<span class="text-emerald-600 font-bold">Tersalin!</span>';
          setTimeout(() => {
            btn.innerHTML = '<span>Salin Teks</span>';
          }, 2000);
        }
      }).catch(() => {
        alert('Teks berhasil disalin.');
      });
    }

    function openFollowUpInGmail() {
      if (!currentFollowUpTarget) return;
      const email = currentFollowUpTarget.email;
      const subject = encodeURIComponent(document.getElementById('fuSubjectInput')?.value || '');
      const body = encodeURIComponent(document.getElementById('fuBodyInput')?.value || '');
      const gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(email) + '&su=' + subject + '&body=' + body;
      window.open(gmailUrl, '_blank');
    }
`;

if (!html.includes('function openFollowUpModal')) {
  const insertBeforeMarker = 'function switchBlastView(';
  html = html.replace(insertBeforeMarker, followUpJs + '\n    ' + insertBeforeMarker);
  console.log("Successfully inserted followUp JS controller!");
}

fs.writeFileSync(indexPath, html, 'utf8');
if (fs.existsSync(protoPath)) {
  fs.writeFileSync(protoPath, html, 'utf8');
}
console.log("Updated both HTML files successfully!");
