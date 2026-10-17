# Kandidat AI (Dims Career Copilot)

> **AI-Powered Career Accelerator untuk Mahasiswa & Fresh Graduate**  
> Bimbingan bedah CV berbasis Socratic STAR, simulasi wawancara suara real-time dengan Dual-Score Evaluation, dan kurasi lowongan kerja tanpa friksi copy-paste.

---

## Gambaran Umum

Banyak mahasiswa tingkat akhir dan fresh graduate mengalami kecemasan ganda saat mencari kerja:
1. **CV Anxiety**: Merasa pengalaman organisasi/kuliah minim dan bingung menyusunnya agar lolos sistem ATS.
2. **Interview Anxiety**: Takut berbicara di depan HR, gugup dengan banyak kata gumam (*"aaa", "eee", "kayak"*), dan ragu menghadapi wawancara bahasa Inggris.
3. **Portal Fatigue**: Lelah harus membuka belasan tab dan menyalin tautan lowongan kerja bolak-balik.

**Kandidat AI** hadir sebagai pendamping satu pintu (*career copilot*) yang menyelesaikan ketiga masalah tersebut secara instan.

---

## Fitur Utama

### 1. Bedah CV Socratic & Optimasi STAR
* **ATS Health Score (0–100)**: Evaluasi kepatuhan format, kepadatan kata kerja aksi (*action verbs*), dan kelengkapan metrik.
* **Socratic Probing**: AI membimbing pengguna mengekstrak angka riil dan hasil nyata dari pengalaman yang awalnya terasa "biasa saja".
* **Visual Diff Before vs After**: Menampilkan perbandingan kalimat sebelum dan sesudah dipoles, dengan tombol 1-klik untuk menerapkan perubahan.
* **1-Click Plain Text ATS Export**: Salin teks bersih yang siap ditempel ke portal karir perusahaan.

### 2. Simulasi Wawancara Suara (Voice Mock Interview)
* **Perekaman Suara Real-Time**: Terintegrasi dengan Web Audio API dan Web Speech recognition.
* **Dual-Score Evaluation Matrix**:
  * **Skor Relevansi (0–100)**: Mengevaluasi apakah substansi jawaban selaras dengan metode STAR dan kebutuhan posisi kerja.
  * **Skor Delivery & Ketenangan (0–100)**: Mengukur artikulasi, kestabilan tempo bicara (WPM), dan deteksi otomatis kata gumam/filler (*"aaa", "eee", "kayak", "anu", "gitu"*).
* **Dual-Language Switcher**: Pilihan mode Bahasa Indonesia (HR screening lokal) dan Bahasa Inggris (multinational company / MT program).
* **Model Answer Percontohan**: Rekomendasi struktur jawaban ideal untuk dipelajari.

### 3. Smart Job Matcher (Zero Copy-Paste)
* **Katalog Loker Terkurasi**: 50+ lowongan aktif dari Glints, LinkedIn, dan JobStreet yang diselaraskan dengan keahlian dan jurusan pengguna.
* **Analisis Kesenjangan Keahlian (Skill Gap)**: Menampilkan keahlian yang sudah cocok serta keahlian yang disarankan untuk dipelajari.
* **Direct Deep-Link Glints**: Tombol 1-klik yang langsung membuka pencarian resmi di Glints dengan parameter posisi terisi otomatis.

### 4. Konsol Simulasi Orkestrasi Agen (Multi-Agent Swarm)
Visualisasi arsitektur 5 agen otonom di latar belakang:
* `@kai` (Chief of Staff & Orchestrator)
* `@tari-agent` (Socratic CV & Metric Modeler)
* `@vocalis-agent` (Acoustic Pacing & Vocal Delivery)
* `@scout-agent` (Loker Crawler & Deep-Link Query)
* `@dewi-gatekeeper` (Strict Anti-Slop & Quality Audit)

---

## Arsitektur Teknis

* **Frontend**: Vanilla HTML5, CSS3 kustom (Dark Forest Matte `#04110a`, Deep Moss `#0c2619`, Mint Sage `#7fd0a5`, Warm Amber `#f59e0b`), dan Vanilla JavaScript modern.
* **Audio Processing**: Web Audio API (`AudioContext`, `AnalyserNode`) untuk visualisasi gelombang suara (*live waveform canvas*) dan kalkulasi durasi riil.
* **Zero Dependencies**: Berdiri sendiri (*single-file*), tanpa build tool, tanpa `npm install`, 100% cepat dan hemat memori.

---

## Panduan Menjalankan Secara Lokal

1. Klon repositori ini:
   ```bash
   git clone https://github.com/username/kandidat-ai.git
   cd kandidat-ai
   ```
2. Buka berkas `index.html` langsung di Google Chrome atau peramban modern lainnya. Tidak memerlukan server lokal.

---

## Panduan Deployment ke Vercel

Repositori ini telah dilengkapi dengan `vercel.json` dan siap di-deploy dalam hitungan detik:

### Opsi A: Lewat Vercel CLI
```bash
npm i -g vercel
vercel
```

### Opsi B: Lewat Dashboard Vercel (1-Click)
1. Push folder ini ke akun GitHub kamu sebagai repositori baru (misal: `kandidat-ai`).
2. Masuk ke [vercel.com](https://vercel.com) $\rightarrow$ klik **Add New Project**.
3. Pilih repositori `kandidat-ai` dari daftar GitHub.
4. Klik **Deploy** (Framework Preset: *Other*, Root Directory: `./`).
5. Selesai! Web langsung online dengan HTTPS aktif.

---

## Lisensi & Hak Cipta
Dibuat oleh **Dimitri Ahmad** (Dimitri HQ / Dims Lab) & **Sasa**.
