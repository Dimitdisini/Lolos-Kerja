import React from 'react';

export default function Hero({ onStartCv, onBrowseJobs }) {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/40 border-b border-slate-200/70">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        
        {/* 1. Top Pill Badge (Dospem Style) */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 text-xs font-semibold text-emerald-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Platform Persiapan &amp; Pengiriman Lamaran Karir Fresh Graduate</span>
        </div>

        {/* 2. Headline H1 Tajam & Berwibawa */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] max-w-4xl mx-auto">
          Dapet Panggilan Kerja Impian <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900">
            Lebih Cepat &amp; Anti-Mager.
          </span>
        </h1>

        {/* 3. Subtitle Padat & Jelas (< 35 kata) */}
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          AI merombak draf CV lamamu ke standar Harvard ATS, mengurasi ratusan lowongan kerja resmi, dan mengirimkan lamaran personal langsung ke email HRD dengan aman.
        </p>

        {/* 4. Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onStartCv}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-[0.98]"
          >
            <span>Rombak CV Jadi Harvard ATS</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onBrowseJobs}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 border border-slate-300 shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Jelajahi 400+ Loker Terkurasi</span>
          </button>
        </div>

        {/* 5. Social Proof Bar (Dospem Style) */}
        <div className="pt-8 sm:pt-12">
          <div className="max-w-4xl mx-auto p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white/80 shadow-2xs grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-left">
            
            <div className="px-2 pt-2 md:pt-0">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">427+</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Loker Aktif Terkurasi</div>
            </div>

            <div className="px-2 pt-2 md:pt-0">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">PT Berbadan Hukum Sah</div>
            </div>

            <div className="px-2 pt-2 md:pt-0">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">0%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Email Bodong / Bounce</div>
            </div>

            <div className="px-2 pt-2 md:pt-0">
              <div className="text-xl sm:text-2xl font-extrabold text-teal-700 font-mono">30 Hari</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Cooldown Anti-Spam HRD</div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
