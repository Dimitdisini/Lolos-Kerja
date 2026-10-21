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


## Auto-Blast dan sumber email (20 Okt 2026)
- Target blast hanya boleh berasal dari `data/blast-targets.js`, dihasilkan `npm run scrape:emails`. Tidak ada daftar manual, tidak ada email tebakan.
- Dimuat lewat `<script src>` (bukan `fetch`) agar `index.html` tetap berjalan saat dibuka via `file://`.
- Email umum (`info@`, `hello@`) disertakan tetapi diberi label "Email Umum"; email rekrutmen dan email dari iklan diutamakan.
- Yield nyata rendah (21% perusahaan). Untuk janji 30-40 email/hari perlu sumber lowongan yang mencantumkan email atau data scraping yang jauh lebih besar, serta `companyWebsite` untuk semua loker (katalog 421 loker lama tidak menyimpannya).
- Pengiriman email di antarmuka masih simulasi (belum memanggil `/api/blast/*`). Penyambungan ke backend butuh sesi Supabase dan kunci Resend.
