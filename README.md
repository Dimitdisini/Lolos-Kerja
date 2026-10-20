# Lolos Kerja (ai.fleekgroup.id / LOLOSKERJA.ID)

Platform akselerasi karir berbasis AI untuk mahasiswa dan fresh graduate Indonesia. Dilengkapi engine bimbingan bedah CV Socratic (Google X-Y-Z formula), simulasi wawancara suara real-time dengan Dual-Score Evaluation, kurasi lowongan kerja terverifikasi tanpa email tebakan, dan Smart Drip auto-blast email terjadwal.

---

## Daftar Isi
1. [Fitur Utama](#fitur-utama)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Struktur Repositori](#struktur-repositori)
4. [Persyaratan & Instalasi Lokal](#persyaratan--instalasi-lokal)
5. [Variabel Lingkungan (Environment Variables)](#variabel-lingkungan-environment-variables)
6. [Pengujian Otomatis (QA & Unit Tests)](#pengujian-otomatis-qa--unit-tests)
7. [Kebijakan Kepatuhan & Privasi](#kebijakan-kepatuhan--privasi)
8. [Panduan Deployment (Vercel & Supabase)](#panduan-deployment-vercel--supabase)

---

## Fitur Utama

### 1. Bedah CV Socratic & Real ATS PDF Exporter
* **Socratic Probing**: Menganalisis draf CV pengguna dan membimbing penambahan metrik riil menggunakan Google X-Y-Z / STAR formula.
* **Aturan Keras Anti-Fabrikasi**: LLM dilarang mengarang angka atau fakta yang tidak ada di draf. Jika draf tanpa angka, sistem mengajukan pertanyaan klarifikasi (`needs_input`).
* **Visual Stepper 3 Langkah**: 1. Unggah/Isi Draf -> 2. Skor ATS & Rekomendasi STAR -> 3. Pratinjau & Ekspor Harvard PDF.
* **Harvard ATS 1-Column Engine**: Mengunduh berkas PDF biner nyata (Times-Roman, layout 1-kolom, margin simetris, teks dapat diseleksi mesin ATS).

### 2. Simulasi Wawancara Suara (Voice Mock Interview)
* **Perekaman Suara Real-Time**: Terintegrasi dengan Web Speech & Web Audio API.
* **Dual-Score Evaluation Matrix**:
  * **Skor Relevansi (0-100)**: Mengevaluasi apakah substansi jawaban selaras dengan metode STAR dan relevan terhadap kualifikasi loker.
  * **Skor Delivery & Ketenangan (0-100)**: Mengukur kestabilan tempo bicara (WPM) dan mendeteksi kata jeda/filler vokal (*"aaa", "eee", "kayak", "anu", "gitu"*).
* **Koneksi Loker ke Wawancara**: Fitur "Latihan untuk loker ini" otomatis memuat simulasi pertanyaan khusus untuk posisi target.

### 3. Smart Job Matcher Terverifikasi
* **Katalog Loker Terkurasi**: Lowongan aktif dari LinkedIn, JobStreet, dan Glints yang telah melalui pipeline normalisasi dan deduplikasi hash SHA-1.
* **Filter Senioritas Ketat**: Otomatis membuang lowongan berlevel Head, Director, VP, Manager, dan Senior dari katalog fresh graduate.
* **Pemisahan Jalur Loker**:
  * **Email Resmi Terverifikasi**: Lowongan dengan kontak HR terverifikasi dapat dimasukkan ke antrean Auto-Blast Email.
  * **Portal Resmi ATS**: Lowongan via Workday/Taleo/Glints diarahkan ke tombol "Lamar via Portal" transparan. Email tebakan spekulatif (`careers@<nama>.com`) telah dieliminasi 100%.

### 4. Smart Drip Auto-Blast Terjadwal
* **Distribusi Pengiriman Alami**: Pengiriman disebar acak pada jam kerja (08:00 - 17:00 WIB) dengan jeda minimum 3 menit untuk melindungi reputasi domain.
* **Dukungan Kepatuhan UU PDP & Anti-Spam**: Header `List-Unsubscribe` resmi, footer kepatuhan B2B, dan pencatatan blocklist otomatis saat terjadi keluhan atau bounce.

### 5. Unified Master Profile & Dashboard Akun
* Modul Akun (`#account-module`) menyajikan profil, sisa kuota, tanggal kedaluwarsa paket (`tier_expires_at`), riwayat CV aktif, dan riwayat lamaran terkirim.
* Dilengkapi fitur portabilitas data ("Unduh Data Saya") dan penghapusan data ("Hapus Akun dan Data Saya").

---

## Arsitektur Sistem

Platform mengadopsi arsitektur modular:
* **Frontend**: Vanilla JS modern + Tailwind CSS + Responsive Floating Navigation.
* **Backend API**: Vercel Serverless Functions (`/api/`) dengan format Node.js ESM.
* **Database & Auth**: Supabase PostgreSQL dengan Row-Level Security (RLS) ketat dan atomik stored procedure.
* **AI Engine**: Anthropic Claude 3.5 Sonnet / Haiku melalui wrapper terpusat (`/api/_lib/llm.js`).
* **PDF Engine**: Client-side `jsPDF` & Server-side `pdf-lib`.

---

## Struktur Repositori

```text
├── api/                     # Serverless Endpoints (Vercel)
│   ├── _lib/                # Shared helpers (auth, limits, llm, quota, rateLimit)
│   ├── cv/                  # analyze, rewrite, export-pdf
│   ├── interview/           # questions, score
│   ├── jobs/                # list, match
│   ├── blast/               # plan, approve, tick, unsubscribe
│   └── billing/             # create-order, admin-confirm, webhook
├── scripts/
│   └── scrape/              # run.js (pipeline normalisasi), stats.js
├── supabase/
│   └── migrations/          # 0001_core.sql, 0002_modules.sql, 0003_seed_promote_owner.sql
├── tests/
│   └── unit/                # Vitest unit test suite
├── deploy/
│   └── workflows/           # CI, scraper, dan blast-tick cron GitHub Actions
├── index.html               # Main Single-Page Application (SPA)
├── run-full-qa-audit.js     # End-to-end QA audit runner (64 tests)
├── run-ui-ux-audit.js       # Mobile & accessibility audit runner (20 tests)
├── package.json
├── vercel.json
└── README.md
```

---

## Persyaratan & Instalasi Lokal

### Prasyarat
* Node.js v18.0.0 atau lebih baru
* npm v9.0.0 atau lebih baru

### Langkah Instalasi
1. Klon repositori ini:
   ```bash
   git clone https://github.com/Dimitdisini/Lolos-Kerja.git
   cd Lolos-Kerja
   ```
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Salin konfigurasi environment:
   ```bash
   cp .env.example .env
   ```
4. Jalankan development server:
   ```bash
   npm run dev
   ```
5. Buka `http://localhost:5173` di peramban Anda.

---

## Variabel Lingkungan (Environment Variables)

Isi berkas `.env` dengan kredensial berikut:

| Variabel | Keterangan |
|---|---|
| `SUPABASE_URL` | URL Proyek Supabase |
| `SUPABASE_ANON_KEY` | Kunci anonim publik Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Kunci admin backend Supabase (rahasia) |
| `ANTHROPIC_API_KEY` | Kunci API Anthropic untuk LLM Bedah CV & Wawancara |
| `RESEND_API_KEY` | Kunci API Resend untuk pengiriman email Auto-Blast |
| `MAIL_FROM_DOMAIN` | Domain email pengirim (misal: `lamaran.loloskerja.id`) |
| `CRON_SECRET` | Token autentikasi untuk memicu `/api/blast/tick` via cron |
| `DRY_RUN` | Set `true` untuk mode simulasi pengiriman tanpa biaya Resend |

---

## Pengujian Otomatis (QA & Unit Tests)

Jalankan seluruh suite verifikasi kualitas:

```bash
# 1. Jalankan unit test Vitest
npx vitest run

# 2. Jalankan end-to-end QA audit (64 tes)
npm run test:qa

# 3. Jalankan mobile & accessibility audit (20 tes)
npm run test:uiux

# 4. Jalankan seluruh suite sekaligus
npm test
```

Status Kepatuhan: **100% PASS** (24 Vitest + 64 E2E QA + 20 UI/UX).

---

## Kebijakan Kepatuhan & Privasi

* [Kebijakan Privasi (PRIVACY.md)](./PRIVACY.md): Kepatuhan terhadap UU Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022).
* [Syarat & Ketentuan Layanan (TERMS.md)](./TERMS.md): Ketentuan penggunaan platform, kepemilikan data, dan batasan tanggung jawab.
* [Kebijakan Pengiriman Email (EMAIL-POLICY.md)](./EMAIL-POLICY.md): Standar Anti-Spam (UU ITE No. 1/2024 & RFC 8058 List-Unsubscribe).
* [Petunjuk Operasional Sistem (RUNBOOK.md)](./RUNBOOK.md): SOP penanganan darurat bounce rate, rollback Vercel, dan rotasi secret key.

---

## Lisensi & Tim
Hak Cipta © 2026 **PT Fleek Group Indonesia & PT Xavortree Digital Solution (Dimitri HQ)**.  
Lead Architect & Builder: **Dimitri Ahmad** (Group CEO & Technology Architect).
