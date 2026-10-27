import React from 'react';

export default function HowItWorks({ onSelectStep }) {
  const steps = [
    {
      number: '01',
      title: 'Rombak CV Jadi Standar Harvard ATS',
      tag: 'Zero-Mager & 1-Kolom Bersih',
      description: 'Cukup tarik berkas CV lamamu (PDF/Word). AI mendeteksi celah format yang bikin gagal screening, menyuntikkan formula Google STAR ber-angka, dan menyusunnya ke standar Harvard ATS.',
      badgeText: 'Skor ATS 94/100 Siap HRD',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      actionKey: 'cv',
      actionLabel: 'Buka CV Studio',
      preview: (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span className="font-bold text-slate-800">Lembar Harvard ATS</span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">94/100</span>
          </div>
          <div className="space-y-1 text-slate-600">
            <div className="h-2 w-3/4 bg-slate-200 rounded"></div>
            <div className="h-2 w-full bg-slate-200 rounded"></div>
            <div className="h-2 w-5/6 bg-slate-200 rounded"></div>
          </div>
        </div>
      )
    },
    {
      number: '02',
      title: 'Pilih Loker Berbadan Hukum Sah',
      tag: '100% PT Resmi & Email HRD',
      description: 'Pilih lowongan kerja terkurasi yang mematuhi 7 Aturan Main Dimitri HQ: khusus bulan berjalan, wilayah Indonesia, bebas penipuan, dan wajib memiliki kontak rekruter korporat asli.',
      badgeText: 'Hanya PT/CV/BUMN Terverifikasi',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      actionKey: 'jobs',
      actionLabel: 'Pilih Lowongan',
      preview: (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">PT Gocean Indonesia</span>
            <span className="text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">recruitment@</span>
          </div>
          <p className="text-slate-600 text-xs">Junior Business Analyst &bull; Jakarta</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Bisa Auto-Blast &amp; Manual</span>
          </div>
        </div>
      )
    },
    {
      number: '03',
      title: 'Kirim Lamaran Personal Sekali Klik',
      tag: 'Auto-Blast atau Kirim via Gmail',
      description: 'Sistem menyiapkan surat lamaran sopan yang otomatis menyebut nama perusahaan dan posisinya. Kirim otomatis dengan jeda aman anti-spam atau buka langsung di tab Gmail pribadimu.',
      badgeText: 'Smart Drip & Jeda Aman',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      actionKey: 'blast',
      actionLabel: 'Kirim Lamaran',
      preview: (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Status Pengiriman</span>
            <span className="text-slate-500 font-mono">1/3 Selesai</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '65%' }}></div>
          </div>
          <div className="flex gap-1.5 pt-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Auto-Blast</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">Tab Gmail</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="py-12 sm:py-16 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <div className="inline-block text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">
            Cara Kerja Platform
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            3 Langkah Mudah Menuju Panggilan Kerja
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Tanpa perlu pusing memikirkan desain grafis CV atau menghabiskan seharian menyalin surat lamaran satu per satu.
          </p>
        </div>

        {/* Bento Grid 3 Kolom ala Dospem.id */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div 
              key={step.number}
              className="p-6 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 hover:border-slate-300 transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                
                {/* Header Kartu */}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-300 font-mono">
                    {step.number}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${step.badgeColor}`}>
                    {step.tag}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {step.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.description}
                </p>

                {/* Micro Visual Card */}
                <div className="pt-1">
                  {step.preview}
                </div>

              </div>

              {/* Action Button Link */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectStep && onSelectStep(step.actionKey)}
                  className="w-full text-xs font-bold text-slate-800 hover:text-emerald-700 py-2 rounded-xl transition flex items-center justify-between cursor-pointer group"
                >
                  <span>{step.actionLabel}</span>
                  <span className="text-slate-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
