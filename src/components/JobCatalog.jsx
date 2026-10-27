import React, { useState, useMemo } from 'react';
import { curatedJobs } from '../data/curatedJobs.js';

export default function JobCatalog({ 
  selectedJobs = [], 
  onToggleJob,
  onProceedToBlast 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all'); // 'all' | 'email' | 'portal'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Selected IDs set for quick lookup
  const selectedIdSet = useMemo(() => {
    return new Set(selectedJobs.map(j => String(j.id)));
  }, [selectedJobs]);

  // Categories definition
  const CATEGORIES = [
    { key: 'all', label: 'Semua Bidang', count: curatedJobs.length },
    { key: 'business-operations', label: 'Bisnis & Operasional', count: curatedJobs.filter(j => j.category === 'business-operations' || (j.category && j.category.includes('business'))).length },
    { key: 'it-software', label: 'Teknologi & AI', count: curatedJobs.filter(j => j.category === 'it-software' || (j.category && j.category.includes('it'))).length },
    { key: 'ops-mt', label: 'Management Trainee', count: curatedJobs.filter(j => j.category === 'ops-mt' || (j.category && j.category.includes('mt'))).length },
    { key: 'marketing-sales', label: 'Marketing & Sales', count: curatedJobs.filter(j => j.category === 'marketing-sales' || (j.category && j.category.includes('marketing'))).length },
    { key: 'finance-banking', label: 'Keuangan & Bank', count: curatedJobs.filter(j => j.category === 'finance-banking' || (j.category && j.category.includes('finance'))).length }
  ];

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return curatedJobs.filter(job => {
      // 1. Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = (job.title || '').toLowerCase().includes(query);
        const matchComp = (job.company || '').toLowerCase().includes(query);
        const matchLoc = (job.location || '').toLowerCase().includes(query);
        const matchSkills = (job.keyRequirements || []).some(k => k.toLowerCase().includes(query));
        if (!matchTitle && !matchComp && !matchLoc && !matchSkills) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all') {
        const cat = (job.category || '').toLowerCase();
        if (selectedCategory === 'business-operations' && !cat.includes('business') && !cat.includes('operasional')) return false;
        if (selectedCategory === 'it-software' && !cat.includes('it') && !cat.includes('tech') && !cat.includes('software')) return false;
        if (selectedCategory === 'ops-mt' && !cat.includes('mt') && !cat.includes('ops') && !cat.includes('management')) return false;
        if (selectedCategory === 'marketing-sales' && !cat.includes('marketing') && !cat.includes('sales')) return false;
        if (selectedCategory === 'finance-banking' && !cat.includes('finance') && !cat.includes('bank')) return false;
      }

      // 3. Method filter
      if (selectedMethod === 'email' && job.applyMethod !== 'email') return false;
      if (selectedMethod === 'portal' && job.applyMethod !== 'portal' && job.applyMethod !== 'link') return false;

      return true;
    });
  }, [searchTerm, selectedCategory, selectedMethod]);

  // Paginated jobs
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(start, start + itemsPerPage);
  }, [filteredJobs, currentPage]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;

  const handleSelectJob = (job) => {
    if (onToggleJob) {
      onToggleJob(job);
    }
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative pb-28">
      
      {/* Top Header Badge */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Langkah 2: Katalog Lowongan Terverifikasi (427 Loker)
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pilih 3–5 Target Loker Resmi Indonesia
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          100% lowongan dari korporat berbadan hukum resmi (PT/CV/Tbk). Seluruh data disaring ketat berdasarkan 7 Aturan Main Dimitri HQ: bulan berjalan, tanpa biaya admin, dan email tim HR terverifikasi.
        </p>
      </div>

      {/* Proof Bar Metric */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto mb-8">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <div className="text-xs font-bold text-slate-500 uppercase">Total Lowongan</div>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">427 Loker Aktif</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <div className="text-xs font-bold text-slate-500 uppercase">Legalitas</div>
          <div className="text-sm sm:text-base font-extrabold text-emerald-700 mt-0.5">100% PT Resmi</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <div className="text-xs font-bold text-slate-500 uppercase">Freshness</div>
          <div className="text-sm sm:text-base font-extrabold text-emerald-700 mt-0.5">Oktober 2026</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <div className="text-xs font-bold text-slate-500 uppercase">Email HRD</div>
          <div className="text-sm sm:text-base font-extrabold text-emerald-700 mt-0.5">0% Info@ / Bodong</div>
        </div>
      </div>

      {/* Filter & Search Bar ala Glints & Dospem */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs mb-8 space-y-4">
        
        {/* Row 1: Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari posisi kerja, nama PT, keahlian (BPMN, SQL, UAT), atau lokasi..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
          />
        </div>

        {/* Row 2: Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100/80 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Row 3: Method Filter */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
          <span className="text-slate-500 font-medium">
            Menampilkan <strong className="text-slate-900">{filteredJobs.length}</strong> lowongan terverifikasi
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Saluran:</span>
            <button
              type="button"
              onClick={() => setSelectedMethod('all')}
              className={`px-2 py-0.5 rounded-md font-medium cursor-pointer ${selectedMethod === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('email')}
              className={`px-2 py-0.5 rounded-md font-medium cursor-pointer ${selectedMethod === 'email' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Email HR Langsung
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('portal')}
              className={`px-2 py-0.5 rounded-md font-medium cursor-pointer ${selectedMethod === 'portal' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Portal Karir
            </button>
          </div>
        </div>

      </div>

      {/* Job Cards Grid */}
      {paginatedJobs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-sm font-bold text-slate-900">Tidak ada lowongan yang sesuai</h4>
          <p className="text-xs text-slate-500 mt-1">
            Coba ubah kata kunci pencarian atau pilih kategori lain.
          </p>
          <button
            type="button"
            onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedMethod('all'); }}
            className="mt-4 text-xs font-semibold text-emerald-800 underline underline-offset-4 cursor-pointer"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {paginatedJobs.map((job) => {
            const isSelected = selectedIdSet.has(String(job.id));
            const isEmail = job.applyMethod === 'email' && job.recruiterEmail;

            return (
              <div 
                key={job.id}
                onClick={() => handleSelectJob(job)}
                className={`bg-white border rounded-2xl p-4 sm:p-5 transition flex flex-col justify-between cursor-pointer select-none ${
                  isSelected 
                    ? 'border-emerald-600 ring-2 ring-emerald-600/30 bg-emerald-50/20 shadow-sm' 
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  
                  {/* Top Row: Checkbox & Channel Badge */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                        isSelected 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        {isSelected ? 'Terpilih' : 'Pilih Loker'}
                      </span>
                    </div>

                    {/* Badge Saluran */}
                    {isEmail ? (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        Email HR Resmi
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        Portal Karir
                      </span>
                    )}
                  </div>

                  {/* Company Name with Verified Check */}
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-600 mb-1">
                    <span>{job.company}</span>
                    <svg className="w-3.5 h-3.5 text-emerald-700 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-snug mb-2 line-clamp-2">
                    {job.title}
                  </h3>

                  {/* Location & Work Type */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {job.location || 'Indonesia'}
                    </span>
                    <span>•</span>
                    <span>{job.type || 'Full-time'}</span>
                    {job.salary && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-slate-800">{job.salary}</span>
                      </>
                    )}
                  </div>

                  {/* Key Requirements Tags */}
                  {job.keyRequirements && job.keyRequirements.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {job.keyRequirements.slice(0, 3).map((req, rIdx) => (
                        <span key={rIdx} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {req}
                        </span>
                      ))}
                    </div>
                  )}

                </div>

                {/* Footer Card */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Bulan: <strong className="text-slate-600">Okt 2026</strong>
                  </span>
                  {isEmail ? (
                    <span className="font-mono text-[11px] text-emerald-800 font-semibold truncate max-w-[170px]">
                      {job.recruiterEmail}
                    </span>
                  ) : (
                    <span className="text-slate-500 font-medium">
                      Via Career Page
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            ← Sebelumnya
          </button>
          <span className="text-xs text-slate-600 font-medium px-2">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Selanjutnya →
          </button>
        </div>
      )}

      {/* Sticky Bottom Action Bar (When 1+ jobs are selected) */}
      {selectedJobs.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-8 max-w-4xl mx-auto z-40 bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-xs shrink-0 border border-emerald-500/30">
              {selectedJobs.length}
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {selectedJobs.length} Lowongan Terpilih Siap Dikirim
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                {selectedJobs.map(j => j.company).join(', ')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                // Clear all selections
                if (onToggleJob) {
                  selectedJobs.forEach(j => onToggleJob(j));
                }
              }}
              className="text-xs text-slate-400 hover:text-white px-3 py-2 cursor-pointer transition font-medium"
            >
              Kosongkan
            </button>
            <button
              type="button"
              onClick={onProceedToBlast}
              className="text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Lanjut ke Pengiriman Lamaran</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

    </section>
  );
}
