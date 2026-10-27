import React from 'react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8">
        
        {/* Kolom 1: Brand Info */}
        <div className="col-span-2 md:col-span-2 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs">
              LK
            </div>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">Lolos Kerja V2</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
            Platform akselerasi karir mahasiswa &amp; fresh graduate Indonesia. Standar Harvard ATS, kurasi loker legal, dan smart application dispatcher.
          </p>
          <div className="pt-1 text-xs text-slate-400">
            &copy; 2026 PT Lolos Kerja Indonesia &bull; Dimitri HQ Ecosystem.
          </div>
        </div>

        {/* Kolom 2: Fitur Utama */}
        <div>
          <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Fitur Utama</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button type="button" onClick={() => onNavigate && onNavigate('cv')} className="hover:text-emerald-700 transition cursor-pointer">
                CV Studio Harvard ATS
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate && onNavigate('jobs')} className="hover:text-emerald-700 transition cursor-pointer">
                400+ Loker Terkurasi
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate && onNavigate('blast')} className="hover:text-emerald-700 transition cursor-pointer">
                Smart Drip Auto-Blast
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate && onNavigate('comparison')} className="hover:text-emerald-700 transition cursor-pointer">
                Perbandingan Metrik
              </button>
            </li>
          </ul>
        </div>

        {/* Kolom 3: Standar Kualitas */}
        <div>
          <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Standar Kualitas</h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li>100% PT Berbadan Hukum</li>
            <li>Zero Bounce Whitelist</li>
            <li>30-Day Anti-Spam Cooldown</li>
            <li>Optimal Timing 08.30 WIB</li>
            <li>Formula Google STAR</li>
          </ul>
        </div>

        {/* Kolom 4: Ekosistem */}
        <div>
          <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Ekosistem</h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li>Dimitri HQ Practice</li>
            <li>Xavortree Digital</li>
            <li>Dospem.id Inspired</li>
            <li>OpenResume Core</li>
          </ul>
        </div>

      </div>
    </footer>
  );
}
