/**
 * src/components/ApplicationTracker.jsx
 * 
 * APPLICATION TRACKER & KANBAN DASHBOARD
 * Ekosistem Dimitri HQ - Lolos Kerja V2
 * 
 * Dasbor pemantauan siklus lamaran kerja:
 * - Terkirim (sent)
 * - Sedang Direview (reviewing)
 * - Jadwal Interview (interview)
 * - Offering / Diterima (offering)
 * - Belum Lolos (rejected)
 */

import React, { useState, useMemo } from 'react';
import {
  APPLICATION_STAGES,
  calculateTrackerMetrics,
  updateApplicationStage,
  updateApplicationNotes,
  addApplicationRecord,
  deleteApplicationRecord,
  exportApplicationsToCsv
} from '../lib/application-tracker.js';

export default function ApplicationTracker({
  applications = [],
  onApplicationsChange,
  onNavigateToJobs,
  onNavigateToBlast
}) {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null); // App being edited for notes
  const [toastMessage, setToastMessage] = useState(null);

  // New application form state
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newStage, setNewStage] = useState('sent');
  const [newNotes, setNewNotes] = useState('');

  // Edit notes form state
  const [editNotes, setEditNotes] = useState('');
  const [editInterviewDate, setEditInterviewDate] = useState('');

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    return calculateTrackerMetrics(applications);
  }, [applications]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    let list = [...applications];

    if (stageFilter !== 'all') {
      list = list.filter(a => a.stage === stageFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a => 
        (a.company || '').toLowerCase().includes(q) ||
        (a.role || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [applications, stageFilter, searchQuery]);

  // Stage movement handlers
  const handleMoveStage = (appId, direction) => {
    const app = applications.find(a => String(a.id) === String(appId));
    if (!app) return;

    const stageIds = APPLICATION_STAGES.map(s => s.id);
    const currentIndex = stageIds.indexOf(app.stage);
    let nextIndex = currentIndex + direction;

    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= stageIds.length) nextIndex = stageIds.length - 1;

    const nextStage = stageIds[nextIndex];
    if (nextStage !== app.stage) {
      const updated = updateApplicationStage(applications, appId, nextStage);
      onApplicationsChange(updated);
      const stageObj = APPLICATION_STAGES.find(s => s.id === nextStage);
      showNotification(`Status ${app.company} dipindahkan ke: ${stageObj ? stageObj.label : nextStage}`);
    }
  };

  const handleDirectStageChange = (appId, newStageId) => {
    const updated = updateApplicationStage(applications, appId, newStageId);
    onApplicationsChange(updated);
    const stageObj = APPLICATION_STAGES.find(s => s.id === newStageId);
    showNotification(`Status dipindahkan ke: ${stageObj ? stageObj.label : newStageId}`);
  };

  const handleDelete = (appId, companyName) => {
    if (window.confirm(`Hapus riwayat lamaran ke ${companyName}?`)) {
      const updated = deleteApplicationRecord(applications, appId);
      onApplicationsChange(updated);
      showNotification(`Lamaran ke ${companyName} berhasil dihapus.`);
    }
  };

  // Open note edit modal
  const handleOpenEditModal = (app) => {
    setEditingApp(app);
    setEditNotes(app.notes || '');
    setEditInterviewDate(app.interviewDate ? app.interviewDate.substring(0, 16) : '');
  };

  const handleSaveNotes = (e) => {
    e.preventDefault();
    if (!editingApp) return;

    const updated = updateApplicationNotes(
      applications, 
      editingApp.id, 
      editNotes, 
      editInterviewDate ? new Date(editInterviewDate).toISOString() : null
    );
    onApplicationsChange(updated);
    setEditingApp(null);
    showNotification('Catatan lamaran berhasil disimpan!');
  };

  // Add manual application
  const handleAddManualApplication = (e) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) {
      showNotification('Nama Perusahaan dan Posisi wajib diisi.');
      return;
    }

    const newRecord = {
      id: `app-man-${Date.now()}`,
      company: newCompany.trim(),
      role: newRole.trim(),
      email: newEmail.trim(),
      stage: newStage,
      status: newStage,
      appliedAt: new Date().toISOString(),
      notes: newNotes.trim()
    };

    const updated = addApplicationRecord(applications, newRecord);
    onApplicationsChange(updated);
    setIsAddModalOpen(false);

    // Reset form
    setNewCompany('');
    setNewRole('');
    setNewEmail('');
    setNewStage('sent');
    setNewNotes('');

    showNotification(`Sukses menambahkan lamaran ke ${newRecord.company}!`);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (applications.length === 0) {
      showNotification('Belum ada data lamaran untuk diekspor.');
      return;
    }

    const csvContent = exportApplicationsToCsv(applications);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Riwayat_Lamaran_LolosKerja_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('File CSV berhasil diunduh!');
  };

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-700 transition animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Executive Summary Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200/80 mb-2">
            <span>📊</span>
            <span>Application Tracker & Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pelacak Lamaran Kerja
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Pantau perkembangan setiap email lamaran yang telah dikirimkan, jadwal interview, dan penawaran kerja dalam satu dasbor visual terpadu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            title="Unduh seluruh data lamaran dalam format spreadsheet CSV"
          >
            <span>📥</span>
            <span>Unduh CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Tambah Lamaran Manual</span>
          </button>
        </div>
      </div>

      {/* 2. KPI / Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Total Lamaran
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{metrics.total}</span>
            <span className="text-xs font-semibold text-slate-500">perusahaan</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Tingkat Respon HRD
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-600">{metrics.responseRate}%</span>
            <span className="text-xs font-semibold text-slate-500">direspon</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Tahap Interview Aktif
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-purple-600">{metrics.activeInterviews}</span>
            <span className="text-xs font-semibold text-purple-700">panggilan</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Penawaran / Offering
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600">{metrics.activeOffers}</span>
            <span className="text-xs font-semibold text-emerald-700">peluang</span>
          </div>
        </div>
      </div>

      {/* 3. Toolbar (Filter, Search & View Toggle) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 mb-6 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari perusahaan atau posisi..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-900"
            />
          </div>

          {/* Filter Stage Dropdown */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Tahap ({applications.length})</option>
            {APPLICATION_STAGES.map(s => (
              <option key={s.id} value={s.id}>
                {s.label} ({metrics.countByStage[s.id] || 0})
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📋</span>
            <span>Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📑</span>
            <span>Tabel</span>
          </button>
        </div>
      </div>

      {/* 4. Main Body: Kanban Board View OR Table View */}
      {applications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center max-w-xl mx-auto my-8">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl">
            📬
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            Belum Ada Lamaran yang Dicatat
          </h3>
          <p className="text-xs text-slate-600 mt-1 mb-5 leading-relaxed">
            Mulai kirimkan lamaran melalui tab Kirim Lamaran (Blast Hub) atau tambahkan lamaran yang pernah Anda kirim secara manual untuk melacak jadwal interview Anda.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onNavigateToBlast}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Kirim Lamaran Sekarang →
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              + Tambah Manual
            </button>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {APPLICATION_STAGES.map(stage => {
            const appsInStage = filteredApps.filter(a => a.stage === stage.id);

            return (
              <div 
                key={stage.id} 
                className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-3 flex flex-col min-h-[480px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${stage.dotClass}`}></span>
                    <h3 className="text-xs font-extrabold text-slate-800">
                      {stage.label}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {appsInStage.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[680px]">
                  {appsInStage.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      Kosong
                    </div>
                  ) : (
                    appsInStage.map(app => {
                      const sentDate = app.appliedAt ? new Date(app.appliedAt) : new Date();
                      const daysAgo = Math.floor((Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
                      const isUnderCooldown = daysAgo < 30;

                      return (
                        <div
                          key={app.id}
                          className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-2xs transition group"
                        >
                          {/* Company & Role */}
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h4 className="text-xs font-black text-slate-900 leading-tight">
                                {app.company}
                              </h4>
                              <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-snug">
                                {app.role}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDelete(app.id, app.company)}
                              className="text-slate-300 hover:text-rose-600 text-xs p-1 transition cursor-pointer"
                              title="Hapus dari pelacak"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Email & Date Info */}
                          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-1">
                            {app.email && (
                              <div className="font-mono text-slate-600 truncate">
                                {app.email}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span>Kirim: {sentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ({daysAgo}h lalu)</span>
                              {isUnderCooldown && (
                                <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded" title="Cooldown 30 hari aktif">
                                  {30 - daysAgo}h jeda
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Notes Preview if any */}
                          {app.notes && (
                            <div className="mt-2 text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                              {app.notes}
                            </div>
                          )}

                          {/* Interview date badge if any */}
                          {app.interviewDate && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 p-1.5 rounded-lg border border-purple-200">
                              <span>📅</span>
                              <span>{new Date(app.interviewDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                          )}

                          {/* Card Action Buttons (Quick Move & Edit) */}
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveStage(app.id, -1)}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-1.5 py-1 rounded transition cursor-pointer"
                                title="Pindah ke tahap sebelumnya"
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveStage(app.id, 1)}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-1.5 py-1 rounded transition cursor-pointer"
                                title="Pindah ke tahap berikutnya"
                              >
                                →
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(app)}
                              className="text-[10px] text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                            >
                              ✏️ Catatan
                            </button>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })}
        </div>

      ) : (

        /* DETAILED TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Perusahaan & Posisi</th>
                  <th className="py-3 px-4">Email Rekruter</th>
                  <th className="py-3 px-4">Tahap / Status</th>
                  <th className="py-3 px-4">Tanggal Kirim</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredApps.map(app => {
                  const sentDate = app.appliedAt ? new Date(app.appliedAt) : new Date();
                  const stageObj = APPLICATION_STAGES.find(s => s.id === app.stage) || APPLICATION_STAGES[0];

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{app.company}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{app.role}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {app.email || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={app.stage}
                          onChange={(e) => handleDirectStageChange(app.id, e.target.value)}
                          className={`text-xs font-bold py-1 px-2.5 rounded-lg border cursor-pointer focus:outline-none ${stageObj.badgeClass}`}
                        >
                          {APPLICATION_STAGES.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {sentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                        {app.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(app)}
                          className="text-xs text-slate-600 hover:text-slate-900 font-bold px-2 py-1 mr-1"
                        >
                          Catatan
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(app.id, app.company)}
                          className="text-xs text-slate-400 hover:text-rose-600 font-bold px-2 py-1"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MODAL: Tambah Lamaran Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                Tambah Lamaran Kerja Manual
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualApplication} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Perusahaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="Contoh: PT Bank Mandiri (Persero)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Posisi Pekerjaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Contoh: Management Trainee - IT"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Rekruter (Opsional)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="recruitment@company.co.id"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tahap / Status Awal
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                >
                  {APPLICATION_STAGES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Pribadi (Opsional)
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                  placeholder="Misal: Melamar lewat LinkedIn, kontak PIC Mas Dimas."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-xs cursor-pointer"
                >
                  Simpan Lamaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Edit Catatan & Jadwal Interview */}
      {editingApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Catatan: {editingApp.company}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {editingApp.role}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jadwal Interview (Jika ada)
                </label>
                <input
                  type="datetime-local"
                  value={editInterviewDate}
                  onChange={(e) => setEditInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Wawancara / Tautan Google Meet / Kisi-kisi
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="Catat pertanyaan yang muncul saat interview, link meet, atau persiapan berikutnya..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
