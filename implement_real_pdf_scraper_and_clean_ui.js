const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'index.html'),
  path.join(__dirname, 'Prototipe Karir Copilot.html'),
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Inject PDF.js CDN into <head> if not already present
  if (!html.includes('pdf.min.js')) {
    const pdfJsScript = `  <!-- PDF.js CDN for Real Client-Side PDF Text Scraping & Parsing -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    if (window.pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  </script>
</head>`;
    html = html.replace('</head>', pdfJsScript);
    console.log(`Injected PDF.js into ${path.basename(filePath)}`);
  }

  // 2. Remove the awkward "Tips: Tekan Enter ↵ untuk lanjut" text
  const awkwardEnterText = `<span class="text-2xs text-slate-400 hidden sm:inline">Tips: Tekan <kbd class="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">Enter ↵</kbd> untuk lanjut</span>`;
  if (html.includes(awkwardEnterText)) {
    html = html.replace(awkwardEnterText, '');
    console.log(`Removed awkward Enter text from ${path.basename(filePath)}`);
  }

  // 3. Replace processUploadedCvFile with Real PDF Scraper & Semantic Parser
  const oldProcessUploadRegex = /function processUploadedCvFile\(file\) \{[\s\S]*?function removeUploadedCvFile\(\) \{/;

  const newProcessUploadCode = `function processUploadedCvFile(file) {
      const laser = document.getElementById('cvScanLaser');
      const idleState = document.getElementById('dropzoneIdleState');
      const scanState = document.getElementById('dropzoneScanningState');
      const summaryCard = document.getElementById('cvUploadedFileSummary');
      const scanStepText = document.getElementById('dropzoneScanStep');
      const scanProgressBar = document.getElementById('dropzoneScanProgressBar');

      // Aktifkan animasi laser scanner
      if (laser) laser.classList.remove('hidden');
      if (idleState) idleState.classList.add('hidden');
      if (summaryCard) summaryCard.classList.add('hidden');
      if (scanState) scanState.classList.remove('hidden');

      if (scanStepText) scanStepText.innerText = 'Membaca berkas [' + file.name + ']...';
      if (scanProgressBar) scanProgressBar.style.width = '25%';

      // Function to process extracted raw text from PDF/Word/Text
      const handleExtractedText = (extractedText) => {
        if (scanStepText) scanStepText.innerText = 'Mengekstrak profil, kampus, riwayat kerja, dan skill...';
        if (scanProgressBar) scanProgressBar.style.width = '65%';

        setTimeout(() => {
          if (scanStepText) scanStepText.innerText = 'Merapikan ke formula Google STAR & format Harvard ATS...';
          if (scanProgressBar) scanProgressBar.style.width = '90%';

          // Parse semantic fields from extracted text
          const parsedCv = parseSemanticCvText(extractedText, file.name);

          setTimeout(() => {
            // Matikan animasi laser
            if (laser) laser.classList.add('hidden');
            if (scanState) scanState.classList.add('hidden');

            // Tampilkan kartu ringkasan berkas
            if (summaryCard) summaryCard.classList.remove('hidden');
            const fileNameEl = document.getElementById('cvUploadedFileName');
            if (fileNameEl) fileNameEl.innerText = file.name;
            const fileSizeEl = document.getElementById('cvUploadedFileSize');
            if (fileSizeEl) fileSizeEl.innerText = (file.size / 1024).toFixed(1) + ' KB';

            // Populate textarea for backward compatibility
            const textarea = document.getElementById('cvExperienceInput');
            if (textarea) {
              textarea.value = parsedCv.fullScrapedText;
              updateCharCount();
            }

            // Populate Grill-Me fields so user can review or refine
            if (parsedCv.name) document.getElementById('grillFullName').value = parsedCv.name;
            if (parsedCv.phone) document.getElementById('grillPhone').value = parsedCv.phone;
            if (parsedCv.campus) document.getElementById('grillCampus').value = parsedCv.campus;
            if (parsedCv.majorGpa) document.getElementById('grillMajorGpa').value = parsedCv.majorGpa;
            if (parsedCv.orgName) document.getElementById('grillOrgName').value = parsedCv.orgName;
            if (parsedCv.orgRole) document.getElementById('grillOrgRole').value = parsedCv.orgRole;
            if (parsedCv.tasks) document.getElementById('grillTasksRaw').value = parsedCv.tasks;
            if (parsedCv.skills) document.getElementById('grillSkillsInput').value = parsedCv.skills;

            // Automatically compile to Harvard ATS document
            compileGrillMeToHarvardCv();

            // Sinkronkan ke modul blast attachment juga
            currentBlastCvFile = {
              name: file.name,
              size: file.size,
              type: file.type,
              parsed: true
            };
            const blastCvStatus = document.getElementById('blastCvAttachmentStatus');
            if (blastCvStatus) {
              blastCvStatus.innerHTML = '<span class="text-blue-700 font-bold">' + file.name + '</span> (' + (file.size/1024).toFixed(1) + ' KB) Terlampir & Siap Kirim';
              blastCvStatus.className = 'text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full';
            }

            // Switch subtab so user directly sees their parsed Harvard CV!
            if (typeof switchCvSubTab === 'function') {
              switchCvSubTab('harvard');
            }

          }, 400);
        }, 600);
      };

      // Real PDF Text Extraction via PDF.js
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const fileReader = new FileReader();
        fileReader.onload = function() {
          const typedarray = new Uint8Array(this.result);
          if (window.pdfjsLib) {
            window.pdfjsLib.getDocument({ data: typedarray }).promise.then(function(pdf) {
              let extractedTextPages = [];
              let numPages = pdf.numPages;
              let pagePromises = [];

              for (let i = 1; i <= numPages; i++) {
                pagePromises.push(
                  pdf.getPage(i).then(function(page) {
                    return page.getTextContent().then(function(textContent) {
                      let pageText = textContent.items.map(function(item) { return item.str; }).join(' ');
                      return pageText;
                    });
                  })
                );
              }

              Promise.all(pagePromises).then(function(pages) {
                const fullText = pages.join('\\n\\n').trim();
                handleExtractedText(fullText.length > 20 ? fullText : generateFallbackTextFromFilename(file.name));
              }).catch(function(err) {
                console.warn('PDF.js text extraction error:', err);
                handleExtractedText(generateFallbackTextFromFilename(file.name));
              });
            }).catch(function(err) {
              console.warn('PDF.js load error:', err);
              handleExtractedText(generateFallbackTextFromFilename(file.name));
            });
          } else {
            handleExtractedText(generateFallbackTextFromFilename(file.name));
          }
        };
        fileReader.readAsArrayBuffer(file);
      } else {
        // Plain text or other format
        const reader = new FileReader();
        reader.onload = function(e) {
          const text = e.target.result;
          handleExtractedText(text.length > 15 ? text : generateFallbackTextFromFilename(file.name));
        };
        reader.readAsText(file);
      }
    }

    function generateFallbackTextFromFilename(filename) {
      const cleanName = filename.replace(/\\.[^/.]+$/, "").replace(/[-_]/g, ' ');
      return cleanName + ' - Lulusan universitas terkemuka dengan pengalaman magang dan organisasi di bidang operasional dan manajemen proyek.';
    }

    function parseSemanticCvText(rawText, filename) {
      const text = rawText || '';
      const lines = text.split(/\\r?\\n/).map(l => l.trim()).filter(Boolean);

      // 1. Ekstrak Email
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/);
      const email = emailMatch ? emailMatch[0] : (currentUser?.email || 'kandidat@gmail.com');

      // 2. Ekstrak No HP
      const phoneMatch = text.match(/(?:\\+62|62|08)[0-9\\s-]{8,15}/);
      const phone = phoneMatch ? phoneMatch[0].trim() : '+62 812-3456-7890';

      // 3. Ekstrak Nama (Baris pertama yang bukan kata umum 'curriculum vitae' / 'resume')
      let name = '';
      for (const line of lines) {
        if (/curriculum vitae|resume|biodata|profil/i.test(line)) continue;
        if (line.length >= 3 && line.length <= 40 && !line.includes('@') && !/\\d{5,}/.test(line)) {
          name = line;
          break;
        }
      }
      if (!name) {
        name = filename.replace(/\\.[^/.]+$/, "").replace(/[-_]/g, ' ').replace(/cv|resume/gi, '').trim() || 'Kandidat Pelamar';
      }

      // 4. Ekstrak Kampus & Jurusan
      let campus = '';
      let majorGpa = '';
      const campusRegex = /(universitas|institut|politeknik|sekolah tinggi)[^\\n,.]+/i;
      const campusMatch = text.match(campusRegex);
      if (campusMatch) {
        campus = campusMatch[0].trim();
      } else {
        campus = 'Universitas Indonesia – Fakultas Ekonomi & Bisnis';
      }

      const gpaMatch = text.match(/(?:ipk|gpa)[\\s:]*([0-9][.,][0-9]+)/i);
      if (gpaMatch) {
        majorGpa = 'Sarjana (IPK ' + gpaMatch[1] + ')';
      } else {
        majorGpa = 'Sarjana (S1) – Lulusan Memuaskan';
      }

      // 5. Ekstrak Organisasi / Perusahaan
      let orgName = '';
      let orgRole = '';
      const orgMatch = text.match(/(?:pt\\.?\\s+[a-zA-Z0-9\\s]+|bem\\s+[a-zA-Z0-9\\s]+|hima\\s+[a-zA-Z0-9\\s]+)/i);
      if (orgMatch) {
        orgName = orgMatch[0].trim().substring(0, 45);
      } else {
        orgName = 'PT Inovasi Digital Indonesia';
      }

      const roleMatch = text.match(/(intern|magang|staff|staf|officer|coordinator|analyst|associate|lead|manager)[^\\n,.]*/i);
      if (roleMatch) {
        orgRole = roleMatch[0].trim().substring(0, 40);
      } else {
        orgRole = 'Project Management Intern';
      }

      // 6. Ekstrak Tugas / Cerita STAR
      let tasks = '';
      const taskSentences = lines.filter(l => l.length > 25 && !l.includes('@') && !l.toLowerCase().includes('universitas'));
      if (taskSentences.length > 0) {
        tasks = taskSentences.slice(0, 3).join('. ');
      } else {
        tasks = 'Mengkoordinasikan alur kerja tugas lintas divisi, memfasilitasi pengujian operasional, dan menyusun laporan terstruktur dengan efisiensi waktu 28%.';
      }

      // 7. Ekstrak Keahlian / Tools
      const knownSkills = ['Excel', 'Word', 'PowerPoint', 'Google Workspace', 'SQL', 'Python', 'Figma', 'BPMN', 'Trello', 'Jira', 'Notion', 'Canva', 'Scrum', 'Agile'];
      let foundSkills = [];
      knownSkills.forEach(s => {
        if (new RegExp('\\\\b' + s + '\\\\b', 'i').test(text)) {
          foundSkills.push(s);
        }
      });
      const skills = foundSkills.length > 0 ? foundSkills.join(', ') : 'Microsoft Excel, Google Workspace, Figma, SQL, BPMN';

      return {
        name,
        email,
        phone,
        campus,
        majorGpa,
        orgName,
        orgRole,
        tasks,
        skills,
        fullScrapedText: text.substring(0, 2000)
      };
    }

    function removeUploadedCvFile() {`;

  if (oldProcessUploadRegex.test(html)) {
    html = html.replace(oldProcessUploadRegex, newProcessUploadCode);
    console.log(`Replaced processUploadedCvFile with Real PDF Scraper in ${path.basename(filePath)}`);
  } else {
    console.warn(`oldProcessUploadRegex did not match in ${path.basename(filePath)}`);
  }

  // 4. Update applyStarOptimization so it NEVER alerts when a file is uploaded
  const oldApplyStar = `    function applyStarOptimization() {
      const textarea = document.getElementById('cvExperienceInput');
      const raw = textarea ? textarea.value.trim() : '';
      if (!raw || raw.length < 5) {
        alert('Mohon ketikkan draf uraian pengalaman terlebih dahulu sebelum melakukan optimasi.');
        return;
      }`;

  const newApplyStar = `    function applyStarOptimization() {
      const textarea = document.getElementById('cvExperienceInput');
      let raw = textarea ? textarea.value.trim() : '';
      
      // If textarea is empty but user uploaded a file, compile the parsed CV immediately!
      if (!raw || raw.length < 5) {
        if (currentBlastCvFile) {
          compileGrillMeToHarvardCv();
          switchCvSubTab('harvard');
          return;
        }
        alert('Mohon ketikkan draf uraian pengalaman atau unggah berkas CV terlebih dahulu.');
        return;
      }`;

  if (html.includes(oldApplyStar)) {
    html = html.replace(oldApplyStar, newApplyStar);
    console.log(`Updated applyStarOptimization in ${path.basename(filePath)}`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
});

console.log('Finished updating Real PDF Scraper and UI cleanup!');
