import React from 'react';

export default function Navbar({ onNavigate, activeTab = 'home', applicationsCount = 0 }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-4">
        
        {/* Brand Logo (Pill Minimalis Modern ala Dospem) */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer select-none" 
          onClick={() => onNavigate && onNavigate('home')}
        >
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs tracking-tight shadow-sm">
            LK
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Lolos Kerja
            </span>
            <span className="hidden sm:inline-block text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-full">
              Platform Karir AI
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
          <button 
            type="button"
            onClick={() => onNavigate && onNavigate('steps')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'steps' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            3 Langkah Kerja
          </button>
          
          <button 
            type="button"
            onClick={() => onNavigate && onNavigate('cv')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'cv' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            CV Studio
          </button>

          <button 
            type="button"
            onClick={() => onNavigate && onNavigate('jobs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'jobs' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Katalog Loker
          </button>

          <button 
            type="button"
            onClick={() => onNavigate && onNavigate('blast')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'blast' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Kirim Lamaran
          </button>

          <button 
            type="button"
            onClick={() => onNavigate && onNavigate('tracker')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tracker' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>Pelacak Lamaran</span>
            {applicationsCount > 0 && (
              <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.2 rounded-full">
                {applicationsCount}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => onNavigate && onNavigate('comparison')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'comparison' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Perbandingan
          </button>
        </nav>

        {/* CTA Button Kanan */}
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={() => onNavigate && onNavigate('cv')}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Mulai Gratis</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

      </div>
    </header>
  );
}
