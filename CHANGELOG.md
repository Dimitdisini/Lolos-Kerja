# CHANGELOG: Lolos Kerja (Dims Career Copilot)

Format mengikuti standar [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), dan proyek ini menganut [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
