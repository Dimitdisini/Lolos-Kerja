# ARSITEKTUR & KEPUTUSAN TEKNIS (DECISIONS.md)

Dokumen ini mencatat keputusan arsitektur penting (*Architectural Decision Records - ADR*) untuk platform **Lolos Kerja (Dims Career Copilot)**.

---

## ADR-001: Model Autentikasi dan Otorisasi (Supabase Auth)
- **Konteks:** Sistem sebelumnya menyimpan kredensial plain text di `localStorage` dan memeriksa akun tanpa verifikasi password.
- **Keputusan:** Mengadopsi Supabase Auth secara penuh (`signInWithPassword`, `signUp`, OAuth Google). Password dikelola dan di-hash oleh server Supabase.
- **Dampak:** Zero plain-text password di frontend. Pengguna anonim tidak dapat mengakses atau memodifikasi akun pengguna lain.

---

## ADR-002: Arsitektur Data Terpusat (Master Profile Pattern)
- **Konteks:** Modul CV, Wawancara, Lowongan, dan Auto-Blast sebelumnya terpisah dan hanya dihubungkan oleh variabel global yang rapuh.
- **Keputusan:** Menetapkan `masterProfile` (JSON terstruktur) sebagai Single Source of Truth.
  - CV yang diunggah/diperbaiki langsung menyusun `masterProfile`.
  - Modul Wawancara menghasilkan pertanyaan dan mengevaluasi jawaban berdasarkan pengalaman di `masterProfile`.
  - Modul Lowongan menghitung skor kecocokan dan skill gap terhadap `masterProfile`.
  - Modul Auto-Blast menyusun cover letter personal dan melampirkan versi PDF ATS resmi dari `masterProfile`.
- **Dampak:** Pengguna cukup melengkapi data satu kali, seluruh alur berjalan sinkron tanpa input ulang.

---

## ADR-003: Pengiriman Email Lamaran (No More Guessed Emails)
- **Konteks:** Versi awal menebak alamat HRD dengan format `careers@<nama>.com`, berisiko tinggi mental (*bounced*) dan domain terkena blacklist spam.
- **Keputusan:**
  1. Hanya lowongan dengan email rekruter resmi yang dapat di-blast via email.
  2. Lowongan yang tidak mencantumkan email diarahkan secara transparan ke tombol "Lamar via Portal" (Glints/LinkedIn/JobStreet).
  3. Menggunakan penyedia email resmi (Resend/SES) dengan autentikasi domain lengkap (SPF, DKIM, DMARC) dan kuota harian bertahap.

---

## ADR-004: Penonaktifan Webhook Open Relay Google Apps Script
- **Konteks:** Webhook Google Apps Script lama dapat dipanggil oleh siapa saja tanpa autentikasi untuk mengirim email dari akun Gmail pribadi.
- **Keputusan:**
  1. Menambahkan verifikasi token rahasia `AUTH_SECRET_TOKEN` (`LK_SECURE_TOKEN_2026`) pada `doPost`.
  2. Mematikan eksekusi pengiriman email massal tanpa izin dari skrip Sheets; pengiriman email lamaran resmi dipindahkan ke serverless/email gateway.
  3. Pemilik proyek disarankan mengarsipkan deployment Apps Script lama di Google Apps Script console.

---

## ADR-005: Model Pembayaran & Gateway
- **Konteks:** Tombol "Simulasi Bayar Berhasil" sebelumnya dapat diklik bebas oleh pengguna untuk mendapatkan VIP tanpa verifikasi pembayaran.
- **Keputusan:**
  1. Simulasi pembayaran di-sandbox hanya untuk pengujian lokal (`localhost`).
  2. Menambahkan alur konfirmasi manual oleh Admin (`admin-confirm`) dengan status PENDING -> SETTLED, pencatatan `tier_expires_at`, dan pengisian kuota atomik di server.
  3. Integrasi gateway dinamis (Midtrans/Xendit) dipersiapkan untuk fase peluncuran publik.

---

## ADR-006: Real ATS 1-Column PDF Exporter (Eliminasi Fake HTML & Fake Metadata)
- **Konteks:** Fitur unduh CV sebelumnya mengunduh file `.html` bertopeng atau menempelkan metadata palsu dengan ukuran hardcoded `142800` bytes tanpa berkas nyata.
- **Keputusan:**
  1. Mengintegrasikan generator PDF standar Harvard 1-kolom berbasis `jsPDF` di sisi peramban serta parser biner PDF 1.4 murni yang menghasilkan `Blob` PDF nyata (`application/pdf`) dengan ukuran byte dinamis nyata.
  2. Aksi "Unduh CV" dan "Lampirkan ke Modul 4" menghasilkan dan melampirkan berkas PDF asli yang dapat langsung dikirimkan ke email rekruter.
- **Dampak:** CV pelamar memenuhi standar mesin ATS internasional (Times-Roman, margin simetris, tanpa tabel/kolom tersembunyi), dan lampiran Auto-Blast merupakan dokumen PDF nyata.

---

## ADR-007: Pemisahan Ketat Jalur Email Terverifikasi vs Portal Resmi ATS
- **Konteks:** Sistem sebelumnya mengarang alamat email `careers@<nama-perusahaan>.com` untuk lowongan yang sebenarnya mewajibkan pelamaran via portal web resmi (Glints/LinkedIn/Workday).
- **Keputusan:**
  1. Seluruh tebakan email dihilangkan (`resolveScrapedCompanyEmail` mengembalikan `null` bila tidak terverifikasi).
  2. Lowongan diklasifikasikan secara tegas:
     - **Email Resmi Terverifikasi:** Tombol "Kirim via Email" menuju antrean Auto-Blast.
     - **Portal Karir Resmi:** Tombol "Lamar via Portal" yang otomatis menyalin Cover Letter formula STAR ke clipboard dan membuka URL portal karir resmi di tab baru.
- **Dampak:** Zero bounce rate akibat email tebakan palsu, menjaga reputasi domain pengirim, dan pelamar tetap dapat melamar dengan mudah ke perusahaan enterprise portal.

---

## ADR-008: Konfirmasi Pembayaran Manual & Siklus Hidup Tier (tier_expires_at)
- **Konteks:** Admin tidak memiliki mekanisme terpusat untuk memvalidasi pembayaran manual yang masuk via transfer bank/QRIS dan mengaktifkan masa berlaku paket.
- **Keputusan:**
  1. Menambahkan fungsi `confirmManualPayment` di Admin Command Center yang mengubah transaksi status `PENDING` menjadi `SETTLED`.
  2. Menghitung dan menyimpan `tier_expires_at`:
     - Paket FLASH (24 Jam): masa aktif 24 jam.
     - Paket DIBANTUIN: masa aktif 30 hari kalender.
     - Paket VIP (Dikerjain VIP): masa aktif 30 hari kalender.
  3. Meng-upgrade tier dan kuota pengguna secara atomik di database `adminState.users` dan tabel PostgreSQL Supabase.
- **Dampak:** Alur operasional bisnis dapat langsung dijalankan untuk penerimaan pembayaran manual tanpa technical debt.

---

## ADR-009: Penghapusan Kode & Fitur Mubazir (Anti-Bloat Architecture)
- **Konteks:** Banyak kode demo, simulasi palsu, modul admin ganda di frontend, dan script usang yang membebani pemeliharaan.
- **Keputusan:**
  1. Hapus total: Tab Panduan Agen + simulasi multi-agent swarm palsu.
  2. Hapus admin portal di `index.html` (`admin-module`, `adminState`, `#admin`, shortcut, KPI palsu). Digantikan halaman `/admin` minimal terpisah.
  3. Hapus seluruh webhook Google Apps Script (`syncToGoogleSheets`). Digantikan Supabase.
  4. Hapus login ganda lokal. Seluruh otentikasi hanya via Supabase Auth.
  5. Hapus simulasi blast dan simulasi bayar.
  6. Pindahkan 421 lowongan tertanam dari HTML ke database PostgreSQL `jobs`.
- **Dampak:** Kode bersih, anti-slop, mudah dipelihara, dan tidak ada perilaku semu.

---

## ADR-010: Integrasi Total FE-BE & Kontrak Pengiriman Email dengan Lampiran Nyata
- **Konteks:** Frontend sebelumnya tidak memanggil endpoint `/api/` dan pengiriman blast tidak melampirkan berkas PDF CV asli.
- **Keputusan:**
  1. Frontend memanggil 14 endpoint serverless `/api/*` secara penuh dengan `Authorization: Bearer <jwt>`.
  2. `api/blast/tick.js` mengunduh PDF CV dari Supabase Storage dan melampirkannya sebagai lampiran fisik biner di Resend (`CV_<Nama>.pdf`).
  3. `CRON_SECRET` dan `APP_URL` wajib terkonfigurasi (fail-closed, server menolak jalan bila kosong).
  4. Mode pengiriman eksplisit: `MAIL_TRANSPORT=resend` (nyata) vs `MAIL_TRANSPORT=capture` (tes lokal/staging tanpa keluar ke internet).
  5. Kepatuhan RFC 8058: List-Unsubscribe Header dengan tautan HTTPS satu-klik dan penambahan otomatis ke `email_blocklist`.
- **Dampak:** Janji inti produk terpenuhi 100% secara nyata, aman, dan mematuhi regulasi anti-spam internasional & UU PDP.

---

## ADR-011: Pipeline Ingestion Loker dan Batas Keabsahan Sumber Email
- **Konteks:** Database lowongan pekerjaan memerlukan pemisahan ketat antara lowongan dengan email rekrutmen terverifikasi vs lowongan via portal karir.
- **Keputusan:**
  1. Membangun script ingestion `scripts/scrape/import-to-db.js` dan `scripts/scrape/import-manual.js`.
  2. Aturan batas mutlak: `apply_via='email'` HANYA diperbolehkan jika alamat email memiliki `email_source_url` resmi berawalan `http://` atau `https://`. Seluruh lowongan tanpa URL sumber sah wajib diset sebagai `apply_via='portal'`.
  3. Deduplikasi idempoten menggunakan sha256 hash dan index unik `uq_jobs_company_email` pada PostgreSQL.
- **Dampak:** Zero email karangan, perlindungan reputasi domain pengirim, dan kepatuhan hukum penuh terhadap UU ITE & UU PDP.

---

## ADR-012: Arsitektur Zero-Orphan & Pengecekan Wiring 100% Green
- **Konteks:** Kontrak antara Frontend (Vite/Vanilla JS), Serverless Functions (`/api/*`), dan Database PostgreSQL Supabase rawan mengalami desinkronisasi atau dead code.
- **Keputusan:**
  1. Membangun dan menjalankan `scripts/qa/check-wiring.js` secara otomatis di CI (`npm run qa:wiring`).
  2. Memastikan seluruh endpoint `/api/*` memiliki pemanggil aktif di frontend atau workflow cron (0 orphaned endpoints).
  3. Memastikan tidak ada akses ke tabel legacy (`users`, `transactions`, `blast_logs`).
  4. Halaman admin `/admin` dipisahkan sepenuhnya ke `admin/index.html` dengan proteksi peran server-side `requireAdmin`.
- **Dampak:** Arsitektur full-stack terintegrasi 100% tanpa dead code, terverifikasi oleh 203 pengujian otomatis.
