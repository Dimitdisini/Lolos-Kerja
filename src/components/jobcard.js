/**
 * src/components/jobcard.js: Clean Job Card Renderer with Verified Channel Badges
 */

export function renderJobCard(job, options = {}) {
  const isEmail = job.apply_via === 'email' && job.apply_email;
  const emailKind = job.email_kind || (isEmail ? 'recruiting' : null);

  let badgeHtml = '';
  if (emailKind === 'recruiting' || emailKind === 'job_posting') {
    badgeHtml = `<span class="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
      Email Rekrutmen Resmi
    </span>`;
  } else if (emailKind === 'general') {
    badgeHtml = `<span class="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
      Email Umum Perusahaan
    </span>`;
  } else {
    badgeHtml = `<span class="text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
      <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
      Portal Karir Resmi
    </span>`;
  }

  const matchScoreHtml = job.match_score 
    ? `<span class="text-xs font-extrabold font-mono px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">${job.match_score}% Match</span>`
    : '';

  return `
    <div class="dospem-card p-4 sm:p-5 hover:border-blue-400 hover:shadow-md transition space-y-3" data-job-id="${job.id}">
      <div class="flex items-start justify-between gap-3 flex-wrap">
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-sm sm:text-base font-extrabold text-slate-900">${job.title}</h3>
            ${matchScoreHtml}
          </div>
          <div class="text-xs text-slate-600 font-semibold flex items-center gap-2">
            <span>${job.company}</span>
            <span>•</span>
            <span>${job.location || 'Indonesia'}</span>
          </div>
        </div>
        <div>
          ${badgeHtml}
        </div>
      </div>

      ${job.description ? `<p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">${job.description}</p>` : ''}

      <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
        <div class="flex items-center gap-2">
          <button type="button" onclick="practiceInterviewForJob('${job.id}')" class="text-xs font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer">
            Latihan Wawancara
          </button>
        </div>
        <div>
          ${isEmail 
            ? `<button type="button" onclick="blastJobDirect('${job.id}')" class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5">
                Kirim via Auto-Blast
              </button>`
            : `<a href="${job.portal_url || '#'}" target="_blank" rel="noopener noreferrer" class="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-1.5 rounded-xl transition inline-flex items-center gap-1">
                Lamar via Portal ↗
              </a>`
          }
        </div>
      </div>
    </div>
  `;
}
