# CHANGELOG: Lolos Kerja (Dims Career Copilot)

Format mengikuti standar [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), dan proyek ini menganut [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.5.0] - 2026-10-21 (Eksekusi Total FE-BE Terhubung, Blast Nyata & Zero-Orphan Contract)

### Added
- **Penyelesaian Eksekusi Total Milestone M0 s/d M8**:
  - **M0 (Pagar Pengaman & CI)**: Branch `integrasi-total`, pemindahan workflow ke `.github/workflows/`, fail-closed validation di `api/_lib/env.js`, dan tool auditor `scripts/qa/check-wiring.js` (`npm run qa:wiring`).
  - **M1 (Database & Auth)**: Migrasi `0004_wiring.sql`, klien Supabase Auth terpusat (`src/lib/supabase.js`), centralized `apiFetch` dengan bearer token otomatis (`src/lib/api.js`), eliminasi 16 akses tabel legacy, dan persistent rate limit di PostgreSQL `public.rate_limits`.
  - **M2 (Vite & Modular UI)**: Vite build bundler, Tailwind CSS terdaftar, arsitektur modular di `src/` (`router.js`, `state.js`, `components/*`).
  - **M3 (CV Terhubung Penuh)**: Ekstraktor dokumen & detektor OCR (`/api/cv/extract`), audit ATS AI (`/api/cv/analyze`), poles STAR Google X-Y-Z tanpa fabrikasi (`/api/cv/rewrite`), simpan versi (`/api/cv/save`), dan generator PDF Harvard ATS 1-kolom (`/api/cv/export-pdf`).
  - **M4 (Ingestion Loker & Target Terverifikasi)**: Pipeline `scripts/scrape/import-to-db.js` dan validator CSV manual `scripts/scrape/import-manual.js` dengan batas keabsahan sumber wajib (`email_source_url`). Wiring FE katalog lowongan (`src/pages/jobs.js`).
  - **M5 (Blast Nyata & Proteksi Reputasi)**: Worker pengiriman berkala (`/api/blast/tick`) dengan lampiran PDF asli biner dari Storage (B1), otentikasi `CRON_SECRET` fail-closed (B2), pemisahan eksplisit `MAIL_TRANSPORT` (B3), kepatuhan RFC 8058 HTTPS List-Unsubscribe (B7), perhitungan hari WIB akurat (B8), dan webhook Resend dengan auto-circuit breaker 5% bounce rate (`/api/blast/webhook-resend`). Wiring FE blast (`src/pages/blast.js`).
  - **M6 (Wawancara Terhubung)**: Perumusan pertanyaan spesifik dari fakta CV kandidat (`/api/interview/questions`), penilaian rubrik STAR & konsistensi CV (`/api/interview/score`), serta metrik ketenangan klien (pemisahan filler vokal murni vs hedging dan WPM). Wiring FE wawancara (`src/pages/interview.js`).
  - **M7 (Billing & Settlement Otoritatif)**: Otoritas harga mutlak di server (`/api/billing/create-order`), settlement konfirmasi admin idempoten (`/api/billing/admin-confirm`), webhook gateway Midtrans/Xendit (`/api/billing/webhook`), dan single source of truth konfigurasi paket (`/api/config`). Wiring FE billing (`src/pages/billing.js`).
  - **M8 (Admin Command Center & Portabilitas Data)**: Halaman terpisah `/admin/index.html` dengan proteksi peran server (`/api/admin/overview`), ekspor data kandidat UU PDP (`/api/account/export`), dan penghapusan akun permanen (`/api/account/delete`). Wiring FE akun (`src/pages/account.js`).
- **Pencapaian Pengujian Menyeluruh (203 Pengujian 100% PASS)**:
  - 119 pengujian unit & behavior Vitest (`npm run test:unit`).
  - 64 skenario end-to-end QA JSDOM (`npm run test:qa`).
  - 20 audit aksesibilitas & UI/UX mobile (`npm run test:uiux`).
  - Pengecekan dead-code & wiring `npm run qa:wiring` 100% GREEN (0 orphaned endpoints, 0 legacy table accesses).

---

## [2.4.0] - 2026-10-20 (Perbaikan UX CV, Auto-Blast dari Data Scraping, Pengujian Perilaku)

### Fixed
- **Langkah 2 CV terisi sendiri.** Draf lama di `localStorage` dimasukkan diam-diam ke kolom tersembunyi sehingga skor, teks "Sesudah", dan stepper langkah 2 muncul padahal formulir kosong. Sekarang draf tidak dimuat otomatis: muncul banner "Lanjutkan draf ini / Mulai dari kosong". Memilih lanjut menampilkan teksnya di kolom yang terlihat.
- **Poles STAR mengarang angka.** Hasil lama menambahkan "38%", "99.5%", dll. dan memaksa skor 98 (termasuk jalan pintas berdasarkan nama preset seperti DIMAS PRATAMA). Sekarang hanya fakta dari teks pengguna yang dipakai, bagian yang belum ada angkanya ditandai `[ISI HASIL TERUKUR ...]`, dan skor dihitung dari isi.
- Definisi ganda `resetCVInput` dihapus.

### Changed
- **Auto-Blast sekarang hanya memakai kontak hasil scraping** (`data/blast-targets.js`). Daftar 25 rekruter yang diketik manual dan berlabel "HRD Whitelist terverifikasi" dihapus dari aplikasi (diarsipkan di `_archive/`, bukti: memuat `careers@fore.coffee`, padahal alamat resmi di halaman karier adalah `career@fore.coffee`). `resolveScrapedCompanyEmail` tidak lagi menebak `careers@<domain>`.
- Tidak ada penerima yang dicentang otomatis. Keadaan kosong menjelaskan jujur bahwa belum ada kontak email. Label sumber email (Email Rekrutmen / Email Umum / Dari Iklan Lowongan), tanggal data scraping, dan filter rumpun posisi "Semua Posisi" ditambahkan. Data scraping di-escape (XSS).
- Klaim tak berdasar dihapus: "HRD Whitelist", "Update Harian Aktif (Auto-Sync)", "Domain Health 100% OK". Isi bawaan modal detail (nama HR, gaji, email contoh) dikosongkan.

### Added
- **`scripts/scrape/enrich-emails.js`** (`npm run scrape:emails`): dari hasil scraping lowongan, kelompokkan per perusahaan, ambil email di deskripsi lowongan, crawl halaman karier/kontak website resmi (patuh `robots.txt`, jeda per host, tanpa tebakan), terima hanya domain yang sama dengan website perusahaan, validasi MX, lalu tulis `data/blast-targets.json|js` beserta laporan.
- `scripts/scrape/classify.js`: fungsi murni untuk ekstraksi dan klasifikasi email, rumpun posisi, robots.txt.
- **Pengujian baru** (85 tes Vitest, 64 QA, 20 UI/UX semuanya lulus): `tests/unit/email-enrichment.test.js` (termasuk crawl ke server lokal), `tests/behavior/cv-state.test.js`, `tests/behavior/blast-targets.test.js` (memuat `index.html` sungguhan di JSDOM dengan kondisi awal berbeda). `run-full-qa-audit.js` diperbarui: T09/T10 sebelumnya menguji perilaku yang salah (skor naik karena angka karangan).

### Hasil pertama pipeline (28 perusahaan fresh grad dari data scraping yang ada)
- 6 perusahaan (21%) punya email yang bisa diverifikasi: 3 rekrutmen, 4 umum, 0 dari deskripsi lowongan. Sebagian besar lowongan memang hanya lewat portal.

---

## [2.3.0] - 2026-10-20 (Sprint 4: Rapi, Pengujian Otomatis, Observabilitas & Kepatuhan UU PDP)

### Added
- **Suite Pengujian Vitest Unit Terotomasi (`/tests/unit/`)**:
  - `limits-and-quota.test.js`: Pengujian kebenaran tabel batas paket Lampiran A (`TIER_LIMITS`), pemetaan label, `getEffectiveTier`, dan pembatasan fitur atomik.
  - `master-profile-schema.test.js`: Validasi skema Master Profile (identitas, pendidikan, pengalaman berbobot STAR, skill matrix).
  - `scraping-filter.test.js`: Pengujian algoritma deduplikasi SHA-1 (`generateJobHash`) dan penolakan posisi senior/eksekutif (`isFreshGradEligible`).
  - `anti-fabrication-llm.test.js`: Pengujian sanitasi prompt injection `<user_data>`, ekstraktor JSON toleran blok kode, dan aturan anti-fabrikasi (permintaan klarifikasi metrik).
  - `privacy-and-compliance.test.js`: Pengujian skema ekspor data portabilitas dan verifikasi pembersihan data sesuai UU PDP No. 27/2022.
- **RFC 8058 & Anti-Spam Unsubscribe Endpoint (`/api/blast/unsubscribe.js`)**: Handler serverless untuk pendaftaran otomatis email rekruter ke tabel `email_blocklist` saat menerima request berhenti berlangganan.
- **Fitur Portabilitas Data ("Unduh Data Saya")**: Tombol ekspor data JSON lengkap di `#account-module` untuk memenuhi hak portabilitas data pengguna.
- **Fitur Hak Dihapus / Dilupakan ("Hapus Akun dan Data Saya")**: Aksi pembersihan total draf CV, riwayat lamaran, dan data sesi dari penyimpanan browser dengan konfirmasi modal berlapis.
- **Modal Interaktif Legal & Privasi (`#legalModal`)**: Akses langsung dokumen hukum tanpa reload:
  - Kebijakan Privasi (UU PDP No. 27/2022).
  - Syarat & Ketentuan Layanan.
  - Kebijakan Korespondensi Email & Anti-Spam (RFC 8058).
  - Standar Kepatuhan Teknis Dimitri HQ.
- **Kolom Legal & Kepatuhan di Footer**: Menambahkan navigasi terstruktur dokumen legal di footer website.
- **Naskah Dokumentasi Produksi Lengkap (`README.md` & `RUNBOOK.md`)**:
  - `README.md` ditulis ulang secara profesional tanpa sisa terminologi usang.
  - `RUNBOOK.md` dilengkapi instruksi Instant Rollback Vercel, rotasi kunci rahasia, dan emergency pause blast.

### Changed
- **Pembersihan Berkas & Direktori**:
  - Mengarsipkan berkas skrip legacy (`flutter_lolos_kerja_app.dart`, `google-apps-script-webhook.js`, `scrape-apify.js`, `simulate-5-accounts.js`, `fix_inline_custom_role.js`) ke folder `_archive/`.
  - Menambahkan `_archive/` ke `.gitignore` untuk menjaga kebersihan repositori publik.
- **Konsolidasi Perintah Pengujian (`npm test`)**: Menyatukan eksekusi `test:unit` (Vitest), `test:qa` (E2E Smoke & Logic), dan `test:uiux` (Mobile & Accessibility) dalam satu perintah dengan total 110 pengujian 100% PASS.

---

## [2.2.0] - 2026-10-20 (Sprint 3: UI/UX Modernization & Mobile Optimization)

### Added
- **Unified Toast Notification & Confirmation Modal**: Menggantikan blocking native `window.alert` dan `window.prompt` dengan sistem toast non-blocking modern bergaya clean matte (`showToast(msg, type)`) dengan warna emerald (sukses), rose (error), dan slate (info), serta dialog modal konfirmasi (`showConfirmModal(title, msg, onConfirm)`).
- **Safe Alert Bridge**: Bridge aman `window.alert` yang memanggil `showToast` tanpa memutus runner test headless (JSDOM).
- **Dasbor Akun & Profil Pengguna (`account-module`)**: Modul mandiri terpadu berisi:
  - Kartu profil kandidat (nama, email, avatar, role badge).
  - Status kuota Auto-Blast & masa aktif langganan dinamis (`tier_expires_at`).
  - Riwayat CV aktif dengan skor ATS, target role, dan aksi langsung unduh PDF Harvard 1-kolom.
  - Riwayat lamaran terkirim real-time yang tersinkronisasi dari `appliedJobsHistory`.
  - Riwayat sesi latihan wawancara suara terakhir (skor relevansi, delivery, WPM, dan deteksi kata jeda).
  - Tombol upgrade paket dan logout.
- **Navigasi Terpadu Akun**: Tombol tab "Akun" ditambahkan pada desktop navbar, mobile nav drawer, dan mobile floating bottom nav (6 tabs).
- **Visual Progress Stepper (Modul CV)**: Indikator tahapan visual interaktif 3-langkah (**1. Unggah/Isi Draft** -> **2. Skor ATS & STAR** -> **3. Pratinjau & Ekspor**) yang tersinkronisasi otomatis dengan status formulir dan subtab.
- **Mobile Job Filter Toggle**: Tombol toggle kolaps filter jurusan & kategori (`#mobileFilterToggleBtn`) untuk menghemat ruang vertikal layar HP.
- **Suite Audit UI/UX Otomatis (UX-15 s/d UX-20)**: Memperluas `run-ui-ux-audit.js` hingga 20 pengujian terotomasi untuk memvalidasi kepatuhan komponen baru.

### Changed
- **Pembersihan Klaim Spekulatif**: Menghapus klaim berlebih ("94% lolos ATS", "100% bebas bouncing", "ChatGPT sering halusinasi") dan menggantinya dengan penjelasan proposisi nilai nyata ("Format Standar Harvard ATS 1-Kolom", "Algoritma Smart Drip Terjadwal", "Formula STAR Berbasis Pengalaman Asli").
- **Standarisasi Pemetaan Tier (`TIER_LABELS`)**: Menyatukan seluruh label tier aplikasi: `FREE: 'Gratis'`, `FLASH: 'Paket 24 Jam'`, `DIBANTUIN: 'Dibantuin'`, `VIP: 'Dikerjain VIP'`.
- **Badge Status Lowongan Kerja**: Mempertegas visual badge antara lowongan `Kirim via Email Resmi` (emerald) vs `Lamar via Portal` (slate/blue).

---

## [2.1.0] - 2026-10-20 (Sprint 2: MVP Vertikal & Integrasi Terpadu)

### Added
- **Unified Master Profile Data Layer**: Menambahkan `appState.masterProfile` sebagai Single Source of Truth yang menyimpan profil terstruktur (identitas, pendidikan, pengalaman berbobot STAR dengan action verb dan metrik %, keahlian, bahasa, dan target role).
- **Sinkronisasi Otomatis Antar Modul**: Modul CV, Wawancara, Katalog Loker, dan Auto-Blast membaca langsung dari `masterProfile`.
- **Real Harvard ATS 1-Column PDF Exporter**: Generator PDF biner standar Harvard ATS (`jsPDF` + fallback generator PDF 1.4) yang menghasilkan berkas PDF asli (`application/pdf`) dengan ukuran dinamis nyata untuk unduhan dan lampiran Auto-Blast.
- **Keterhubungan Wawancara & Loker**: Tombol "Latihan untuk loker ini" (`practiceInterviewForJob`) di setiap kartu loker yang memformulasikan pertanyaan wawancara spesifik berdasarkan role, kualifikasi perusahaan, dan riwayat pengalaman di CV pengguna.
- **Admin Manual Payment Confirmation**: Aksi "Konfirmasi Pembayaran" (`confirmManualPayment`) di Command Center untuk memproses transaksi PENDING menjadi SETTLED, meng-upgrade tier/kuota pengguna, dan menetapkan `tier_expires_at`.

### Changed
- **Pembersihan Total Email Tebakan**: Menghapus sintesis email tebakan `careers@<nama>.com`. Lowongan tanpa email HR resmi dialihkan secara transparan ke tombol "Lamar via Portal" yang menyalin Cover Letter STAR ke clipboard dan membuka URL portal karir resmi.
- **Auto-Blast Filter Integritas**: Hanya lowongan dengan email HR resmi terverifikasi yang dapat masuk ke antrean Auto-Blast Email.
- **Lampiran Nyata Modul 4**: Menggantikan metadata statis palsu ukuran 142.800 bytes dengan berkas PDF asli terkompresi.

---

## [2.0.0] - 2026-10-20 (Sprint 1: Keamanan & Fondasi P0)

### Added
- **Supabase Auth Integration**: Otentikasi nyata menggunakan `signInWithPassword` dan `signUp` dengan hashing di server.
- **Strict Row Level Security (RLS)**: File `supabase-schema.sql` diperbarui dengan kebijakan ketat berbasis `auth.uid() = id`, penguncian kolom `tier`, `blast_quota`, dan `role`, serta tabel baru `cv_documents`, `interview_sessions`, `applications`, `scrape_requests`, dan `jobs`.
- **Button Paket 24 Jam**: Tombol pembelian resmi untuk Paket 24 Jam (Rp 9.999) ditambahkan pada kartu banner harga.
- **Webhook Authentication**: Verifikasi token rahasia `AUTH_SECRET_TOKEN` pada `google-apps-script-webhook.js`.
- **Header Keamanan CSP & Referrer-Policy**: Ditambahkan pada konfigurasi `vercel.json`.
- **Dokumen Standar Arsitektur**: Menambahkan `.env.example`, `package.json`, `DECISIONS.md`, dan `CHANGELOG.md`.

### Changed
- **Pembersihan Plaintext Passwords**: Menghapus seluruh penyimpanan dan penayangan kata sandi plain text dari `localStorage`, `adminState.users`, tabel Admin, dan modal edit.
- **Hardening Command Center Admin**: Menghapus seluruh prompt PIN hardcoded (`1908`, `lord`, `admin`), hash URL `#lord` / `#admin`, dan bypass `sessionStorage`. Admin hanya terbuka jika `currentUser.role === 'admin' || currentUser.role === 'owner'`.
- **Sandbox Simulasi QRIS**: Tombol `simulatePaymentSuccess()` dikunci hanya di lingkungan pengembang (`localhost`).
- **Sanitasi XSS**: Menambahkan `escapeHtml()` pada pencarian lowongan, nama file unggahan, sinkronisasi CV, dan log transmisi.
- **Tailwind v3 Compliant**: Mengganti class tidak valid `text-2xs`, `shadow-2xs`, `py-0.2`, `active:scale-98` dengan class standar Tailwind.

### Removed
- Menghapus file duplikat `Prototipe Karir Copilot.html` (-956 KB).
- Menghapus 17 skrip patch root usang (-24.533 baris kode).
- Menghapus form input URL dan API Key Supabase dari tampilan Command Center.
