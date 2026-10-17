# Panduan Penggunaan & Dokumentasi Sistem: Lolos Kerja (Career Copilot)

**Versi:** 1.2.0 (Production Stable)  
**Terakhir Diperbarui:** 17 Oktober 2026  
**Arsitektur & Pemilik Proyek:** Dimitri Ahmad (Group CEO & Technology Architect - Dimitri HQ)  
**Live Production URL:** [https://lolos-kerja-seven.vercel.app](https://lolos-kerja-seven.vercel.app)  
**Tautan Repositori GitHub:** [https://github.com/Dimitdisini/Lolos-Kerja](https://github.com/Dimitdisini/Lolos-Kerja)  

---

## 1. Ringkasan Platform & Nilai Bisnis
**Lolos Kerja** adalah platform *AI Academic & Career Copilot* terintegrasi yang dirancang khusus untuk mahasiswa tingkat akhir dan pencari kerja pemula (*fresh graduates*). Platform ini mengatasi 3 hambatan utama pencari kerja:
1. **CV Anxiety:** Ketidakmampuan merumuskan pengalaman biasa menjadi pencapaian terukur yang lolos sistem Applicant Tracking System (ATS).
2. **Interview Anxiety:** Kegugupan menghadapi pertanyaan HRD/User dan kebiasaan menggunakan kata pengisi (*filler words*) seperti "aaa/eee/kayak".
3. **Job Hunting Fatigue:** Kelelahan menyalin-tempel informasi lowongan kerja di berbagai tab job portal yang berbeda.

---

## 2. Struktur Penyimpanan & Lokasi Berkas (Local & Cloud)

### A. Lokasi Berkas Lokal (macOS)
Seluruh kode sumber, basis data lowongan, dan konfigurasi deployment tersimpan pada direktori:
```
/Users/haimac/Dimitri Ahmad/Dokumen Dimitri/05 Proyek dan Materi AI/Dims Career Copilot/
```

**Daftar Berkas Kunci:**
- `index.html`: Berkas utama aplikasi web (SPA: HTML5, Tailwind CSS, JavaScript Vanilla modular, zero-build dependency).
- `Prototipe Karir Copilot.html`: Replika sinkron untuk cadangan dan pengujian lokal offline.
- `clean-live-jobs.json`: Basis data 418 lowongan kerja aktif Indonesia hasil kurasi scraping LinkedIn Apify.
- `scrape-apify.js`: Skrip Node.js otomatisasi scraping API Apify dengan pengaman anggaran (budget cap < $3.00/bulan).
- `vercel.json`: Konfigurasi routing static serverless untuk Vercel.
- `README.md`: Dokumentasi repositori publik GitHub.
- `.gitignore`: Proteksi agar berkas riwayat mentah / cache tidak terunggah ke publik.

### B. Arsitektur Cloud & Partisi Data
- **Hosting & CDN:** Vercel Global Edge Network (subdomain aktif: `lolos-kerja-seven.vercel.app`).
- **Version Control (VCS):** GitHub Remote `origin/main` di `Dimitdisini/Lolos-Kerja`.
- **Client-Side State:** `localStorage` browser pengguna (menyimpan sesi login, profil Google mock, tier keanggotaan `FREE`/`DIBANTUIN`/`VIP`, sisa kuota email blast, dan riwayat transaksi).

---

## 3. Panduan Penggunaan Modul Utama

### Modul 1: Bedah CV Interaktif (ATS Socratic Guidance)
1. Buka tab **"Bedah CV"** melalui navigasi atas.
2. Masukkan draf pengalaman kerja, magang, organisasi, atau proyek kuliah pada kotak teks.
3. Klik tombol **"Mulai Bedah CV Sekarang"**.
4. Sistem akan mengevaluasi teks dan menampilkan:
   - **ATS Health Score** (0 - 100).
   - **Analisis Kekurangan (Socratic Prompts):** Mengarahkan pelamar untuk menambahkan metrik angka riil.
   - **Optimasi Rumus STAR:** Konversi otomatis menjadi formula *Situation, Task, Action, Result* dengan kata kerja aksi kuat.
   - **Fitur 1-Click Salin Teks ATS:** Memudahkan pelamar menempelkan hasil akhir ke resume.

### Modul 2: Simulasi Wawancara Suara (Dual-Score Matrix)
1. Buka tab **"Simulasi Wawancara"**.
2. Pilih pertanyaan wawancara (misal: *"Ceritakan tentang diri Anda"* atau *"Kelemahan terbesar Anda"*).
3. Atur preferensi bahasa: **Bahasa Indonesia** atau **English (MNC Prep)**.
4. Klik tombol mikrofon **"Mulai Bicara"** (menggunakan browser Web Speech API / Web Audio).
5. Setelah selesai berbicara, klik **"Selesai & Analisis Jawaban"**.
6. Sistem memproses audio dan memunculkan **Dual-Scoring Matrix**:
   - **Skor Relevansi Isi (0 - 100):** Seberapa tepat jawaban menjawab konteks pertanyaan HR.
   - **Skor Delivery & Ketenangan (0 - 100):** Analisis kecepatan bicara (WPM) dan deteksi kata pengisi (*filler words: "aaa", "eee", "kayak", "anu"*).

### Modul 3: Smart Job Matcher (400+ Loker Aktif)
1. Buka tab **"Katalog Lowongan"**.
2. Tersedia **418 lowongan kerja aktif Indonesia** yang dapat difilter berdasarkan:
   - Kategori (IT & Software, Engineering, Operations, BUMN/MT, Marketing).
   - Lokasi (Jakarta, Bandung, Surabaya, Yogyakarta, Bali, Remote).
   - Tingkat Pengalaman (Fresh Graduate, Junior).
3. **Logika Kartu Loker:**
   - **Sebelum Analisis CV:** Kartu menampilkan badge netral *"Siap Lamarmu"* beserta Kualifikasi Utama dan Nilai Tambah tanpa persentase palsu.
   - **Setelah Analisis CV:** Persentase kecocokan dihitung secara dinamis (68% - 98%) mencocokkan kata kunci profil dengan deskripsi pekerjaan.
4. **Tombol Tindakan Instan:**
   - Tombol utama: **"Lamar Langsung di LinkedIn"** membuka tautan langsung ke pos lowongan asli.
   - Tombol sekunder: Mengarahkan pencarian otomatis (*auto-query*) ke **Glints** dan **JobStreet**.

### Modul 4: Smart Drip Auto-Blast (Kirim Lamaran Massal)
1. Buka tab **"Auto-Blast"**.
2. Pilih lowongan kerja target yang ingin dilamar.
3. Tulis atau gunakan rekomendasi *Cover Letter AI*.
4. **Access Gate:**
   - Pengguna paket `FREE` dibatasi untuk mencegah spam.
   - Untuk mengirim lamaran langsung, sistem akan memicu modal aktivasi VIP.

### Modul 5: Sistem Pembayaran & Upgrade (Dynamic QRIS)
1. Buka tab **"Paket & Harga"** atau klik tombol **"Beli Kuota"**.
2. Pilih paket yang diinginkan:
   - *Paket 24 Jam:* Rp 9.999
   - *Paket Dibantuin:* Rp 49.000
   - *Paket Dikerjain VIP:* Rp 149.000
3. Pop-up **Dynamic QRIS Checkout** akan muncul dengan:
   - Order ID unik (`LK-ORD-...`).
   - Kode QRIS SVG standar nasional.
   - Hitung mundur pembayaran 15 menit.
4. Klik **"Simulasi Bayar Berhasil (Scan QRIS)"** untuk menguji alur verifikasi transaksi seketika. Akun pengguna akan otomatis naik tier dan kuota blast bertambah.

---

## 4. Panduan Akses Portal Admin & Revenue Analytics

Portal Admin sengaja disembunyikan dari navigasi publik untuk menjaga kerahasiaan metrik bisnis Dimitri HQ.

### Cara Membuka Portal Admin:
- **Metode 1 (URL Langsung):** Buka [https://lolos-kerja-seven.vercel.app/#admin](https://lolos-kerja-seven.vercel.app/#admin)
- **Metode 2 (Keyboard Shortcut Rahasia):** Di halaman mana saja, tekan:
  - **Mac:** `Cmd + Shift + A`
  - **Windows:** `Ctrl + Shift + A`

### Fitur di Dalam Portal Admin:
1. **Ringkasan Pendapatan (KPI Dashboard):**
   - Total Gross Revenue (Rp).
   - Jumlah Transaksi Berhasil.
   - Total Pengguna Terdaftar.
   - Total Email Terkirim.
2. **Tab Pesanan (Orders):**
   - Riwayat seluruh pesanan QRIS masuk beserta status pembayaran.
   - Tombol **"Export CSV Transaksi"** untuk pelaporan keuangan.
3. **Tab Pelamar (User Management):**
   - Pantau status tier akun dan sisa kuota blast per pengguna.
   - Aksi cepat: Tombol **"+5 Kuota Blast"** dan **"Upgrade VIP Instan"** langsung dari dashboard.
4. **Tab Katalog Lowongan (Job Management):**
   - Pemantauan 418 loker LinkedIn.
   - Form penambahan loker manual langsung ke halaman publik.

---

## 5. Prosedur Pembaruan Data & Deploy (Maintenance Workflow)

Jika di kemudian hari ingin menambahkan data lowongan baru atau merilis pembaruan:

1. **Jalankan Scraping Tambahan (Opsional):**
   ```bash
   cd "/Users/haimac/Dimitri Ahmad/Dokumen Dimitri/05 Proyek dan Materi AI/Dims Career Copilot"
   node scrape-apify.js
   ```
   *Catatan: Biaya scraper Apify hanya ~$0.002 per loker, jaga di bawah batas $3.00/bulan.*

2. **Verifikasi Sintaks Sebelum Rilis:**
   Pastikan tidak ada error JavaScript:
   ```bash
   node -e '
   const fs = require("fs");
   const vm = require("vm");
   const content = fs.readFileSync("index.html", "utf8");
   const matches = content.match(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi);
   matches.forEach((s, i) => new vm.Script(s.replace(/<\/?script[^>]*>/gi, "")));
   console.log("Semua skrip valid!");
   '
   ```

3. **Deploy Otomatis ke GitHub & Vercel:**
   ```bash
   git add index.html "Prototipe Karir Copilot.html" clean-live-jobs.json
   git commit -m "feat: pembaruan sistem dan katalog lowongan"
   git push origin main
   ```
   *Vercel akan mendeteksi push pada branch `main` dan memperbarui web dalam ~15 detik.*
