import React from 'react';

export default function Comparison() {
  const comparisonRows = [
    {
      feature: 'Format & Standar ATS',
      manual: 'Format Canva 2-kolom / warna-warni, rawan 80% gagal screening robot rekruter.',
      lolosKerja: '100% Standar Harvard ATS 1-kolom, lolos uji sistem ATS global (Workday/Taleo/Greenhouse).'
    },
    {
      feature: 'Penyusunan Kalimat Pencapaian',
      manual: 'Menulis rincian tugas pasif harian tanpa angka ("Membantu operasional").',
      lolosKerja: 'Otomatis dipoles ke formula Google STAR ber-angka hasil nyata ("Meningkatkan efisiensi 25%").'
    },
    {
      feature: 'Validasi Legalitas Lowongan',
      manual: 'Sering terjebak loker fiktif, MLM berbayar, atau email penipuan perorangan.',
      lolosKerja: '7 Aturan Main Dimitri HQ: 100% PT/BUMN berbadan hukum, email korporat resmi, anti-scam.'
    },
    {
      feature: 'Kecepatan & Waktu Melamar',
      manual: 'Menghabiskan 3-4 jam sehari menyalin surat lamaran dan mencari kontak HRD.',
      lolosKerja: 'Hanya butuh 3 menit: centang loker, pilih Auto-Blast atau Buka di Gmail, beres.'
    },
    {
      feature: 'Reputasi Email & Pengiriman',
      manual: 'Kirim massal sembarangan, masuk folder Spam / Promosi atau akun di-suspend Google.',
      lolosKerja: 'Smart Drip Engine: jeda aman 15-30 detik, kuota 35 email/hari, waktu emas HRD (Selasa-Kamis).'
    }
  ];

  return (
    <section className="py-12 sm:py-16 bg-slate-50/60 border-b border-slate-200/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-block text-xs font-bold text-slate-500 uppercase tracking-wider bg-white border border-slate-200 px-3 py-1 rounded-full">
            Tolak Cara Kuno
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cara Lama vs Lolos Kerja V2
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Perbandingan jujur kenapa melamar kerja dengan ekosistem terstruktur jauh lebih menghasilkan panggilan wawancara.
          </p>
        </div>

        {/* Tabel Perbandingan Elegan (Dospem Style) */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700">
                  <th className="py-3.5 px-4 sm:px-6 font-bold w-1/4">Parameter</th>
                  <th className="py-3.5 px-4 sm:px-6 font-bold text-rose-800 bg-rose-50/40 w-3/8">Cara Manual / Kuno</th>
                  <th className="py-3.5 px-4 sm:px-6 font-bold text-emerald-900 bg-emerald-50/60 w-3/8">Lolos Kerja V2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                      {row.feature}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-600 bg-rose-50/20 leading-relaxed">
                      <span className="text-rose-600 font-bold mr-1.5">&times;</span>
                      {row.manual}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-800 font-medium bg-emerald-50/30 leading-relaxed">
                      <span className="text-emerald-600 font-bold mr-1.5">&#10003;</span>
                      {row.lolosKerja}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
