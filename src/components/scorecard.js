/**
 * src/components/scorecard.js: Dual-Score Matrix & Evaluation Display
 */

export function renderScoreCard({ relevancy = 0, delivery = 0, fillers = 0, wpm = 0, feedback = '' }) {
  return `
    <div class="dospem-card p-4 sm:p-5 space-y-4 border border-slate-200">
      <div class="grid grid-cols-2 gap-3 text-center">
        <div class="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
          <span class="text-xs text-slate-500 block font-medium">Skor Relevansi (STAR)</span>
          <span class="text-xl sm:text-2xl font-extrabold text-blue-700 font-mono">${relevancy}%</span>
        </div>
        <div class="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
          <span class="text-xs text-slate-500 block font-medium">Skor Ketenangan (Delivery)</span>
          <span class="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono">${delivery}%</span>
        </div>
      </div>

      <div class="flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-3">
        <span>Kata Jeda: <strong>${fillers} Terdeteksi</strong></span>
        <span class="font-mono">Tempo: <strong>${wpm} WPM</strong></span>
      </div>

      ${feedback ? `
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
          <strong>Umpan Balik:</strong> ${feedback}
        </div>
      ` : ''}
    </div>
  `;
}
